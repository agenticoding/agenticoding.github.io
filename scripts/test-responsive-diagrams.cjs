const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");

const puppeteer = require(
  path.resolve(__dirname, "..", "website", "node_modules", "puppeteer"),
);

const websiteDir = path.resolve(__dirname, "..", "website");
const tempRoot = fs.mkdtempSync(
  path.join(os.tmpdir(), "agenticoding-responsive-diagrams-"),
);
const buildDir = path.join(tempRoot, "build");
const docusaurusCache = path.join(websiteDir, ".docusaurus");
const hadDocusaurusCache = fs.existsSync(docusaurusCache);

let server;
let browser;

function fail(message) {
  throw new Error(message);
}

function runBuild() {
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

function serveArgs(port) {
  return [
    "run",
    "serve",
    "--",
    "--dir",
    buildDir,
    "--port",
    String(port),
    "--host",
    "127.0.0.1",
    "--no-open",
  ];
}

function startServer(port) {
  const output = [];
  server = spawn("npm", serveArgs(port), {
    cwd: websiteDir,
    stdio: ["ignore", "pipe", "pipe"],
  });
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

async function main() {
  runBuild();
  const routes = routesFromSitemap();
  const port = await reservePort();
  startServer(port);
  await waitForServer(port);

  browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const responsiveContainers = await inspectRoutes(page, routes);
  if (!responsiveContainers)
    fail("no responsive diagrams found in generated routes");
  console.log(
    `responsive diagram browser regression passed (${routes.length} routes × 2 viewports; ${responsiveContainers} checks)`,
  );
}

async function cleanup() {
  if (browser) await browser.close().catch(() => {});
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("close", resolve));
  }
  fs.rmSync(tempRoot, { recursive: true, force: true });
  if (!hadDocusaurusCache) {
    fs.rmSync(docusaurusCache, { recursive: true, force: true });
  }
}

main()
  .catch((error) => {
    console.error(error.stack || error);
    process.exitCode = 1;
  })
  .finally(cleanup);
