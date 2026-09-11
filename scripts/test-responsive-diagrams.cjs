const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const puppeteer = require(
  path.resolve(__dirname, "..", "website", "node_modules", "puppeteer"),
);

// Spawned directly via node instead of `npm run serve`: the npm/sh wrapper
// layers swallow SIGTERM on Linux CI (ubuntu dash), orphaning the server while
// it keeps our stdio pipes open — Node's child `close` event (exit + stdio EOF)
// never fires and teardown hangs forever. See npm/rfcs#829.
const docusaurusBin = path.resolve(
  __dirname,
  "..",
  "website",
  "node_modules",
  "@docusaurus",
  "core",
  "bin",
  "docusaurus.mjs",
);

// Labels below must stay in sync with website/chapters.ts (chapterGroups[].label
// and standaloneChapters). Centralized here so renames cause a single-point
// update rather than scattered string literals.
const LABEL_FOUNDATIONS = "Foundations"; // chapterGroups[0].label
const LABEL_DIRECTING = "Directing Agent Work"; // chapterGroups[1].label
const LABEL_SHIPPING = "Shipping Agent Work"; // chapterGroups[3].label
const LABEL_ABOUT = "About"; // standaloneChapters.afterGroups[0] -> sidebar title
// chapterGroups[0].chapters[0].id — the SSR fallback target of the Foundations
// category link when JavaScript is disabled.
const FOUNDATIONS_FIRST_DOC = "/how-llms-work";
const TRACE_DIR = path.join(path.resolve(__dirname, "..", "website"), "browser-contracts-traces");

const websiteDir = path.resolve(__dirname, "..", "website");
// The build-time star snapshot and its canonical formatter, read by the
// no-JavaScript homepage contract below.
const STARS_SNAPSHOT = path.join(websiteDir, "src", "generated", "github-stars.json");
const FORMAT_STARS = path.join(
  websiteDir,
  "src",
  "components",
  "GitHubSocialProof",
  "formatStars.ts",
);
// CI builds once and points us at the artifact; local runs self-build.
const providedBuildDir = process.env.BROWSER_TEST_BUILD_DIR
  ? path.resolve(process.env.BROWSER_TEST_BUILD_DIR)
  : null;
const tempRoot = providedBuildDir
  ? null
  : fs.mkdtempSync(path.join(os.tmpdir(), "agenticoding-responsive-diagrams-"));
const buildDir = providedBuildDir ?? path.join(tempRoot, "build");
const docusaurusCache = path.join(websiteDir, ".docusaurus");
const hadDocusaurusCache = fs.existsSync(docusaurusCache);

let server;
let serverClosed;
let browser;

function fail(message) {
  throw new Error(message);
}

// Bounded wait: teardown must never hang the CI step on a process that won't die.
function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function captureFailure(page, name) {
  try {
    if (page && typeof page.isClosed === "function" && !page.isClosed()) {
      await page.screenshot({
        path: path.join(TRACE_DIR, `${name}.png`),
        fullPage: true,
      });
    }
  } catch {}
}

// Lightweight retry for Puppeteer flake (transient nav / animation races).
// Keeps CI signal: quarantine is via retry, not skip; final failure still throws.
async function withRetry(fn, label, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.warn(`[retry ${attempt}/${attempts}] ${label}: ${error.message}`);
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastError;
}

function runBuild() {
  if (providedBuildDir) {
    if (!fs.existsSync(path.join(providedBuildDir, "sitemap.xml")))
      fail(
        `BROWSER_TEST_BUILD_DIR ${providedBuildDir} contains no sitemap.xml; run a production build first`,
      );
    console.log(
      `testing prebuilt site at ${providedBuildDir} (BROWSER_TEST_BUILD_DIR)`,
    );
    return;
  }
  const result = spawnSync(
    "npm",
    ["run", "build", "--", "--out-dir", buildDir],
    { cwd: websiteDir, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0)
    fail(`optimized build exited with status ${result.status}`);
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      socket.close(() => resolve(address.port));
    });
  });
}

function startServer(port) {
  const output = [];
  // detached: true gives the server its own process group (PGID == PID) so
  // stopServer can signal the whole tree; killing a lone PID is what lets
  // grandchildren survive as orphans holding our stdio pipes.
  server = spawn(
    process.execPath,
    [
      docusaurusBin,
      "serve",
      "--dir",
      buildDir,
      "--port",
      String(port),
      "--host",
      "127.0.0.1",
      "--no-open",
    ],
    { cwd: websiteDir, stdio: ["ignore", "pipe", "pipe"], detached: true },
  );
  serverClosed = new Promise((resolve) => server.once("close", resolve));
  for (const stream of [server.stdout, server.stderr]) {
    stream.on("data", (chunk) => {
      output.push(String(chunk));
      if (output.length > 20) output.shift();
    });
  }
  server._recentOutput = output;
  server._port = port;
}

function checkServer(port) {
  return new Promise((resolve) => {
    const request = http.get(
      { host: "127.0.0.1", port, path: "/", timeout: 1000 },
      (response) => {
        response.resume();
        resolve(response.statusCode < 500);
      },
    );
    request.on("error", () => resolve(false));
    request.on("timeout", () => request.destroy());
  });
}

// Signals the server's whole process group; safe to call when already gone.
function signalServerGroup(signal) {
  if (!server || server.pid === undefined) return;
  try {
    process.kill(-server.pid, signal);
  } catch {} // process group already gone
}

async function stopServer() {
  if (!server) return;
  signalServerGroup("SIGTERM");
  try {
    await withTimeout(serverClosed, 5000, "static server shutdown");
  } catch {
    console.warn("[cleanup] static server ignored SIGTERM; sending SIGKILL");
    signalServerGroup("SIGKILL");
    try {
      await withTimeout(serverClosed, 5000, "static server SIGKILL");
    } catch {
      console.warn("[cleanup] static server survived SIGKILL; exiting anyway");
    }
  }
}

async function waitForServer(port) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) {
      fail(
        `static server exited with status ${server.exitCode}\n${server._recentOutput.join("")}`,
      );
    }
    if (await checkServer(port)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fail(`static server did not start\n${server._recentOutput.join("")}`);
}

function routesFromSitemap() {
  const sitemap = fs.readFileSync(path.join(buildDir, "sitemap.xml"), "utf8");
  const routes = new Set();
  for (const [, location] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    routes.add(new URL(location).pathname);
  }
  if (!routes.size) fail("sitemap contains no routes");
  return [...routes].sort();
}

function variantState() {
  return [...document.querySelectorAll("[data-responsive-breakpoint]")].map(
    (container) => {
      const variants = [...container.children]
        .filter((element) =>
          [...element.classList].some((name) =>
            /^(desktopVariant|mobileVariant)_/.test(name),
          ),
        )
        .map((element) => {
          const style = getComputedStyle(element);
          const rects = element.getClientRects();
          const child = element.firstElementChild;
          const wrapperRect = element.getBoundingClientRect();
          const childRect = child?.getBoundingClientRect();
          return {
            name: [...element.classList].find((name) =>
              /^(desktopVariant|mobileVariant)_/.test(name),
            ),
            display: style.display,
            visibility: style.visibility,
            rectCount: rects.length,
            childTag: child?.tagName.toLowerCase() || null,
            childCenterDelta: childRect
              ? Math.abs(
                  childRect.left +
                    childRect.width / 2 -
                    (wrapperRect.left + wrapperRect.width / 2),
                )
              : null,
          };
        });
      return {
        breakpoint: container.dataset.responsiveBreakpoint,
        fallback: container.dataset.responsiveFallback || null,
        mode: container.dataset.responsiveMode,
        variants,
      };
    },
  );
}

function breakpointPixels(value) {
  if (value.endsWith("px")) return Number.parseFloat(value);
  if (value.endsWith("rem")) return Number.parseFloat(value) * 16;
  fail(`unsupported responsive breakpoint unit: ${value}`);
}

function visibleVariants(state) {
  return state.variants.filter(
    (variant) =>
      variant.display !== "none" &&
      variant.visibility !== "hidden" &&
      variant.visibility !== "collapse" &&
      variant.rectCount > 0,
  );
}

async function waitForPaint(page) {
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}

function assertVariantState(state, route, width) {
  if (state.variants.length !== 2) {
    fail(
      `${route} at ${width}px has ${state.variants.length} responsive variants for ${state.breakpoint}`,
    );
  }
  const visible = visibleVariants(state);
  if (visible.length !== 1) {
    fail(
      `${route} at ${width}px has ${visible.length} visible variants for ${state.breakpoint} (${state.mode}): ${JSON.stringify(state.variants)}`,
    );
  }
  if (
    visible[0].childTag === "svg" &&
    visible[0].childCenterDelta !== null &&
    visible[0].childCenterDelta > 1
  ) {
    fail(
      `${route} at ${width}px left-aligns its visible SVG by ${visible[0].childCenterDelta}px for ${state.breakpoint}`,
    );
  }
  if (state.mode !== "viewport") return;
  const expected =
    width <= breakpointPixels(state.breakpoint)
      ? "mobileVariant"
      : "desktopVariant";
  if (!visible[0].name.startsWith(`${expected}_`)) {
    fail(
      `${route} at ${width}px selected ${visible[0].name}; expected ${expected} for viewport breakpoint ${state.breakpoint}`,
    );
  }
}

async function inspectRoute(page, route, width) {
  await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
  const response = await page.goto(`http://127.0.0.1:${server._port}${route}`, {
    waitUntil: "domcontentloaded",
  });
  if (!response || response.status() >= 400) {
    fail(`${route} at ${width}px returned ${response && response.status()}`);
  }
  await waitForPaint(page);
  const states = await page.evaluate(variantState);
  states.forEach((state) => assertVariantState(state, route, width));
  return states.length;
}

async function inspectRoutes(page, routes) {
  let responsiveContainers = 0;
  for (const route of routes) {
    for (const width of [1440, 390]) {
      responsiveContainers += await inspectRoute(page, route, width);
    }
  }
  return responsiveContainers;
}

function siteUrl(route = "/") {
  return `http://127.0.0.1:${server._port}${route}`;
}

function linksInHtml(html) {
  // Regex-based intentionally: avoids adding an HTML parser dep in CI. The
  // sitemap/static HTML is predictable Docusaurus output, so a lightweight
  // pattern is sufficient and keeps the contract test dependency-free.
  // Handles both single and double-quoted hrefs; strips inner tags via replace.
  return [
    ...html.matchAll(/<a\b[^>]*href=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi),
  ].map(([, , href, content]) => ({
    href,
    label: content.replace(/<[^>]*>/g, "").trim(),
  }));
}

// The homepage's no-JavaScript contract: navigation works and the trust band's
// build-time star counts are baked into the HTML. One fetch feeds both checks.
async function inspectNoJavaScriptHomepage() {
  const response = await fetch(siteUrl());
  if (!response.ok) fail(`no-JavaScript homepage returned ${response.status}`);
  const html = await response.text();
  inspectNoJavaScriptSidebar(html);
  await inspectNoJavaScriptStars(html);
}

function inspectNoJavaScriptSidebar(html) {
  const foundation = linksInHtml(html).find(
    (link) => link.label === LABEL_FOUNDATIONS,
  );
  if (!foundation) fail("collapsed Foundations group has no SSR fallback link");
  if (new URL(foundation.href, siteUrl()).pathname !== FOUNDATIONS_FIRST_DOC)
    fail(`${LABEL_FOUNDATIONS} SSR fallback points to ${foundation.href}`);
}

// Asserts each count is rendered server-side from the committed snapshot, tied
// to its "stars" label so a stray number elsewhere cannot satisfy the check.
async function inspectNoJavaScriptStars(html) {
  const { formatStars } = await import(pathToFileURL(FORMAT_STARS).href);
  const { projects } = JSON.parse(fs.readFileSync(STARS_SNAPSHOT, "utf8"));
  for (const { repo, stars } of projects) {
    const count = formatStars(stars).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`>${count}</span>[^<]*<span[^>]*>stars</span>`).test(html))
      fail(`SSR homepage is missing the baked-in star count for ${repo}`);
  }
}

// Scoped to the desktop docs sidebar. Keep in sync with the theme's canonical
// scroller selector (DocSidebar/Desktop/index.tsx SIDEBAR_NAV_SELECTOR): the
// aria-label is a translated theme string, the class is stable markup.
const SIDEBAR_NAV = 'nav.menu';
const DRAWER_MENU = ".navbar-sidebar__item.menu";
const SIDEBAR_CATEGORIES = (scope) => `${scope} a[role="button"]`;

async function waitForHydrated(page) {
  // Hydration signal: category links keep the SSR fallback href until
  // useCategoryHrefWithSSRFallback (DocSidebarItem/Category/index.tsx)
  // re-renders client-side to "#". Clicking before that NAVIGATES instead of
  // expanding the group — the race these suites hit on slow CI runners, so
  // this wait is event-driven rather than time-based.
  const desktopReady = await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll(`${SIDEBAR_NAV} a[role="button"]`)].some(
          (link) => link.getAttribute('href') === '#',
        ),
      { timeout: 5000 },
    )
    .then(() => true)
    .catch(() => false);
  if (desktopReady) return;
  // Mobile viewport renders no desktop sidebar; network idle is reached only
  // after the shell scripts that hydrate React have executed.
  await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 });
}

async function waitForCategoryState(
  page,
  label,
  expanded,
  description,
  scope = SIDEBAR_NAV,
) {
  try {
    await page.waitForFunction(
      ({ scopeSelector, categoryLabel, expected }) => {
        const sidebar = document.querySelector(scopeSelector);
        return [...(sidebar?.querySelectorAll('a[role="button"]') || [])].some(
          (link) =>
            link.textContent?.trim() === categoryLabel &&
            link.getAttribute("aria-expanded") === String(expected),
        );
      },
      { timeout: 5000 },
      { scopeSelector: scope, categoryLabel: label, expected: expanded },
    );
  } catch {
    const states = await page.evaluate((scopeSelector) => {
      const sidebar = document.querySelector(scopeSelector);
      return [...(sidebar?.querySelectorAll('a[role="button"]') || [])].map(
        (link) => [
          link.textContent?.trim(),
          link.getAttribute("aria-expanded"),
        ],
      );
    }, scope);
    fail(`${description}: ${JSON.stringify(states)}`);
  }
}

async function clickCategory(page, label, expanded, scope = SIDEBAR_NAV) {
  const categories = await page.$$(SIDEBAR_CATEGORIES(scope));
  const category = await (async () => {
    for (const candidate of categories) {
      if (
        (await candidate.evaluate((link) => link.textContent?.trim())) === label
      )
        return candidate;
    }
    return undefined;
  })();
  if (!category) fail(`sidebar category ${label} was not found`);
  await category.click();
  await waitForCategoryState(
    page,
    label,
    expanded,
    `clicking ${label} did not set aria-expanded=${expanded}`,
    scope,
  );
}

async function openMobileDrawer(page) {
  const toggle = await page.$(".navbar__toggle");
  if (!toggle) fail("mobile navbar toggle was not found at 390px");
  await toggle.click();
  await page.waitForFunction(
    (scope) => {
      const drawer = document.querySelector(scope);
      if (!drawer) return false;
      const style = getComputedStyle(drawer);
      return (
        style.visibility !== "hidden" && drawer.getClientRects().length > 0
      );
    },
    { timeout: 5000 },
    DRAWER_MENU,
  );
}

async function inspectMobileDrawerSidebar() {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(siteUrl(), { waitUntil: "domcontentloaded" });
  await waitForPaint(page);
  await waitForHydrated(page);
  await openMobileDrawer(page);
  // The drawer reuses the swizzled DocSidebarItem components, so the group
  // accordion must behave identically inside the mobile navigation drawer.
  try {
    await clickCategory(page, LABEL_FOUNDATIONS, true, DRAWER_MENU);
    await clickCategory(page, LABEL_DIRECTING, true, DRAWER_MENU);
    await waitForCategoryState(
      page,
      LABEL_FOUNDATIONS,
      false,
      `opening ${LABEL_DIRECTING} did not collapse ${LABEL_FOUNDATIONS} in the mobile drawer`,
      DRAWER_MENU,
    );
  } catch (error) {
    await captureFailure(page, "inspectMobileDrawerSidebar");
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

async function inspectSidebarNavigation() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(siteUrl(), { waitUntil: "domcontentloaded" });
  await waitForPaint(page);
  await waitForHydrated(page);
  try {
    await clickCategory(page, LABEL_FOUNDATIONS, true);
    await clickCategory(page, LABEL_DIRECTING, true);
    // Accordion contract: opening one group collapses the previously open one.
    await waitForCategoryState(
      page,
      LABEL_FOUNDATIONS,
      false,
      `opening ${LABEL_DIRECTING} did not collapse ${LABEL_FOUNDATIONS}`,
    );
    // collapsesCategories contract: navigating to a standalone doc (About)
    // collapses every open group.
    const clickedAbout = await page.evaluate(
      (navSelector, aboutLabel) => {
        const sidebar = document.querySelector(navSelector);
        const about = [...(sidebar?.querySelectorAll("a") || [])].find(
          (link) => link.textContent?.trim() === aboutLabel,
        );
        if (!about) return false;
        about.click();
        return true;
      },
      SIDEBAR_NAV,
      LABEL_ABOUT,
    );
    if (!clickedAbout) fail(`sidebar link ${LABEL_ABOUT} was not found`);
    await waitForCategoryState(
      page,
      LABEL_DIRECTING,
      false,
      `navigating to ${LABEL_ABOUT} did not collapse ${LABEL_DIRECTING}`,
    );
  } catch (error) {
    await captureFailure(page, "inspectSidebarNavigation");
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

async function waitForActiveChapterInScroller(page, description) {
  // Contract: the sidebar's real scroller (nav.menu, see getSidebarScroller) is
  // scrolled so the active chapter link sits fully inside the scroller's
  // viewport. Deliberately does NOT require scrollTop > 0 — a chapter near the
  // top of a short list can legitimately satisfy the contract without scrolling.
  try {
    await page.waitForFunction(
      (scopeSelector) => {
        const scroller = document.querySelector(scopeSelector);
        const active = scroller?.querySelector(
          '.menu__link--active[aria-current="page"]',
        );
        if (!scroller || !active) return false;
        const sRect = scroller.getBoundingClientRect();
        const aRect = active.getBoundingClientRect();
        return (
          aRect.top >= sRect.top - 1 &&
          aRect.bottom <= sRect.bottom + 1
        );
      },
      { timeout: 5000 },
      SIDEBAR_NAV,
    );
  } catch {
    fail(description);
  }
}

async function clickReadingSpineNext(page) {
  const clicked = await page.evaluate(() => {
    const footer = [...document.querySelectorAll("article p")].find((p) =>
      p.textContent?.trim().startsWith("Next:"),
    );
    const link = footer?.querySelector("a");
    if (!link) return false;
    link.click();
    return true;
  });
  if (!clicked) fail("reading-spine Next footer link was not found");
}

async function inspectActiveChapterScroll() {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 720, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  try {
    // Deep-link contract: loading a chapter deep in the last group must
    // auto-expand its category and scroll the real scroller to the active link.
    await page.goto(siteUrl("/agent-knowledge-cache"), {
      waitUntil: "domcontentloaded",
    });
    await waitForPaint(page);
    await waitForHydrated(page);
    await waitForCategoryState(
      page,
      LABEL_SHIPPING,
      true,
      `deep link did not auto-expand ${LABEL_SHIPPING}`,
    );
    await waitForActiveChapterInScroller(
      page,
      "deep link did not scroll the active chapter into the sidebar viewport",
    );
    // Cross-group SPA contract: the reading-spine footer of the last chapter of a
    // group expands the next group, collapses the previous one (accordion), and
    // keeps the target chapter visible.
    await page.goto(siteUrl("/structured-control-plane-agents"), {
      waitUntil: "domcontentloaded",
    });
    await waitForPaint(page);
    await waitForHydrated(page);
    await waitForCategoryState(
      page,
      LABEL_FOUNDATIONS,
      true,
      "structured-control-plane-agents did not expand Foundations",
    );
    await clickReadingSpineNext(page);
    await waitForCategoryState(
      page,
      LABEL_DIRECTING,
      true,
      `Next navigation did not expand ${LABEL_DIRECTING}`,
    );
    await waitForCategoryState(
      page,
      LABEL_FOUNDATIONS,
      false,
      "Next navigation did not collapse the previous group (accordion)",
    );
    await waitForActiveChapterInScroller(
      page,
      "Next navigation did not keep the active chapter in the sidebar viewport",
    );
  } catch (error) {
    await captureFailure(page, "inspectActiveChapterScroll");
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  runBuild();
  const routes = routesFromSitemap();
  const port = await reservePort();
  startServer(port);
  await waitForServer(port);

  fs.mkdirSync(TRACE_DIR, { recursive: true });
  browser = await puppeteer.launch({ headless: true });
  await withRetry(() => inspectNoJavaScriptHomepage(), "inspectNoJavaScriptHomepage");
  await withRetry(() => inspectSidebarNavigation(), "inspectSidebarNavigation");
  await withRetry(() => inspectMobileDrawerSidebar(), "inspectMobileDrawerSidebar");
  await withRetry(() => inspectActiveChapterScroll(), "inspectActiveChapterScroll");
  const page = await browser.newPage();
  let responsiveContainers;
  try {
    responsiveContainers = await withRetry(() => inspectRoutes(page, routes), "inspectRoutes");
  } catch (error) {
    await captureFailure(page, "inspectRoutes");
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
  if (!responsiveContainers)
    fail("no responsive diagrams found in generated routes");
  console.log(
    `browser regression passed (${routes.length} routes × 2 viewports; ${responsiveContainers} responsive checks; sidebar and mobile drawer contracts verified)`,
  );
}

async function cleanup() {
  if (browser) {
    try {
      await withTimeout(browser.close(), 5000, "browser.close()");
    } catch (error) {
      console.warn(`[cleanup] ${error.message}`);
    }
  }
  await stopServer();
  // Only remove what this script created: tempRoot when self-built, and the
  // .docusaurus cache when the self-build was the first thing to create it.
  // TRACE_DIR is intentionally preserved for CI artifact upload on failure.
  if (tempRoot) fs.rmSync(tempRoot, { recursive: true, force: true });
  if (!hadDocusaurusCache && !providedBuildDir) {
    fs.rmSync(docusaurusCache, { recursive: true, force: true });
  }
  // Belt-and-braces: teardown must never hang the CI step. If any handle is
  // still keeping the event loop alive, leave explicitly with the test result.
  process.exit(process.exitCode ?? 0);
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(cleanup);
