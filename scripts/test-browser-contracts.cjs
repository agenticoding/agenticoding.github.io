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
const TRACE_DIR = path.join(
  path.resolve(__dirname, "..", "website"),
  "browser-contracts-traces",
);

const websiteDir = path.resolve(__dirname, "..", "website");
// The build-time star snapshot and its canonical formatter, read by the
// no-JavaScript homepage contract below.
const STARS_SNAPSHOT = path.join(
  websiteDir,
  "src",
  "generated",
  "github-stars.json",
);
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
      timer = setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms,
      );
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

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };

// Long CSS transitions would race every geometry assertion, so inspectors that
// measure layout freeze animations.
async function emulateReducedMotion(page) {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
}

// Every inspector runs the same scaffold: a fresh page at one viewport, a
// failure screenshot named after the inspector, and a close that must never
// mask the real error.
async function withPage(name, viewport, fn) {
  const page = await browser.newPage();
  await page.setViewport({ ...viewport, deviceScaleFactor: 1 });
  try {
    return await fn(page);
  } catch (error) {
    await captureFailure(page, name);
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
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
        console.warn(
          `[retry ${attempt}/${attempts}] ${label}: ${error.message}`,
        );
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
const SIDEBAR_NAV = "nav.menu";
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
          (link) => link.getAttribute("href") === "#",
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
  await withPage(
    "inspectMobileDrawerSidebar",
    { width: 390, height: 900 },
    async (page) => {
      await emulateReducedMotion(page);
      await page.goto(siteUrl(), { waitUntil: "domcontentloaded" });
      await waitForPaint(page);
      await waitForHydrated(page);
      await openMobileDrawer(page);
      // The drawer reuses the swizzled DocSidebarItem components, so the group
      // accordion must behave identically inside the mobile navigation drawer.
      await clickCategory(page, LABEL_FOUNDATIONS, true, DRAWER_MENU);
      await clickCategory(page, LABEL_DIRECTING, true, DRAWER_MENU);
      await waitForCategoryState(
        page,
        LABEL_FOUNDATIONS,
        false,
        `opening ${LABEL_DIRECTING} did not collapse ${LABEL_FOUNDATIONS} in the mobile drawer`,
        DRAWER_MENU,
      );
    },
  );
}

async function clickSidebarLink(page, label) {
  const clicked = await page.evaluate(
    (navSelector, linkLabel) => {
      const sidebar = document.querySelector(navSelector);
      const link = [...(sidebar?.querySelectorAll("a") || [])].find(
        (candidate) => candidate.textContent?.trim() === linkLabel,
      );
      if (!link) return false;
      link.click();
      return true;
    },
    SIDEBAR_NAV,
    label,
  );
  if (!clicked) fail(`sidebar link ${label} was not found`);
}

async function inspectSidebarNavigation() {
  await withPage("inspectSidebarNavigation", DESKTOP_VIEWPORT, async (page) => {
    await emulateReducedMotion(page);
    await page.goto(siteUrl(), { waitUntil: "domcontentloaded" });
    await waitForPaint(page);
    await waitForHydrated(page);
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
    await clickSidebarLink(page, LABEL_ABOUT);
    await waitForCategoryState(
      page,
      LABEL_DIRECTING,
      false,
      `navigating to ${LABEL_ABOUT} did not collapse ${LABEL_DIRECTING}`,
    );
  });
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
        return aRect.top >= sRect.top - 1 && aRect.bottom <= sRect.bottom + 1;
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

// Deep-link contract: loading a chapter deep in the last group must
// auto-expand its category and scroll the real scroller to the active link.
async function assertDeepLinkAutoScrolls(page) {
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
}

// Cross-group SPA contract: the reading-spine footer of the last chapter of a
// group expands the next group, collapses the previous one (accordion), and
// keeps the target chapter visible.
async function assertReadingSpineAccordion(page) {
  await page.goto(siteUrl("/workflow-agents"), {
    waitUntil: "domcontentloaded",
  });
  await waitForPaint(page);
  await waitForHydrated(page);
  await waitForCategoryState(
    page,
    LABEL_FOUNDATIONS,
    true,
    "workflow-agents did not expand Foundations",
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
}

async function inspectActiveChapterScroll() {
  await withPage(
    "inspectActiveChapterScroll",
    { width: 1440, height: 720 },
    async (page) => {
      await emulateReducedMotion(page);
      await assertDeepLinkAutoScrolls(page);
      await assertReadingSpineAccordion(page);
    },
  );
}

// The contents list's two ends on a chapter whose last heading sits well below the fold: the click
// down is the longest travel available, and the click back up is the one an "has the heading reached
// the reading line yet" rule would cut short.
async function findTravellingRow(page, routes) {
  for (const route of routes) {
    await openChapter(page, route);
    const ends = await page.evaluate((tocSelector) => {
      const rows = Array.from(document.querySelectorAll(`${tocSelector} a`));
      if (rows.length < 2) return null;
      const first = rows[0].getAttribute("href");
      const last = rows[rows.length - 1].getAttribute("href");
      const heading = document.getElementById(last.slice(1));
      if (!heading) return null;
      const documentTop = heading.getBoundingClientRect().top + window.scrollY;
      return documentTop > window.innerHeight * 1.5 ? { first, last } : null;
    }, TOC_INLINE);
    if (ends) return { route, ...ends };
  }
  fail(
    "no route in the sitemap pairs a multi-row contents list with a final heading far enough down the page to travel to",
  );
}

// Records the active row every frame, so even a single frame naming a different
// row fails. Sampled from before the click until the page settles.
async function installActiveRowSampler(page) {
  await page.evaluate((tocSelector) => {
    window.__activeRows = [];
    const nav = document.querySelector(tocSelector);
    const tick = () => {
      const active = Array.from(nav.querySelectorAll("a")).find(
        (row) => getComputedStyle(row, "::before").content !== "none",
      );
      window.__activeRows.push(active ? active.getAttribute("href") : null);
      window.__activeRowFrame = requestAnimationFrame(tick);
    };
    window.__activeRowFrame = requestAnimationFrame(tick);
  }, TOC_INLINE);
}

async function collectActiveRowSamples(page) {
  return page.evaluate(() => {
    cancelAnimationFrame(window.__activeRowFrame);
    return {
      from: window.__activeRows[0],
      seen: [...new Set(window.__activeRows)],
    };
  });
}

function assertTravelledStraight(from, seen, href, route) {
  if (from === href)
    fail(
      `${href} on ${route} was already the active row; nothing travelled, so the highlight was not checked`,
    );
  const onTheWay = seen.filter((row) => row !== href && row !== from);
  if (onTheWay.length !== 0)
    fail(
      `clicking ${href} on ${route} highlighted ${onTheWay.join(", ")} on the way there; the contents list must move straight to the row the reader asked for`,
    );
  if (!seen.includes(href))
    fail(`clicking ${href} on ${route} never highlighted that row`);
}

async function assertClickHasNoDetour(page, route, href) {
  await installActiveRowSampler(page);
  await page.click(`${TOC_INLINE} a[href='${href}']`);
  await pause(1200);
  const { from, seen } = await collectActiveRowSamples(page);
  assertTravelledStraight(from, seen, href, route);
}

// Clicking a contents row must move the highlight straight to that row. It used to blink back to its
// idle weight for the whole length of the travel, because the scroll spy reports the position the page
// is passing through rather than the row the reader asked for.
async function inspectTocClickHighlight(routes) {
  await withPage("inspectTocClickHighlight", DESKTOP_VIEWPORT, async (page) => {
    const { route, first, last } = await findTravellingRow(page, routes);
    await assertClickHasNoDetour(page, route, last);
    await assertClickHasNoDetour(page, route, first);
  });
}

// ── Chapter audio: the pinned transport line ────────────────────────────
// The band is the audio contract the sidebar redesign exists for: one fixed
// line holding play and the chapter's progress, identical on every audio
// chapter. Narration is invisible everywhere else: the contents list and the
// article render the same whether or not a chapter has audio, so the player is
// the only place playback is shown.
// The heading being narrated is named beside the sidebar's own controls (the
// bottom button strip) and in the mobile dock's status row; both are asserted.
// Selectors use the theme's [data-audio-*] hooks, never hashed CSS classes;
// the chapter list comes from the audio manifest, never hardcoded, because a
// concurrent pipeline regenerates it.
const AUDIO_BAND = "[data-audio-band]";
const AUDIO_PLAY = `${AUDIO_BAND} [aria-label*="chapter audio"]`;
// The band lives in the sidebar footer's pinned bottom region, above the site
// controls (theme toggle + GitHub), whose spare width carries the status text.
const SIDEBAR_FOOTER = "[data-sidebar-footer]";
const SIDEBAR_UTILITY = "[data-sidebar-utility]";
// The hairline under the brand row, above the scrolling contents list.
const SIDEBAR_DIVIDER = "[data-sidebar-divider]";
// Scope to the desktop sidebar via its unhashed aria-label: the TOC renders
// inside nav[aria-label='Docs sidebar'], and module class names are hashed so
// `.sidebarScrollable` never matches a selector. (The mobile drawer mounts its
// own TOC copy only when opened, but the label scoping keeps this desktop-only
// regardless.)
const TOC_INLINE =
  "nav[aria-label='Docs sidebar'] nav[aria-label='Current chapter contents']";
// The contents list must not vary with narration, so its signature is read on a chapter with
// audio and compared with one without. Only computed style is compared — a text-only chapter
// legitimately has fewer rows, never differently styled ones — and the active row is probed
// rather than the first row, so the two sides are always like for like.
const TOC_SIGNATURE = {
  nav: [
    "borderLeftWidth",
    "borderLeftStyle",
    "borderLeftColor",
    "paddingLeft",
    "marginLeft",
    "marginTop",
    "marginBottom",
    "position",
  ],
  row: [
    "fontSize",
    "fontFamily",
    "fontWeight",
    "lineHeight",
    "letterSpacing",
    "color",
    "paddingLeft",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "minHeight",
    "position",
  ],
  // The eye's own marker: a row shows navigation position, never playback.
  marker: ["position", "left", "width", "top", "bottom", "backgroundColor"],
};
// The scrubber renders in two hosts — the desktop band and the mobile dock — so
// each surface carries its own selector and both are asserted. `data-audio-total`
// is the one time readout: the chapter's length while paused, the live position
// while the voice plays.
// One root per surface. Everything audio-flavoured is a descendant of one of these, except the
// <audio> element itself, which the engine mounts beside the article.
const DOCK = "[data-chapter-audio]";
const PLAYER_SURFACES = [AUDIO_BAND, SIDEBAR_UTILITY, DOCK];
const BAND_SCRUBBER = `${AUDIO_BAND} [data-audio-scrubber] input[type='range']`;
const DOCK_SCRUBBER = `${DOCK} [data-audio-scrubber] input[type='range']`;
const BAND_FILL = `${AUDIO_BAND} [data-audio-fill]`;
const DOCK_FILL = `${DOCK} [data-audio-fill]`;
const BAND_TOTAL = `${AUDIO_BAND} [data-audio-total]`;
const DOCK_TOTAL = `${DOCK} [data-audio-total]`;
const DOCK_PLAY = `${DOCK} [aria-label*='chapter audio']`;
// Selector bundle per scrubber host, so the shared battery below runs on either surface.
const BAND_CONTROLS = {
  scrubber: BAND_SCRUBBER,
  fill: BAND_FILL,
  play: AUDIO_PLAY,
};
const DOCK_CONTROLS = {
  scrubber: DOCK_SCRUBBER,
  fill: DOCK_FILL,
  play: DOCK_PLAY,
};
// The status text — which heading is being narrated — renders on both surfaces, each
// inside the box it has to fit: the sidebar's own bottom button strip, and the dock's
// status row.
const SIDEBAR_STATUS = `${SIDEBAR_UTILITY} [data-audio-status]`;
const DOCK_STATUS = `${DOCK} [data-audio-status]`;
const SIDEBAR_STATUS_SURFACE = {
  name: "sidebar status strip",
  status: SIDEBAR_STATUS,
  container: SIDEBAR_UTILITY,
};
const DOCK_STATUS_SURFACE = {
  name: "mobile dock",
  status: DOCK_STATUS,
  container: DOCK,
};
// The scrubber's arrow-key notch, applied by the component itself: its value space must stay
// continuous or the chapter's own length (`max`) is unreachable on a range's `min + n*step` grid.
const SCRUB_STEP_MS = 5000;
// End reachability is asserted as a fraction of the track, not in exact milliseconds: Chrome
// estimates an MP3's length from the streamed bytes and can disagree with the manifest's probe by
// about a second. The bug this guards left the thumb 0.72% short, so 0.3% still catches it.
const SCRUB_END_TOLERANCE = 0.003;
// A control beside the status text may not move at all when the narrated heading changes;
// half a pixel is sub-pixel rounding, not movement.
const STATUS_ROW_TOLERANCE = 0.5;
const AUDIO_MANIFEST = path.join(
  websiteDir,
  "static",
  "audio",
  "manifest.json",
);

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exact port of formatClock (src/audiobook/clock.ts): what the reader can check
// is the clock text, so the contract asserts the text, not the number behind it.
function formatClock(ms) {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const seconds = String(total % 60).padStart(2, "0");
  const minutes = Math.floor(total / 60) % 60;
  const hours = Math.floor(total / 3600);
  const rest = `${hours > 0 ? String(minutes).padStart(2, "0") : minutes}:${seconds}`;
  return hours > 0 ? `${hours}:${rest}` : rest;
}

function audioManifest() {
  const manifest = JSON.parse(fs.readFileSync(AUDIO_MANIFEST, "utf8"));
  if (!manifest.chapters || typeof manifest.chapters !== "object")
    fail(`audio manifest at ${AUDIO_MANIFEST} has no chapters object`);
  return manifest.chapters;
}

// Playback memory is keyed per chapter by the player's own storage prefix. Writing the key
// before any document loads is what makes the band's start-at-zero assertion a real contract:
// no code path in the page can have cleared the key first.
const PLAYBACK_KEY_PREFIX = "agentic-coding:audio:";

// Half a chapter is always a valid "where I stopped" offset — well past the point where an
// offer would be noise, and well inside the chapter's end — so seeding it would move the
// player if anything still read it.
async function seedPlaybackOffsets(page, chapters) {
  const offsets = Object.fromEntries(
    Object.entries(chapters).map(([key, chapter]) => [
      key,
      Math.round(chapter.durationMs * 0.5),
    ]),
  );
  await page.evaluateOnNewDocument(
    (prefix, seeds) => {
      for (const [key, timeMs] of Object.entries(seeds))
        localStorage.setItem(prefix + key, JSON.stringify({ timeMs }));
    },
    PLAYBACK_KEY_PREFIX,
    offsets,
  );
}

// The intro doc is served at the site root (slug: /); other chapters live at
// /<id>. Probing the built output derives the mapping instead of hardcoding
// which chapter id owns which route.
function chapterRouteCandidates(key) {
  const candidates = [`/${key}`];
  if (
    fs.existsSync(path.join(buildDir, "index.html")) &&
    !fs.existsSync(path.join(buildDir, key, "index.html"))
  )
    candidates.push("/");
  return candidates;
}

async function openChapter(page, route) {
  await page.goto(siteUrl(route), { waitUntil: "domcontentloaded" });
  await waitForPaint(page);
  await waitForHydrated(page);
}

async function readBandGeometry(page) {
  return page.evaluate(
    (
      selector,
      scrollerSelector,
      tocSelector,
      footerSelector,
      utilitySelector,
    ) => {
      const band = document.querySelector(selector);
      if (!band) return null;
      const rect = band.getBoundingClientRect();
      const utility = document.querySelector(utilitySelector);
      const utilityRect = utility?.getBoundingClientRect() ?? null;
      return {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        // Fixed location means outside the scrolling chapter list AND outside the
        // chapter-contents nav: inside either one, the band's offset would follow
        // where the active chapter sits in the list.
        outsideList:
          band.closest(scrollerSelector) === null &&
          band.closest(tocSelector) === null,
        // At the bottom of the nav the band is a footer child, above the controls.
        insideFooter: band.closest(footerSelector) !== null,
        bandAboveUtility:
          utilityRect === null ? false : rect.bottom <= utilityRect.top + 0.5,
      };
    },
    AUDIO_BAND,
    SIDEBAR_NAV,
    TOC_INLINE,
    SIDEBAR_FOOTER,
    SIDEBAR_UTILITY,
  );
}

// The pinned bottom region: with audio it holds the band above the utility row;
// without audio it holds the utility row alone. Its height proves the move did
// not take more height from the scrolling list than the old pinned arrangement.
async function readFooterGeometry(page) {
  return page.evaluate(
    (footerSelector, utilitySelector) => {
      const footer = document.querySelector(footerSelector);
      if (!footer) return null;
      const utility = document.querySelector(utilitySelector);
      const footerRect = footer.getBoundingClientRect();
      const utilityRect = utility?.getBoundingClientRect() ?? null;
      return {
        top: footerRect.top,
        height: footerRect.height,
        bottom: footerRect.bottom,
        utilityTop: utilityRect?.top ?? null,
        utilityHeight: utilityRect?.height ?? null,
        hasThemeToggle: Boolean(
          utility?.querySelector(".color-mode-toggle button"),
        ),
        hasGithub: Boolean(
          utility?.querySelector("a[aria-label='GitHub repository']"),
        ),
      };
    },
    SIDEBAR_FOOTER,
    SIDEBAR_UTILITY,
  );
}

// The scrolling list is the footer's previous flex sibling; read it structurally
// because its CSS-module class name is hashed.
async function readScrollableHeight(page) {
  return page.evaluate((footerSelector) => {
    const scrollable =
      document.querySelector(footerSelector)?.previousElementSibling;
    return scrollable ? scrollable.getBoundingClientRect().height : null;
  }, SIDEBAR_FOOTER);
}

function assertFooterControls(footer, route) {
  if (!footer.hasThemeToggle || !footer.hasGithub)
    fail(
      `sidebar footer on ${route} is missing the theme toggle (${SIDEBAR_UTILITY} .color-mode-toggle button) or the GitHub link`,
    );
}

// Play and the progress bar are one line: the transport is that line, not a row above it.
async function readBandTransportLine(page) {
  return page.evaluate((bandSelector) => {
    const band = document.querySelector(bandSelector);
    if (!band) return null;
    const play = band.querySelector("[aria-label*='chapter audio']");
    const strip = band.querySelector("[data-audio-scrubber] input[type='range']");
    if (!play || !strip) return null;
    const p = play.getBoundingClientRect();
    const s = strip.getBoundingClientRect();
    return {
      playLeft: p.left,
      playRight: p.right,
      playTop: p.top,
      playBottom: p.bottom,
      stripLeft: s.left,
      stripTop: s.top,
      stripBottom: s.bottom,
    };
  }, AUDIO_BAND);
}

// The hairline under the brand row: the boundary the audio band used to draw from its
// top slot. It must sit between the header and the scrolling list, above the TOC.
async function assertSidebarDivider(page, route) {
  const geometry = await page.evaluate((dividerSelector) => {
    const divider = document.querySelector(dividerSelector);
    if (!divider) return null;
    const rect = divider.getBoundingClientRect();
    const listTop =
      divider.nextElementSibling?.getBoundingClientRect().top ?? null;
    const headerBottom =
      divider.previousElementSibling?.getBoundingClientRect().bottom ?? null;
    return {
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      colour: getComputedStyle(divider).backgroundColor,
      headerBottom,
      listTop,
    };
  }, SIDEBAR_DIVIDER);
  if (!geometry) fail(`sidebar on ${route} has no ${SIDEBAR_DIVIDER}`);
  if (!(geometry.width > 0) || geometry.colour === "rgba(0, 0, 0, 0)")
    fail(`sidebar divider on ${route} is not visibly drawn`);
  if (
    geometry.headerBottom === null ||
    geometry.listTop === null ||
    geometry.top < geometry.headerBottom - 0.5 ||
    geometry.bottom > geometry.listTop + 0.5
  )
    fail(
      `sidebar divider on ${route} is not between the brand row (bottom ${geometry.headerBottom}) and the contents list (top ${geometry.listTop})`,
    );
}

// The contents list's rendered style on whichever chapter is open. `nav`/`row`/`marker` are
// each one joined string of computed values, so two chapters compare field by field.
async function readTocSignature(page) {
  return page.evaluate(
    (tocSelector, navProps, rowProps, markerProps) => {
      const nav = document.querySelector(tocSelector);
      if (!nav) return null;
      const rows = Array.from(nav.querySelectorAll("a"));
      if (rows.length === 0) return null;
      const read = (element, props, pseudo) => {
        const style = getComputedStyle(element, pseudo);
        return props.map((prop) => style[prop]).join("|");
      };
      // A row advertises itself as active by drawing the rail marker, not by a class
      // name a hashed stylesheet is free to rename.
      const active = rows.find(
        (row) => getComputedStyle(row, "::before").content !== "none"
      );
      // Playback state inside the list is exactly what would make it vary with narration.
      const hooks = Array.from(nav.querySelectorAll("*")).filter((element) =>
        Array.from(element.attributes).some((attribute) =>
          attribute.name.startsWith("data-audio")
        )
      ).length;
      return {
        nav: read(nav, navProps),
        row: read(active ?? rows[0], rowProps),
        marker: active ? read(active, markerProps, "::before") : "none",
        hooks,
      };
    },
    TOC_INLINE,
    TOC_SIGNATURE.nav,
    TOC_SIGNATURE.row,
    TOC_SIGNATURE.marker
  );
}

// The contents list renders identically whether or not the chapter has narration: same nav
// metrics, same row metrics, same active marker, and no playback state anywhere inside it.
// Compared against a real audio chapter rather than this page's own variables: the contents
// must not know that narration even exists.
function assertTocIsAudioIndependent(toc, audioToc, route) {
  if (!toc) fail(`text-only chapter ${route} has a chapter TOC with no rows`);
  // Without the audio chapter's signature there is nothing to compare against, and a
  // skipped comparison would read as a pass.
  if (!audioToc)
    fail(
      `the audio chapter has no chapter TOC to compare the contents on ${route} against`,
    );
  ["nav", "row", "marker"].forEach((part) => {
    if (toc[part] !== audioToc[part])
      fail(
        `text-only chapter ${route} renders its contents ${part} as ${toc[part]}; the audio chapter uses ${audioToc[part]} — the contents must not vary with narration`,
      );
  });
  if (toc.hooks !== 0)
    fail(
      `text-only chapter ${route} renders ${toc.hooks} audio nodes inside the contents list`,
    );
  if (audioToc.hooks !== 0)
    fail(
      `the audio chapter renders ${audioToc.hooks} audio nodes inside the contents list`,
    );
}

// A contents row must not resize when it becomes the active one: the row would grow a line and
// take the list — and every row below it — with it, mid-scroll. Every row is measured with and
// without the class that draws the active marker, on a detached copy of the list so the page's own
// DOM is never touched, and the class is found by differential application rather than by name, so
// the check survives a rename or a whole different highlighting technique.
// Each measurement waits for the frame after its style change: this phase runs with reduced motion
// emulated, where the browser applies a forced-zero-duration transition only on the next frame, so
// reading straight after the class change reports the previous metrics.
// Runs inside the page: puppeteer serializes the whole function, so it must
// reference nothing outside its own scope.
async function readTocRowResizeReport(tocSelector) {
  const nextFrame = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  const drawsMarker = (row) =>
    getComputedStyle(row, "::before").content !== "none";
  const height = (row) => row.getBoundingClientRect().height;

  // A detached copy of the list inside a shell of the sidebar's own width, so
  // the copy breaks its lines exactly as the real list and the page's own DOM
  // is never touched.
  const mountCopy = (nav) => {
    const shell = document.createElement("div");
    shell.style.cssText = `position:absolute;left:-99999px;top:0;width:${nav.getBoundingClientRect().width}px`;
    const copy = nav.cloneNode(true);
    // The list's own left margin is outside its measured width; drop it so the copy lays out in a
    // box of exactly the same width and breaks its lines exactly as the real list does.
    copy.style.margin = "0";
    shell.appendChild(copy);
    document.body.appendChild(shell);
    return shell;
  };

  // The class that draws the active marker is found by differential application,
  // not by name, so the check survives a rename or a different highlighting technique.
  const markerClassesOf = (active) =>
    Array.from(active.classList).filter((token) => {
      active.classList.remove(token);
      const markerGone = !drawsMarker(active);
      active.classList.add(token);
      return markerGone;
    });

  // Each measurement waits for the frame after its style change: this phase runs
  // with reduced motion emulated, where the browser applies a forced-zero-duration
  // transition only on the next frame, so reading straight after the class change
  // reports the previous metrics.
  const resizeOf = async (row, activeClasses) => {
    const idle = height(row);
    activeClasses.forEach((token) => row.classList.add(token));
    await nextFrame();
    const highlighted = height(row);
    activeClasses.forEach((token) => row.classList.remove(token));
    await nextFrame();
    return Math.abs(highlighted - idle) > 0.5
      ? `${row.getAttribute("href")} ${idle.toFixed(1)}px -> ${highlighted.toFixed(1)}px`
      : null;
  };

  const nav = document.querySelector(tocSelector);
  if (!nav) return { error: "has no chapter TOC" };
  const shell = mountCopy(nav);
  await nextFrame();
  const rows = Array.from(shell.querySelectorAll("a"));
  const active = rows.find(drawsMarker);
  if (!active) {
    shell.remove();
    return { error: "has no active contents row to model" };
  }
  const activeClasses = markerClassesOf(active);
  if (activeClasses.length === 0) {
    shell.remove();
    return { error: "draws its active marker from no class" };
  }
  const resized = [];
  for (const row of rows) {
    const resize = await resizeOf(row, activeClasses);
    if (resize) resized.push(resize);
  }
  shell.remove();
  return { resized };
}

async function inspectTocRowResize(page, route) {
  await openChapter(page, route);
  const report = await page.evaluate(readTocRowResizeReport, TOC_INLINE);
  if (report.error)
    fail(`${route} ${report.error}; row resizing cannot be checked`);
  if (report.resized.length !== 0)
    fail(
      `contents rows on ${route} resize when highlighted (${report.resized.join(", ")}); the list must not move when the reader's section changes`,
    );
}

// Per chapter: the band exists, and its viewport top does not move when the
// page scrolls — the two invariants the redesign exists for.
// The band's placement invariants: outside the scrolling list, inside the
// pinned footer, above the utility row.
function assertBandPlacement(atRest, route) {
  if (!atRest.outsideList)
    fail(
      `audio band on ${route} is nested in the sidebar list or the chapter-contents nav`,
    );
  if (!atRest.insideFooter)
    fail(`audio band on ${route} is not inside ${SIDEBAR_FOOTER}`);
  if (!atRest.bandAboveUtility)
    fail(
      `audio band on ${route} is not above the theme/GitHub row in the sidebar footer`,
    );
}

// The footer is exactly band + utility row, and the list above it keeps a
// usable height.
async function assertBandFillsFooter(page, atRest, route) {
  const footer = await readFooterGeometry(page);
  if (!footer) fail(`audio chapter ${route} has no ${SIDEBAR_FOOTER}`);
  assertFooterControls(footer, route);
  if (
    footer.utilityHeight === null ||
    Math.abs(footer.height - (atRest.height + footer.utilityHeight)) > 0.5
  )
    fail(
      `audio chapter ${route} footer is ${footer.height}px tall, not band ${atRest.height}px + utility ${footer.utilityHeight}px`,
    );
  const scrollerHeight = await readScrollableHeight(page);
  if (!(scrollerHeight > 0))
    fail(
      `audio chapter ${route} footer squeezed the sidebar list to ${scrollerHeight}px`,
    );
  return { footer, scrollerHeight };
}

// Play sits left of the scrubber and the two share one horizontal line.
async function assertBandTransportLine(page, route) {
  const line = await readBandTransportLine(page);
  if (!line)
    fail(`audio band on ${route} is missing its play button or its scrubber`);
  if (line.playRight > line.stripLeft + 0.5)
    fail(
      `audio band on ${route} draws play at ${line.playRight}px, past the scrubber's left edge ${line.stripLeft}px`,
    );
  if (
    line.playTop > line.stripTop + 0.5 ||
    line.playBottom < line.stripBottom - 0.5
  )
    fail(
      `audio band on ${route} puts play at ${line.playTop}-${line.playBottom}px and the progress bar at ${line.stripTop}-${line.stripBottom}px; the two share one line`,
    );
}

// The band is pinned: scrolling the page moves nothing.
async function assertBandStaysPinned(page, atRest, route) {
  await page.evaluate(() => window.scrollTo(0, 800));
  await waitForPaint(page);
  const scrolled = await readBandGeometry(page);
  if (Math.abs(scrolled.top - atRest.top) > 0.5)
    fail(
      `audio band on ${route} moved from top ${atRest.top}px to ${scrolled.top}px when the page scrolled`,
    );
  if (Math.abs(scrolled.height - atRest.height) > 0.5)
    fail(
      `audio band on ${route} changed height from ${atRest.height}px to ${scrolled.height}px when the page scrolled`,
    );
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function measureAudioChapter(page, key) {
  for (const route of chapterRouteCandidates(key)) {
    await openChapter(page, route);
    const atRest = await readBandGeometry(page);
    if (!atRest) continue;
    await assertOpensAtTheBeginning(page, route);
    assertBandPlacement(atRest, route);
    const { footer, scrollerHeight } = await assertBandFillsFooter(
      page,
      atRest,
      route,
    );
    await assertBandTransportLine(page, route);
    await assertSidebarDivider(page, route);
    await assertBandStaysPinned(page, atRest, route);
    return {
      key,
      route,
      top: atRest.top,
      height: atRest.height,
      footerHeight: footer.height,
      scrollerHeight,
      toc: await readTocSignature(page),
    };
  }
  fail(`audio chapter ${key} has no route that renders ${AUDIO_BAND}`);
}

// A chapter opens at the beginning: whatever a previous visit left in storage, the band must
// offer to start the chapter rather than to resume it, and the scrubber must read 0.
async function assertOpensAtTheBeginning(page, route) {
  const state = await page.evaluate(
    (playSelector, scrubberSelector) => {
      const play = document.querySelector(playSelector);
      const scrubber = document.querySelector(scrubberSelector);
      if (!play || !scrubber) return null;
      return {
        label: play.getAttribute("aria-label"),
        value: Number(scrubber.value),
      };
    },
    AUDIO_PLAY,
    BAND_SCRUBBER,
  );
  if (!state)
    fail(`audio chapter ${route} band has no play button or scrubber to read`);
  if (state.label !== "Listen chapter audio")
    fail(
      `audio chapter ${route} opens offering "${state.label}"; a stored offset must not be offered after navigation or reload`,
    );
  if (state.value !== 0)
    fail(`audio chapter ${route} opens its scrubber at ${state.value}ms, not 0`);
}

function assertBandGeometryIdentical(measured) {
  const first = measured[0];
  for (const chapter of measured.slice(1)) {
    if (
      Math.abs(chapter.top - first.top) > 0.5 ||
      Math.abs(chapter.height - first.height) > 0.5 ||
      Math.abs(chapter.footerHeight - first.footerHeight) > 0.5
    )
      fail(
        `audio band/footer geometry differs across chapters: ${first.key} (top ${first.top}, band ${first.height}, footer ${first.footerHeight}) vs ${chapter.key} (top ${chapter.top}, band ${chapter.height}, footer ${chapter.footerHeight})`,
      );
  }
}

// A chapter without audio renders no band, no space reserved for one, and a
// contents list that renders exactly as an audio chapter's does.
async function inspectTextOnlyChapter(page, audioRoutes, audioToc) {
  const candidates = routesFromSitemap().filter(
    (route) => !audioRoutes.includes(route) && route !== "/",
  );
  for (const route of candidates) {
    await openChapter(page, route);
    if (!(await page.$(TOC_INLINE))) continue;
    if (await page.$(AUDIO_BAND))
      fail(`text-only chapter ${route} renders ${AUDIO_BAND}`);
    const footer = await readFooterGeometry(page);
    if (!footer) fail(`text-only chapter ${route} has no ${SIDEBAR_FOOTER}`);
    assertFooterControls(footer, route);
    await assertSidebarDivider(page, route);
    if (
      footer.utilityHeight === null ||
      Math.abs(footer.height - footer.utilityHeight) > 0.5
    )
      fail(
        `text-only chapter ${route} footer is ${footer.height}px tall, not its utility row ${footer.utilityHeight}px — audio space leaked in`,
      );
    assertTocIsAudioIndependent(await readTocSignature(page), audioToc, route);
    return route;
  }
  fail("no text-only chapter with a chapter TOC was found in the sitemap");
}

// Exact port of the contiguous-run section merge in src/audiobook/outline.ts
// (narrateSections): the last heading id carries forward through figure and
// code marks, so a section's end is the end of the run before the NEXT
// headlined mark — not merely the last adjacent heading-anchored mark.
function allSectionSpans(marks) {
  let headingId = null;
  const spans = [];
  marks.forEach((mark) => {
    if (mark.anchor.kind === "heading" && mark.anchor.id)
      headingId = mark.anchor.id;
    const last = spans.at(-1);
    if (last && last.id === headingId) last.endMs = mark.endMs;
    else
      spans.push({ id: headingId, startMs: mark.startMs, endMs: mark.endMs });
  });
  return spans;
}

async function seekTo(page, ms) {
  await page.evaluate((seconds) => {
    const audio = document.querySelector("audio");
    if (!audio) throw new Error("no audio element on the page");
    audio.muted = true; // keep the headless clock running after any reload
    audio.currentTime = seconds;
  }, ms / 1000);
}

// scaleX(s) computes to matrix(s, 0, 0, 1, 0, 0); s is the 1st component.
async function scrubberFillScaleX(page, selector) {
  return page.evaluate((sel) => {
    const fill = document.querySelector(sel);
    if (!fill) return null;
    const matrix =
      getComputedStyle(fill).transform.match(/^matrix\(([^)]+)\)$/);
    return matrix ? Number.parseFloat(matrix[1].split(",")[0]) : null;
  }, selector);
}

// The player's chrome lives in the player's own surfaces — the sidebar band, the bottom button
// strip carrying its status text, and the mobile dock — and in nothing else, the article
// included. The check runs while narration is live, when every surface is mounted.
// `data-audio-figure` is exempt: it is the diagram extractor's own hook (DiagramFrame.tsx)
// marking figure anchors in narration order, not playback state, so every chapter carries it.
async function verifyAudioHooksStayInPlayerSurfaces(page) {
  const strays = await page.evaluate(
    (surfaces, articleSelector) => {
      const roots = surfaces.map((selector) => document.querySelector(selector));
      const outside = (element) =>
        !roots.some((root) => root !== null && root.contains(element));
      const marks = [];
      document.querySelectorAll("*").forEach((element) => {
        if (element.tagName === "AUDIO" && element.closest(articleSelector))
          marks.push("article audio");
        if (!outside(element)) return;
        Array.from(element.attributes).forEach((attribute) => {
          const name = attribute.name;
          if (name.startsWith("data-audio") && name !== "data-audio-figure")
            marks.push(`${element.tagName.toLowerCase()}[${name}]`);
        });
      });
      return marks;
    },
    PLAYER_SURFACES,
    "article",
  );
  if (strays.length !== 0)
    fail(
      `${strays.join(", ")} sit outside the player surfaces; audio chrome is band/dock/bottom-strip-only`,
    );
}

// Every station the status text can name: the manifested headings the article renders, in
// narration order, one per section — taken from the page rather than from a copy of the
// outline, because the manifest anchors narration to heading ids and the page renders those
// ids as the reader's own words. The article is the source, not the sidebar contents,
// because the dock is asserted at a width where the sidebar's list is not mounted.
async function headlineStations(page, marks) {
  const anchored = marks.filter(
    (mark) => mark.anchor?.kind === "heading" && mark.anchor.id,
  );
  const stations = [];
  const seen = new Set();
  for (const mark of anchored) {
    const id = mark.anchor.id;
    if (seen.has(id)) continue; // a section's later marks are the same station
    seen.add(id);
    const title = await headingTitleFor(page, id);
    if (title === null) continue;
    stations.push({ startMs: mark.startMs, title });
  }
  if (anchored.length > 0 && stations.length === 0)
    fail("no manifested heading anchor renders as a heading in the article");
  return stations;
}

// Which heading the clock sits in. Parking just inside a section's start lets the store land
// on it, and the seek's timeupdate has to reach the store before it is read.
async function parkedHeadline(page, marks) {
  const [first] = await headlineStations(page, marks);
  if (!first) return null; // a chapter the narration never headlines has no heading to name
  await seekTo(page, first.startMs + 250);
  await pause(400);
  return first.title;
}

// The reader's own wording for a heading id, off the heading the page renders for it.
async function headingTitleFor(page, id) {
  return page.evaluate((headingId) => {
    const heading = document.querySelector(`article [id="${headingId}"]`);
    return heading ? heading.textContent.trim() : null;
  }, id);
}

// The reader's own chapter title, off the article's h1 — the same frontmatter title the
// narration's opener turn speaks (doc-titles.test.ts pins it as one source of truth).
async function chapterTitleFor(page) {
  return page.evaluate(() => {
    const heading = document.querySelector("article h1");
    return heading ? heading.textContent.trim() : null;
  });
}

// The opener is the span before the first headlined mark — the only station with no
// `§n/total`. A chapter whose article renders no h1 has no title to name at that station.
async function openerStation(page, marks) {
  const span = allSectionSpans(marks).find(
    (candidate) => candidate.id === null,
  );
  if (!span) return null;
  const title = await chapterTitleFor(page);
  if (title === null) return null;
  return { startMs: span.startMs + 250, title };
}

// While the opener plays the voice says the chapter's own title, so the status line must
// name it too. `§n/total` is absent there, so the shape check skips itself.
async function assertStatusOpener(page, surface, marks) {
  const opener = await openerStation(page, marks);
  if (opener === null) return;
  await seekTo(page, opener.startMs);
  await pause(400); // the seek's timeupdate has to reach the store
  await assertStatusHeading(page, surface, opener.title);
}

// The status text names the heading being narrated, on whichever surface the reader has.
// Both surfaces answer it with one component, so both are held to the same rule: the
// heading may be long, but naming it may not resize the surface that carries it, nor move
// the controls that share its row.
async function verifyAudioStatus(page, surface, marks) {
  const before = await surfaceHeight(page, surface.container);
  if (before === null) fail(`no ${surface.container} holds the status text`);
  const expected = await parkedHeadline(page, marks);
  if (expected === null) return;
  await assertStatusHeading(page, surface, expected);
  await assertStatusFits(page, surface);
  await assertStatusOpener(page, surface, marks);
  await assertStatusLeavesControlsPut(page, surface, marks);
  const after = await surfaceHeight(page, surface.container);
  if (Math.abs(after - before) > 0.5)
    fail(
      `${surface.name} grew from ${before}px to ${after}px while naming "${expected}"`,
    );
}

async function surfaceHeight(page, selector) {
  return page.evaluate((containerSelector) => {
    const container = document.querySelector(containerSelector);
    return container ? container.getBoundingClientRect().height : null;
  }, selector);
}

async function assertStatusHeading(page, surface, expected) {
  const shown = await page.evaluate((statusSelector) => {
    const heading = document.querySelector(
      `${statusSelector} [data-audio-heading]`,
    );
    const position = document.querySelector(
      `${statusSelector} [data-audio-position]`,
    );
    return {
      heading: heading?.textContent ?? null,
      position: position?.textContent ?? null,
    };
  }, surface.status);
  const heading = shown.heading === null ? null : visibleText(shown.heading);
  if (heading !== visibleText(expected))
    fail(
      `${surface.name} names "${heading}" while the narrated heading is "${expected}"`,
    );
  const position = shown.position === null ? null : visibleText(shown.position);
  if (position !== null && !/^§\d+\/\d+$/.test(position))
    fail(
      `${surface.name} labels the narrated section "${position}"; "§n/total" is the contract`,
    );
}

// Headings carry zero-width and non-breaking characters the reader cannot see and the player
// does not echo; both sides are flattened before they are compared.
function visibleText(value) {
  return value
    .replace(/[\u200b-\u200d\ufeff\u00a0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// A heading can be too long to fit: it has to ellipsise inside its own surface rather than
// wrapping or widening the surface it sits in.
async function readStatusFit(page, surface) {
  return page.evaluate(
    (statusSelector, containerSelector) => {
      const status = document.querySelector(statusSelector);
      const container = document.querySelector(containerSelector);
      const heading = status?.querySelector("[data-audio-heading]");
      if (!status || !container || !heading) return null;
      const rect = status.getBoundingClientRect();
      return {
        width: rect.width,
        right: rect.right,
        containerRight: container.getBoundingClientRect().right,
        lines: heading.getClientRects().length,
        overflow: getComputedStyle(heading).textOverflow,
      };
    },
    surface.status,
    surface.container,
  );
}

function assertFit(surface, fit) {
  if (!(fit.width > 0)) fail(`${surface.name} status text has no width`);
  if (fit.right > fit.containerRight + 0.5)
    fail(
      `${surface.name} status text runs past its surface: right ${fit.right}px vs ${fit.containerRight}px`,
    );
  if (fit.lines !== 1)
    fail(
      `${surface.name} status heading wraps onto ${fit.lines} lines; a heading stays on one`,
    );
  if (fit.overflow !== "ellipsis")
    fail(
      `${surface.name} status heading is not ellipsised (text-overflow: ${fit.overflow})`,
    );
}

async function assertStatusFits(page, surface) {
  const fit = await readStatusFit(page, surface);
  if (!fit) fail(`${surface.name} renders no status text (${surface.status})`);
  assertFit(surface, fit);
}

// Every box in the row that carries the status text, in DOM order. That row is the reader's
// own bottom strip, so each control is named as the reader's DOM names it: the aria-label
// where a control has one, its tag otherwise. CSS-module class names are hashed and useless
// here; the index keeps two same-tag controls apart.
async function readRowBoxes(page, statusSelector) {
  const boxes = await page.evaluate((statusSel) => {
    const status = document.querySelector(statusSel);
    const row = status?.parentElement;
    if (!status || !row || row.children.length === 0) return null;
    return [...row.children].map((child, index) => {
      const rect = child.getBoundingClientRect();
      const name =
        child.getAttribute("aria-label") || child.tagName.toLowerCase();
      return {
        label: child === status ? "status text" : `${name} #${index}`,
        x: rect.left,
        width: rect.width,
      };
    });
  }, statusSelector);
  if (!boxes)
    fail(`no row of controls holds the status text (${statusSelector})`);
  return boxes;
}

// The heading named may change at every station; the boxes beside the status text may not.
// One box is compared against the station furthest from it — the widest gap bounds every
// other pair — so the failure names the title that moved it rather than whichever station
// happens to be sampled first.
function assertBoxHoldsStill(samples, index, surface) {
  const boxes = samples.map((sample) => ({
    title: sample.title,
    box: sample.boxes[index],
  }));
  let worst = null;
  for (const from of boxes)
    for (const to of boxes) {
      const distance = Math.max(
        Math.abs(to.box.x - from.box.x),
        Math.abs(to.box.width - from.box.width),
      );
      if (!worst || distance > worst.distance) worst = { from, to, distance };
    }
  if (worst.distance <= STATUS_ROW_TOLERANCE) return;
  fail(
    `${surface.name} moves its "${worst.from.box.label}" box ` +
      `(${worst.distance.toFixed(2)}px) while the status names "${worst.to.title}": ` +
      `x ${worst.from.box.x} width ${worst.from.box.width} at "${worst.from.title}" vs ` +
      `x ${worst.to.box.x} width ${worst.to.box.width}`,
  );
}

// Naming a longer heading may not move any control the status text shares its row with
// either: the reader's eye follows the GitHub link and the theme toggle while the title
// changes. That row is the whole of the desktop surface's neighbour set, and the dock's row
// holds the status alone, so this check is a no-op where nothing can move.
async function assertStatusLeavesControlsPut(page, surface, marks) {
  const stations = await headlineStations(page, marks);
  if (stations.length < 2) return; // one station cannot show a box moving
  const parked = await readRowBoxes(page, surface.status);
  if (parked.length < 2) return; // the status text is alone in its row
  const opener = await openerStation(page, marks);
  if (opener) stations.unshift(opener); // the chapter-title line must hold the row too
  const samples = [];
  for (const station of stations) {
    await seekTo(page, station.startMs + 250);
    await pause(400); // the seek's timeupdate has to reach the store
    samples.push({
      title: station.title,
      boxes: await readRowBoxes(page, surface.status),
    });
  }
  for (let index = 0; index < parked.length; index += 1)
    assertBoxHoldsStill(samples, index, surface);
}

// Playback speed is gone; neither surface may start offering it again.
async function assertNoRateControls(page) {
  const rate = await page.evaluate(() => ({
    cells: document.querySelectorAll("[data-audio-rate]").length,
    groups: document.querySelectorAll(
      '[role="group"][aria-label="Playback speed"]',
    ).length,
  }));
  if (rate.cells > 0 || rate.groups > 0)
    fail(
      `the player still exposes playback speed (${rate.cells} rate cells, ${rate.groups} speed groups)`,
    );
}

// The clock is only trustworthy once the element knows the media's length.
async function waitForAudioReady(page) {
  try {
    await page.waitForFunction(
      () => {
        const audio = document.querySelector("audio");
        return audio && audio.readyState >= 1;
      },
      { timeout: 15000 },
    );
  } catch {
    fail("the page never produced an audio element with metadata");
  }
}

async function expectAudioPaused(page, paused, label) {
  const actual = await page.evaluate(
    () => document.querySelector("audio")?.paused ?? null,
  );
  if (actual !== paused)
    fail(
      `${label}: audio is ${actual === null ? "absent" : actual ? "paused" : "playing"}; expected ${paused ? "paused" : "playing"}`,
    );
}

async function waitForMediaNear(page, ms, slackMs, label) {
  try {
    await page.waitForFunction(
      (target, slack) => {
        const audio = document.querySelector("audio");
        return !!audio && Math.abs(audio.currentTime * 1000 - target) <= slack;
      },
      { timeout: 5000 },
      ms,
      slackMs,
    );
  } catch {
    const actual = await page.evaluate(
      () => (document.querySelector("audio")?.currentTime ?? -1) * 1000,
    );
    fail(
      `${label}: audio.currentTime is ${Math.round(actual)}ms, expected ${ms}ms (±${slackMs})`,
    );
  }
}

// A native range carries no `aria-valuemax`/`aria-valuenow` attributes: Chromium
// derives them from the element and exposes them as the slider's AX properties,
// which is what assistive tech actually reads.
async function readSliderAxValue(page, selector) {
  const client = await page.createCDPSession();
  try {
    const { root } = await client.send("DOM.getDocument");
    const { nodeId } = await client.send("DOM.querySelector", {
      nodeId: root.nodeId,
      selector,
    });
    if (!nodeId)
      fail(`no element matches ${selector} for the accessibility read`);
    const { nodes } = await client.send("Accessibility.getPartialAXTree", {
      nodeId,
      fetchRelatives: false,
    });
    const node = nodes[0];
    const property = (name) =>
      node.properties?.find((entry) => entry.name === name)?.value?.value;
    return {
      role: node.role?.value,
      name: node.name?.value,
      valuemin: property("valuemin"),
      valuemax: property("valuemax"),
      value: Number(node.value?.value),
    };
  } finally {
    await client.detach().catch(() => {});
  }
}

async function readScrubberSurface(page, selector) {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel);
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return {
      max: input.max,
      value: Number(input.value),
      valueText: input.getAttribute("aria-valuetext"),
      label: input.getAttribute("aria-label"),
      rangeVisible: input.getClientRects().length > 0,
      width: rect.width,
      height: rect.height,
    };
  }, selector);
}

// One surface of the scrubber: a real slider whose maximum is the chapter's own length.
async function assertScrubberSurface(page, selector, chapter, surface) {
  const scrubber = await readScrubberSurface(page, selector);
  if (!scrubber) fail(`the ${surface} renders no scrubber (${selector})`);
  if (!scrubber.rangeVisible) fail(`the ${surface} scrubber is not visible`);
  if (Number(scrubber.max) !== chapter.durationMs)
    fail(
      `${surface} scrubber max is ${scrubber.max}; the manifest duration is ${chapter.durationMs}`,
    );
  if (!scrubber.label || !scrubber.valueText)
    fail(`${surface} scrubber carries no aria-label/aria-valuetext`);
  const ax = await readSliderAxValue(page, selector);
  if (ax.role !== "slider")
    fail(`${surface} scrubber exposes role "${ax.role}", not "slider"`);
  if (Number(ax.valuemax) !== chapter.durationMs)
    fail(
      `${surface} slider valuemax is ${ax.valuemax}; the manifest duration is ${chapter.durationMs}`,
    );
  return scrubber;
}

// React ignores a plain `input.value =`, so the drag path is the native prototype
// setter plus the `input` event a pointer drag emits.
async function dispatchScrubValue(page, selector, value) {
  return page.evaluate(
    (sel, next) => {
      const input = document.querySelector(sel);
      if (!input) return null;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(input, String(next));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return Number(input.value);
    },
    selector,
    value,
  );
}

// A real pointer drag across the scrubber strip: this is the gesture the reader
// performs with the square knob, and it must land the clock near the pointer.
async function dragScrubber(page, selector, ratio, chapter, label) {
  const box = await (await page.$(selector))?.boundingBox();
  if (!box) fail(`${label}: the scrubber has no box to drag`);
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + box.width * 0.1, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ratio, y, { steps: 5 });
  await page.mouse.up();
  // The thumb travels inside the track, so the landing point is proportional
  // rather than exact: 8% of the chapter is the slack a 9px knob earns.
  await waitForMediaNear(
    page,
    Math.round(ratio * chapter.durationMs),
    Math.round(0.08 * chapter.durationMs),
    `${label} pointer drag`,
  );
}

// The two paths that move the media clock: a real `input` event (drag) and one
// ArrowRight step. Both must work while paused and while playing.
async function verifyScrubberMoves(page, selector, chapter, playing, surface) {
  const state = playing ? "playing" : "paused";
  const target = Math.round(chapter.durationMs * 0.3);
  if ((await dispatchScrubValue(page, selector, target)) === null)
    fail(`${surface} has no scrubber to drive`);
  await waitForMediaNear(
    page,
    target,
    SCRUB_STEP_MS * 1.5,
    `${surface} scrub by input event (${state})`,
  );
  await expectAudioPaused(page, !playing, surface);
  await page.focus(selector);
  const from = await readScrubberSurface(page, selector);
  await page.keyboard.press("ArrowRight");
  await waitForMediaNear(
    page,
    from.value + SCRUB_STEP_MS,
    SCRUB_STEP_MS * 1.5,
    `${surface} scrub by ArrowRight (${state})`,
  );
  await expectAudioPaused(page, !playing, surface);
}

// `aria-valuenow` is the media clock quantised by the range's 5000ms step: it
// must follow playback, not merely hold the value the last drag left behind.
async function verifyScrubberTracksClock(page, selector, surface) {
  const before = await readScrubberSurface(page, selector);
  try {
    await page.waitForFunction(
      (sel, start, step) => {
        const input = document.querySelector(sel);
        const audio = document.querySelector("audio");
        return (
          !!input &&
          !!audio &&
          !audio.paused &&
          Number(input.value) > start &&
          Math.abs(Number(input.value) - audio.currentTime * 1000) <= step * 1.2
        );
      },
      { timeout: 12000 },
      selector,
      before.value,
      SCRUB_STEP_MS,
    );
  } catch {
    fail(
      `${surface} scrubber value stayed at ${before.value}ms while the narration advanced`,
    );
  }
}

// Invariants 1 and 2 on the desktop band: the separator is a real draggable
// slider holding the chapter's duration, and driving it moves the media clock.
// Paused moves, both ends, then playing moves and clock tracking — the battery
// every scrubber surface must pass.
async function verifyScrubberBattery(page, controls, chapter, surface) {
  await verifyScrubberMoves(page, controls.scrubber, chapter, false, surface);
  await verifyScrubberEnds(
    page,
    controls.scrubber,
    controls.fill,
    chapter,
    surface,
  );
  await page.click(controls.play);
  await expectAudioPaused(page, false, `${surface} scrub`);
  await verifyScrubberMoves(page, controls.scrubber, chapter, true, surface);
  await verifyScrubberTracksClock(page, controls.scrubber, surface);
}

async function verifyScrubber(page, chapter) {
  await assertScrubberSurface(page, BAND_SCRUBBER, chapter, "desktop band");
  if (!(await currentPaused(page))) await page.click(AUDIO_PLAY);
  await expectAudioPaused(page, true, "desktop band scrub");
  await verifyScrubberTimeLabel(
    page,
    BAND_TOTAL,
    AUDIO_PLAY,
    chapter,
    "desktop band",
  );
  await dragScrubber(page, BAND_SCRUBBER, 0.6, chapter, "desktop band");
  await verifyScrubberBattery(page, BAND_CONTROLS, chapter, "desktop band");
}

// Both of the scrubber's drawings must agree at the chapter's two ends: the fill is our fraction
// of `durationMs`, the thumb is the browser's position for the range's own value. A `step` grid
// cannot hold an off-grid `max`, so the thumb used to stop one notch short of the end (655000 of
// 659753ms for how-llms-work) while the fill read 100% — the knob never arrived.
async function verifyScrubberEnds(
  page,
  selector,
  fillSelector,
  chapter,
  surface,
) {
  for (const [edge, expected, at] of [
    [0, 0, "start"],
    [chapter.durationMs, 1, "end"],
  ]) {
    await seekTo(page, edge);
    await pause(400); // let a timeupdate land and the transform settle
    const scrubber = await readScrubberSurface(page, selector);
    const reach = scrubber.value / Number(scrubber.max);
    if (Math.abs(reach - expected) > SCRUB_END_TOLERANCE)
      fail(
        `${surface} thumb sits at ${reach} of the track at the chapter's ${at}; expected ${expected}`,
      );
    const fill = await scrubberFillScaleX(page, fillSelector);
    if (Math.abs(fill - expected) > SCRUB_END_TOLERANCE)
      fail(
        `${surface} fill draws ${fill} at the chapter's ${at}; expected ${expected}`,
      );
  }
  await verifyScrubberEndKeys(page, selector, surface);
}

// Home and End are how a reader reaches an end without dragging, so they must land on it too.
// The end goes first, which leaves the clock at the start for the playback checks that follow.
async function verifyScrubberEndKeys(page, selector, surface) {
  await page.focus(selector);
  for (const [key, expected] of [
    ["End", 1],
    ["Home", 0],
  ]) {
    await page.keyboard.press(key);
    await pause(400);
    const scrubber = await readScrubberSurface(page, selector);
    const reach = scrubber.value / Number(scrubber.max);
    if (Math.abs(reach - expected) > SCRUB_END_TOLERANCE)
      fail(
        `${surface} ${key} leaves the scrubber at ${reach} of the track; expected ${expected}`,
      );
  }
}

async function currentPaused(page) {
  return page.evaluate(() => document.querySelector("audio")?.paused ?? true);
}

// The bottom strip carries one time readout: the chapter's length while paused,
// the live position while the voice plays. The slider's value is the position in
// either case, so the label is the only thing that swaps.
// Paused and parked away from the ends — near the chapter's end the live label
// would read the same text as the total, making the swap unobservable — the
// readout is the chapter's length.
async function assertPausedLabelShowsTotal(
  page,
  totalSelector,
  playSelector,
  chapter,
  surface,
) {
  if (!(await currentPaused(page))) await page.click(playSelector);
  await expectAudioPaused(page, true, `${surface} time label`);
  await seekTo(page, Math.round(chapter.durationMs * 0.1));
  await pause(200);
  const total = formatClock(chapter.durationMs);
  // The pause event flips the element synchronously but reaches the store (and
  // therefore the label) on the next render, so wait for the label to settle.
  if (!(await waitForLabel(page, totalSelector, total, 5000))) {
    const shown = await readScrubberLabel(page, totalSelector);
    fail(
      `${surface} shows "${shown}" while paused; the total ${total} is expected`,
    );
  }
  return total;
}

// Waits until the label stops showing the paused-state total.
async function waitForLabelChange(page, totalSelector, total, surface) {
  try {
    await page.waitForFunction(
      (totalSel, expected) => {
        const node = document.querySelector(totalSel);
        return !!node && node.textContent !== expected;
      },
      { timeout: 8000 },
      totalSelector,
      total,
    );
  } catch {
    fail(`${surface} still shows the total "${total}" while playing`);
  }
}

// The live label and the audio clock, read together so they agree by construction.
async function readLiveLabel(page, totalSelector) {
  return page.evaluate((totalSel) => {
    const node = document.querySelector(totalSel);
    const audio = document.querySelector("audio");
    return {
      label: node?.textContent ?? null,
      ms: audio ? audio.currentTime * 1000 : null,
    };
  }, totalSelector);
}

// Playing, the same element shows the live position instead of the total.
async function assertPlayingLabelShowsPosition(
  page,
  totalSelector,
  playSelector,
  total,
  surface,
) {
  await page.click(playSelector);
  await expectAudioPaused(page, false, `${surface} time label`);
  await waitForLabelChange(page, totalSelector, total, surface);
  const playing = await readLiveLabel(page, totalSelector);
  const live = readingSeconds(playing.label);
  if (live === null)
    fail(`${surface} shows an unreadable live time "${playing.label}"`);
  // The label floors to whole seconds and updates on `timeupdate`, so allow the
  // rounding the clock format itself introduces.
  if (Math.abs(live - playing.ms / 1000) > 1.5)
    fail(
      `${surface} shows "${playing.label}" while playing; the live position is ${formatClock(playing.ms)}`,
    );
  await page.click(playSelector);
  await expectAudioPaused(page, true, `${surface} time label`);
}

async function verifyScrubberTimeLabel(
  page,
  totalSelector,
  playSelector,
  chapter,
  surface,
) {
  const total = await assertPausedLabelShowsTotal(
    page,
    totalSelector,
    playSelector,
    chapter,
    surface,
  );
  await assertPlayingLabelShowsPosition(
    page,
    totalSelector,
    playSelector,
    total,
    surface,
  );
}

async function waitForLabel(page, selector, expected, timeout) {
  try {
    await page.waitForFunction(
      (sel, value) => {
        const node = document.querySelector(sel);
        return !!node && node.textContent === value;
      },
      { timeout },
      selector,
      expected,
    );
    return true;
  } catch {
    return false;
  }
}

async function readScrubberLabel(page, selector) {
  return page.evaluate(
    (totalSel) => document.querySelector(totalSel)?.textContent ?? null,
    selector,
  );
}

// "M:SS" or "H:MM:SS" back to seconds; null when unparseable.
function readingSeconds(text) {
  const match = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(text ?? "");
  if (!match) return null;
  return (
    Number(match[1] ?? 0) * 3600 + Number(match[2]) * 60 + Number(match[3])
  );
}

// Invariant 1, mobile half: below the 997px breakpoint the same scrubber lives in
// the dock, and the desktop band is not the surface the reader gets.
async function verifyDockScrubber(page, chapter, marks) {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  try {
    await openChapter(page, chapter.route);
    await waitForAudioReady(page);
    await seekTo(page, 0);
    await verifyAudioStatus(page, DOCK_STATUS_SURFACE, marks);
    await assertScrubberSurface(page, DOCK_SCRUBBER, chapter, "mobile dock");
    const band = await readScrubberSurface(page, BAND_SCRUBBER);
    if (band?.rangeVisible)
      fail("the desktop band scrubber is still visible below 997px");
    await verifyScrubberTimeLabel(
      page,
      DOCK_TOTAL,
      DOCK_PLAY,
      chapter,
      "mobile dock",
    );
    await verifyScrubberBattery(page, DOCK_CONTROLS, chapter, "mobile dock");
  } finally {
    await page.setViewport({ ...DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
  }
}

async function verifyBandPlaybackContract(page, chapter, marks) {
  await openChapter(page, chapter.route);
  await waitForAudioReady(page);
  // Headless Chromium stalls the audio clock while unmuted.
  await seekTo(page, 0);
  await page.click(AUDIO_PLAY);
  await verifyAudioHooksStayInPlayerSurfaces(page);
  await assertNoRateControls(page);
  await verifyAudioStatus(page, SIDEBAR_STATUS_SURFACE, marks);
  await verifyScrubber(page, chapter);
}

// The pinned footer is fixed height: on a short desktop viewport it must still
// leave the scrolling list height and stay inside the viewport.
async function inspectShortSidebarViewport(page, route) {
  await page.setViewport({ width: 1440, height: 600, deviceScaleFactor: 1 });
  await openChapter(page, route);
  const geometry = await page.evaluate((footerSelector) => {
    const footer = document.querySelector(footerSelector);
    if (!footer) return null;
    const scrollable = footer.previousElementSibling;
    const f = footer.getBoundingClientRect();
    return {
      footerTop: f.top,
      footerBottom: f.bottom,
      scrollableHeight: scrollable?.getBoundingClientRect().height ?? null,
      viewportHeight: window.innerHeight,
    };
  }, SIDEBAR_FOOTER);
  if (!geometry) fail(`short viewport: no ${SIDEBAR_FOOTER}`);
  if (!(geometry.scrollableHeight > 0))
    fail(
      `short viewport (1440x600): the pinned footer squeezed the sidebar list to ${geometry.scrollableHeight}px`,
    );
  if (geometry.footerBottom > geometry.viewportHeight + 0.5)
    fail(
      `short viewport (1440x600): footer bottom ${geometry.footerBottom}px overflows the ${geometry.viewportHeight}px viewport`,
    );
  if (geometry.footerTop < 0)
    fail("short viewport (1440x600): footer starts above the viewport");
}

async function measureAudioChapters(page, manifest) {
  const measured = [];
  for (const key of Object.keys(manifest)) {
    measured.push(
      await withRetry(
        () => measureAudioChapter(page, key),
        `measureAudioChapter(${key})`,
      ),
    );
  }
  assertBandGeometryIdentical(measured);
  return measured;
}

async function assertRowsStayPutOnAudioChapters(page, measured) {
  for (const entry of measured) {
    await withRetry(
      () => inspectTocRowResize(page, entry.route),
      `inspectTocRowResize(${entry.key})`,
    );
  }
}

async function verifyPlaybackSurfaces(page, chapter, manifest) {
  const marks = manifest[chapter.key].marks;
  await withRetry(
    () => verifyBandPlaybackContract(page, chapter, marks),
    "verifyBandPlaybackContract",
  );
  await withRetry(
    () => verifyDockScrubber(page, chapter, marks),
    "verifyDockScrubber",
  );
  await withRetry(
    () => inspectShortSidebarViewport(page, chapter.route),
    "inspectShortSidebarViewport",
  );
}

async function inspectSidebarAudioBand() {
  await withPage("inspectSidebarAudioBand", DESKTOP_VIEWPORT, async (page) => {
    await emulateReducedMotion(page);
    const manifest = audioManifest();
    await seedPlaybackOffsets(page, manifest);
    const measured = await measureAudioChapters(page, manifest);
    const textOnlyRoute = await withRetry(
      () =>
        inspectTextOnlyChapter(
          page,
          measured.map((chapter) => chapter.route),
          measured[0].toc,
        ),
      "inspectTextOnlyChapter",
    );
    await assertRowsStayPutOnAudioChapters(page, measured);
    // The scrubber and marker contracts need the manifest's own length, so the
    // geometry record (key/route/top/height) is joined with it here.
    const chapter = {
      ...measured[0],
      durationMs: manifest[measured[0].key].durationMs,
    };
    await verifyPlaybackSurfaces(page, chapter, manifest);
    console.log(
      `audio band contract verified on ${measured
        .map((entry) => entry.route)
        .join(
          ", ",
        )} (text-only control: ${textOnlyRoute}; band ${measured[0].height}px in a ${measured[0].footerHeight}px footer, ${measured[0].scrollerHeight}px list; scrubber time label + mobile dock verified, and the contents list renders identically with and without audio)`,
    );
  });
}

async function launchBrowser() {
  fs.mkdirSync(TRACE_DIR, { recursive: true });
  browser = await puppeteer.launch({ headless: true });
}

async function inspectNavigationContracts(routes) {
  await withRetry(
    () => inspectNoJavaScriptHomepage(),
    "inspectNoJavaScriptHomepage",
  );
  await withRetry(() => inspectSidebarNavigation(), "inspectSidebarNavigation");
  await withRetry(
    () => inspectMobileDrawerSidebar(),
    "inspectMobileDrawerSidebar",
  );
  await withRetry(
    () => inspectActiveChapterScroll(),
    "inspectActiveChapterScroll",
  );
  await withRetry(
    () => inspectTocClickHighlight(routes),
    "inspectTocClickHighlight",
  );
  await withRetry(() => inspectSidebarAudioBand(), "inspectSidebarAudioBand");
}

async function inspectResponsiveRoutes(routes) {
  const page = await browser.newPage();
  try {
    return await withRetry(() => inspectRoutes(page, routes), "inspectRoutes");
  } catch (error) {
    await captureFailure(page, "inspectRoutes");
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

  await launchBrowser();
  await inspectNavigationContracts(routes);
  const responsiveContainers = await inspectResponsiveRoutes(routes);
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
