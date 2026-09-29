#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

// Anti-drift guard for the ContextRegions foundation.
//
// The foundation's stylesheet is emitted AFTER every consumer's, so a consumer
// rule that redeclares a foundation-owned property with the same specificity is
// decided by bundle order — it either wins by luck or vanishes silently (that is
// exactly how the sub-agent fanout shipped a stack outside its rails). Consumers
// override through a seam variable, an identical value, or a higher-specificity
// selector — never through a tie.

const root = path.resolve(
  __dirname,
  "..",
  "website",
  "src",
  "components",
  "VisualElements",
);
const foundationCss = fs.readFileSync(
  path.join(root, "ContextRegions.module.css"),
  "utf8",
);

// Element role (ContextRegionScene prop) -> the foundation class that owns its
// property set. A consumer class landing on the same element must not fight it.
const ROLES = {
  className: ".scene",
  stackClassName: ".regionStack",
  companionClassName: ".sceneCompanion",
};
const SEAM = "--context-stack-position";
const SEAM_POSITION = "position";

function blocks(css) {
  const out = [];
  let cursor = 0;
  while (cursor < css.length) {
    const open = css.indexOf("{", cursor);
    if (open === -1) break;
    const prelude = css.slice(cursor, open).trim();
    let depth = 1;
    let end = open + 1;
    while (end < css.length && depth > 0) {
      if (css[end] === "{") depth += 1;
      else if (css[end] === "}") depth -= 1;
      end += 1;
    }
    out.push({ prelude, body: css.slice(open + 1, end - 1) });
    cursor = end;
  }
  return out;
}

function declarationsOf(body) {
  return body
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const separator = entry.indexOf(":");
      return {
        property: entry.slice(0, separator).trim(),
        value: entry.slice(separator + 1).trim(),
      };
    })
    .filter((declaration) => declaration.property.length > 0);
}

// Comments carry prose (and pseudo-declarations) that would otherwise be read as
// declarations, so they leave before any parsing happens.
function collectRules(css, nested = false, out = []) {
  for (const { prelude, body } of blocks(
    css.replace(/\/\*[\s\S]*?\*\//g, " "),
  )) {
    if (prelude.startsWith("@")) collectRules(body, true, out);
    else
      out.push({
        selectors: prelude.split(",").map((selector) => selector.trim()),
        declarations: declarationsOf(body),
        nested,
      });
  }
  return out;
}

function specificity(selector) {
  const ids = selector.match(/#[\w-]+/g) ?? [];
  const classes = selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? [];
  const bare = selector
    .replace(/\.[\w-]+/g, " ")
    .replace(/#[\w-]+/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/::?[\w-]+/g, " ");
  const elements = bare.match(/[a-zA-Z][\w-]*/g) ?? [];
  return ids.length * 10000 + classes.length * 100 + elements.length;
}

const referencesClass = (selector, className) =>
  new RegExp(`\\.${className}(?![\\w-])`).test(selector);

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}

function propertiesOf(rules, className) {
  const properties = new Map();
  for (const rule of rules) {
    for (const selector of rule.selectors) {
      if (!referencesClass(selector, className)) continue;
      for (const { property, value } of rule.declarations) {
        properties.set(property, { value, specificity: specificity(selector) });
      }
    }
  }
  return properties;
}

function rulesOfClass(rules, className) {
  return rules.filter((rule) =>
    rule.selectors.some((selector) => referencesClass(selector, className)),
  );
}

function specificityOf(rule, className) {
  return Math.max(
    ...rule.selectors
      .filter((selector) => referencesClass(selector, className))
      .map(specificity),
  );
}

// Same specificity + different value = bundle order decides = silent drift.
function overrideFailures(component, role, className, consumerRules, owned) {
  const failures = [];
  for (const rule of rulesOfClass(consumerRules, className)) {
    const ruleSpecificity = specificityOf(rule, className);
    for (const { property, value } of rule.declarations) {
      const base = owned.get(property);
      if (!base || normalize(base.value) === normalize(value)) continue;
      if (ruleSpecificity > base.specificity) continue;
      failures.push(
        `${component}: ${role} class .${className} redeclares ${property}: ${value} ` +
          `against the foundation's ${property}: ${base.value} at equal specificity ` +
          `(bundle order would decide${rule.nested ? ", inside a media query" : ""})`,
      );
    }
  }
  return failures;
}

function seamFailures(component, className, consumerRules) {
  const declaresAbsolute = rulesOfClass(consumerRules, className).some((rule) =>
    rule.declarations.some(
      (declaration) =>
        declaration.property === SEAM &&
        normalize(declaration.value) === "absolute",
    ),
  );
  if (!declaresAbsolute) return [];
  const declaresInset = rulesOfClass(consumerRules, className).some((rule) =>
    rule.declarations.some((declaration) => declaration.property === "inset"),
  );
  return declaresInset
    ? []
    : [`${component}: .${className} sets ${SEAM}: absolute without an inset`];
}

function consumerComponents() {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
    .map((entry) => entry.name.replace(/\.tsx$/, ""))
    .filter((name) => name !== "ContextRegions")
    .filter((name) =>
      fs
        .readFileSync(path.join(root, `${name}.tsx`), "utf8")
        .includes("ContextRegionScene"),
    );
}

function elementSource(source, start) {
  let depth = 0;
  for (let index = start; index < source.length - 1; index += 1) {
    const char = source[index];
    if ("{([".includes(char)) depth += 1;
    else if ("})]".includes(char)) depth -= 1;
    else if (char === "/" && source[index + 1] === ">" && depth === 0)
      return source.slice(start, index + 2);
  }
  return source.slice(start);
}

// The text between a prop's opening brace and its matching close. A depth counter
// keeps template-literal interpolations (${...}) and nested braces intact, which a
// single regex cannot — truncating at the first `}` dropped every class after it.
function braceBody(element, open) {
  let depth = 0;
  for (let index = open; index < element.length; index += 1) {
    const char = element[index];
    if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0)
      return element.slice(open + 1, index);
  }
  return element.slice(open + 1);
}

// Every <ContextRegionScene> usage with the classes it hands to each element role.
// A prop can compose several classes (string concat, template literals), so each
// role resolves to an array — auditing only the first would miss the rest.
function sceneUsages(source) {
  const usages = [];
  let cursor = 0;
  while ((cursor = source.indexOf("<ContextRegionScene", cursor)) !== -1) {
    const element = elementSource(source, cursor);
    const classes = {};
    for (const match of element.matchAll(
      /\b(className|stackClassName|companionClassName)=\{/g,
    )) {
      const names = [
        ...braceBody(element, match.index + match[0].length - 1).matchAll(
          /styles\.([\w$]+)/g,
        ),
      ].map((hit) => hit[1]);
      if (names.length) classes[match[1]] = names;
    }
    usages.push(classes);
    cursor += element.length;
  }
  return usages;
}

function main() {
  const failures = [];
  if (!foundationCss.includes(SEAM))
    failures.push(`foundation lost the ${SEAM} seam`);

  const foundationRules = collectRules(foundationCss);
  const components = consumerComponents();
  for (const component of components) {
    const cssPath = path.join(root, `${component}.module.css`);
    if (!fs.existsSync(cssPath)) {
      failures.push(
        `${component}: missing paired stylesheet ${component}.module.css`,
      );
      continue;
    }
    const consumerRules = collectRules(fs.readFileSync(cssPath, "utf8"));
    for (const usage of sceneUsages(
      fs.readFileSync(path.join(root, `${component}.tsx`), "utf8"),
    )) {
      for (const [role, foundationClass] of Object.entries(ROLES)) {
        for (const className of usage[role] ?? [])
          failures.push(
            ...overrideFailures(
              component,
              role,
              className,
              consumerRules,
              propertiesOf(foundationRules, foundationClass.slice(1)),
            ),
          );
      }
      for (const className of usage.stackClassName ?? [])
        failures.push(...seamFailures(component, className, consumerRules));
    }
  }

  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      `context region consumer audit passed (${components.length} consumers)`,
    );
    console.log(components.map((name) => `- ${name}`).join("\n"));
  }
}

// Importable so the contract tests can exercise the pure checks directly;
// the filesystem audit only runs as a CLI entry point.
if (require.main === module) main();

module.exports = {
  SEAM,
  collectRules,
  specificity,
  propertiesOf,
  overrideFailures,
  seamFailures,
  sceneUsages,
};
