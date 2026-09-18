const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'website', 'src', 'components', 'VisualElements');

// Self-maintaining: any component that opts into ResponsiveDiagram joins the
// audit, so a new paired diagram can never ship unlisted.
const names = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.tsx'))
  .map((entry) => entry.name.replace(/\.tsx$/, ''))
  .filter((name) => name !== 'ResponsiveDiagram')
  .filter((name) =>
    fs.readFileSync(path.join(root, `${name}.tsx`), 'utf8').includes('ResponsiveDiagram')
  );

const variantSelector =
  /\.(?:desktopDiagram|mobileDiagram|desktop|mobile|operatorDesktop|operatorMobile|validationDesktop|validationMobile|desktopChart|mobileChart)\b/;
const failures = [];

for (const name of names) {
  const cssPath = path.join(root, `${name}.module.css`);
  if (!fs.existsSync(cssPath)) {
    failures.push(`${name}: missing paired stylesheet ${name}.module.css`);
    continue;
  }
  const css = fs.readFileSync(cssPath, 'utf8');

  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1];
    const declarations = match[2];
    if (variantSelector.test(selector) && /\bdisplay\s*:/.test(declarations)) {
      failures.push(`${name}.module.css: variant selector owns display (${selector.trim()})`);
    }
    if (/^\s*\.diagram\s*$/.test(selector) && /\bdisplay\s*:/.test(declarations)) {
      failures.push(`${name}.module.css: generic diagram selector owns display`);
    }
  }
}

const sharedCss = fs.readFileSync(
  path.join(root, 'ResponsiveDiagram.module.css'),
  'utf8'
);
for (const required of [
  '.container[data-responsive-breakpoint=',
  '.desktopVariant',
  '.mobileVariant',
  'data-responsive-mode',
]) {
  if (!sharedCss.includes(required)) failures.push(`shared contract missing ${required}`);
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`responsive diagram audit passed (${names.length} paired diagrams)`);
  console.log(names.map((name) => `- ${name}`).join('\n'));
}
