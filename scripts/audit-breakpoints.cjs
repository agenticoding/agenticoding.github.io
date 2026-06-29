#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'website', 'src');
const breakpointPattern = /@(media|container)[^{]*(?:min|max)-width\s*:\s*([0-9.]+)(px|rem|em)[^{]*\{/g;

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath);
    if (/\.(css|ts|tsx)$/.test(entry.name)) return [fullPath];
    return [];
  });
}

function lineFor(source, index) {
  return source.slice(0, index).split('\n').length;
}

const rows = [];
for (const file of walk(root)) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(breakpointPattern)) {
    rows.push({
      file: path.relative(process.cwd(), file),
      line: lineFor(source, match.index),
      rule: match[0].replace(/\s+/g, ' ').trim(),
      value: `${match[2]}${match[3]}`,
    });
  }
}

rows.sort((a, b) => a.value.localeCompare(b.value, undefined, {numeric: true}) || a.file.localeCompare(b.file));

for (const row of rows) {
  console.log(`${row.value.padEnd(7)} ${row.file}:${row.line} ${row.rule}`);
}

console.log(`\n${rows.length} breakpoint rules found.`);
