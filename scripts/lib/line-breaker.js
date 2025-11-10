/**
 * Deterministic Line Breaking for Presentation Code Blocks
 *
 * This module provides language-aware line breaking to ensure all code blocks
 * in presentations fit within the 60-character limit for readability.
 *
 * Strategy:
 * - Target line length: 50-55 chars (optimal readability)
 * - Maximum line length: 60 chars (hard limit)
 * - Language-specific break points (prioritized)
 * - Preserve semantic meaning (no mid-word breaks)
 */

const MAX_LINE_LENGTH = 60;
const TARGET_LINE_LENGTH = 50;
const INDENT = '  '; // 2 spaces for wrapped lines

/**
 * Language-specific break patterns with priorities
 * Higher priority = preferred break points
 */
const BREAK_PATTERNS = {
  text: [
    // Sentence boundaries (highest priority for readability)
    { regex: /\.\s+(?=[A-Z])/g, priority: 10, preserveDelimiter: true, description: 'Sentence boundary' },
    // After colons that introduce content
    { regex: /:\s+/g, priority: 9, preserveDelimiter: false, description: 'After colon' },
    // After conjunctions with commas
    { regex: /,\s+(?:and|or|but)\s+/g, priority: 8, preserveDelimiter: false, description: 'Conjunction' },
    // After commas
    { regex: /,\s+/g, priority: 7, preserveDelimiter: false, description: 'After comma' },
    // Before bullet points
    { regex: /\s+-\s+/g, priority: 6, preserveDelimiter: true, description: 'Before bullet' },
    // After "that", "which", "where" (natural pauses)
    { regex: /(?:that|which|where)\s+/g, priority: 5, preserveDelimiter: false, description: 'Relative clause' },
    // At any space (fallback)
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, description: 'Whitespace' },
  ],

  markdown: [
    // After headers
    { regex: /#\s+[^\n]+\n/g, priority: 10, preserveDelimiter: true, description: 'After header' },
    // After bullet points
    { regex: /\n[-*]\s+/g, priority: 9, preserveDelimiter: true, description: 'After bullet' },
    // After sentences
    { regex: /\.\s+/g, priority: 8, preserveDelimiter: false, description: 'After sentence' },
    // After commas
    { regex: /,\s+/g, priority: 5, preserveDelimiter: false, description: 'After comma' },
    // At spaces
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, description: 'Whitespace' },
  ],

  bash: [
    // After pipes (preserve pipe, break before next command)
    { regex: /\|\s+/g, priority: 10, preserveDelimiter: false, addContinuation: true, description: 'After pipe' },
    // After logical operators
    { regex: /&&\s+/g, priority: 9, preserveDelimiter: false, addContinuation: true, description: 'After AND' },
    { regex: /\|\|\s+/g, priority: 9, preserveDelimiter: false, addContinuation: true, description: 'After OR' },
    // After semicolons
    { regex: /;\s*/g, priority: 8, preserveDelimiter: false, description: 'After semicolon' },
    // After flags
    { regex: /\s+--?[a-zA-Z-]+(?:\s+|=)/g, priority: 7, preserveDelimiter: false, addContinuation: true, description: 'After flag' },
    // At spaces
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, addContinuation: true, description: 'Whitespace' },
  ],

  typescript: [
    // Method chains
    { regex: /\./g, priority: 10, preserveDelimiter: true, description: 'Method chain' },
    // After commas in parameter lists
    { regex: /,\s+/g, priority: 9, preserveDelimiter: false, description: 'After comma' },
    // After logical operators
    { regex: /\s+(?:&&|\|\|)\s+/g, priority: 8, preserveDelimiter: false, description: 'Logical operator' },
    // After assignment operators
    { regex: /\s*=\s*/g, priority: 7, preserveDelimiter: false, description: 'Assignment' },
    // After opening braces/parens
    { regex: /[({]\s*/g, priority: 6, preserveDelimiter: true, description: 'After opening' },
    // At spaces
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, description: 'Whitespace' },
  ],

  javascript: [
    // Same as TypeScript
    { regex: /\./g, priority: 10, preserveDelimiter: true, description: 'Method chain' },
    { regex: /,\s+/g, priority: 9, preserveDelimiter: false, description: 'After comma' },
    { regex: /\s+(?:&&|\|\|)\s+/g, priority: 8, preserveDelimiter: false, description: 'Logical operator' },
    { regex: /\s*=\s*/g, priority: 7, preserveDelimiter: false, description: 'Assignment' },
    { regex: /[({]\s*/g, priority: 6, preserveDelimiter: true, description: 'After opening' },
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, description: 'Whitespace' },
  ],

  json: [
    // After commas in objects/arrays
    { regex: /,\s*/g, priority: 10, preserveDelimiter: false, description: 'After comma' },
    // After colons
    { regex: /:\s*/g, priority: 9, preserveDelimiter: false, description: 'After colon' },
    // After opening braces/brackets
    { regex: /[{[]\s*/g, priority: 8, preserveDelimiter: true, description: 'After opening' },
    // At spaces
    { regex: /\s+/g, priority: 1, preserveDelimiter: false, description: 'Whitespace' },
  ],
};

// Fallback for unknown languages
const DEFAULT_PATTERNS = BREAK_PATTERNS.text;

/**
 * Find all potential break points in a line
 * @param {string} line - The line to analyze
 * @param {Array} patterns - Language-specific break patterns
 * @param {number} maxLength - Maximum allowed length
 * @returns {Array} Array of {index, priority, pattern} objects
 */
function findBreakPoints(line, patterns, maxLength) {
  const breakPoints = [];

  for (const pattern of patterns) {
    const regex = new RegExp(pattern.regex);
    let match;

    while ((match = regex.exec(line)) !== null) {
      // Always break after the delimiter to keep it with preceding text
      const index = match.index + match[0].length;

      // Only consider break points within the acceptable range
      if (index > 0 && index <= maxLength) {
        breakPoints.push({
          index,
          priority: pattern.priority,
          pattern: pattern.description,
          addContinuation: pattern.addContinuation || false,
        });
      }
    }
  }

  // Sort by priority (descending), then by distance to target (ascending)
  return breakPoints.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Higher priority first
    }
    // Among same priority, prefer closest to target
    const aDist = Math.abs(a.index - TARGET_LINE_LENGTH);
    const bDist = Math.abs(b.index - TARGET_LINE_LENGTH);
    return aDist - bDist;
  });
}

/**
 * Break a single long line into multiple lines
 * @param {string} line - The line to break
 * @param {string} language - Programming/markup language
 * @returns {string} Line with \n breaks inserted
 */
function breakLongLine(line, language = 'text') {
  // If line is already short enough, return as-is
  if (line.length <= MAX_LINE_LENGTH) {
    return line;
  }

  const patterns = BREAK_PATTERNS[language] || DEFAULT_PATTERNS;
  const lines = [];
  let remaining = line;
  let isFirstLine = true;

  while (remaining.length > MAX_LINE_LENGTH) {
    const breakPoints = findBreakPoints(remaining, patterns, MAX_LINE_LENGTH);

    if (breakPoints.length === 0) {
      // No good break point found - force break at last space before max
      const lastSpace = remaining.lastIndexOf(' ', MAX_LINE_LENGTH);
      if (lastSpace > 0) {
        lines.push(isFirstLine ? remaining.substring(0, lastSpace) : INDENT + remaining.substring(0, lastSpace));
        remaining = remaining.substring(lastSpace + 1).trim();
      } else {
        // No space at all - hard break (shouldn't happen with our patterns, but safety)
        lines.push(isFirstLine ? remaining.substring(0, MAX_LINE_LENGTH) : INDENT + remaining.substring(0, MAX_LINE_LENGTH));
        remaining = remaining.substring(MAX_LINE_LENGTH);
      }
    } else {
      // Use the best break point
      const breakPoint = breakPoints[0];
      const head = remaining.substring(0, breakPoint.index).trimEnd();
      let tail = remaining.substring(breakPoint.index).trimStart();

      // Add line continuation for bash if needed
      if (breakPoint.addContinuation && language === 'bash') {
        lines.push(isFirstLine ? head + ' \\' : INDENT + head + ' \\');
      } else {
        lines.push(isFirstLine ? head : INDENT + head);
      }

      remaining = tail;
    }

    isFirstLine = false;
  }

  // Add remaining text (indented if not first line)
  if (remaining.length > 0) {
    lines.push(isFirstLine ? remaining : INDENT + remaining);
  }

  return lines.join('\n');
}

/**
 * Process all lines in a code block
 * @param {string} code - Multi-line code string (with \n)
 * @param {string} language - Programming/markup language
 * @returns {string} Processed code with line breaks
 */
function processCodeBlock(code, language = 'text') {
  if (!code || typeof code !== 'string') {
    return code;
  }

  const lines = code.split('\n');
  const processedLines = lines.map(line => breakLongLine(line, language));

  return processedLines.join('\n');
}

/**
 * Recursively process all code blocks in a presentation JSON
 * @param {Object} presentation - Presentation JSON object
 * @returns {Object} Modified presentation with broken lines
 */
function processPresentation(presentation) {
  if (!presentation || !presentation.slides) {
    return presentation;
  }

  let linesProcessed = 0;
  let linesShortened = 0;
  let maxReduction = 0;

  // Process each slide
  for (const slide of presentation.slides) {
    // Process code slides
    if (slide.type === 'code' && slide.code) {
      const originalLines = slide.code.split('\n');
      const language = slide.language || 'text';
      slide.code = processCodeBlock(slide.code, language);

      const newLines = slide.code.split('\n');
      linesProcessed += originalLines.length;

      // Check for improvements
      for (let i = 0; i < originalLines.length; i++) {
        if (originalLines[i].length > MAX_LINE_LENGTH) {
          linesShortened++;
          maxReduction = Math.max(maxReduction, originalLines[i].length - MAX_LINE_LENGTH);
        }
      }
    }

    // Process codeComparison slides
    if (slide.type === 'codeComparison') {
      const language = slide.leftCode?.language || slide.rightCode?.language || 'text';

      if (slide.leftCode && slide.leftCode.code) {
        const originalLines = slide.leftCode.code.split('\n');
        slide.leftCode.code = processCodeBlock(slide.leftCode.code, language);
        linesProcessed += originalLines.length;

        for (const line of originalLines) {
          if (line.length > MAX_LINE_LENGTH) {
            linesShortened++;
            maxReduction = Math.max(maxReduction, line.length - MAX_LINE_LENGTH);
          }
        }
      }

      if (slide.rightCode && slide.rightCode.code) {
        const originalLines = slide.rightCode.code.split('\n');
        slide.rightCode.code = processCodeBlock(slide.rightCode.code, language);
        linesProcessed += originalLines.length;

        for (const line of originalLines) {
          if (line.length > MAX_LINE_LENGTH) {
            linesShortened++;
            maxReduction = Math.max(maxReduction, line.length - MAX_LINE_LENGTH);
          }
        }
      }
    }

    // Process codeExecution slides (steps with .line field)
    if (slide.type === 'codeExecution' && Array.isArray(slide.steps)) {
      for (const step of slide.steps) {
        if (step.line && typeof step.line === 'string') {
          const originalLength = step.line.length;
          step.line = processCodeBlock(step.line, 'text');
          linesProcessed++;

          if (originalLength > MAX_LINE_LENGTH) {
            linesShortened++;
            maxReduction = Math.max(maxReduction, originalLength - MAX_LINE_LENGTH);
          }
        }
      }
    }
  }

  return {
    presentation,
    stats: {
      linesProcessed,
      linesShortened,
      maxReduction: maxReduction > 0 ? maxReduction : 0,
    },
  };
}

export {
  processPresentation,
  processCodeBlock,
  breakLongLine,
  MAX_LINE_LENGTH,
  TARGET_LINE_LENGTH,
};
