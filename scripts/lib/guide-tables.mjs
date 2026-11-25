/**
 * Markdown table readers shared by the data extractors.
 *
 * WHY: two guides publish their facts as pipe tables, and one reader per table
 * shape means a quoting or separator rule cannot drift between them. Each
 * extractor keeps its own `fail`, so a message still names the script that
 * refused the row.
 */

/** Splits a pipe row into trimmed cells, without its outer walls. */
export const cells = (line) =>
  line
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

export const isSeparator = (line) =>
  /^\|[\s\-:|]+\|$/.test((line ?? "").trim());

export function guideTables(md, fail) {
  const lines = md.split("\n");

  // Link definitions live once per document, so a row may cite a reference.
  const refs = new Map();
  for (const line of lines) {
    const definition = /^\[([^\]]+)\]:\s*(\S+)\s*$/.exec(line);
    if (definition) refs.set(definition[1], definition[2]);
  }

  const firstUrl = (cell) => {
    const inline = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/.exec(cell);
    if (inline) return inline[1];
    const reference = /\[[^\]]*\]\[([^\]]+)\]/.exec(cell);
    if (reference) return refs.get(reference[1]) ?? null;
    const bare = /(https?:\/\/\S+?)(?:\s|$)/.exec(cell);
    return bare ? bare[1] : null;
  };

  const plain = (cell) =>
    cell
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\[[^\]]*\]/g, "$1")
      .replace(/\*\*/g, "")
      .trim();

  /**
   * The rows of the first table under a heading. A second table under the same
   * heading is not read: the section's own table is the one the extractor wants.
   */
  function tableRowsUnder(heading) {
    const start = lines.findIndex((line) => line.trim() === heading);
    if (start < 0) fail(`missing section "${heading}"`);
    const rows = [];
    for (let i = start + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^#{2,4} /.test(line) || line.trim() === "---") break;
      if (!line.startsWith("|") || isSeparator(line)) continue;
      // A pipe row followed by a separator is a header: the section's own when
      // no facts are read yet, a second table's once there are.
      if (isSeparator(lines[i + 1])) {
        if (rows.length) break;
        continue;
      }
      rows.push(cells(line));
    }
    if (!rows.length) fail(`no rows under "${heading}"`);
    return rows;
  }

  return { lines, refs, cells, plain, firstUrl, isSeparator, tableRowsUnder };
}
