/**
 * Shared Markdown Parser Library
 *
 * Used by both podcast and presentation generation scripts to parse MDX content
 * and describe code blocks in a pedagogically meaningful way.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');

/**
 * Analyze code block context and generate appropriate description
 * @param {string} codeBlock - The code block with ``` delimiters
 * @param {string} precedingContext - Text before the code block
 * @param {string} followingContext - Text after the code block
 * @returns {string} Natural language description of the code
 */
export function describeCodeBlock(codeBlock, precedingContext, followingContext) {
  // Extract language and code content
  const langMatch = codeBlock.match(/```(\w+)?\n([\s\S]*?)```/);
  const language = langMatch?.[1] || '';
  const code = langMatch?.[2]?.trim() || '';

  if (!code) {
    return '[Code example]';
  }

  // Focus on immediate context
  const immediatePreContext = precedingContext.substring(Math.max(0, precedingContext.length - 100));
  const immediatePostContext = followingContext.substring(0, 100);

  // Detect code block type
  const fullContext = (precedingContext + ' ' + followingContext).toLowerCase();
  const immediateContext = (immediatePreContext + ' ' + immediatePostContext).toLowerCase();

  // Type detection
  if (immediateContext.includes('**ineffective:**') || immediateContext.includes('**risky:**') ||
      immediateContext.includes('**bad:**') || immediateContext.includes('**wrong:**')) {
    return `[INEFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (immediateContext.includes('**effective:**') || immediateContext.includes('**better:**') ||
      immediateContext.includes('**good:**') || immediateContext.includes('**correct:**')) {
    return `[EFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (fullContext.includes('❌') && !immediateContext.includes('✅')) {
    return `[INEFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (fullContext.includes('✅') && !immediateContext.includes('❌')) {
    return `[EFFECTIVE CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
  }

  if (fullContext.includes('pattern') || fullContext.includes('structure') ||
      immediateContext.includes('example') || fullContext.includes('template')) {
    return `[CODE PATTERN: ${extractCodeSummary(code, language)}]`;
  }

  return `[CODE EXAMPLE: ${extractCodeSummary(code, language)}]`;
}

/**
 * Extract a concise summary of what the code does/shows
 * @param {string} code - The code content
 * @param {string} language - Programming language
 * @returns {string} Human-readable summary
 */
export function extractCodeSummary(code, language) {
  const lines = code.split('\n').filter(l => l.trim());

  // Detect function definitions
  const functionMatch = code.match(/(?:^|\n)\s*(?:export\s+)?(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function)/m);
  if (functionMatch) {
    const funcName = functionMatch[1] || functionMatch[2] || functionMatch[3];
    if (funcName && funcName.length >= 3 && /^[a-zA-Z]/.test(funcName)) {
      const params = code.match(/\(([^)]*)\)/)?.[1] || '';
      const paramCount = params.trim() ? params.split(',').length : 0;
      const hasReturn = code.includes('return');
      return `Function '${funcName}'${paramCount > 0 ? ` with ${paramCount} parameter${paramCount > 1 ? 's' : ''}` : ''}${hasReturn ? ' that returns a value' : ''}`;
    }
  }

  // Detect type/interface definitions
  if (code.includes('interface') || code.includes('type')) {
    const typeMatch = code.match(/(?:interface|type)\s+(\w+)/);
    if (typeMatch) {
      return `Type definition '${typeMatch[1]}'`;
    }
  }

  // Detect class definitions
  if (code.includes('class')) {
    const classMatch = code.match(/class\s+(\w+)/);
    if (classMatch) {
      return `Class '${classMatch[1]}'`;
    }
  }

  // Detect imports
  if (code.includes('import') || code.includes('require')) {
    return 'Import statements for dependencies';
  }

  // Detect configuration/object
  if (code.trim().startsWith('{') || code.includes('config') || code.includes('options')) {
    return 'Configuration object with properties';
  }

  // Detect command-line/shell
  if (language === 'bash' || language === 'sh' || code.includes('$') || code.includes('npm') || code.includes('git')) {
    const commands = lines.filter(l => !l.startsWith('#')).length;
    return `Shell command${commands > 1 ? 's' : ''} (${commands} line${commands > 1 ? 's' : ''})`;
  }

  // Default: describe by line count and language
  const lineCount = lines.length;
  return `${language || 'Code'} snippet (${lineCount} line${lineCount > 1 ? 's' : ''})`;
}

/**
 * Extract MDX import statements and build a component-to-path map
 * @param {string} content - Raw MDX file content
 * @returns {Object} Map of { ComponentName: importPath }
 */
function extractMdxImports(content) {
  const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const imports = {};
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports[match[1]] = match[2];
  }
  return imports;
}

/**
 * Resolve @site import paths to filesystem paths
 * @param {string} importPath - Import path (e.g., '@site/shared-prompts/_file.mdx')
 * @returns {string} Resolved filesystem path
 */
function resolveImportPath(importPath) {
  // Remove escape characters (MDX escapes underscores as \_)
  let cleaned = importPath.replace(/\\/g, '');

  if (cleaned.startsWith('@site/')) {
    return join(PROJECT_ROOT, 'website', cleaned.replace('@site/', ''));
  }
  return cleaned;
}

/**
 * Classify a component by its import source
 * @param {string} componentName - Name of the component
 * @param {Object} imports - Map of component names to import paths
 * @returns {'visual'|'shared-prompt'|'unknown'} Component classification
 */
function classifyComponent(componentName, imports) {
  const importPath = imports[componentName];
  if (!importPath) return 'unknown';

  if (importPath.includes('shared-prompts/')) return 'shared-prompt';
  if (importPath.includes('VisualElements/')) return 'visual';

  return 'unknown';
}

/**
 * Read and parse shared-prompt MDX content for inlining
 * @param {string} importPath - The @site import path
 * @param {string} mode - Rendering mode
 * @param {boolean} preserveCode - Whether to preserve code blocks
 * @returns {string} Parsed content ready for inlining
 */
function inlineSharedPrompt(importPath, mode, preserveCode) {
  const resolvedPath = resolveImportPath(importPath);

  if (!existsSync(resolvedPath)) {
    return `[SHARED_PROMPT: File not found - ${importPath}]`;
  }

  const content = readFileSync(resolvedPath, 'utf-8');

  // Remove frontmatter if present
  let cleaned = content.replace(/^---[\s\S]*?---\n/, '');

  // Remove any imports (shared prompts shouldn't have nested imports)
  cleaned = cleaned.replace(/^import\s+.*$/gm, '');

  // Process code blocks based on preserveCode flag
  if (!preserveCode) {
    // Find and describe code blocks
    const codeBlocks = [];
    const regex = /```[\s\S]*?```/g;
    let match;

    while ((match = regex.exec(cleaned)) !== null) {
      const precedingStart = Math.max(0, match.index - 200);
      const precedingContext = cleaned.substring(precedingStart, match.index);
      const followingEnd = Math.min(cleaned.length, match.index + match[0].length + 200);
      const followingContext = cleaned.substring(match.index + match[0].length, followingEnd);

      codeBlocks.push({
        original: match[0],
        index: match.index,
        precedingContext,
        followingContext
      });
    }

    let offset = 0;
    for (const block of codeBlocks) {
      const description = describeCodeBlock(block.original, block.precedingContext, block.followingContext);
      const adjustedIndex = block.index + offset;
      cleaned = cleaned.substring(0, adjustedIndex) +
                description +
                cleaned.substring(adjustedIndex + block.original.length);
      offset += description.length - block.original.length;
    }
  }

  // Clean up markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Parse MDX/MD file and extract clean text content
 * @param {string} filePath - Path to MDX/MD file
 * @param {string} mode - Rendering mode: 'doc' (default) or 'presentation'
 * @param {boolean} preserveCode - If true, keeps code blocks intact instead of converting to descriptions
 * @returns {string} Cleaned text content with code blocks described (or preserved if preserveCode=true)
 */
export function parseMarkdownContent(filePath, mode = 'doc', preserveCode = false) {
  const content = readFileSync(filePath, 'utf-8');

  // Extract MDX imports BEFORE any processing (needed for component classification)
  const imports = extractMdxImports(content);

  // Remove frontmatter
  let cleaned = content.replace(/^---[\s\S]*?---\n/, '');

  // Remove import statements (they're not content)
  cleaned = cleaned.replace(/^import\s+.*$/gm, '');

  // Process React components based on their import source
  // - Visual components (from VisualElements/) → [VISUAL_COMPONENT: X]
  // - Shared prompts (from shared-prompts/) → inline content
  // - Unknown → remove silently
  cleaned = cleaned.replace(/<([A-Z][a-zA-Z]*)\s*\/>/g, (match, componentName) => {
    const classification = classifyComponent(componentName, imports);

    switch (classification) {
      case 'visual':
        return `[VISUAL_COMPONENT: ${componentName}]`;
      case 'shared-prompt':
        return inlineSharedPrompt(imports[componentName], mode, preserveCode);
      default:
        // Unknown component - remove silently (likely layout/UI)
        return '';
    }
  });

  // Process conditional blocks based on mode
  if (mode === 'presentation') {
    // Strip doc-only blocks
    cleaned = cleaned.replace(/<!--\s*doc-only-start\s*-->[\s\S]*?<!--\s*doc-only-end\s*-->/g, '');
    // Preserve presentation-only blocks (but remove markers)
    cleaned = cleaned.replace(/<!--\s*presentation-only-start\s*-->\n?/g, '');
    cleaned = cleaned.replace(/\n?<!--\s*presentation-only-end\s*-->/g, '');
  } else {
    // Strip presentation-only blocks
    cleaned = cleaned.replace(/<!--\s*presentation-only-start\s*-->[\s\S]*?<!--\s*presentation-only-end\s*-->/g, '');
    // Preserve doc-only blocks (but remove markers)
    cleaned = cleaned.replace(/<!--\s*doc-only-start\s*-->\n?/g, '');
    cleaned = cleaned.replace(/\n?<!--\s*doc-only-end\s*-->/g, '');
  }

  // Remove remaining HTML tags (lowercase = HTML elements)
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Code block processing: preserve or describe based on mode
  if (!preserveCode) {
    // First pass: Find all code blocks and their contexts
    const codeBlocks = [];
    const regex = /```[\s\S]*?```/g;
    let match;

    while ((match = regex.exec(cleaned)) !== null) {
      const precedingStart = Math.max(0, match.index - 200);
      const precedingContext = cleaned.substring(precedingStart, match.index);

      const followingEnd = Math.min(cleaned.length, match.index + match[0].length + 200);
      const followingContext = cleaned.substring(match.index + match[0].length, followingEnd);

      codeBlocks.push({
        original: match[0],
        index: match.index,
        precedingContext,
        followingContext
      });
    }

    // Second pass: Replace code blocks with descriptions
    let offset = 0;
    for (const block of codeBlocks) {
      const description = describeCodeBlock(block.original, block.precedingContext, block.followingContext);
      const adjustedIndex = block.index + offset;

      cleaned = cleaned.substring(0, adjustedIndex) +
                description +
                cleaned.substring(adjustedIndex + block.original.length);

      offset += description.length - block.original.length;
    }

    // Remove inline code (only when converting code blocks to descriptions)
    cleaned = cleaned.replace(/`[^`]+`/g, (match) => match.replace(/`/g, ''));
  }

  // Remove images
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '[Image]');

  // Clean up markdown links but keep text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');

  // Tag admonition boxes
  cleaned = cleaned.replace(/:::(tip|warning|info|note|caution)\s*(?:\[([^\]]*)\])?\s*/gi, (match, type, title) => {
    return `\n[PEDAGOGICAL ${type.toUpperCase()}: ${title || 'Note'}]\n`;
  });
  cleaned = cleaned.replace(/^:::$/gm, '\n[END NOTE]\n');

  // Clean up excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}
