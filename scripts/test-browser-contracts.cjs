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
const LABEL_EXERCISES = "Exercises"; // chapterGroups[4].label
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
// The play button's accessible name, shared with the component so the two cannot drift.
const AUDIO_LABELS = path.join(
  websiteDir,
  "src",
  "theme",
  "audio",
  "labels.ts",
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

// Actions job-summary telemetry: retry-only passes and the slowest route/viewport
// checks, so a flake is visible at a glance instead of buried in the log. Absent
// GITHUB_STEP_SUMMARY (local runs) this is silently unused.
const telemetry = { contracts: [], routes: [] };

// One contract attempt outcome, flattened for the job summary.
function recordContract(label, attempts, startedAt, failed) {
  telemetry.contracts.push({
    label,
    attempts,
    ms: Date.now() - startedAt,
    failed,
  });
}

// The route under test, for failure messages; test doubles may omit url().
function pageRoute(page) {
  return typeof page.url === "function" ? page.url() : "the page";
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
// Below this width the band yields to the dock (the player's 997px breakpoint).
const DOCK_VIEWPORT = { width: 390, height: 844 };

// A check that needs the dock swaps the viewport and restores the desktop one whatever the
// body does, so a mid-check failure cannot leak the mobile viewport into the next check.
async function withDockViewport(page, fn) {
  await page.setViewport({ ...DOCK_VIEWPORT, deviceScaleFactor: 1 });
  try {
    return await fn();
  } finally {
    await page.setViewport({ ...DESKTOP_VIEWPORT, deviceScaleFactor: 1 });
  }
}

// Long CSS transitions would race every geometry assertion, so inspectors that
// measure layout freeze animations.
async function emulateReducedMotion(page) {
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
}

// The built site ships third-party requests the contracts don't depend on (umami
// analytics, the homepage's live api.github.com star refresh, remote doc images).
// Aborting them keeps every contract hermetic: no dependency on a third party's
// latency or availability, and no cross-run variance from an external outage.
async function blockForeignRequests(page) {
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = new URL(request.url());
    const foreignHttp =
      url.protocol.startsWith("http") &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "localhost";
    const resolution = foreignHttp ? request.abort() : request.continue();
    resolution.catch((error) =>
      console.warn(`[hermetic] ${request.url()}: ${error.message}`),
    );
  });
}

// Hermetic by construction: every contract page gets interception before its first
// navigation, so a new inspector cannot forget the block.
async function openContractPage() {
  const page = await browser.newPage();
  await blockForeignRequests(page);
  return page;
}

// Every inspector runs the same scaffold: a fresh page at one viewport, a
// failure screenshot named after the inspector, and a close that must never
// mask the real error.
async function withPage(name, viewport, fn) {
  const page = await openContractPage();
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
  const startedAt = Date.now();
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const value = await fn();
      recordContract(label, attempt, startedAt, false);
      return value;
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
  recordContract(label, attempts, startedAt, true);
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
  const startedAt = Date.now();
  try {
    await page.setViewport({ width, height: 900, deviceScaleFactor: 1 });
    const response = await page.goto(
      `http://127.0.0.1:${server._port}${route}`,
      {
        waitUntil: "domcontentloaded",
      },
    );
    if (!response || response.status() >= 400) {
      fail(`${route} at ${width}px returned ${response && response.status()}`);
    }
    await waitForPaint(page);
    const states = await page.evaluate(variantState);
    states.forEach((state) => assertVariantState(state, route, width));
    return states.length;
  } finally {
    telemetry.routes.push({ route, width, ms: Date.now() - startedAt });
  }
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

// The cover promises the book's freshness, chapters their own: the homepage
// footer must read "Book last updated" while a chapter reads "Last updated".
// Static-HTML check (same fetch style as the no-JavaScript contract above):
// a stray label elsewhere cannot satisfy it, and no browser JS is needed.
async function inspectLastUpdatedLabels() {
  const home = await (await fetch(siteUrl())).text();
  if (!home.includes("Book last updated"))
    fail('homepage footer is missing the "Book last updated" label');
  if (!/dateModified/.test(home))
    fail("homepage footer is missing its <time dateModified> element");
  const chapter = await (await fetch(siteUrl(FOUNDATIONS_FIRST_DOC))).text();
  if (!chapter.includes("Last updated"))
    fail(`${FOUNDATIONS_FIRST_DOC} footer is missing the "Last updated" label`);
  if (chapter.includes("Book last updated"))
    fail(`${FOUNDATIONS_FIRST_DOC} footer must not use the book label`);
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
// Docusaurus hydration marker (HasHydratedDataAttribute, Docusaurus #9256;
// verified against @docusaurus/core 3.9.2). A rename in a future upgrade breaks
// every contract at once, so the attribute name lives here rather than inline
// in the page function below. Worst-case wait: 15s hydration + 5s TOC settle
// inside openChapter, per route attempt — bounded by the deploy step timeout.
const HYDRATED_ATTR = "data-has-hydrated";

async function waitForHydrated(page) {
  // Docusaurus renders <html data-has-hydrated="false"> server-side and flips it
  // to "true" once React hydrates. That single marker exists at every viewport,
  // so it replaces the desktop-only category-href probe and the page-global
  // network-idle fallback whose counter never settled while analytics or media
  // requests were in flight.
  try {
    await page.waitForFunction(
      (attr) =>
        document.documentElement.getAttribute(attr) === "true",
      // Interval polling is immune to renderer rAF throttling on loaded runners.
      { timeout: 15000, polling: 100 },
      HYDRATED_ATTR,
    );
  } catch (error) {
    fail(
      `the page never hydrated (${HYDRATED_ATTR} stayed false) at ${pageRoute(page)}: ${error.message}`,
    );
  }
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

async function clickPaginatorNext(page) {
  const clicked = await page.evaluate(() => {
    const link = document.querySelector(
      "nav.pagination-nav a.pagination-nav__link--next",
    );
    if (!link) return false;
    link.click();
    return true;
  });
  if (!clicked) fail("paginator Next link was not found");
}

// Deep-link contract: loading a chapter deep in the last group must
// auto-expand its category and scroll the real scroller to the active link.
async function assertDeepLinkAutoScrolls(page) {
  await page.goto(siteUrl("/exercises/tic-tac-toe/overview"), {
    waitUntil: "domcontentloaded",
  });
  await waitForPaint(page);
  await waitForHydrated(page);
  await waitForCategoryState(
    page,
    LABEL_EXERCISES,
    true,
    `deep link did not auto-expand ${LABEL_EXERCISES}`,
  );
  await waitForActiveChapterInScroller(
    page,
    "deep link did not scroll the active chapter into the sidebar viewport",
  );
}

// Cross-group SPA contract: the paginator's Next link from the last chapter of a
// group expands the next group, collapses the previous one (accordion), and
// keeps the target chapter visible.
async function assertPaginatorAccordion(page) {
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
  await clickPaginatorNext(page);
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
      await assertPaginatorAccordion(page);
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
  // Only chapter routes (TOC/audio contracts) need the settle wait: sidebar and
  // drawer contracts never read the contents list and already synchronize via
  // waitForCategoryState / waitForActiveChapterInScroller, so adding it there
  // would only add cost and a new failure mode.
  await waitForTocSettled(page);
}

// Hydration flips before the sidebar's scrollspy has published the active row and
// its highlight finishes transitioning, so the contents list is not comparable yet.
// Wait until a row draws the rail marker AND the signature stops changing; pages
// with no contents list have nothing to wait for. Fail-hard after the deadline is
// deliberate: a chapter page whose scrollspy never publishes an active row is a
// broken contents list, not timing variance — and a soft pass would read as green.
async function waitForTocSettled(page) {
  const deadline = Date.now() + 5000;
  let previous = null;
  for (;;) {
    // Bound the read by the remaining budget so a stuck page.evaluate cannot
    // overshoot the deadline it is meant to enforce.
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const toc = await withTimeout(
      readTocSignature(page),
      remaining,
      `readTocSignature at ${pageRoute(page)}`,
    );
    if (!toc) return;
    if (
      toc.marker !== "none" &&
      JSON.stringify(toc) === JSON.stringify(previous)
    )
      return;
    previous = toc;
    await pause(150);
  }
  fail(`the contents list at ${pageRoute(page)} never settled after hydration`);
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
  const { chapterAudioLabel } = await import(pathToFileURL(AUDIO_LABELS).href);
  if (state.label !== chapterAudioLabel(false))
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

// Park just inside a station's start so the store lands on it: the seek's timeupdate has to
// reach the store before the status text is read.
async function parkOnStation(page, station) {
  await seekTo(page, station.startMs + 250);
  await pause(400);
}

// The status text names the heading being narrated at EVERY station, not only the one the
// chapter opens on: a heading the reader authored with `'`, `&`, `<`, `>`, or `"` reaches the
// text consumer re-escaped, and the shipped leak sat at a later station of a paragraph heading.
// Returns the stations, in narration order, so callers can reuse them.
async function parkedStations(page, surface, marks) {
  const stations = await headlineStations(page, marks);
  for (const station of stations) {
    await parkOnStation(page, station);
    await assertStatusHeading(page, surface, station.title);
  }
  return stations;
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
  const [first] = await parkedStations(page, surface, marks);
  if (!first) return; // a chapter the narration never headlines has no heading to name
  await parkOnStation(page, first); // fitting and row behaviour are checked on the first station
  await assertStatusFits(page, surface);
  await assertStatusOpener(page, surface, marks);
  await assertStatusLeavesControlsPut(page, surface, marks);
  const after = await surfaceHeight(page, surface.container);
  if (Math.abs(after - before) > 0.5)
    fail(
      `${surface.name} grew from ${before}px to ${after}px while naming "${first.title}"`,
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
    await parkOnStation(page, station);
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
  await withDockViewport(page, async () => {
    await openChapterAtStart(page, chapter.route);
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
  });
}

// Open a chapter with its audio metadata loaded and parked at the start. Headless Chromium
// stalls the audio clock while unmuted, so every drive of the store goes through `seekTo`,
// which mutes.
async function openChapterAtStart(page, route) {
  await openChapter(page, route);
  await waitForAudioReady(page);
  await seekTo(page, 0);
}

async function verifyBandPlaybackContract(page, chapter, marks) {
  await openChapterAtStart(page, chapter.route);
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

// Characters `escape-html` re-escapes into references (`&#39;`, `&amp;`, ...): a text consumer
// that skips decoding leaks the reference to the reader instead of the reader's own heading.
const ESCAPABLE_HEADING = /['&"<>]/;

// The first manifested chapter, in narration order, whose article renders a heading carrying an
// escapable character. The manifest carries heading ids only, so the reader's own words come off
// the page; `measured` already resolved every chapter to a route that renders it.
async function firstEscapableHeading(page, measured, manifest) {
  for (const chapter of measured) {
    await openChapter(page, chapter.route);
    const stations = await headlineStations(page, manifest[chapter.key].marks);
    const match = stations.find((station) =>
      ESCAPABLE_HEADING.test(station.title),
    );
    if (match) return { chapter, title: match.title };
  }
  return null;
}

// Both surfaces answer the status text with one component, so the chosen chapter is named
// station by station on whichever surface the reader has.
async function verifyStatusOnBothSurfaces(page, chapter, manifest) {
  const marks = manifest[chapter.key].marks;
  await openChapterAtStart(page, chapter.route);
  await parkedStations(page, SIDEBAR_STATUS_SURFACE, marks);
  await withDockViewport(page, async () => {
    await openChapterAtStart(page, chapter.route);
    await parkedStations(page, DOCK_STATUS_SURFACE, marks);
  });
}

// A status text that names an escaped heading shows the reference, not the reader's words. The
// main status pass runs on the first manifested chapter, whose headings may all be plain, so
// this walks the manifest for one that is not — and skips with a reason when a book has none.
async function inspectEscapableHeadingStatus(page, measured, manifest) {
  const first = await firstEscapableHeading(page, measured, manifest);
  if (!first) {
    console.log(
      `escapable-heading status pass skipped: no narrated chapter renders a heading with ${ESCAPABLE_HEADING.source}`,
    );
    return null;
  }
  await verifyStatusOnBothSurfaces(page, first.chapter, manifest);
  console.log(
    `escapable-heading status pass: ${first.chapter.route} names "${first.title}" at every station on both surfaces`,
  );
  return first;
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
    await withRetry(
      () => inspectEscapableHeadingStatus(page, measured, manifest),
      "inspectEscapableHeadingStatus",
    );
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
  await withRetry(() => inspectLastUpdatedLabels(), "inspectLastUpdatedLabels");
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

// ---------------------------------------------------------------- fit page
// Each contract pins a calculator invariant a reader would notice if it broke.
const FIT_ROUTE = "/developer-tools/open-weight-model-fit";
/** A memory cell: a number with its integrity markers. */
const FIT_CELL = /^(≈|⇢)?[\d,.]+\+?$/;
// The two workload axes are document-wide (they sit beside the memory track),
// while the rail keeps only the target's own levers.
const FIT_CONTEXT_LABEL = "Context length (prompt + output, in tokens)";
const FIT_CONVERSATIONS_LABEL = "Conversations in flight";

async function openFit(page) {
  await emulateReducedMotion(page);
  await page.goto(siteUrl(FIT_ROUTE), { waitUntil: "networkidle0" });
  await page.waitForSelector("input[data-fit-budget]");
  await page.waitForSelector("[data-fit-table] [data-fit-row]");
}

async function fitTrackState(page) {
  return page.evaluate(() => {
    const input = document.querySelector("input[data-fit-budget]");
    const block = input?.closest("section");
    if (!input || !block) throw new Error("Missing memory track");
    const strip = block.querySelector('[class*="zones"]');
    const text = block.textContent.replace(/\s+/g, " ").trim();
    const read = (node) => node?.textContent.replace(/\s+/g, " ").trim() ?? "";
    const rows = [...document.querySelectorAll("[data-fit-row]")];
    // The retired verdict bands and their hues: a reappearing group is a design
    // regression, and the flat table states it as data.
    const bands = document.querySelectorAll(
      "[data-fit-table] details, [data-fit-table] [class*='group']",
    ).length;
    const marks = rows.flatMap((row) => [
      ...row.querySelectorAll('[class*="mark"] img, [class*="mark"] > span'),
    ]);
    return {
      // The input spans the whole machine; the ends it must not enter travel as
      // their own data, so the contract states the same three numbers the page does.
      track: Number(input.max),
      floor: Number(input.dataset.fitFloor),
      ceiling: Number(input.dataset.fitCeiling),
      value: Number(input.dataset.fitValue),
      thumb: input.getBoundingClientRect(),
      zoneBox: strip ? strip.getBoundingClientRect() : null,
      text,
      labels: [...block.querySelectorAll("li")].map((li) =>
        li.textContent.replace(/\s+/g, " ").trim(),
      ),
      zones: strip
        ? [...strip.children].map((zone) => zone.getBoundingClientRect().width)
        : [],
      // The strip keeps a 1px border, so its children own the content box.
      stripWidth: strip ? strip.clientWidth : 0,
      bands,
      // The number travels on its own hook: the cell also draws the budget
      // ruler and, for a streamed row, the storage line, and concatenating the
      // three would make the number unreadable to the contract that guards it.
      values: rows.map((row) =>
        read(row.querySelector("[data-figure-memory]")),
      ),
      // A streamed row is a different claim from a resident one, and the mark is
      // the only place the reader sees which claim this row makes.
      streamed: rows
        .filter((row) => row.hasAttribute("data-fit-streamed"))
        .map((row) => read(row.querySelector('[class*="rowValue"]'))),
      streamedRows: rows.filter((row) => row.hasAttribute("data-fit-streamed"))
        .length,
      markedRows: rows.filter((row) =>
        /^⇢/.test(read(row.querySelector('[class*="rowValue"]'))),
      ).length,
      // A row is a mark, a name, a setup, and one number; a bar or a badge here
      // would be the design the table replaced.
      legacyMarks: document.querySelectorAll(
        '[data-fit-table] [class*="bar"], [data-fit-table] [class*="badge"], [data-fit-table] [class*="budgetMark"]',
      ).length,
      brokenMarks: marks.filter((mark) => !mark.getBoundingClientRect().width)
        .length,
      // The counts travel as data on the instrument, so no contract parses prose.
      count: Number(
        document.querySelector("[data-fit-target]")?.dataset.fitCount ?? NaN,
      ),
      total: Number(
        document.querySelector("[data-fit-target]")?.dataset.fitTotal ?? NaN,
      ),
      hasAxis: Boolean(document.querySelector("[data-fit-axis]")),
      // The count's sentence travels for screen readers; it must state the same
      // numbers the rows do, and it must take no room on the page.
      speech: {
        text: read(document.querySelector("[data-fit-speech]")),
        box: (() => {
          const node = document.querySelector("[data-fit-speech]");
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        })(),
      },
      valueText: document
        .querySelector("[data-fit-budget-value]")
        ?.textContent.trim(),
    };
  });
}

/** A wait that names itself: a timeout must say which value never arrived. */
async function waitForFit(page, label, predicate, ...args) {
  try {
    await page.waitForFunction(predicate, { timeout: 5000 }, ...args);
  } catch {
    fail(`${label} did not settle`);
  }
}

/** Hydration and React commits land after the click returns. The page is one
 * reading when the table's rows account for the instrument's own count and every
 * row prints a number: a half-applied state fails both. */
async function settleFitTable(page) {
  await page
    .waitForFunction(
      () => {
        const count = Number(
          document.querySelector("[data-fit-target]")?.dataset.fitCount,
        );
        const rows = [...document.querySelectorAll("[data-fit-row]")];
        if (rows.length !== count) return false;
        return rows.every((row) =>
          /^(?:≈|⇢)?[\d,.]+\+?$/.test(
            row.querySelector("[data-figure-memory]")?.textContent.trim() ?? "",
          ),
        );
      },
      { timeout: 3000 },
    )
    .catch(() => {});
}

async function assertFitTrack(page, name) {
  await settleFitTable(page);
  const state = await fitTrackState(page);
  if (state.hasAxis) fail(`${name} still draws the old axis strip`);
  // The ends are the machine's own arithmetic: a positive floor, a ceiling above
  // it, and the reader's value inside the range the reserved areas leave.
  if (!(state.floor > 0)) fail(`${name} track has no floor: ${state.floor}`);
  if (!(state.ceiling > state.floor))
    fail(`${name} track has no range: ${state.floor}–${state.ceiling}`);
  if (state.ceiling >= state.track)
    fail(`${name} ceiling ${state.ceiling} leaves no OS reserve`);
  if (state.value < state.floor || state.value > state.ceiling)
    fail(`${name} thumb sits inside a reserved area: ${state.value}`);
  // The handle is a position on the same scale as the zones it rides.
  if (state.zoneBox) {
    const at =
      (state.thumb.left + state.thumb.width / 2 - state.zoneBox.left) /
      state.zoneBox.width;
    if (Math.abs(at - state.value / state.track) > 0.02)
      fail(
        `${name} handle sits at ${at.toFixed(3)} of the track, not its value`,
      );
  }
  if (!state.valueText?.startsWith(`${state.value}`))
    fail(`${name} track states "${state.valueText}" for ${state.value}`);
  // Three reserved or free areas, each named with its own number.
  if (state.labels.length !== 3)
    fail(`${name} track labels ${state.labels.length} zones`);
  const patterns = [
    /smallest model · [\d,.]+ GiB/,
    /cache at .+ · [\d,.]+ GiB/,
    /OS reserve · [\d,.]+ GiB/,
  ];
  patterns.forEach((pattern, index) => {
    if (!pattern.test(state.labels[index] ?? ""))
      fail(`${name} zone ${index} reads "${state.labels[index]}"`);
  });
  // Every zone is painted and they account for the whole track: nothing can be
  // dragged into an area the page forgot to draw.
  if (state.zones.length !== 4)
    fail(`${name} track paints ${state.zones.length} zones`);
  const painted = state.zones.reduce((sum, width) => sum + width, 0);
  if (Math.abs(painted - state.stripWidth) > 2)
    fail(`${name} zones cover ${painted}px of ${state.stripWidth}px`);
  // The table is the count: the list holds exactly the models that fit, and the
  // retired verdict bands stay gone.
  if (state.bands) fail(`${name} renders ${state.bands} retired verdict bands`);
  if (!state.values.length && state.count !== 0)
    fail(`${name} lists no rows for ${state.count} fits`);
  if (state.count !== state.values.length)
    fail(`${name} lists ${state.values.length} rows for ${state.count} fits`);
  if (state.total < state.count)
    fail(`${name} counts ${state.count} of ${state.total} models`);
  // One count, two surfaces: the visible rows and the announced sentence.
  if (!state.speech.text.startsWith(`${state.count} of ${state.total} `))
    fail(
      `${name} announces "${state.speech.text}" for ${state.count} of ${state.total}`,
    );
  if (
    !state.speech.box ||
    state.speech.box.height > 1 ||
    state.speech.box.width > 1
  )
    fail(`${name} lays out its announced count`);
  // A row carries one number and no chart furniture.
  for (const value of state.values)
    if (!FIT_CELL.test(value)) fail(`${name} row prints "${value}"`);
  // The attribute and the mark are one fact: a streamed row must say so on its
  // number, and a number that streams must be attributed.
  if (state.streamedRows !== state.markedRows)
    fail(
      `${name} marks ${state.markedRows} rows and attributes ${state.streamedRows}`,
    );
  for (const value of state.streamed)
    if (!/^⇢/.test(value)) fail(`${name} streamed row prints "${value}"`);
  if (state.legacyMarks)
    fail(`${name} still draws ${state.legacyMarks} bar or badge marks`);
  if (state.brokenMarks)
    fail(`${name} paints ${state.brokenMarks} lab marks with no size`);
  return state;
}

/** The overfull panel: there is no budget to set, so the strip splits the need
 * into what the machine holds and what it cannot. The claim is geometric: each
 * area must sit at the share its own key states. */
async function assertOverfullTrack(page, name) {
  // The panel is a query container: Chromium can leave its percentage children
  // on an earlier pass's basis while the page is not painting, so the rects
  // would state an older workload. One write and revert re-runs the layout the
  // reader would see before the ratio is judged; the panel itself is unchanged.
  await page.evaluate(() => {
    const section = document.querySelector("[data-fit-overfull]");
    if (!section) return;
    section.style.display = "none";
    void section.offsetHeight;
    section.style.removeProperty("display");
  });
  const state = await page.evaluate(() => {
    const block = document.querySelector("[data-fit-overfull]");
    if (!block) return null;
    const strip = block.querySelector('[class*="zones"]');
    const zones = [...strip.querySelectorAll("[data-fit-zone]")];
    const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() ?? "";
    const labels = [...block.querySelectorAll("li")].map(text);
    const number = (pattern, label) => {
      const match = label.match(pattern);
      return match ? Number(match[1].replace(/,/g, "")) : NaN;
    };
    const recipe = (labels[2] ?? "").match(
      /^([\d,.]+) GiB model \+ ([\d,.]+) GiB cache$/,
    );
    const widths = zones.map((zone) => zone.getBoundingClientRect().width);
    return {
      input: Boolean(block.querySelector("input[data-fit-budget]")),
      labels,
      widths,
      target: document.querySelector("[data-fit-target]")?.dataset.fitTarget,
      strip: strip.clientWidth,
      need: Number(block.dataset.fitNeed),
      supply: Number(block.dataset.fitSupply),
      covered: number(/^this machine · ([\d,.]+) GiB usable$/, labels[0] ?? ""),
      over: number(/^over this machine · ([\d,.]+) GiB$/, labels[1] ?? ""),
      model: recipe ? Number(recipe[1].replace(/,/g, "")) : NaN,
      cache: recipe ? Number(recipe[2].replace(/,/g, "")) : NaN,
      head: text(block.querySelector("[data-fit-head-value]")),
      note: text(document.querySelector("[data-fit-note]")),
    };
  });
  if (!state) fail(`${name} shows no overfull panel`);
  if (state.input)
    fail(`${name} offers a budget handle for a range with one value`);
  if (state.widths.length !== 2)
    fail(`${name} paints ${state.widths.length} zones, not the need's two`);
  if (state.labels.length !== 3)
    fail(`${name} keys the overfull strip with ${state.labels.length} rows`);
  if (!(state.need > 0)) fail(`${name} travels no need: ${state.need}`);
  if (!(state.supply > 0)) fail(`${name} travels no supply: ${state.supply}`);
  // One scale, no gaps: the need is the whole strip.
  const painted = state.widths[0] + state.widths[1];
  if (Math.abs(painted - state.strip) > 2)
    fail(
      `${name} zones cover ${painted}px of ${state.strip}px (need ${
        state.need
      }, supply ${state.supply}, target ${state.target}: ${state.labels.join(
        " | ",
      )})`,
    );
  // Both keys state the same two sides the areas paint, and the composition is
  // the arithmetic the head fills: a colour change with no number is decoration.
  const parts = [
    ["covered", state.covered, state.supply, state.widths[0]],
    ["over", state.over, state.need - state.supply, state.widths[1]],
  ];
  for (const [label, said, gib, px] of parts) {
    if (!(Math.abs(said - gib) <= 0.51))
      fail(`${name} keys ${label} as ${said} GiB for ${gib.toFixed(1)}`);
    if (!(Math.abs(px / painted - gib / state.need) <= 0.02))
      fail(
        `${name} paints ${label} ${Math.round(px)}px for ${gib.toFixed(1)} of ${
          state.need
        } GiB`,
      );
  }
  if (!(state.model > 0)) fail(`${name} names no model size`);
  if (!(state.cache >= 0)) fail(`${name} names no cache size`);
  if (Math.abs(state.model + state.cache - state.need) > 1.02)
    fail(
      `${name} recipe ${state.model} + ${state.cache} does not fill ${
        state.need
      } GiB`,
    );
  // The head and the strip are one claim: the big number is the length the bar
  // fills, so a reader never has to reconcile two different totals.
  const headed = state.head.match(/^([\d,.]+) GiB$/);
  if (!headed) fail(`${name} heads the need as "${state.head}"`);
  if (Math.abs(Number(headed[1].replace(/,/g, "")) - state.need) > 0.51)
    fail(`${name} heads "${state.head}" for a ${state.need} GiB need`);
  // The note names the only two levers that can change an overfull answer.
  if (!/^Shorten the context or pick a larger machine\.$/.test(state.note))
    fail(`${name} explains the overfull track as "${state.note}"`);
  return state;
}

async function inspectFitChartViewport(viewport) {
  await withPage(`fit-chart-${viewport.width}`, viewport, async (page) => {
    await openFit(page);
    const before = await assertFitTrack(page, `fit track ${viewport.width}`);
    // The budget changes what fits, never the boxes that report it.
    const settled = await fitLayout(page);
    assertBandsHold(`fit track ${viewport.width}`, settled);
    // The thumb is a control: one key press moves the budget and regrades the
    // table, and a lower budget can never let more models through.
    await page.focus("input[data-fit-budget]");
    await page.keyboard.press("ArrowLeft");
    await waitForFit(
      page,
      `budget below ${before.value}`,
      (previous) =>
        Number(
          document.querySelector("input[data-fit-budget]").dataset.fitValue,
        ) < previous,
      before.value,
    );
    const after = await assertFitTrack(
      page,
      `fit track after ${viewport.width}`,
    );
    if (after.value >= before.value)
      fail(`${viewport.width} arrow key did not lower the budget`);
    if (after.count > before.count)
      fail(`${viewport.width} a lower budget added fits`);
    // Park the thumb at its floor: the reserved ends must stay out of reach.
    await page.keyboard.press("Home");
    await waitForFit(page, "budget at its floor", () => {
      const input = document.querySelector("input[data-fit-budget]");
      return (
        Math.abs(
          Number(input.dataset.fitValue) - Number(input.dataset.fitFloor),
        ) < 1e-9
      );
    });
    const floor = await assertFitTrack(page, `fit floor ${viewport.width}`);
    assertBandsStill(
      `fit floor ${viewport.width}`,
      settled,
      await fitLayout(page),
    );
    if (Math.abs(floor.value - floor.floor) > 1e-9)
      fail(`${viewport.width} thumb left the track at ${floor.value}`);
    // The far end is the other reserved area: it must stop at its own boundary.
    await page.keyboard.press("End");
    await page.waitForFunction(
      (ceiling) =>
        Math.abs(
          Number(
            document.querySelector("input[data-fit-budget]").dataset.fitValue,
          ) - ceiling,
        ) < 1e-9,
      {},
      floor.ceiling,
    );
    const top = await assertFitTrack(page, `fit ceiling ${viewport.width}`);
    assertBandsStill(
      `fit ceiling ${viewport.width}`,
      settled,
      await fitLayout(page),
    );
    if (Math.abs(top.value - top.ceiling) > 1e-9)
      fail(`${viewport.width} thumb entered the OS reserve at ${top.value}`);
    if (top.count < floor.count)
      fail(`${viewport.width} raising the budget to its ceiling lost fits`);
    if (floor.count > before.count)
      fail(`${viewport.width} the floor added fits`);
  });
}

async function inspectFitChart() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitChartViewport(viewport);
}

async function clickFitChip(page, groupLabel, label) {
  const clicked = await page.evaluate(
    (group, text) => {
      const rail = document.querySelector(
        `[role="group"][aria-label="${group}"]`,
      );
      // A chip may carry a count after its label, so match the label alone.
      const chip = [...(rail?.querySelectorAll("button") ?? [])].find(
        (button) => button.textContent.trim().split(" · ")[0] === text,
      );
      if (!chip) return false;
      // A folded tier keeps its chips in the document but out of sight. Open
      // every ancestor so the click is the one a reader makes.
      for (let node = chip.parentElement; node; node = node.parentElement)
        if (node.tagName === "DETAILS" && !node.open) node.open = true;
      chip.click();
      return true;
    },
    groupLabel,
    label,
  );
  if (!clicked) fail(`Missing ${groupLabel} chip "${label}"`);
}

/** Every platform answers the same control, including those the guide never screened. */
async function inspectFitPlatformsViewport(viewport) {
  await withPage(`fit-platforms-${viewport.width}`, viewport, async (page) => {
    await openFit(page);
    const families = [
      ["Workstation", "RTX 4090"],
      ["DGX Spark", "DGX Spark"],
      ["NVIDIA node", "H100 80 GB"],
      ["AMD", "MI355X"],
      ["Apple Silicon", "M4 Max 128 GB"],
    ];
    // The calm strip the reservation is measured against: the default machine's
    // layout and the chips it draws.
    let calm = null;
    for (const [family, device] of families) {
      await clickFitChip(page, "Hardware", family);
      if (family !== "DGX Spark") await clickFitChip(page, "Device", device);
      // React commits after the click handler returns, so wait until the device
      // chip is the pressed one before measuring the answer it produces.
      await page.waitForFunction(
        (label) =>
          document
            .querySelector(
              '[role="group"][aria-label="Device"] button[aria-pressed="true"]',
            )
            ?.textContent.trim()
            .split(" · ")[0] === label,
        {},
        device,
      );
      const state = await assertFitTrack(page, `${family} ${viewport.width}`);
      // A family brings its own sentences: the reserved bands must still hold
      // them without clipping or wrapping into a new row.
      const layout = await fitLayout(page);
      assertBandsHold(`${family} ${viewport.width}`, layout);
      // Every machine draws the same bands, whatever hardware it names: the
      // machine's sentence and its budget wrap inside reserved rows, so a target
      // can change words but never the instrument's boxes. Only sizes are claimed
      // here; the seam under the reserved row is claimed by `figureSeam`, which
      // sweeps the families of both figures.
      if (!calm) calm = { layout };
      else {
        for (const band of ["setup", "budget", "workload", "strip"]) {
          if (layout[band].height !== calm.layout[band].height)
            fail(
              `${family} ${viewport.width} resizes ${band}: ${calm.layout[band].height}px → ${layout[band].height}px`,
            );
        }
      }
      const rails = await page.evaluate(
        (workload) => {
          // The page carries two figures; this contract is about the fit one.
          const root =
            document.querySelector("[data-figure-root][data-fit]") ?? document;
          const labels = [...root.querySelectorAll('[role="group"]')].map(
            (group) => group.getAttribute("aria-label"),
          );
          return {
            runtime: labels.filter((label) => label === "Runtime").length,
            missing: workload.filter((label) => !labels.includes(label)),
          };
        },
        [FIT_CONTEXT_LABEL, FIT_CONVERSATIONS_LABEL],
      );
      if (rails.runtime !== 1)
        fail(`${family} offers ${rails.runtime} runtime rails`);
      if (rails.missing.length)
        fail(`${family} hides the ${rails.missing.join(", ")} rail`);
      // A streamed layout must be visible where it changes the answer: the
      // runtime that reaches models the standardized set cannot says so, and
      // every row it leaves carries the mark on its number.
      if (family !== "Apple Silicon") continue;
      await clickFitChip(page, "Specialized runtimes", "WARP");
      await page.waitForFunction(() =>
        document
          .querySelector(
            '[role="group"][aria-label="Specialized runtimes"] button[aria-pressed="true"]',
          )
          ?.textContent.trim()
          .startsWith("WARP"),
      );
      const streamed = await assertFitTrack(page, `WARP ${viewport.width}`);
      const chips = await fitRuntimeState(page);
      const warp = chips?.chips.find((chip) => chip.label === "WARP");
      if (!warp) fail(`${viewport.width} WARP takes no chip`);
      // The snapshot is taken on the pressed chip: the gain must survive the
      // inverted surface, where the hue alone would be unreadable.
      if (!warp.pressed) fail(`${viewport.width} WARP is not the pressed chip`);
      if (!/^\d+ only here$/.test(warp.gain))
        fail(`${viewport.width} WARP prints no gain: "${warp.gain}"`);
      if (
        !/holds [1-9]\d* models? no general-purpose runtime holds here/.test(
          warp.spoken,
        )
      )
        fail(`${viewport.width} WARP reach reads "${warp.spoken}"`);
      if (!streamed.count) fail(`${viewport.width} WARP lists no streamed row`);
      if (streamed.streamedRows !== streamed.count)
        fail(
          `${viewport.width} WARP lists ${streamed.streamedRows} of ${streamed.count} rows as streamed`,
        );
      if (warp.count !== streamed.count)
        fail(
          `${viewport.width} WARP prints ${warp.count} and leaves ${streamed.count}`,
        );
      await clickFitChip(page, "Runtime", "Any runtime");
    }
    // The busiest strip the guide can draw: the largest DGX Spark lists five
    // runtimes, two of them specialized. Space is reserved for that, so the
    // crowded state must keep the same box on the same machine rather than push
    // the answer down.
    await clickFitChip(page, "Hardware", "DGX Spark");
    await page.waitForFunction(() =>
      document
        .querySelector(
          '[role="group"][aria-label="Device"] button[aria-pressed="true"]',
        )
        ?.textContent.trim()
        .startsWith("DGX Spark"),
    );
    const quiet = await fitLayout(page);
    const counts = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          '[role="group"][aria-label="Devices"] button',
        ),
      ].map((button) => button.textContent.trim().split(" · ")[0]),
    );
    if (!counts.length)
      fail(`${viewport.width} DGX Spark offers no device count`);
    const busiest = counts[counts.length - 1];
    await clickRailChip(page, "Devices", busiest);
    await waitForFit(
      page,
      `${viewport.width} busiest DGX Spark`,
      (label) =>
        document
          .querySelector(
            '[role="group"][aria-label="Devices"] button[aria-pressed="true"]',
          )
          ?.textContent.trim()
          .split(" · ")[0] === label,
      busiest,
    );
    const busy = await fitLayout(page);
    assertBandsHold(`${viewport.width} busiest strip`, busy);
    const chips = await page.evaluate(() => ({
      general: document.querySelectorAll(
        '[role="group"][aria-label="Runtime"] button',
      ).length,
      specialized: document.querySelectorAll(
        '[role="group"][aria-label="Specialized runtimes"] button',
      ).length,
    }));
    if (chips.general < 4)
      fail(
        `${viewport.width} the busiest DGX Spark lists ${chips.general} runtimes`,
      );
    // One machine, two memberships: nothing but the strip's own words may differ.
    for (const band of ["strip", "table"])
      for (const side of ["top", "height"])
        if (side === "height" && band === "table") continue;
        else if (quiet[band][side] !== busy[band][side])
          fail(
            `${viewport.width} the busy strip moved ${band}.${side}: ${quiet[band][side]} → ${busy[band][side]}`,
          );
  });
}

async function inspectFitPlatforms() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitPlatformsViewport(viewport);
}

const FIT_RAIL_LABELS = ["Hardware", "Device"];

/** One workload axis: the stops it offers, where its handle sits, and its words. */
async function fitWorkloadState(page) {
  return page.evaluate(
    (labels) => {
      const rail = document.querySelector(
        'section[aria-label="Your hardware"]',
      );
      const read = (node) =>
        node?.textContent.replace(/\s+/g, " ").trim() ?? "";
      const axis = (label) => {
        const group = document.querySelector(
          `[role="group"][aria-label="${label}"]`,
        );
        const input = group?.querySelector('input[type="range"]');
        if (!group || !input) return null;
        return {
          inRail: Boolean(rail?.contains(group)),
          ranges: group.querySelectorAll('input[type="range"]').length,
          stops: (group.dataset.leverStops ?? "").split(","),
          min: Number(input.min),
          max: Number(input.max),
          value: Number(input.value),
          spoken: input.getAttribute("aria-valuetext") ?? "",
          shown: read(group.querySelector('[class*="leverValue"]')),
          ends: [...group.querySelectorAll('[class*="leverEnd"]')].map(read),
        };
      };
      return {
        context: axis(labels.context),
        conversations: axis(labels.conversations),
      };
    },
    { context: FIT_CONTEXT_LABEL, conversations: FIT_CONVERSATIONS_LABEL },
  );
}

/** An axis is ordinal: one handle on the published stops, and it states its span. */
function assertWorkloadAxis(axis, name) {
  if (!axis) fail(`${name} is missing`);
  if (axis.inRail) fail(`${name} is still folded into the target rail`);
  if (axis.ranges !== 1) fail(`${name} offers ${axis.ranges} handles`);
  if (axis.min !== 0 || axis.max !== axis.stops.length - 1)
    fail(`${name} spans ${axis.min}–${axis.max} of ${axis.stops.length} stops`);
  if (!Number.isInteger(axis.value) || axis.value > axis.max)
    fail(`${name} sits at ${axis.value}`);
  if (axis.shown !== axis.stops[axis.value])
    fail(`${name} states "${axis.shown}" at stop ${axis.stops[axis.value]}`);
  if (!axis.spoken.startsWith(axis.shown))
    fail(`${name} is read as "${axis.spoken}" for "${axis.shown}"`);
  const ends = [axis.stops[0], axis.stops[axis.stops.length - 1]];
  if (axis.ends.join() !== ends.join())
    fail(`${name} prints ends ${axis.ends.join(" … ")} of ${ends.join(" … ")}`);
}

/** Move an axis to one of its published stops, the way a reader drags it. */
async function setFitStop(page, groupLabel, label) {
  const moved = await page.evaluate(
    (group, text) => {
      const wrapper = document.querySelector(
        `[role="group"][aria-label="${group}"]`,
      );
      const input = wrapper?.querySelector('input[type="range"]');
      const stops = (wrapper?.dataset.leverStops ?? "").split(",");
      const index = stops.indexOf(text);
      if (!input || index < 0) return false;
      // React tracks the input's value, so write through the native setter and
      // announce the change the way a drag does.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set.call(input, String(index));
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    groupLabel,
    label,
  );
  if (!moved) fail(`Missing ${groupLabel} stop "${label}"`);
}

/** One chip, as the page renders it. Shared by the rail and the runtime strip. */
const CHIP_STATE = `(chip) => {
  const parts = chip.textContent.trim().split(" · ");
  const raw = parts[1] ?? "";
  const [fits, coverage] = raw.split("/");
  return {
    group: chip.closest('[role="group"]')?.getAttribute("aria-label") ?? "",
    label: parts[0],
    raw,
    count: Number(fits),
    coverage: coverage === undefined ? null : Number(coverage),
    gain: parts.length > 2 ? parts.slice(2).join(" · ") : "",
    spoken: chip.getAttribute("aria-label") ?? "",
    pressed: chip.getAttribute("aria-pressed") === "true",
    overflow: chip.scrollWidth - chip.clientWidth,
  };
}`;

/** The rail's own contract: the machine's choices, and no workload and no prose. */
async function fitRailState(page) {
  return page.evaluate(
    (labels, chipStateSource) => {
      const chipState = eval(chipStateSource);
      const rail = document.querySelector(
        'section[aria-label="Your hardware"]',
      );
      if (!rail) throw new Error("Missing the target rail");
      const group = (label) =>
        rail.querySelector(`[role="group"][aria-label="${label}"]`);
      const text = (node) =>
        node?.textContent.replace(/\s+/g, " ").trim() ?? "";
      const box = rail.getBoundingClientRect();
      return {
        height: box.height,
        missing: labels.filter((label) => !group(label)),
        chips: [...rail.querySelectorAll('[role="group"] button')].map(
          chipState,
        ),
        // Every rail paragraph other than a group label is prose; the rail owns none.
        notes: [...rail.querySelectorAll("p")]
          .filter((node) => !String(node.className).includes("chipLabel"))
          .map((node) => text(node)),
        // The rendered target travels as data: the rail's words are for readers.
        target:
          document.querySelector("[data-fit-target]")?.dataset.fitTarget ?? "",
        count: Number(
          document.querySelector("[data-fit-target]")?.dataset.fitCount ?? NaN,
        ),
        total: Number(
          document.querySelector("[data-fit-target]")?.dataset.fitTotal ?? NaN,
        ),
        budgetNote: text(document.querySelector("[data-fit-note]")),
        cacheKey: text(document.querySelector('[class*="budgetZones"]')),
      };
    },
    FIT_RAIL_LABELS,
    CHIP_STATE,
  );
}

/** The runtime strip: two groups of chips, no fold, no prose, one promise each. */
async function fitRuntimeState(page) {
  return page.evaluate((chipStateSource) => {
    const chipState = eval(chipStateSource);
    const section = document.querySelector("[data-fit-strip]");
    if (!section) return null;
    const group = (label) =>
      section.querySelector(`[role="group"][aria-label="${label}"]`);
    const text = (node) => node?.textContent.replace(/\s+/g, " ").trim() ?? "";
    const chips = [...section.querySelectorAll('[role="group"] button')].map(
      chipState,
    );
    return {
      folded: Boolean(section.closest("details")),
      groups: [...section.querySelectorAll('[role="group"]')].map((node) =>
        node.getAttribute("aria-label"),
      ),
      chips,
      specialized: chips.filter(
        (chip) => chip.group === "Specialized runtimes",
      ),
      notes: [...section.querySelectorAll("p")]
        .filter((node) => !String(node.className).includes("chipLabel"))
        .map((node) => text(node)),
      // The empty group's own words: its note slot states the absence its
      // reserved rail cannot.
      empty: text(section.querySelector("[data-chip-empty]")),
    };
  }, CHIP_STATE);
}

/** Both groups keep their reserved rails, so an empty one states its absence
 * in the note slot above the rail. */
function assertEmptyGroupState(name, runtimes) {
  if (!runtimes.groups.includes("Specialized runtimes"))
    fail(`${name} drops the specialized group's reserved rows`);
  if (runtimes.specialized.length === 0 && !runtimes.empty)
    fail(`${name} leaves its empty specialized group unstated`);
  if (runtimes.specialized.length > 0 && runtimes.empty)
    fail(
      `${name} states an absence beside ${runtimes.specialized.length} specialized runtimes`,
    );
}

/** The bands between the levers and the rows. A state change may rewrite the
 * words in any of them but never their boxes: a lever that rescales the page is
 * the defect this instrument exists to avoid. */
async function fitLayout(page) {
  return page.evaluate(() => {
    // Positions are relative to the instrument: focusing a control can scroll
    // the page, and a scroll must not read as a moved band.
    const origin = document
      .querySelector("[data-fit-target]")
      .getBoundingClientRect().top;
    const read = (selector) => {
      const node = document.querySelector(selector);
      if (!node) throw new Error(`Missing ${selector}`);
      const box = node.getBoundingClientRect();
      return {
        top: Math.round(box.top - origin),
        height: Math.round(box.height),
        width: Math.round(box.width),
        scrollHeight: node.scrollHeight,
        clientHeight: node.clientHeight,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
      };
    };
    return {
      // Scoped to the fit figure: the page carries two instruments, and one
      // class name must never resolve to the other figure's panel.
      setup: read('[data-fit] [class*="setup"]'),
      budget: read('[data-fit] section[class*="budget"]'),
      workload: read('[data-fit] div[class*="workload"]'),
      // The strip's membership follows the workload, so its box is reserved: it
      // must measure the same in the crowded and the empty state.
      strip: read("[data-fit-strip]"),
      table: read("[data-fit-table]"),
    };
  });
}

/** Reserved bands must hold what they are given: an overflow is a silent clip. */
function assertBandsHold(name, layout) {
  for (const band of ["strip", "budget", "workload"]) {
    const box = layout[band];
    if (box.scrollHeight > box.clientHeight + 1)
      fail(
        `${name} ${band} needs ${box.scrollHeight}px of its ${box.clientHeight}px band`,
      );
    if (box.scrollWidth > box.clientWidth + 1)
      fail(
        `${name} ${band} overflows by ${box.scrollWidth - box.clientWidth}px`,
      );
  }
  // Side by side, the two levers are one row: one bottom edge, whatever each
  // panel's own content needs.
  if (
    Math.abs(layout.budget.top - layout.workload.top) <= 1 &&
    layout.budget.height !== layout.workload.height
  )
    fail(
      `${name} panels end ${layout.budget.height}px and ${layout.workload.height}px tall`,
    );
}

/** Nothing may move. The bands above the runtime strip keep their boxes, and the
 * strip's own space is reserved for its most crowded state, so the table stays
 * where it is in the lean one too. The table's own height is its row count;
 * widths never move. */
function assertBandsStill(name, before, after) {
  assertBandsHold(name, after);
  for (const band of Object.keys(before))
    for (const side of ["top", "height", "width"])
      if (side === "height" && band === "table") continue;
      else if (before[band][side] !== after[band][side])
        fail(
          `${name} moved ${band}.${side}: ${before[band][side]} → ${after[band][side]}`,
        );
}

/** The row's pitch is a design token: a theme's list margin or a
 * state-dependent padding must not move it. */
const FIT_ROW_PITCH = 52;

/** The head and the rows are one table: the head's words sit on the name
 * column, and the rows keep the stated rhythm. Industry rule: a header inherits
 * the table's column grid. */
async function assertFitTableGrid(page, name) {
  await assertMemoryRuler(page, name);
  const grid = await page.evaluate(() => {
    const table = document.querySelector("[data-fit-table]");
    const left = (node) => node.getBoundingClientRect().left;
    const headModel = table.querySelector('[class*="headLabel"]');
    const head = table.querySelector(':scope > [class*="head"]');
    const rowName = table.querySelector('[data-fit-row] [class*="rowName"]');
    const headModality = [
      ...table.querySelectorAll('[class*="headLabel"]'),
    ].find((node) => node.textContent.trim() === "Modality");
    const modality = table.querySelector("[data-fit-row] [data-fit-modality]");
    const flow = modality?.querySelector("svg") ?? null;
    const rowValue = table.querySelector('[data-fit-row] [class*="rowValue"]');
    const pitch = [];
    const rows = [...table.querySelectorAll("[data-fit-row] > button")];
    for (let index = 1; index < rows.length; index += 1) {
      const before = rows[index - 1];
      const after = rows[index];
      // An open detail is part of its row's box: that pair cannot state a pitch.
      if (
        before.getAttribute("aria-expanded") === "true" ||
        after.getAttribute("aria-expanded") === "true"
      )
        continue;
      pitch.push(
        after.getBoundingClientRect().top - before.getBoundingClientRect().top,
      );
    }
    return {
      headModelX: left(headModel),
      rowNameX: rowName ? left(rowName) : null,
      // The head and a row must state the same columns: a hidden column in one
      // would silently shift every label off its values.
      headCells: head ? head.children.length : 0,
      rowCells: rows[0] ? rows[0].children.length : 0,
      headModalityX: headModality ? left(headModality) : null,
      modalityX: modality ? left(modality) : null,
      // The flow must stay inside its own column; a chip that overhangs the
      // memory number reads as part of that number.
      modalityRight: flow ? flow.getBoundingClientRect().right : null,
      valueLeft: rowValue ? left(rowValue) : null,
      modalityCode: modality?.dataset.fitModality ?? null,
      rows: rows.length,
      pitch,
    };
  });
  // One left edge: the head's word and every model name. A state that lists no
  // rows still draws the head, so the page never resizes around a verdict.
  if (grid.rows === 0) {
    if (typeof grid.headModelX !== "number")
      fail(`${name} draws no table head`);
    return;
  }
  if (Math.abs(grid.headModelX - grid.rowNameX) > 1)
    fail(
      `${name} head sits ${Math.round(grid.headModelX - grid.rowNameX)}px off the names`,
    );
  if (grid.headCells !== grid.rowCells)
    fail(
      `${name} head draws ${grid.headCells} columns over rows of ${grid.rowCells}`,
    );
  if (typeof grid.headModalityX !== "number")
    fail(`${name} draws no modality head`);
  if (Math.abs(grid.headModalityX - grid.modalityX) > 1)
    fail(
      `${name} modality head sits ${Math.round(grid.headModalityX - grid.modalityX)}px off its cell`,
    );
  if (grid.modalityRight > grid.valueLeft + 1)
    fail(`${name} modality flow overhangs the memory column`);
  // `in:text+image;out:text` — the shape cell's machine form, so a contract can
  // read the claim without reading a drawing.
  if (
    !/^in:(text|image|audio|video)(\+(text|image|audio|video))*;out:(text|image|audio|video)(\+(text|image|audio|video))*$/.test(
      grid.modalityCode ?? "",
    )
  )
    fail(`${name} modality cell states "${grid.modalityCode}"`);
  // Rows are 50px tall and 2px apart; the theme's list margin must not add to it.
  for (const gap of grid.pitch)
    if (Math.abs(gap - FIT_ROW_PITCH) > 1)
      fail(`${name} rows sit ${Math.round(gap)}px apart, not ${FIT_ROW_PITCH}`);
}

/** WCAG relative luminance of an `rgb()` colour. */
function luminance(value) {
  const [r, g, b] = value.match(/\d+/g).slice(0, 3).map(Number);
  const channel = (part) => {
    const scaled = part / 255;
    return scaled <= 0.04045
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 1.4.11: a data mark's edge must read against its own ground. */
function contrastRatio(from, to) {
  const [high, low] = [luminance(from), luminance(to)].sort((a, b) => b - a);
  return (high + 0.05) / (low + 0.05);
}

/**
 * The memory ruler, in every table on the page: one scale, drawn inside its own
 * column, off the row's edge, on an ink pair the eye can separate, with a key
 * that states the budget. All four are properties of the drawing rather than of
 * a row's data, so they are asserted wherever a table is drawn.
 */
async function assertMemoryRuler(page, name) {
  const ruler = await page.evaluate(() => {
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return { left: rect.left, right: rect.right, bottom: rect.bottom };
    };
    // The groove may be the page's own surface; the shipped colour is what the
    // reader sees under the fill, whatever the declaration chain.
    const painted = (node) => {
      let current = node;
      while (current) {
        const value = getComputedStyle(current).backgroundColor;
        if (value !== "rgba(0, 0, 0, 0)" && value !== "transparent")
          return value;
        current = current.parentElement;
      }
      return "rgb(255, 255, 255)";
    };
    return [
      ...document.querySelectorAll("[data-fit-table], [data-decision-table]"),
    ].map((table) => {
      const legend = table.nextElementSibling;
      const row = table.querySelector("[data-figure-row]");
      return {
        table: table.hasAttribute("data-fit-table") ? "fit" : "decision",
        // The key follows its own table: two figures on one page keep two
        // budgets, so a page-wide lookup would read the wrong one.
        legend: legend?.matches("[data-memory-legend]")
          ? Number(legend.dataset.memoryBudget)
          : null,
        rowHeight: row ? Math.round(row.getBoundingClientRect().height) : null,
        bars: [...table.querySelectorAll("[data-memory-bar-need]")].map(
          (bar) => ({
            need: Number(bar.dataset.memoryBarNeed),
            over: bar.hasAttribute("data-memory-bar-over"),
            width: Math.round(bar.getBoundingClientRect().width),
            bar: box(bar),
            cell: box(bar.parentElement),
            row: box(bar.closest("[data-figure-row]")),
            track: painted(bar),
            fill: getComputedStyle(bar.firstElementChild).backgroundColor,
            // One ink: a row bar draws nothing but its own footprint. The cache
            // and the drafter are stated once, where they do not repeat.
            inks: bar.children.length,
            fillLeft: box(bar.firstElementChild).left,
          }),
        ),
      };
    });
  });
  const widths = [];
  for (const table of ruler) {
    if (table.legend === null)
      fail(`${name} ${table.table} table carries no memory key`);
    if (!Number.isFinite(table.legend))
      fail(`${name} ${table.table} memory key states no budget`);
    for (const bar of table.bars) {
      widths.push(bar.width);
      // The drawing states a share of its own column, never of the row.
      if (
        bar.bar.left < bar.cell.left - 1 ||
        bar.bar.right > bar.cell.right + 1
      )
        fail(
          `${name} ${table.table} draws its memory bar ${Math.round(
            Math.max(
              bar.cell.left - bar.bar.left,
              bar.bar.right - bar.cell.right,
            ),
          )}px outside its column`,
        );
      // A rule on the row's edge merges with the divider between rows.
      if (bar.row.bottom - bar.bar.bottom < 4)
        fail(`${name} ${table.table} draws its memory bar on the row's edge`);
      const ratio = contrastRatio(bar.fill, bar.track);
      if (ratio < 3)
        fail(
          `${name} ${table.table} draws its memory bar at ${ratio.toFixed(
            2,
          )}:1 against its groove`,
        );
      // The mark is the arithmetic, not a decoration: a full ruler without the
      // hatch hides an over-budget row, and a hatch on a fitting row lies.
      if (bar.over !== bar.need > table.legend)
        fail(
          `${name} ${table.table} draws a ${bar.need} GiB row ${bar.over ? "over" : "inside"} a ${table.legend} GiB budget`,
        );
      // One ink, one origin: the footprint starts where the groove starts in
      // every row, so the column reads as one ruler rather than five drawings.
      if (bar.inks !== (bar.over ? 2 : 1))
        fail(
          `${name} ${table.table} draws ${
            bar.inks
          } layers on a ${bar.over ? "over" : "fitting"} row`,
        );
      if (Math.abs(bar.fillLeft - bar.bar.left) > 1)
        fail(
          `${name} ${table.table} starts its ink ${Math.round(
            bar.fillLeft - bar.bar.left,
          )}px into the bar`,
        );
    }
  }
  if (widths.length && Math.max(...widths) - Math.min(...widths) > 1)
    fail(
      `${name} draws its memory bars ${Math.min(...widths)}-${Math.max(
        ...widths,
      )}px wide, not one ruler`,
    );
  // The two tables answer from one geometry: a bar that grew a row would make
  // the pages that draw both read as two designs.
  const heights = ruler
    .map((table) => table.rowHeight)
    .filter((height) => Number.isFinite(height));
  if (heights.length === 2 && Math.abs(heights[0] - heights[1]) > 1)
    fail(`${name} draws its two tables' rows ${heights.join(" and ")}px tall`);
}

/** Click a rail chip by its words, the way the reader does. */
async function clickRailChip(page, groupLabel, text) {
  const clicked = await page.evaluate(
    (group, label) => {
      const box = document.querySelector(
        '[role="group"][aria-label="' + group + '"]',
      );
      const chip = [...(box?.querySelectorAll("button") ?? [])].find(
        (entry) => entry.textContent.trim().split(" · ")[0] === label,
      );
      if (!chip) return false;
      chip.click();
      return true;
    },
    groupLabel,
    text,
  );
  if (!clicked) fail(`rail chip ${groupLabel} "${text}" was not found`);
}

/** Every runtime chip is a click the page survives: a narrow runtime can leave
 * the open model unsized, and the readout must say that instead of taking the
 * instrument down. Restores the runtime the caller was priced on. */
async function assertRuntimeClicksSurvive(page, name, restore) {
  const chips = await page.evaluate(() =>
    [
      ...document.querySelectorAll('[data-fit-strip] [role="group"] button'),
    ].map((button) => ({
      group: button.closest('[role="group"]').getAttribute("aria-label"),
      label: button.textContent.trim().split(" · ")[0],
    })),
  );
  if (chips.length < 3)
    fail(`${name} offers ${chips.length} runtimes to click`);
  for (const { group, label } of chips) {
    const clicked = await page.evaluate(
      (target) => {
        const box = document.querySelector(
          `[role="group"][aria-label="${target.group}"]`,
        );
        const chip = [...(box?.querySelectorAll("button") ?? [])].find(
          (button) =>
            button.textContent.trim().split(" · ")[0] === target.label,
        );
        chip?.click();
        return Boolean(chip);
      },
      { group, label },
    );
    if (!clicked) continue;
    await page.waitForFunction(
      (target) =>
        document
          .querySelector(
            `[role="group"][aria-label="${target.group}"] button[aria-pressed="true"]`,
          )
          ?.textContent.trim()
          .split(" · ")[0] === target.label,
      {},
      { group, label },
    );
    const alive = await page.evaluate(() => {
      // The pressed chip's numerator is its promise: the rows this click leaves.
      const strip = document.querySelector("[data-fit-strip]");
      const pressed = strip.querySelector('button[aria-pressed="true"]');
      const printed = (pressed?.textContent ?? "").match(/(\d+)\s*\/\s*\d+/);
      return {
        instrument: Boolean(document.querySelector("[data-fit-target]")),
        crashed: document.body.textContent.includes("This page crashed"),
        promise: printed ? Number(printed[1]) : null,
        rows: document.querySelectorAll("[data-fit-row]").length,
      };
    });
    if (!alive.instrument || alive.crashed)
      fail(
        `${name} the click on "${label}" leaves the page ${
          alive.crashed ? "crashed" : "incomplete"
        }`,
      );
    if (alive.promise !== alive.rows)
      fail(
        `${name} "${label}" prints ${alive.promise} rows over a table of ${alive.rows}`,
      );
  }
  await clickRailChip(page, restore.group, restore.label);
}

/** The rail's promise: the number a chip prints is the count its click leaves. */
async function assertChipPromise(page, name, closed) {
  for (const group of ["Device", "Hardware"]) {
    const pressed = closed.chips.find(
      (chip) => chip.group === group && chip.pressed,
    );
    const other = closed.chips.find(
      (chip) => chip.group === group && !chip.pressed,
    );
    if (!pressed || !other) continue;
    await clickRailChip(page, other.group, other.label);
    await waitForFit(
      page,
      `${name} chip "${other.label}"`,
      (expected) =>
        document.querySelector("[data-fit-target]")?.dataset.fitCount ===
        expected,
      String(other.count),
    );
    await clickRailChip(page, pressed.group, pressed.label);
    await waitForFit(
      page,
      `${name} back to "${pressed.label}"`,
      (expected) =>
        document.querySelector("[data-fit-target]")?.dataset.fitCount ===
        expected,
      String(pressed.count),
    );
    return;
  }
  fail(`${name} offers no chip swap to test`);
}

async function inspectFitRailViewport(viewport) {
  await withPage(`fit-rail-${viewport.width}`, viewport, async (page) => {
    await openFit(page);
    const name = `fit rail ${viewport.width}`;
    // The bands' boxes as the reader first sees them. Every stop below must
    // leave them as they are: only the words and the rows may change.
    const settled = await fitLayout(page);
    assertBandsHold(name, settled);
    const closed = await fitRailState(page);
    if (closed.missing.length)
      fail(`${name} loses the ${closed.missing.join(", ")} rail`);
    if (!closed.target) fail(`${name} names no hardware target`);
    // The runtime is the guide's second dimension: one strip, never folded, and
    // every chip states the coverage its number is counted from.
    const runtimes = await fitRuntimeState(page);
    if (!runtimes) fail(`${name} offers no runtime strip`);
    if (runtimes.folded) fail(`${name} hides the runtimes behind a fold`);
    const silent = runtimes.chips.filter(
      (chip) =>
        chip.label !== "Any runtime" &&
        !/covers [1-9]\d* models?/.test(chip.spoken),
    );
    if (silent.length)
      fail(
        `${name} offers ${silent.map((chip) => chip.label).join(", ")} with no coverage`,
      );
    if (runtimes.notes.length === 0)
      fail(`${name} never says what a runtime count means`);
    assertEmptyGroupState(name, runtimes);
    // One number, one meaning: a chip is listed only when the click that lists
    // it lands on rows, and its count carries the scope it is counted from.
    for (const chip of runtimes.chips) {
      if (chip.coverage === null)
        fail(`${name} prints "${chip.label}" without its coverage`);
      if (!(chip.count > 0))
        fail(`${name} offers "${chip.label}" with ${chip.count} rows`);
    }
    // The gain lives in the words: the hue repeats them, so the phrase is on the
    // page and the strip defines it once.
    if (
      runtimes.chips.some((chip) => chip.gain) &&
      !runtimes.notes.some((note) => /“only here”/.test(note))
    )
      fail(`${name} marks a gain without defining “only here”`);
    for (const chip of runtimes.chips)
      if (
        chip.gain &&
        !/holds \d+ models? no general-purpose runtime holds here/.test(
          chip.spoken,
        )
      )
        fail(`${name} marks "${chip.label}" without words`);
    // The rail carries chips only: a runtime that sizes nothing is absent, and
    // the group needs no sentence about it.
    if (closed.notes.length)
      fail(`${name} adds rail prose: ${closed.notes.join(" | ")}`);
    // A pinned rail taller than the window is cut off, whatever the scroll.
    if (closed.height > viewport.height - 16)
      fail(
        `${name} needs ${Math.round(closed.height)} px of a ${viewport.height} px window`,
      );
    // One number, one meaning: a chip prints the fits its own click leaves.
    for (const chip of [...closed.chips, ...runtimes.chips]) {
      if (!Number.isInteger(chip.count) || chip.count < 0)
        fail(`${name} ${chip.group} "${chip.label}" prints "${chip.count}"`);
      if (chip.count > closed.total)
        fail(
          `${name} "${chip.label}" promises ${chip.count} of ${closed.total}`,
        );
      if (chip.overflow > 0)
        fail(`${name} "${chip.label}" overflows by ${chip.overflow}px`);
    }
    // The pressed runtime chip is a click that changes nothing, so it repeats the
    // count the instrument travels as data.
    const pressedRuntime = runtimes.chips.find((chip) => chip.pressed);
    if (!pressedRuntime || pressedRuntime.count !== closed.count)
      fail(
        `${name} pressed runtime prints ${pressedRuntime?.count} beside ${closed.count}`,
      );
    await assertChipPromise(page, name, closed);
    assertBandsStill(name, settled, await fitLayout(page));

    // The panel's note row speaks only when the track cannot hold the workload.
    if (closed.budgetNote)
      fail(
        `${name} explains a track that still holds the workload: "${closed.budgetNote}"`,
      );

    // Both levers are open, beside the track, and agree with the answer. The
    // axes name themselves; the strip names the runtimes.
    const workload = await fitWorkloadState(page);
    assertWorkloadAxis(workload.context, `${name} context axis`);
    assertWorkloadAxis(workload.conversations, `${name} conversation axis`);
    if (workload.context.stops.length < 2)
      fail(`${name} context axis offers one length`);
    if (!closed.cacheKey.includes(workload.context.shown))
      fail(`${name} cache key "${closed.cacheKey}" ignores the axis`);

    // One axis moves the answer and the track's cache together, in width and in
    // words: the zone is the only place the workload's cost is drawn.
    await setFitStop(page, FIT_CONTEXT_LABEL, "128K");
    await waitForFit(page, `${name} context choice`, () =>
      document
        .querySelector('[class*="budgetZones"]')
        ?.textContent.includes("128K"),
    );
    const moved = await fitWorkloadState(page);
    if (moved.context.shown !== "128K")
      fail(`${name} context axis stopped at "${moved.context.shown}"`);
    const afterContext = await fitRailState(page);
    if (!afterContext.cacheKey.includes("128K"))
      fail(`${name} the memory track kept the old workload's cache`);
    const narrow = await assertFitTrack(page, `${name} at 128K`);
    assertBandsStill(name, settled, await fitLayout(page));
    await assertFitTableGrid(page, `${name} at 128K`);
    await setFitStop(page, FIT_CONTEXT_LABEL, "256K");
    // Wait on the drawn width, not only the words: the zone is the claim, and a
    // paint that lags its label would otherwise pass a stale read.
    await waitForFit(
      page,
      `${name} longer context`,
      (previous) => {
        const strip = document.querySelector('[class*="zones"]');
        const cache = strip?.children[1]?.getBoundingClientRect().width ?? 0;
        return (
          cache > previous &&
          document
            .querySelector('[class*="budgetZones"]')
            ?.textContent.includes("256K")
        );
      },
      narrow.zones[1],
    );
    const wide = await assertFitTrack(page, `${name} at 256K`);
    assertBandsStill(name, settled, await fitLayout(page));
    await assertFitTableGrid(page, `${name} at 256K`);
    if (!(wide.zones[1] > narrow.zones[1]))
      fail(
        `${name} cache zone stays ${wide.zones[1]} px at 256K and ${narrow.zones[1]} px at 128K`,
      );
    if (!(wide.count <= narrow.count))
      fail(`${name} a longer context added fits`);
    await setFitStop(page, FIT_CONTEXT_LABEL, "128K");
    await waitForFit(page, `${name} back to 128K`, () =>
      document
        .querySelector('[class*="budgetZones"]')
        ?.textContent.includes("128K"),
    );

    // The other axis too, and its direction: more conversations never add fits.
    const lastStop = moved.conversations.stops.length - 1;
    // The panel's cache cost is the axis' claim: read it before the move, then
    // wait for the number the keys print, not only for the slider.
    const cacheBefore = await fitCacheValue(page);
    await setFitStop(
      page,
      FIT_CONVERSATIONS_LABEL,
      moved.conversations.stops[lastStop],
    );
    await waitForFit(
      page,
      `${name} conversation choice`,
      (previous) => {
        // The same parse as fitCacheValue: this predicate runs in the page.
        const text =
          document.querySelector('[class*="budgetZones"]')?.textContent ?? "";
        const found =
          text.match(/\+ ([\d,.]+) GiB cache/) ??
          text.match(/cache at .+ · ([\d,.]+) GiB/);
        return Boolean(found) && Number(found[1].replace(/,/g, "")) > previous;
      },
      cacheBefore,
    );
    const crowded = await fitWorkloadState(page);
    if (crowded.conversations.value !== lastStop)
      fail(
        `${name} conversation axis stopped at ${crowded.conversations.value}`,
      );
    const crowdedRail = await fitRailState(page);
    if (!((await fitCacheValue(page)) > cacheBefore))
      fail(`${name} cache cost does not follow its conversation axis`);
    if (crowdedRail.count > afterContext.count)
      fail(`${name} more conversations added fits`);
    assertBandsStill(name, settled, await fitLayout(page));

    // A count is a consequence, not a layout event: the rail's counts and the
    // open model's answer fill bands that were already reserved, so nothing
    // between the levers and the rows changes size.
    await setFitStop(page, FIT_CONTEXT_LABEL, "512K");
    await waitForFit(
      page,
      `${name} zero count`,
      () =>
        document.querySelector("[data-fit-target]")?.dataset.fitCount === "0",
    );
    assertBandsStill(name, settled, await fitLayout(page));
    await assertFitTableGrid(page, `${name} at 512K`);
    // The strip states only runtimes that still hold a row; a runtime the
    // workload outgrows leaves the page rather than becoming a dead button.
    const later = await fitRuntimeState(page);
    assertEmptyGroupState(`${name} at 512K`, later);
    const idle = later.chips.filter(
      (chip) => !chip.pressed && !(chip.count > 0),
    );
    if (idle.length)
      fail(
        `${name} keeps ${idle.map((chip) => chip.label).join(", ")} at 512K`,
      );
    // The panel's reserved note row is the only place a saturated track speaks,
    // and the strip itself must state the need against the machine: an empty
    // range is not a control.
    await assertOverfullTrack(page, `${name} at 512K`);
    // Nothing fits, so the list is empty: the track's note is the page's only
    // word.
    const zero = await page.evaluate(
      () => document.querySelectorAll("[data-fit-row]").length,
    );
    if (zero !== 0) fail(`${name} lists ${zero} rows at the zero state`);
    assertBandsStill(name, settled, await fitLayout(page));
  });
}

async function inspectFitRail() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitRailViewport(viewport);
}

/**
 * The memory panel's cache cost, whichever key set the state prints: the fitting
 * key names it after the workload, the overfull row after the model. WHY read
 * both: the conversation axis can cross from a fitting state into an overfull
 * one, and the cache is still the fact the move must change.
 */
async function fitCacheValue(page) {
  return page.evaluate(() => {
    const text =
      document.querySelector('[class*="budgetZones"]')?.textContent ?? "";
    const found =
      text.match(/\+ ([\d,.]+) GiB cache/) ??
      text.match(/cache at .+ · ([\d,.]+) GiB/);
    return found ? Number(found[1].replace(/,/g, "")) : null;
  });
}

async function fitConversationRail(page) {
  const state = await fitWorkloadState(page);
  return state.conversations;
}

function assertConversationRail(rail) {
  if (!rail) fail("conversation axis is missing");
  if (rail.stops.length < 4)
    fail(`conversation axis shows ${rail.stops.length} stops`);
  if (rail.ranges !== 1)
    fail(`conversation axis offers ${rail.ranges} handles`);
  if (!rail.spoken.startsWith(rail.shown))
    fail(`conversation axis reads "${rail.spoken}" for "${rail.shown}"`);
}

async function inspectFitConversationViewport(viewport) {
  await withPage(
    `fit-conversation-${viewport.width}`,
    viewport,
    async (page) => {
      await openFit(page);
      assertConversationRail(await fitConversationRail(page));
    },
  );
}

/** The runtime comparison: a narrow runtime is priced on the machine that can
 * host it, and a zero-fit chip states zero rather than a dash. */
async function inspectFitRuntimes() {
  await withPage(
    "fit-runtimes",
    { width: 1440, height: 1000 },
    async (page) => {
      await openFit(page);
      await clickRailChip(page, "Hardware", "DGX Spark");
      await page.waitForFunction(() =>
        [
          ...document.querySelectorAll(
            '[data-figure-root][data-fit] [role="group"] button',
          ),
        ].some((node) => node.textContent.trim().startsWith("2×")),
      );
      await clickRailChip(page, "Devices", "2×");
      await setFitStop(page, FIT_CONTEXT_LABEL, "64K");
      await clickRailChip(page, "Specialized runtimes", "DwarfStar");
      await page.waitForFunction(() =>
        [...document.querySelectorAll("[data-fit-row] > button")].some((row) =>
          row.textContent.includes("DeepSeek V4.1 Flash 1017"),
        ),
      );

      const pair = await page.evaluate(() => {
        const row = [...document.querySelectorAll("[data-fit-row]")].find(
          (node) => node.textContent.includes("DeepSeek V4.1 Flash 1017"),
        );
        const button = row?.querySelector(":scope > button");
        button?.click();
        return {
          memory: row?.querySelector('[class*="rowValue"]')?.textContent ?? "",
        };
      });
      if (!pair.memory.includes("162"))
        fail(`2× Spark prices DwarfStar at "${pair.memory}", not 162 GiB`);

      await page.waitForSelector("[data-fit-runtimes]");
      const detail = await page.evaluate(() => {
        const options = [
          ...document.querySelectorAll("[data-fit-runtime]"),
        ].map((node) => ({
          state: node.dataset.fitRuntimeState,
          text: node.textContent.replace(/\s+/g, " ").trim(),
        }));
        return {
          options,
          note: document
            .querySelector("[data-fit-runtimes]")
            .textContent.replace(/\s+/g, " ")
            .trim(),
        };
      });
      const layout = detail.options.find(
        (option) => option.state === "fits" && /2 devices/.test(option.text),
      );
      if (!layout)
        fail(
          `the comparison never offers the two-device layout: ${JSON.stringify(detail.options)}`,
        );
      if (!/~81 GiB\/rank/.test(layout.text))
        fail(`the two-device option loses its per-rank figure: ${layout.text}`);
      if (!/do not change the fit arithmetic/.test(detail.note))
        fail("the comparison never says cited configurations are not priced");
      // The retired placeholder line: a runtime the guide names but never sizes
      // has nothing to compare, so it must not stand in as a dead row.
      if (/no published configuration/.test(detail.note))
        fail("the comparison lists a runtime with nothing to compare");

      // A runtime is a chip, not a way to break the page: the open model may be
      // unsized on a narrow engine, and the readout must say so.
      await assertRuntimeClicksSurvive(page, "DGX Spark 2×", {
        group: "Specialized runtimes",
        label: "DwarfStar",
      });

      await clickRailChip(page, "Devices", "1×");
      await page.waitForFunction(
        () =>
          ![...document.querySelectorAll("[data-fit-row] > button")].some(
            (row) => row.textContent.includes("DeepSeek V4.1 Flash 1017"),
          ),
      );
      // A runtime the smaller machine cannot hold leaves the strip rather than
      // becoming a dead button: what stays, promises at least one row.
      const dead = await page.evaluate(() =>
        [...document.querySelectorAll('[data-fit-strip] [role="group"] button')]
          .map((chip) => chip.textContent.replace(/\s+/g, " ").trim())
          .filter((text) => / \u00b7 0\//.test(text)),
      );
      if (dead.length)
        fail(`a one-Spark machine still offers ${dead.join(", ")}`);
    },
  );
}

/** The table changes one way, whatever the input was. A press that re-scopes it
 * closes the open card (the row's question is gone), and a repricing press
 * leaves no pin on a row the list has dropped — otherwise the card would spring
 * open again the moment a later press brings that row back. The classifier holds
 * the same rule (`pinAfter`); this guard keeps the two figures from drifting. */
async function inspectFitPin() {
  await withPage("fit-pin", { width: 1440, height: 1000 }, async (page) => {
    await openFit(page);
    const rowName = () =>
      page.evaluate(() => {
        const row = document.querySelector("[data-fit-row]");
        return {
          name: row
            ?.querySelector('[class*="rowName"]')
            ?.textContent.trim(),
          open: document.querySelectorAll(
            '[data-fit-row] button[aria-expanded="true"]',
          ).length,
          rows: [...document.querySelectorAll("[data-fit-row]")].map((node) =>
            node
              .querySelector('[class*="rowName"]')
              ?.textContent.trim(),
          ),
        };
      });
    const opened = await page.evaluate(() => {
      const button = document.querySelector("[data-fit-row] > button");
      button?.click();
      return Boolean(button);
    });
    if (!opened) fail("fit pin: no row to open");
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-fit-row] button[aria-expanded="true"]')
          .length === 1,
    );
    const first = await rowName();

    // llama.cpp serves every row the default machine lists, so the press both
    // keeps the open row and re-scopes the table: exactly the case the pin must
    // close, not keep.
    const pressed = await page.evaluate(() => {
      const chip = [...document.querySelectorAll("[data-fit-strip] button")].find(
        (node) => node.textContent.trim().startsWith("llama.cpp"),
      );
      chip?.click();
      return Boolean(chip);
    });
    if (!pressed) fail("fit pin: the default machine offers no llama.cpp chip");
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("[data-fit-strip] button")].some(
          (node) =>
            node.textContent.trim().startsWith("llama.cpp") &&
            node.getAttribute("aria-pressed") === "true",
        ),
    );
    const reScoped = await rowName();
    if (!reScoped.rows.includes(first.name))
      fail(
        `fit pin: llama.cpp drops ${first.name}, so the press cannot show a kept card`,
      );
    if (reScoped.open !== 0)
      fail(`fit pin: a runtime press leaves ${first.name} open`);

    // A lever can drop the open row and bring it back: the pin must not wait for
    // that return, or a card nobody clicked reappears.
    await page.evaluate(() => {
      document.querySelector("[data-fit-row] > button")?.click();
    });
    await page.waitForFunction(
      () =>
        document.querySelectorAll('[data-fit-row] button[aria-expanded="true"]')
          .length === 1,
    );
    const target = await rowName();
    await setFitStop(page, FIT_CONTEXT_LABEL, "1M");
    await page.waitForFunction(
      (name) =>
        ![...document.querySelectorAll("[data-fit-row]")].some((node) =>
          node
            .querySelector('[class*="rowName"]')
            ?.textContent.trim() === name,
        ),
      {},
      target.name,
    );
    await setFitStop(page, FIT_CONTEXT_LABEL, "64K");
    await page.waitForFunction(
      (name) =>
        [...document.querySelectorAll("[data-fit-row]")].some(
          (node) =>
            node
              .querySelector('[class*="rowName"]')
              ?.textContent.trim() === name,
        ),
      {},
      target.name,
    );
    const returned = await rowName();
    if (returned.rows.length !== first.rows.length)
      fail(
        `fit pin: the lever round trip lists ${returned.rows.length} rows, not ${first.rows.length}`,
      );
    if (returned.open !== 0)
      fail(`fit pin: the lever round trip reopens ${target.name}`);
  });
}

/** Every runtime chip in the busiest strip, with its box relative to the
 * instrument: a control that resizes on press re-wraps the rail under the
 * reader's click. */
async function fitRuntimeChips(page) {
  return page.evaluate(() => {
    const origin = document
      .querySelector("[data-fit-target]")
      .getBoundingClientRect().top;
    return [...document.querySelectorAll("[data-fit-strip] button")].map(
      (chip) => {
        const box = chip.getBoundingClientRect();
        return {
          label: chip.textContent.replace(/\s+/g, " ").trim(),
          pressed: chip.getAttribute("aria-pressed") === "true",
          disabled: chip.disabled,
          top: Math.round(box.top - origin),
          left: Math.round(box.left),
          height: Math.round(box.height),
          width: Math.round(box.width),
        };
      },
    );
  });
}

/** A pressed chip is a reading, not a layout event: its own box and every other
 * chip's box stay where they were. */
function assertRuntimeChipsStill(name, before, after) {
  if (before.length !== after.length)
    fail(`${name} offers ${after.length} runtimes, not ${before.length}`);
  before.forEach((chip, index) => {
    const now = after[index];
    for (const side of ["top", "left", "height", "width"])
      if (chip[side] !== now[side])
        fail(
          `${name} moves ${chip.label}.${side}: ${chip[side]} → ${now[side]}`,
        );
  });
}

/** The runtime strip's promise: a runtime reprices the rows, not the instrument.
 * Every reserved band keeps its box, and no chip resizes when pressed, so the
 * rail cannot re-wrap under the click that chose it. */
async function inspectFitRuntimeBandsViewport(viewport) {
  await withPage(
    `fit-runtime-bands-${viewport.width}`,
    viewport,
    async (page) => {
      await openFit(page);
      const name = `fit runtime bands ${viewport.width}`;
      // The busiest strip the guide can draw: five engines and two specialists.
      await clickRailChip(page, "Hardware", "DGX Spark");
      await clickRailChip(page, "Devices", "4×");
      await settleFitTable(page);
      const settled = await fitLayout(page);
      const blueprint = await fitRuntimeChips(page);
      if (blueprint.length < 5)
        fail(`${name} lists ${blueprint.length} runtimes`);
      for (const chip of blueprint) {
        // A zero-fit chip is drawn but inert; the contract is about the clicks a
        // reader can make, so only what can be pressed is pressed.
        if (chip.disabled) continue;
        const clicked = await page.evaluate((label) => {
          const target = [
            ...document.querySelectorAll("[data-fit-strip] button"),
          ].find(
            (node) => node.textContent.replace(/\s+/g, " ").trim() === label,
          );
          target?.click();
          return Boolean(target);
        }, chip.label);
        if (!clicked) fail(`${name} lost "${chip.label}" between reads`);
        await page.waitForFunction(
          (label) =>
            document
              .querySelector('[data-fit-strip] button[aria-pressed="true"]')
              ?.textContent.replace(/\s+/g, " ")
              .trim() === label,
          { timeout: 3000 },
          chip.label,
        );
        assertBandsStill(name, settled, await fitLayout(page));
        assertRuntimeChipsStill(
          `${name} on "${chip.label}"`,
          blueprint,
          await fitRuntimeChips(page),
        );
      }
    },
  );
}

async function inspectFitRuntimeBands() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitRuntimeBandsViewport(viewport);
}

async function inspectFitConversation() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitConversationViewport(viewport);
}

// Three regions: the rail sets the target, the master carries the controls, and
// the answer band carries the table on the figure's full measure. Rows start
// closed; the reader's click opens one row, whose detail is a child of that row.
async function fitLayoutGeometry(page) {
  return page.evaluate(() => {
    const rect = (node) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
      };
    };
    const figure = document.querySelector("figure[data-audio-figure]");
    const rail = figure?.querySelector("[data-figure-rail]");
    const master = figure?.querySelector("[data-figure-master]");
    const answer = figure?.querySelector("[data-figure-answer]");
    // The sidebar has its own open <details>; anchor on a chart row instead.
    const row = figure?.querySelector("[data-fit-row] > button");
    const table = row?.closest("[data-fit-table]");
    if (!figure || !rail || !master || !answer || !table)
      throw new Error("Fit layout is incomplete");
    const expanded = [
      ...figure.querySelectorAll('button[aria-expanded="true"]'),
    ];
    const owner = expanded[0]?.closest("[data-fit-row]");
    const detail = owner?.querySelector('[role="region"]');
    return {
      rail: { ...rect(rail), position: getComputedStyle(rail).position },
      master: rect(master),
      answer: rect(answer),
      table: rect(table),
      expanded: expanded.length,
      detail: detail ? rect(detail) : null,
    };
  });
}

/**
 * The shell's measure: the rail sets the target beside the controls or above
 * them, never beside the answer, and the answer band spans the figure. A
 * floating rail, or a table that stops short of its band, re-creates the side
 * column the figure abandoned.
 */
function assertFigureMeasure(name, { rail, master, answer, table }) {
  if (rail.position === "sticky" || rail.position === "fixed")
    fail(`${name} floats its rail (${rail.position})`);
  if (rail.bottom > table.top + 1)
    fail(`${name} draws the answer beside the rail`);
  if (answer.width < master.width - 1)
    fail(
      `${name} narrows the answer to the ${Math.round(
        answer.width,
      )}px controls column`,
    );
  if (Math.abs(table.width - answer.width) > 1)
    fail(
      `${name} leaves ${Math.round(
        answer.width - table.width,
      )}px of the answer band outside the table`,
    );
}

function assertFitLayout(geometry) {
  // Nothing is open on arrival: a row's evidence costs the reader a click.
  if (geometry.expanded !== 0)
    fail(`fit table opens ${geometry.expanded} rows on arrival`);
  if (geometry.detail) fail("fit detail is drawn before a row is opened");
  assertFigureMeasure("fit layout", geometry);
}

function assertFitDetail(geometry) {
  // One row is the answer: a second expanded row would be a second reading.
  if (geometry.expanded !== 1)
    fail(`fit table expands ${geometry.expanded} rows`);
  if (!geometry.detail) fail("expanded fit row has no detail region");
  if (geometry.detail.top < geometry.table.top)
    fail("fit detail sits above the table it belongs to");
  // The panel is a disclosure, not a peek: it must land at its own height, so a
  // clipped or never-opened panel fails here rather than passing as "present".
  if (geometry.detail.bottom - geometry.detail.top <= 0)
    fail("expanded fit row's panel never opened");
}

/** Click the first row the way the reader does, then read the page again. */
async function openFitRow(page) {
  await page.evaluate(() => {
    const row = document.querySelector(
      "figure[data-audio-figure] [data-fit-row] > button",
    );
    if (!row) throw new Error("Missing table row");
    row.click();
  });
  await waitForFit(
    page,
    "fit row expansion",
    () =>
      document.querySelectorAll(
        'figure[data-audio-figure] button[aria-expanded="true"]',
      ).length === 1,
  );
}

/** The open row's second click: the reader closes what they opened. */
async function closeFitRow(page) {
  await page.evaluate(() => {
    const row = document.querySelector(
      'figure[data-audio-figure] [data-fit-row] > button[aria-expanded="true"]',
    );
    if (!row) throw new Error("No open fit row to close");
    row.click();
  });
  await waitForFit(
    page,
    "fit row collapse",
    () =>
      document.querySelectorAll(
        'figure[data-audio-figure] button[aria-expanded="true"]',
      ).length === 0,
  );
}

async function inspectFitLayoutViewport(viewport) {
  await withPage(`fit-layout-${viewport.width}`, viewport, async (page) => {
    await openFit(page);
    assertFitLayout(await fitLayoutGeometry(page));
    const bands = await fitLayout(page);
    // The reader's first click picks one row, and that row owns the detail.
    await openFitRow(page);
    assertFitDetail(await fitLayoutGeometry(page));
    // A row opens downward, under the table: the levers, the strip and the
    // answer above it are the page's frame and must not move with it.
    assertBandsStill("fit row expansion", bands, await fitLayout(page));
    // The same row's next click closes it: the panel leaves no ghost, and the
    // page keeps the frame it had before the row opened.
    const opened = await fitLayout(page);
    await closeFitRow(page);
    assertFitLayout(await fitLayoutGeometry(page));
    assertBandsStill("fit row collapse", opened, await fitLayout(page));
  });
}

async function inspectFitLayout() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectFitLayoutViewport(viewport);
}

/**
 * Both figures draw one shell: the answer band must be as wide as the rail's row
 * in each. A drift here is the failure the shared layer exists to prevent, so it
 * fails loudly.
 */
async function assertFigureBase(page, name, attr) {
  const base = await page.evaluate((prefix) => {
    const root = document.querySelector(`[data-figure-root][${prefix}]`);
    const count = (selector) => document.querySelectorAll(selector).length;
    const rect = (node) => {
      const box = node.getBoundingClientRect();
      return {
        left: box.left,
        right: box.right,
        top: box.top,
        bottom: box.bottom,
        width: box.width,
      };
    };
    const rail = root?.querySelector("[data-figure-rail]");
    const master = root?.querySelector("[data-figure-master]");
    const answer = root?.querySelector("[data-figure-answer]");
    const table = root?.querySelector(
      "[data-fit-table], [data-decision-table]",
    );
    return {
      roots: count(`[data-figure-root][${prefix}]`),
      speech: count(`[${prefix}-speech]`),
      heads: root?.querySelectorAll('[class*="headLabel"]').length ?? 0,
      strips: count(`[${prefix}-strip]`),
      railLabel: rail?.getAttribute("aria-label") ?? "",
      measure:
        rail && master && answer && table
          ? {
              rail: {
                ...rect(rail),
                position: getComputedStyle(rail).position,
              },
              master: rect(master),
              answer: rect(answer),
              table: rect(table),
            }
          : null,
    };
  }, attr);
  if (base.roots !== 1) fail(`${name} draws ${base.roots} figure roots`);
  if (base.speech !== 1) fail(`${name} has ${base.speech} live regions`);
  if (base.heads === 0) fail(`${name} draws no table head`);
  if (base.strips !== 1) fail(`${name} draws ${base.strips} runtime strips`);
  if (base.railLabel !== "Your hardware")
    fail(`${name} names its rail "${base.railLabel}"`);
  if (!base.measure) fail(`${name} draws no rail, master, answer and table`);
  else assertFigureMeasure(name, base.measure);
}

/** The hardware chips one rail draws, in the order the figure draws them. */
async function railFamilies(page, attr) {
  return page.evaluate((prefix) => {
    const group = document.querySelector(
      `[data-figure-root][${prefix}] [role="group"][aria-label="Hardware"]`,
    );
    return [...(group?.querySelectorAll("button") ?? [])].map(
      (chip) => chip.textContent.trim().split(" · ")[0],
    );
  }, attr);
}

/** One family click, scoped to one figure: both rails draw a "Hardware" group. */
async function clickRailFamily(page, attr, family) {
  const clicked = await page.evaluate(
    (prefix, label) => {
      const group = document.querySelector(
        `[data-figure-root][${prefix}] [role="group"][aria-label="Hardware"]`,
      );
      const chip = [...(group?.querySelectorAll("button") ?? [])].find(
        (button) => button.textContent.trim().split(" · ")[0] === label,
      );
      if (!chip) return false;
      chip.click();
      return true;
    },
    attr,
    family,
  );
  if (!clicked) fail(`${attr} rail draws no "${family}" chip`);
  // React commits on the event, but the answer is measured against the layout it
  // produced: wait for that click's own pressed chip.
  await page.waitForFunction(
    (prefix, label) =>
      [
        ...(document
          .querySelector(
            `[data-figure-root][${prefix}] [role="group"][aria-label="Hardware"]`,
          )
          ?.querySelectorAll("button") ?? []),
      ].some(
        (chip) =>
          chip.getAttribute("aria-pressed") === "true" &&
          chip.textContent.trim().split(" · ")[0] === label,
      ),
    {},
    attr,
    family,
  );
}

/** What one family costs the figure's boxes, measured against the row it sits in. */
async function seamMetrics(page, attr) {
  return page.evaluate((prefix) => {
    const root = document.querySelector(`[data-figure-root][${prefix}]`);
    const box = (selector) =>
      root.querySelector(selector).getBoundingClientRect();
    return {
      // Measured from the row's top, not the page's: the figure above may answer
      // a different question and move; this figure's own seam may not.
      belowRow:
        box("[data-figure-answer]").top - box("[data-figure-master]").top,
      axis:
        root
          .querySelector("[data-decision-memory-axis]")
          ?.getBoundingClientRect().height ?? null,
    };
  }, attr);
}

/**
 * The seam, swept over every family: the answer band starts where the reserved
 * first row ends, never where the tallest column ends. Chips wrap by family, so
 * the rail runs 328-496px against controls of 429-505px; without the
 * reservation a chip click would carry the table down the page.
 *
 * The same sweep states the read-out's own reservation: the memory axis keeps
 * two lines of facts, so a target's wording never resizes the card that prices
 * it.
 */
async function figureSeam(page, attr) {
  const families = await railFamilies(page, attr);
  if (families.length < 2)
    fail(`${attr} offers ${families.length} hardware families`);
  const rows = [];
  for (const family of families) {
    await clickRailFamily(page, attr, family);
    rows.push({ family, ...(await seamMetrics(page, attr)) });
  }
  const spread = (values) => Math.max(...values) - Math.min(...values);
  const seams = rows.map((row) => row.belowRow);
  if (spread(seams) > 1)
    fail(
      `${attr} moves its answer ${spread(seams)}px across families (${rows
        .map((row) => `${row.family} ${Math.round(row.belowRow)}`)
        .join(", ")})`,
    );
  const axes = rows.map((row) => row.axis).filter((height) => height !== null);
  if (axes.length && spread(axes) > 1)
    fail(
      `${attr} resizes its memory axis by ${spread(axes)}px across families`,
    );
}

async function inspectFigureSeam() {
  await withPage("figure-seam", DESKTOP_VIEWPORT, async (page) => {
    await openFit(page);
    await page.waitForSelector("[data-decision-memory-axis]");
    for (const attr of ["data-fit", "data-decision"])
      await figureSeam(page, attr);
  });
}

/** What one family costs the two figures' own boxes, in page coordinates. */
async function anchorMetrics(page, attr, other) {
  return page.evaluate(
    ([prefix, siblingPrefix]) => {
      const root = document.querySelector(`[data-figure-root][${prefix}]`);
      const sibling = document.querySelector(
        `[data-figure-root][${siblingPrefix}]`,
      );
      const strip = root.querySelector(`[${prefix}-strip]`);
      const box = (node) => node.getBoundingClientRect();
      return {
        // Document top, not viewport top: the figure under test may sit below
        // the sibling, so a scroll would hide the movement this reads.
        top: Math.round(box(root).top + window.scrollY),
        siblingHeight: Math.round(box(sibling).height),
        strip: strip ? Math.round(box(strip).height) : null,
      };
    },
    [attr, other],
  );
}

/**
 * A figure's place on the page, swept over every family: a click in one rail may
 * not resize the other figure, and may not move the figure that owns the rail.
 *
 * WHY: the fit table draws one row per fitting model (0-16 rows, 581-1428px).
 * While both figures read one machine, a classifier click resized that table and
 * translated the classifier by up to 521px, out from under the reader. Each
 * figure keeps its own store now; this sweep is what proves it.
 *
 * Run at two widths: 1400 is where the layout gives the master its widest
 * column, and where the strip's reserved rows are the only thing keeping its box
 * the same size on every machine.
 */
async function figureAnchor(page, attr) {
  const other = attr === "data-fit" ? "data-decision" : "data-fit";
  const families = await railFamilies(page, attr);
  if (families.length < 2)
    fail(`${attr} offers ${families.length} hardware families`);
  const rows = [];
  for (const family of families) {
    await clickRailFamily(page, attr, family);
    rows.push({ family, ...(await anchorMetrics(page, attr, other)) });
  }
  const spread = (values) => Math.max(...values) - Math.min(...values);
  const tops = rows.map((row) => row.top);
  if (spread(tops) > 1)
    fail(
      `${attr} moves itself ${spread(tops)}px across families (${rows
        .map((row) => `${row.family} ${row.top}`)
        .join(", ")})`,
    );
  const siblings = rows.map((row) => row.siblingHeight);
  if (spread(siblings) > 1)
    fail(`${attr} resizes the ${other} figure by ${spread(siblings)}px`);
  const strips = rows
    .map((row) => row.strip)
    .filter((height) => height !== null);
  if (strips.length && spread(strips) > 1)
    fail(
      `${attr} resizes its runtime strip by ${spread(strips)}px across families`,
    );
}

async function inspectFigureAnchor() {
  for (const viewport of [DESKTOP_VIEWPORT, { width: 1400, height: 900 }]) {
    await withPage(
      `figure-anchor-${viewport.width}`,
      viewport,
      async (page) => {
        await openFit(page);
        await page.waitForSelector("[data-decision-memory-axis]");
        for (const attr of ["data-fit", "data-decision"])
          await figureAnchor(page, attr);
      },
    );
  }
}

/** One figure's drawn claims, read from the DOM rather than from its prose. */
async function decisionShape(page) {
  return page.evaluate(() => {
    const read = (node) => node?.textContent.replace(/\s+/g, " ").trim();
    const table = document.querySelector("[data-decision-table]");
    const head = table.querySelector(':scope > [class*="head"]');
    const row = table.querySelector("[data-decision-row] > button");
    const lever = (axis) => {
      const input = document.querySelector(
        `[data-decision] input[data-lever-input="${axis}"]`,
      );
      if (!input) return null;
      return {
        value: Number(input.dataset.leverValue),
        stops: Number(input.max) + 1,
        spoken: input.getAttribute("aria-valuetext") ?? "",
      };
    };
    return {
      // Every column that is drawn must be one the row also draws: a folded
      // column hides its head and its cell together. A workload the machine
      // cannot hold lists no row, so the row-level facts are null then.
      headCells: head.children.length,
      rowCells: row ? row.children.length : null,
      headNameX: head
        .querySelector('[class*="headLabel"]')
        .getBoundingClientRect().left,
      rowNameX: row
        ? row.querySelector('[class*="rowName"]').getBoundingClientRect().left
        : null,
      // The name is the one column allowed to shorten: every other fact has a
      // fixed track, so a long name never pushes a number out of the card.
      nameEllipsis: row
        ? (() => {
            const style = getComputedStyle(
              row.querySelector('[class*="rowName"]'),
            );
            return (
              style.textOverflow === "ellipsis" && style.whiteSpace === "nowrap"
            );
          })()
        : null,
      // A card's own facts, which no lever may touch: the lab's country and the
      // four-island name it publishes under.
      origins: [...table.querySelectorAll("[data-decision-origin]")].map(read),
      leakedFit: table.querySelectorAll("[data-fit-row], [data-fit-table]")
        .length,
      verified: document.querySelectorAll(
        "[data-decision-row][data-decision-verdict]",
      ).length,
      // The mark column is drawn in every row: a lab with no official vector
      // still gets its initial tile, so no row reads as a broken image.
      emptyMarks: [...table.querySelectorAll("[data-decision-row]")].filter(
        (row) => {
          const slot = row.querySelector("button > span");
          return !slot || !slot.firstElementChild;
        },
      ).length,
      tableScroll: table.scrollWidth,
      tableWidth: table.clientWidth,
      docScroll: document.documentElement.scrollWidth,
      docWidth: document.documentElement.clientWidth,
      // The memory band, read from its own hooks: the lightest listed row's need
      // (the strip's floor), the budget the row bars are priced against, and the
      // machine that is the strip's whole length.
      axis: (() => {
        const node = document.querySelector("[data-decision-memory-axis]");
        if (!node) return null;
        const head = node.querySelector("[data-decision-head-value]");
        return {
          need: Number(node.dataset.decisionNeed),
          budget: Number(node.dataset.decisionSupply),
          machine: Number(node.dataset.decisionTrack),
          weights: Number(node.dataset.decisionWeights),
          cache: Number(node.dataset.decisionCache),
          overfull: node.hasAttribute("data-decision-overfull"),
          head: Number(read(head)?.replace(/[^\d.]/g, "")),
        };
      })(),
      levers: {
        state: lever("state"),
        decisions: lever("decisions"),
      },
      // The table's own verdicts, which the axis must agree with: one budget
      // prices both, so neither may be read as a second opinion.
      counts: {
        fitting: Number(
          document.querySelector("[data-decision-count]")?.dataset
            .decisionCount,
        ),
        total: Number(
          document.querySelector("[data-decision-total]")?.dataset
            .decisionTotal,
        ),
      },
      // The levers are sliders, not chips: one handle per axis, so the count is
      // the panel's own claim that a knob is a published value, not a filter.
      leverInputs: document.querySelectorAll(
        "[data-decision] input[data-lever-input]",
      ).length,
      // The columns the chat table also draws: the channels each card reads, and
      // the footprint the reader's machine is tested against.
      modalities: [...table.querySelectorAll("[data-decision-modality]")].map(
        (cell) => cell.dataset.decisionModality,
      ),
      memory: [...table.querySelectorAll("[data-decision-memory]")].map(
        (cell) => read(cell.querySelector("[data-figure-memory]")),
      ),
      // The workload's two terms, row by row: the published weights, and the
      // exact need the bar was drawn from. A row with no published size states
      // the mark and draws nothing.
      rows: [
        ...table.querySelectorAll("[data-decision-row][data-decision-verdict]"),
      ].map((row) => {
        const figure = row.querySelector("[data-figure-memory]");
        const bar = row.querySelector("[data-memory-bar-need]");
        const text = read(figure);
        return {
          id: row.dataset.decisionModel,
          verdict: row.dataset.decisionVerdict,
          weights: figure?.dataset.decisionWeights
            ? Number(figure.dataset.decisionWeights)
            : null,
          memory: text === "—" ? null : Number(text.replace(/,/g, "")),
          need: bar ? Number(bar.dataset.memoryBarNeed) : null,
          origin: row.querySelector("[data-decision-origin]")?.textContent,
        };
      }),
      // One ruler, two tables: the bars must be one width, or the columns that
      // look alike are reading different scales.
      barWidths: [
        ...table.querySelectorAll(
          "[data-decision-memory] [data-memory-bar-need]",
        ),
        ...document.querySelectorAll("[data-fit-table] [data-memory-bar-need]"),
      ].map((bar) => Math.round(bar.getBoundingClientRect().width)),
    };
  });
}

/**
 * Push one workload lever to its end and wait for the panel to re-price. WHY a
 * wait on the floor: a lever can delete rows, so the row list is not a stable
 * signal; the lightest need is.
 */
async function pushLever(page, axis, before) {
  if (!before.axis) fail(`the ${axis} lever has no memory band to move`);
  const was = before.axis.need;
  await page.focus(`input[data-lever-input="${axis}"]`);
  await page.keyboard.press("End");
  await page.waitForFunction(
    (need) => {
      const node = document.querySelector("[data-decision-memory-axis]");
      return node ? Number(node.dataset.decisionNeed) !== need : false;
    },
    {},
    was,
  );
  return decisionShape(page);
}

/**
 * The setup's own shape: the memory strip beside the levers that price it. Read
 * as geometry, so the two arrangements the fit calculator taught (side by side,
 * then stacked) are one contract.
 */
async function decisionSetup(page) {
  return page.evaluate(() => {
    const root = document.querySelector("[data-decision]");
    const setup = root.querySelector('[class*="setup"]');
    const panel = root.querySelector("[data-decision-memory-axis]");
    const levers = root.querySelector('[class*="levers"]');
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    return {
      bands: setup.children.length,
      setup: box(setup),
      panel: box(panel),
      levers: box(levers),
    };
  });
}

const sameEdge = (a, b) => Math.abs(a - b) <= 1;

/** One row where there is room, one column where there is not. */
function assertDecisionSetup(name, shape) {
  if (shape.bands !== 2)
    fail(`${name} draws ${shape.bands} setup bands, not two`);
  if (!sameEdge(shape.panel.left, shape.levers.left)) {
    // One row: same top, same bottom, the panel stretched to the levers.
    if (!sameEdge(shape.panel.top, shape.levers.top))
      fail(
        `${name} starts its memory and levers ${Math.round(
          shape.panel.top - shape.levers.top,
        )}px apart`,
      );
    if (!(shape.panel.right <= shape.levers.left + 1))
      fail(`${name} overlaps its memory band and its levers`);
    if (!sameEdge(shape.panel.height, shape.levers.height))
      fail(
        `${name} leaves its bands ${Math.round(
          Math.abs(shape.panel.height - shape.levers.height),
        )}px apart`,
      );
  } else {
    if (!(shape.panel.bottom <= shape.levers.top + 1))
      fail(`${name} overlaps its stacked bands`);
    if (!sameEdge(shape.panel.width, shape.levers.width))
      fail(`${name} stacks bands of two widths`);
  }
}

/**
 * The decision figure's contract: one state, two protocols, and a count that
 * states its own basis. The levers must move the count and the need, never a
 * card's own facts; the table must keep its columns inside the card at every
 * width, and no fit hook may appear inside it.
 */
// ---------------------------------------------------------------- decision runtimes
// The classifier cards' own runtime list, read from the artifact the figure
// reads: a second copy of "who serves what" would drift, and this contract
// exists because a chip agreed with a table that listed rows it never served.
const CLASSIFIER_DATASET = require(
  path.resolve(
    __dirname,
    "..",
    "website",
    "src",
    "generated",
    "open-weight-classifiers.json",
  ),
);
const FIT_DATASET = require(
  path.resolve(
    __dirname,
    "..",
    "website",
    "src",
    "generated",
    "open-weight-fit.json",
  ),
);
const ENGINE_LABELS = new Map(
  FIT_DATASET.engines.map((engine) => [engine.label, engine.id]),
);

/** The cards that name a runtime: the rows that chip promises. */
const classifiersServing = (engineId) =>
  CLASSIFIER_DATASET.models
    .filter((model) => model.engineIds.includes(engineId))
    .map((model) => model.id);

/** The classifier table, its count and its floor, as the reader reads them. */
async function decisionRuntimeState(page) {
  return page.evaluate(() => {
    const root = document.querySelector("[data-decision]");
    const axis = root.querySelector("[data-decision-memory-axis]");
    const pressed = root.querySelector(
      '[data-decision-strip] button[aria-pressed="true"]',
    );
    const chip = (pressed?.textContent ?? "").replace(/\s+/g, " ").trim();
    const [count, coverage] = (chip.split(" \u00b7 ")[1] ?? "").split("/");
    return {
      chip,
      label: chip.split(" \u00b7 ")[0],
      chipCount: Number(count),
      chipCoverage: Number(coverage),
      rows: [...root.querySelectorAll("[data-decision-row]")].map(
        (row) => row.dataset.decisionModel,
      ),
      needs: [
        ...root.querySelectorAll("[data-decision-row] [data-memory-bar-need]"),
      ].map((bar) => Number(bar.dataset.memoryBarNeed)),
      count: Number(root.dataset.decisionCount),
      total: Number(root.dataset.decisionTotal),
      need: Number(axis?.dataset.decisionNeed),
      expanded: root.querySelectorAll(
        '[data-decision-row] button[aria-expanded="true"]',
      ).length,
      speech: (root.querySelector("[data-decision-speech]")?.textContent ?? " ")
        .replace(/\s+/g, " ")
        .trim(),
    };
  });
}

/** The runtime chips the strip offers, in drawing order, without their counts. */
async function decisionRuntimeChips(page) {
  return page.evaluate(() =>
    [
      ...document.querySelectorAll(
        '[data-decision-strip] [role="group"][aria-label="Runtime"] button',
      ),
    ].map((chip) =>
      chip.textContent.replace(/\s+/g, " ").trim().split(" \u00b7 ")[0],
    ),
  );
}

/** Presses one runtime chip and waits for the strip to read it back. */
async function pressDecisionRuntime(page, label) {
  const clicked = await page.evaluate((target) => {
    const chip = [
      ...document.querySelectorAll(
        '[data-decision-strip] [role="group"][aria-label="Runtime"] button',
      ),
    ].find((node) =>
      node.textContent.replace(/\s+/g, " ").trim().startsWith(`${target} \u00b7 `),
    );
    chip?.click();
    return Boolean(chip);
  }, label);
  if (!clicked) fail(`the classifier strip offers no "${label}" chip`);
  await page.waitForFunction(
    (target) =>
      document
        .querySelector('[data-decision-strip] button[aria-pressed="true"]')
        ?.textContent.replace(/\s+/g, " ")
        .trim()
        .startsWith(`${target} \u00b7 `),
    {},
    label,
  );
}

/**
 * The classifier strip's promise: a runtime chip lists the rows it serves, and
 * the numbers it prints are the ones under it. WHY the dataset rides along: a
 * chip can agree with a table that lists the wrong rows, so the source that
 * decides "who serves what" is the only check a scope that never reached the
 * list cannot pass (2026-11-25: the chip counted 2, the table listed 3).
 */
async function inspectDecisionRuntimesViewport(viewport) {
  await withPage(
    `decision-runtimes-${viewport.width}`,
    viewport,
    async (page) => {
      await emulateReducedMotion(page);
      await page.goto(siteUrl(FIT_ROUTE), { waitUntil: "networkidle0" });
      await page.waitForSelector("[data-decision-table] [data-decision-row]");
      const name = `decision runtimes ${viewport.width}`;
      const baseline = await decisionRuntimeState(page);
      const chips = await decisionRuntimeChips(page);
      if (chips[0] !== "Any runtime")
        fail(`${name} opens on "${chips[0]}", not the whole set`);
      if (baseline.rows.length !== baseline.count)
        fail(
          `${name} lists ${baseline.rows.length} rows under a count of ${baseline.count}`,
        );
      if (baseline.total !== CLASSIFIER_DATASET.models.length)
        fail(
          `${name} prices ${baseline.total} classifiers against a card set of ${CLASSIFIER_DATASET.models.length}`,
        );
      if (!baseline.speech.includes("on any runtime"))
        fail(`${name} speaks "${baseline.speech}" without a scope`);

      // A row opened here is a pin on this runtime: the next runtime may not
      // serve it, so the strip must close it rather than leave it hidden.
      const opened = baseline.rows[0];
      const toggled = await page.evaluate((id) => {
        const row = document.querySelector(
          `[data-decision-row][data-decision-model="${id}"] button`,
        );
        row?.click();
        return Boolean(row);
      }, opened);
      if (!toggled) fail(`${name} cannot open ${opened}`);
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            '[data-decision-row] button[aria-expanded="true"]',
          ).length === 1,
      );

      let narrowed = false;
      for (const label of chips.slice(1)) {
        const engineId = ENGINE_LABELS.get(label);
        if (!engineId)
          fail(`${name} draws "${label}", which the catalogue does not name`);
        await pressDecisionRuntime(page, label);
        const state = await decisionRuntimeState(page);
        if (state.label !== label)
          fail(`${name} pressed "${label}" and reads "${state.label}"`);
        const served = classifiersServing(engineId);
        for (const id of state.rows)
          if (!served.includes(id))
            fail(
              `${name} lists ${id} under "${label}", which its card does not name`,
            );
        // The printed fraction is the list: the numerator counts its rows, the
        // denominator counts the cards that name this runtime.
        if (state.chipCount !== state.rows.length || state.count !== state.rows.length)
          fail(
            `${name} prints "${state.chip}" over ${state.rows.length} rows and a count of ${state.count}`,
          );
        if (state.chipCoverage !== served.length || state.total !== served.length)
          fail(
            `${name} prints "${state.chip}" against ${served.length} cards that name ${label}`,
          );
        // The floor is the lightest listed row, whatever the runtime.
        const lightest = Math.min(...state.needs);
        if (!(Math.abs(state.need - lightest) <= 0.05))
          fail(
            `${name} states a ${state.need} GiB floor over a ${lightest} GiB lightest row on "${label}"`,
          );
        if (state.expanded !== 0)
          fail(`${name} keeps ${opened} open on "${label}"`);
        if (!state.speech.includes(`${state.count} of ${state.total}`))
          fail(
            `${name} speaks "${state.speech}" over a ${state.count} of ${state.total} table`,
          );
        if (!state.speech.includes(label))
          fail(`${name} speaks "${state.speech}" without naming "${label}"`);
        if (state.rows.length < baseline.rows.length) narrowed = true;
      }
      if (!narrowed)
        fail(`${name} lists the same rows on every runtime: no chip filters`);

      await pressDecisionRuntime(page, "Any runtime");
      const restored = await decisionRuntimeState(page);
      if (restored.rows.join() !== baseline.rows.join())
        fail(`${name} does not restore its rows on "Any runtime"`);
      if (restored.expanded !== 0)
        fail(`${name} reopens the row a runtime dropped`);
    },
  );
}

async function inspectDecisionRuntimes() {
  for (const viewport of [DESKTOP_VIEWPORT, DOCK_VIEWPORT])
    await inspectDecisionRuntimesViewport(viewport);
}

async function inspectDecisionModelViewport(viewport) {
  await withPage(`decision-model-${viewport.width}`, viewport, async (page) => {
    await emulateReducedMotion(page);
    await page.goto(siteUrl(FIT_ROUTE), { waitUntil: "networkidle0" });
    await page.waitForSelector("[data-decision-table] [data-decision-row]");
    const name = `decision model ${viewport.width}`;
    await assertFigureBase(page, name, "data-decision");
    await assertFigureBase(page, name, "data-fit");
    await assertMemoryRuler(page, name);
    assertDecisionSetup(name, await decisionSetup(page));

    const shape = await decisionShape(page);
    if (shape.leakedFit)
      fail(`${name} carries ${shape.leakedFit} fit-figure hooks`);
    if (shape.rowCells !== null && shape.headCells !== shape.rowCells)
      fail(
        `${name} head draws ${shape.headCells} columns over rows of ${shape.rowCells}`,
      );
    if (
      shape.rowNameX !== null &&
      Math.abs(shape.headNameX - shape.rowNameX) > 1
    )
      fail(`${name} name column sits off its head`);
    if (shape.nameEllipsis === false)
      fail(`${name} lets the model name wrap instead of ellipsing`);
    // One handle per workload axis, and no chip standing in for one: a knob is a
    // published value the reader picks, a chip is a filter.
    if (shape.leverInputs !== 2)
      fail(`${name} draws ${shape.leverInputs} lever handles, not two`);
    for (const [axis, lever] of Object.entries(shape.levers))
      if (!lever || !Number.isInteger(lever.value) || !lever.spoken)
        fail(`${name} states no value for the ${axis} lever`);
    // The memory band: one budget prices its bar and the table's row bars, so
    // the filled span may never claim memory the machine does not print.
    if (!shape.axis) fail(`${name} draws no memory band`);
    else {
      const { axis } = shape;
      if (!(axis.budget > 0 && axis.budget <= axis.machine))
        fail(`${name} gives ${axis.budget} GiB of ${axis.machine} GiB printed`);
      if (!(axis.need > 0))
        fail(`${name} states no floor for this workload`);
      // The panel's three areas are its own need: the strip and its keys cannot
      // describe two different models.
      if (Math.abs(axis.weights + axis.cache - axis.need) > 0.05)
        fail(
          `${name} splits ${axis.need} GiB into ${axis.weights} + ${axis.cache}`, 
        );
      if (axis.overfull !== (axis.need > axis.budget + 1e-9))
        fail(
          `${name} calls a ${axis.need} GiB floor over ${axis.budget} GiB "${axis.overfull}"`,
        );
      const head = axis.overfull ? axis.need : axis.budget;
      if (Math.abs(axis.head - head) > 0.6)
        fail(
          `${name} prints ${axis.head} GiB in a panel that stands on ${head} GiB`,
        );
    }
    if (shape.origins.length !== shape.verified)
      fail(
        `${name} draws ${shape.origins.length} origins for ${shape.verified} rows`,
      );
    for (const origin of shape.origins)
      if (!origin) fail(`${name} leaves an origin cell empty`);
    if (shape.tableScroll > shape.tableWidth + 1)
      fail(`${name} table overflows its card`);
    if (shape.emptyMarks)
      fail(`${name} leaves ${shape.emptyMarks} row marks empty`);

    // The chat table's two columns, drawn here as well: a classifier states the
    // channels it reads and the memory it needs on the machine the reader set.
    if (shape.modalities.length !== shape.verified)
      fail(
        `${name} draws ${shape.modalities.length} modality cells for ${shape.verified} rows`,
      );
    for (const code of shape.modalities)
      if (
        !/^in:(?:text|image|audio|video)(?:\+(?:text|image|audio|video))*;out:label$/.test(
          code ?? "",
        )
      )
        fail(`${name} draws the channels as "${code}"`);
    if (shape.memory.length !== shape.verified)
      fail(
        `${name} draws ${shape.memory.length} memory cells for ${shape.verified} rows`,
      );
    for (const value of shape.memory)
      if (!/^(?:—|[\d.,]+)$/.test(value))
        fail(`${name} prints "${value}" as a memory figure`);
    // The column is the need at this workload: the weights once, plus the cache
    // the state holds. The table lists only the rows that fit, so a listed row
    // is inside the budget by construction — the count and the list are one
    // claim, and neither may name a card that loses here.
    if (shape.rows.length !== shape.counts.fitting)
      fail(
        `${name} lists ${shape.rows.length} rows under a count of ${shape.counts.fitting}`,
      );
    for (const row of shape.rows) {
      if (row.verdict !== "fits")
        fail(`${name} lists a "${row.verdict}" row`);
      if (row.weights === null)
        fail(`${name} lists a row with no published weight size`);
      if (row.need === null || row.memory === null)
        fail(`${name} draws no need for ${row.id}`);
      if (row.need + 1e-6 < row.weights)
        fail(
          `${name} prices ${row.need} GiB under its ${row.weights} GiB of weights`,
        );
      if (!(row.need > row.weights))
        fail(`${name} prices no cache for a ${row.weights} GiB row`);
      if (!(row.need <= shape.axis.budget + 1e-9))
        fail(
          `${name} lists ${row.need} GiB over a ${shape.axis.budget} GiB budget`,
        );
      // The number and the bar state one footprint: the row prints the need.
      if (Math.abs(row.memory - row.need) > 0.05)
        fail(`${name} prints ${row.memory} for a ${row.need} GiB need`);
      // No listed row can carry the "needs more" hatch.
      if (row.need > shape.axis.budget)
        fail(`${name} hatches a row it lists`);
    }

    // The panel's cache is the rows' own term: every listed row's need minus its
    // weights must be the one figure the strip draws beside the levers.
    const caches = shape.rows
      .filter((row) => row.need !== null && row.weights !== null)
      .map((row) => row.need - row.weights);
    if (!caches.length) fail(`${name} prices no cache term`);
    for (const cache of caches)
      if (Math.abs(cache - shape.axis.cache) > 0.05)
        fail(
          `${name} draws a ${shape.axis.cache} GiB cache against a row's ${cache} GiB`,
        );
    // The floor is the lightest listed row, so the panel and the table quote one
    // model's need: this is the quantity the old cache-only strip never carried.
    const lightest = Math.min(...shape.rows.map((row) => row.need));
    if (!(Math.abs(shape.axis.need - lightest) <= 0.05))
      fail(
        `${name} states a ${shape.axis.need} GiB floor while its lightest row needs ${lightest} GiB`,
      );
    if (new Set(shape.barWidths).size > 1)
      fail(
        `${name} draws its memory bars ${[...new Set(shape.barWidths)].join("/")}px wide, not one ruler`,
      );
    if (shape.docScroll > shape.docWidth + 1)
      fail(`${name} overflows the page`);

    // A longer state raises every listed row's need and every read, and lists
    // strictly fewer rows. It may not touch the weights, a card's own origin,
    // the machine's budget, or the question count the read-out states.
    const long = await pushLever(page, "state", shape);
    if (long.axis?.budget !== shape.axis?.budget)
      fail(`${name} moved the memory budget with a workload lever`);
    if (!(long.axis.cache > shape.axis.cache))
      fail(`${name} kept a ${long.axis.cache} GiB cache at a longer state`);
    if (!(long.axis.need > shape.axis.need))
      fail(`${name} kept a ${long.axis.need} GiB floor at a longer state`);
    if (long.axis.overfull !== (long.axis.need > long.axis.budget + 1e-9))
      fail(`${name} misreads its own floor after the state lever`);
    if (!(long.rows.length < shape.rows.length))
      fail(
        `${name} lists ${long.rows.length} rows at a longer state, not fewer than ${shape.rows.length}`,
      );
    for (const row of long.rows) {
      const was = shape.rows.find((before) => before.id === row.id);
      if (!was) fail(`${name} lists ${row.id}, which it did not price before`);
      if (row.origin !== was.origin)
        fail(`${name} changed a card's origin with a lever`);
      if (row.weights !== was.weights)
        fail(`${name} rescaled a card's published weights with a lever`);
      if (!(row.need > was.need))
        fail(`${name} kept ${row.need} GiB of need at a longer state`);
    }

    // Concurrency is the cache's multiplier for every row: the same state, held
    // for every decision the deployment runs at once.
    const many = await pushLever(page, "decisions", long);
    if (!(many.axis.cache > long.axis.cache))
      fail(`${name} kept a ${many.axis.cache} GiB cache in flight`);
    if (!(many.axis.need > long.axis.need))
      fail(`${name} kept a ${many.axis.need} GiB floor in flight`);
    for (const row of many.rows) {
      const was = long.rows.find((before) => before.id === row.id);
      if (!was) fail(`${name} lists ${row.id}, which it did not price before`);
      if (!(row.need > was.need))
        fail(`${name} kept ${row.need} GiB of need in flight`);
    }
    if (!(many.levers.decisions.value > long.levers.decisions.value))
      fail(`${name} ignored the decisions lever`);
  });
}

async function inspectDecisionModel() {
  for (const width of [1280, 768, 390])
    await inspectDecisionModelViewport({ width, height: 900 });
}

async function inspectResponsiveRoutes(routes) {
  const page = await openContractPage();
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
  await withRetry(() => inspectFitChart(), "inspectFitChart");
  await withRetry(() => inspectFitPlatforms(), "inspectFitPlatforms");
  await withRetry(() => inspectFitRail(), "inspectFitRail");
  await withRetry(() => inspectFitRuntimes(), "inspectFitRuntimes");
  await withRetry(() => inspectFitPin(), "inspectFitPin");
  await withRetry(() => inspectFitRuntimeBands(), "inspectFitRuntimeBands");
  await withRetry(() => inspectFitConversation(), "inspectFitConversation");
  await withRetry(() => inspectFitLayout(), "inspectFitLayout");
  await withRetry(() => inspectFigureSeam(), "inspectFigureSeam");
  await withRetry(() => inspectFigureAnchor(), "inspectFigureAnchor");
  await withRetry(() => inspectDecisionModel(), "inspectDecisionModel");
  await withRetry(() => inspectDecisionRuntimes(), "inspectDecisionRuntimes");
  const responsiveContainers = await inspectResponsiveRoutes(routes);
  if (!responsiveContainers)
    fail("no responsive diagrams found in generated routes");
  console.log(
    `browser regression passed (${routes.length} routes × 2 viewports; ${responsiveContainers} responsive checks; sidebar and mobile drawer contracts verified)`,
  );
}

function retriedContracts() {
  return telemetry.contracts.filter((entry) => entry.attempts > 1);
}

// A retried route sweep records each route once per attempt (inspectRoute's
// finally); collapse to the slowest per route/width so the table names each
// check once. The map size is also the true unique route/viewport count.
function slowestRouteChecks() {
  const slowest = new Map();
  for (const entry of telemetry.routes) {
    const key = `${entry.route} ${entry.width}`;
    if (!slowest.has(key) || entry.ms > slowest.get(key).ms)
      slowest.set(key, entry);
  }
  return slowest;
}

function retrySection(retried) {
  const lines = [
    "",
    "| contract | attempts | time | outcome |",
    "| --- | --- | --- | --- |",
  ];
  for (const entry of retried) {
    // Labels are string literals today, but a future `|` would break the
    // table — escape defensively.
    const label = entry.label.replaceAll("|", "\\|");
    lines.push(
      `| ${label} | ${entry.attempts} | ${(entry.ms / 1000).toFixed(1)}s | ${entry.failed ? "failed" : "passed on retry"} |`,
    );
  }
  // Contract time includes the 400ms x attempt retry backoff sleep.
  return [...lines, "", "*contract time includes retry backoff waits.*"];
}

function slowestSection(slowest) {
  const lines = [
    "",
    "### Slowest route/viewport checks",
    "",
    "| route | width | time |",
    "| --- | --- | --- |",
  ];
  for (const entry of slowest) {
    lines.push(`| ${entry.route} | ${entry.width} | ${entry.ms}ms |`);
  }
  return lines;
}

// Emits the flake signal to the Actions job summary. A missing target (local run)
// or a write error must never mask the test result, so it is best-effort.
function writeStepSummary() {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  try {
    const retried = retriedContracts();
    const slowestByRoute = slowestRouteChecks();
    const slowest = [...slowestByRoute.values()]
      .sort((a, b) => b.ms - a.ms)
      .slice(0, 10);
    const lines = [
      "## Browser contracts",
      "",
      `- result: ${process.exitCode ? "failed" : "passed"}`,
      `- route/viewport checks: ${slowestByRoute.size}`,
      `- contracts retried: ${retried.length}`,
    ];
    if (retried.length) lines.push(...retrySection(retried));
    if (slowest.length) lines.push(...slowestSection(slowest));
    fs.appendFileSync(target, `${lines.join("\n")}\n`);
  } catch (error) {
    console.warn(`[summary] ${error.message}`);
  }
}

async function cleanup() {
  writeStepSummary();
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

// Required by harness tests: only launch the suite when executed directly.
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.stack || error);
      process.exitCode = 1;
    })
    .finally(cleanup);
}

// Test-only surface: harnesses stub page/fs/env and drive these units directly.
module.exports = {
  withRetry,
  waitForHydrated,
  waitForTocSettled,
  writeStepSummary,
  telemetry,
};
