#!/usr/bin/env node

/**
 * Presentation Generation Script
 *
 * Generates presentation slides from MDX course content using AI:
 * 1. Parses MDX lesson content
 * 2. Uses Claude Code CLI (Opus 4.5) to condense into presentation slides
 * 3. Generates structured JSON with slides, speaker notes, and metadata
 *
 * Modes:
 * - Default: Interactive file selection → generate presentation
 * - --all: Batch process all files
 * - --file <path>: Process specific file
 * - --module <name>: Process all files in module directory
 * - --debug: Save prompt for validation
 *
 * Usage:
 *   node scripts/generate-presentation.js                 # Interactive
 *   node scripts/generate-presentation.js --all           # Batch: all files
 *   node scripts/generate-presentation.js --file intro.md # Specific file
 */

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  statSync,
  existsSync,
  unlinkSync,
} from "fs";
import { join, relative, dirname, basename, extname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import * as readline from "readline";
import { parseMarkdownContent } from "./lib/markdown-parser.js";

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DOCS_DIR = join(__dirname, "../website/docs");
const OUTPUT_DIR = join(__dirname, "output/presentations");
const STATIC_OUTPUT_DIR = join(__dirname, "../website/static/presentations");
const MANIFEST_PATH = join(OUTPUT_DIR, "manifest.json");
const REVEAL_SLIDESHOW_PATH = join(
  __dirname,
  "../website/src/components/PresentationMode/RevealSlideshow.tsx",
);

/**
 * Extract valid visual component names from RevealSlideshow.tsx
 * Single source of truth: the VISUAL_COMPONENTS object in the renderer
 */
function getValidVisualComponents() {
  const content = readFileSync(REVEAL_SLIDESHOW_PATH, "utf-8");
  const match = content.match(
    /const VISUAL_COMPONENTS = \{([^}]+)\}/,
  );
  if (!match) {
    throw new Error(
      "Could not find VISUAL_COMPONENTS in RevealSlideshow.tsx",
    );
  }
  // Extract component names (the keys of the object)
  const componentNames = match[1]
    .split(",")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"))
    .map((line) => line.split(":")[0].trim());
  return componentNames;
}

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: "interactive",
    file: null,
    module: null,
    debug: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--all") {
      config.mode = "batch";
    } else if (arg === "--file") {
      config.mode = "batch";
      config.file = args[++i];
    } else if (arg === "--module") {
      config.mode = "batch";
      config.module = args[++i];
    } else if (arg === "--debug") {
      config.debug = true;
    }
  }

  return config;
}

// ============================================================================
// CONTENT PARSING - Uses shared markdown-parser library
// ============================================================================
// (Functions imported from ./lib/markdown-parser.js)

// ============================================================================
// PRESENTATION PROMPT
// ============================================================================

/**
 * Generate presentation slides prompt optimized for Claude Opus 4.5
 */
function buildPresentationPrompt(content, fileName, outputPath) {
  return `You are a presentation script writer specializing in educational content for senior software engineers.

TASK: Convert the technical course material below into a concise, visual presentation format for classroom teaching.

TARGET AUDIENCE:
Senior software engineers (3+ years experience) who want practical, production-focused insights. They don't need hand-holding.

PRESENTATION CONTEXT:
This presentation will be shown in a classroom using Reveal.js. The instructor needs:
- Clear, visual slides with minimal text (bullet points, not paragraphs)
- Speaker notes with detailed talking points and timing guidance
- Code examples that demonstrate key concepts
- Logical flow with clear transitions

PRESENTATION STRUCTURE REQUIREMENTS:

✓ DO: Create 8-15 slides total (no more, no less)
✓ DO: Each slide should cover ONE key concept or example
✓ DO: Use bullet points with 3-5 items per slide maximum
✓ DO: Include transitions between conceptual sections
✓ DO: Add speaker notes with:
  - Talking points that expand on slide content
  - Timing guidance (e.g., "Spend 2-3 minutes on this")
  - Discussion prompts or questions to ask students
  - Real-world examples to reference
✓ DO: Preserve important code examples as slide content
✓ DO: ONLY use these registered visual components: ${getValidVisualComponents().join(", ")}
✗ DO NOT: Invent or reference visual components not in this list
✓ DO: Generate exactly 4 learning objectives (no more, no less)
✓ DO: Keep each learning objective to 5 words or fewer - THIS IS STRICTLY ENFORCED
  - Good: "Master active context engineering" (4 words) ✓
  - Bad: "Learn how to master active context" (6 words) ✗

✗ AVOID: Long paragraphs on slides (slides are visual anchors, not reading material)
✗ AVOID: More than 5 bullet points per slide
✗ AVOID: Redundant slides covering the same concept
✗ AVOID: Skipping critical concepts from the lesson
✗ AVOID: Technical jargon without context in speaker notes

SLIDE TYPES:

1. **Title Slide**: Lesson title, learning objectives
2. **Concept Slide**: Key idea with 3-5 bullet points
3. **Code Example Slide**: Code snippet with context
4. **Code Comparison Slide**: Side-by-side code examples (especially for prompt examples)
5. **Code Execution Slide**: Step-by-step visualization of execution flows (agent loops, algorithms, workflows)
6. **Comparison Slide**: Effective vs ineffective patterns (bullet points)
7. **Visual Slide**: ONLY when source has [VISUAL_COMPONENT: X] marker - NEVER invent components
8. **Key Takeaway Slide**: Summary of section or lesson

HANDLING CODE BLOCKS:

The source material includes code blocks tagged like:
- [INEFFECTIVE CODE EXAMPLE: ...] - Shows what NOT to do
- [EFFECTIVE CODE EXAMPLE: ...] - Shows the correct approach
- [CODE PATTERN: ...] - Demonstrates a structure
- [CODE EXAMPLE: ...] - General code reference

For presentation slides:
✓ Include the most illustrative code examples (2-4 per presentation)
✓ Add context in speaker notes about what the code demonstrates
✓ For comparison slides, show ineffective and effective side-by-side
✓ Keep code snippets under 15 lines for readability
✓ EXCEPTION: Textual context flow examples showing agent conversation flows should use "codeExecution" slide type regardless of length (see section below)
✗ Don't include every code example from the lesson
✗ Don't show code without explaining its purpose

HANDLING MARKDOWN TABLES (CRITICAL):

Source material may contain markdown tables (pipe/dash syntax like | Col1 | Col2 |).
Tables are NOT a valid slide format—they're unreadable at presentation scale and
violate the one-concept-per-slide principle.

ABSOLUTE RULE: NEVER put pipe/dash table syntax in code or codeComparison slides.
NEVER use language="markdown" for content containing table structures.

Instead, distill tables into appropriate slide types:

1. Two-category tables → "comparison" slide (neutral=true if both sides are valid)
   Extract the key insight from each row as a bullet point.

2. List-of-items tables → "concept" slide
   Each row becomes one bullet capturing the essential insight.

3. Sequential/flow tables → "codeExecution" slide
   Each row becomes a step with appropriate highlightType.

4. Good-vs-bad tables → "comparison" slide (evaluative, neutral=false)
   Left = weak approach, Right = strong approach.

Put the FULL original table in speakerNotes.talkingPoints for instructor reference.
The slide shows the distilled insight; the notes provide the data.

NOTE: language="markdown" IS valid for prompt templates showing what to write to an
AI (e.g., CLAUDE.md examples). It is ONLY prohibited for pipe/dash table content.

CODE FORMATTING FOR PRESENTATIONS:

✓ Include natural line breaks in code and text (use \\n for newlines in JSON strings)
✓ Use standard formatting - post-processing will optimize line lengths automatically
✓ Preserve semantic meaning and don't break mid-identifier or mid-word
✓ DO NOT output literal newlines in JSON strings - always use the \\n escape sequence

NOTE: Line length optimization (60-char limit) is handled automatically by post-processing.
Focus on preserving the exact content and structure from the source material.

<CRITICAL_CONSTRAINT>
SOURCE MATERIAL VERIFICATION

Before generating any slide containing code:
1. Read the source material carefully to locate the code
2. Verify all code examples exist verbatim in the source markdown
3. Copy code exactly as it appears - character for character

ABSOLUTE PROHIBITIONS:
✗ DO NOT generate hypothetical code examples that aren't in the source
✗ DO NOT fabricate implementations that "would result" from prompts shown in the lesson
✗ DO NOT create code to demonstrate "what the AI would produce"
✗ DO NOT show resulting code unless it explicitly exists in the source markdown

CORRECT BEHAVIOR:
✓ If the lesson shows ONLY a prompt example (text describing what to ask AI):
  → Show the prompt as-is using code/codeComparison type with language: "text"
  → DO NOT generate the code that would result from that prompt
  → The prompt itself IS the educational example

✓ If the lesson shows BOTH a prompt AND its resulting code:
  → Show both exactly as they appear in the source
  → Verify both exist in the source before including

✓ If the lesson shows code WITHOUT a preceding prompt:
  → Show the code exactly as it appears in the source
  → Verify it exists before including

EXAMPLES:

❌ WRONG - Fabricating implementation:
Source contains: "Write a TypeScript function that validates email addresses per RFC 5322..."
Slide shows: Complete validateEmail() function with regex and edge case handling
Problem: The implementation was FABRICATED - it doesn't exist in the source

✅ CORRECT - Showing only what exists:
Source contains: "Write a TypeScript function that validates email addresses per RFC 5322..."
Slide shows: The prompt text only (type: "code", language: "text")
Result: Authentic prompt example preserved, no fabrication

Remember: You are extracting and organizing existing content, NOT generating new examples.
</CRITICAL_CONSTRAINT>

<MANDATORY_RULES>
CRITICAL: PRESERVING PROMPT EXAMPLES

When the source material includes prompt examples (text showing what to write to an AI coding assistant):
✓ PRESERVE EXACTLY as shown—do NOT paraphrase, rewrite, or summarize
✓ Use "code" or "codeComparison" slide types, NEVER bullet points
✓ Set language to "text" or "markdown" for prompt examples
✓ Include the FULL prompt text with exact formatting and line breaks
✓ Copy verbatim from source—these are educational examples showing structure

Examples of prompt text that MUST be preserved as code:
- "Write a TypeScript function that validates email addresses..."
- "You are a security engineer. Review this code for..."
- "Calculate the optimal cache size for 1M users..."

For comparison slides showing ineffective vs effective prompts:
✓ Use "codeComparison" type with leftCode/rightCode fields
✓ Set language to "text" for both sides
✓ Copy the EXACT prompt text from the source markdown
✗ Do NOT convert prompts to bullet points
✗ Do NOT summarize or paraphrase prompt text
✗ Do NOT rewrite for "presentation style"—preserve authenticity

Example structure for prompt comparisons:
{
  "type": "codeComparison",
  "title": "Imperative Commands: Ineffective vs Effective",
  "leftCode": {
    "label": "Ineffective",
    "language": "text",
    "code": "Could you help me write a function to validate email addresses?\nThanks in advance!"
  },
  "rightCode": {
    "label": "Effective",
    "language": "text",
    "code": "Write a TypeScript function that validates email addresses per RFC 5322.\nHandle edge cases:\n- Multiple @ symbols (invalid)\n- Missing domain (invalid)\n- Plus addressing (valid)\n\nReturn { valid: boolean, reason?: string }"
  },
  "speakerNotes": { ... }
}
</MANDATORY_RULES>

COMMON MISTAKE - DO NOT DO THIS:

❌ WRONG - Converting prompts to bullet points:
{
  "type": "concept",
  "title": "Action Verbs and Specificity",
  "content": [
    "Write (not make) → establishes code pattern",
    "Debug X in File.ts:47 (not fix) → pinpoints scope",
    "Add JSDoc to exported functions (not improve docs) → defines scope"
  ]
}

✅ CORRECT - Using codeComparison for prompts:
{
  "type": "codeComparison",
  "title": "Action Verbs and Specificity",
  "leftCode": {
    "label": "Weak",
    "language": "text",
    "code": "Make a function\nFix the bug\nUpdate the docs\nImprove performance"
  },
  "rightCode": {
    "label": "Strong",
    "language": "text",
    "code": "Write a function\nDebug the null pointer exception in UserService.ts:47\nAdd JSDoc comments to all exported functions in auth.ts\nOptimize the query to use indexed columns"
  }
}

If you see prompt examples in the source (text showing what to write to an AI), you MUST use "code" or "codeComparison" slide types. NEVER use "concept" with bullet points for prompts.

<VERIFICATION_PROTOCOL>
CHAIN-OF-THOUGHT FOR CODE SLIDES

For each code example you consider including in a slide, follow this verification process:

Step 1: LOCATE - Where does this code appear in the source material?
  → Identify the section and approximate line range
  → If you cannot find it, STOP - do not include this code

Step 2: EXTRACT - Copy the exact text from the source
  → Character-by-character match
  → Preserve all whitespace, formatting, and syntax

Step 3: VERIFY - Does your extracted code match what you're about to include?
  → Compare character by character
  → If there's any mismatch, re-extract from source

Step 4: CONFIRM - Is this code explicitly in the source, or did you generate it?
  → If you generated it (even to "demonstrate" something), DELETE IT
  → Only include code that passed Steps 1-3

Apply this process to:
- Every "code" slide
- Every "codeComparison" leftCode and rightCode
- Every "codeExecution" step that contains code

This verification prevents fabrication and ensures educational integrity.
</VERIFICATION_PROTOCOL>

COMPONENT DETECTION (CRITICAL):

The source content contains markers for visual React components in the format:
[VISUAL_COMPONENT: ComponentName]

Examples you will see:
- [VISUAL_COMPONENT: AbstractShapesVisualization]
- [VISUAL_COMPONENT: CapabilityMatrix]
- [VISUAL_COMPONENT: UShapeAttentionCurve]
- [VISUAL_COMPONENT: ContextWindowMeter]

**MANDATORY RULE:** When you encounter a [VISUAL_COMPONENT: X] marker, you MUST:
1. Generate a "visual" slide type (NOT a "concept" slide)
2. Set "component" field to the exact component name from the marker
3. Use the surrounding context to write a VALUE-FOCUSED caption

**CAPTION REQUIREMENTS:**

CRITICAL: Captions must be EXACTLY ONE SHORT SENTENCE capturing the core essence.
- Length: 8-15 words maximum
- No statistics, percentages, or numerical data
- Less is more—distill to the single most important insight

✓ Capture the core conceptual essence in one breath
✓ Be direct and concise—what's the ONE key insight?
✓ Focus on impact or principle, not detailed explanation
✗ Don't include multiple points or list consequences
✗ Don't use numbers, statistics, or percentages
✗ Don't just describe what's shown (that's the title's job)

Example:
{
  "type": "visual",
  "title": "Context and Agent Behavior",
  "component": "AbstractShapesVisualization",
  "caption": "Clean context prevents agent hallucinations"
}

**DO NOT:**
- Convert component markers into text bullet points
- Skip component markers
- Change the component name
- Generate a "concept" slide when you see a component marker

If you see [VISUAL_COMPONENT: X] anywhere in the content, it MUST become a visual slide.

CRITICAL CONSTRAINT: NEVER create a "visual" slide type unless there is an explicit [VISUAL_COMPONENT: X] marker in the source content. Do NOT invent visual components. If no marker exists, use "concept", "comparison", or "codeExecution" slide types instead.

CODE EXECUTION SLIDES:

Use the "codeExecution" slide type to visualize step-by-step processes like:
- Agent execution loops (human input → LLM prediction → agent execution → feedback)
- Algorithm execution flows
- Request/response cycles
- Multi-step workflows

Structure with highlightType for semantic color-coding (uses design system colors):
- **"human"** (white/neutral): Engineer/operator input, commands, task specifications, explicit constraints
- **"prediction"** (purple): LLM predictions, reasoning, decisions, "I will..." or "I should..." statements
- **"execution"** (green): Agent/software tool calls, deterministic actions (Read, Edit, Bash commands)
- **"feedback"** (purple light): Data/results returned from operations, outputs that LLM receives
- **"summary"** (white/neutral): Loop conditions, conclusions, final outcomes

SEMANTIC RULES (critical for correct color coding):
✓ "Engineer specifies task:" → human (operator input)
✓ "LLM predicts:" or "LLM decides:" → prediction (thinking/planning)
✓ "Agent executes: Read(...)" → execution (tool call)
✓ "File content returned:" → feedback (operation result)
✓ "LLM receives and predicts:" → prediction (NOT feedback - it's the prediction after receiving)
✓ "Loop continues until..." → summary (loop condition)

✓ Use for "how it works" explanations (3-8 steps typical)
✓ Include annotations to explain WHY each step happens
✓ Show the complete cycle from start to finish
✓ Maintain semantic consistency: what's DOING the action determines the type
✗ Don't use for static code examples (use "code" type instead)
✗ Don't create more than 10 steps (split into multiple slides if needed)
✗ Don't confuse "LLM receives data and predicts" (prediction) with "data returned" (feedback)

RECOGNIZING TEXTUAL CONTEXT FLOW PATTERNS (CRITICAL):

When you see code blocks showing conversation/execution flows with patterns like:
- "SYSTEM: ... USER: ... ASSISTANT: ... TOOL_RESULT: ..."
- Sequential back-and-forth between human, LLM, and tools
- Full execution traces showing how text flows through agent context
- Examples demonstrating the actual content of the context window

→ These are PEDAGOGICALLY CRITICAL and must be included as "codeExecution" slides

Why these matter MORE than config examples:
- They show the fundamental mental model of how agents operate
- They demystify what "context" actually contains
- They're the core learning insight, not just implementation details

How to handle them:
1. Break the flow into 8-12 logical steps (not necessarily every line)
2. Map conversation elements to highlightTypes:
   - "SYSTEM:" or system instructions → human
   - "USER:" or task specification → human
   - "ASSISTANT:" thinking/reasoning → prediction
   - "<tool_use>" or tool calls → execution
   - "TOOL_RESULT:" or outputs → feedback
3. Add annotations explaining the significance of each step
4. Focus on the FLOW of text through the context, not just the code

Example transformation:
- Source: 67-line conversation showing full agent execution
- Slide: 10 steps highlighting key moments in the conversation flow
- Annotations: "Notice how the tool result becomes input to the next prediction"

PRIORITIZATION: Textual flow examples showing context mechanics trump configuration
examples like MCP setup. Configuration is implementation; textual flow is understanding.

SPEAKER NOTES GUIDELINES:

For each slide, provide speaker notes with:
1. **Talking points**: What to say (2-4 sentences)
   ✓ Explain what IS shown on the slide
   ✗ Do NOT describe "what the model would generate" for prompts
   ✗ Do NOT fabricate hypothetical outcomes or implementations
2. **Timing**: Estimated time to spend (e.g., "2 minutes")
3. **Discussion prompts**: Questions to engage students
4. **Real-world context**: Production scenarios to reference
5. **Transition**: How to move to next slide

CRITICAL CONSTRAINTS FOR SPEAKER NOTES:
✗ NEVER say "Notice what the model generated" when showing prompt examples alone
✗ NEVER describe hypothetical code that would result from a prompt (unless that code exists in the source)
✗ NEVER fabricate examples or scenarios not present in the source material
✓ Focus on explaining the content that IS on the slide
✓ Reference only examples and code that exist in the source

Example speaker notes:
\`\`\`
Talking points: This slide shows the difference between vague and specific prompts. The vague version gives no context, forcing the AI to guess. The specific version provides language, standard, edge cases, and return type.

Timing: 3-4 minutes - this is a critical concept

Discussion: Ask students to share examples of vague prompts they've used. Have them identify what's missing.

Real-world: In production, vague prompts lead to code that compiles but doesn't meet requirements. Specific prompts reduce iteration cycles from 5+ to 1-2.

Transition: "Now that we understand specificity, let's look at how to structure prompts for different tasks..."
\`\`\`

OUTPUT FORMAT:

You must generate a valid JSON file with this structure:

REMINDER: If the source contains prompt examples (text showing what to write to an AI coding assistant), you MUST use "code" or "codeComparison" slide types with language="text". NEVER convert prompts to bullet points in "concept" slides.

{
  "metadata": {
    "title": "Lesson Title",
    "lessonId": "lesson-id",
    "estimatedDuration": "30-45 minutes",
    "learningObjectives": [
      "Master active context engineering",
      "Review agent plans before execution",
      "Set up parallel workflows",
      "Identify and prevent hallucinations"
    ]
  },
  "slides": [
    {
      "type": "title",
      "title": "Lesson Title",
      "subtitle": "Brief tagline",
      "content": [],
      "speakerNotes": {
        "talkingPoints": "...",
        "timing": "1 minute",
        "discussion": "...",
        "context": "...",
        "transition": "..."
      }
    },
    {
      "type": "concept",
      "title": "Slide Title",
      "content": [
        "Bullet point 1",
        "Bullet point 2",
        "Bullet point 3"
      ],
      "speakerNotes": { ... }
    },
    {
      "type": "code",
      "title": "Code Example Title",
      "language": "typescript",
      "code": "function example() { ... }",
      "caption": "Brief explanation",
      "speakerNotes": { ... }
    },
    {
      "type": "codeExecution",
      "title": "Agent Execution Loop Example",
      "steps": [
        {
          "line": "Engineer specifies: 'Add authentication middleware'",
          "highlightType": "human",
          "annotation": "Human provides explicit task and constraints"
        },
        {
          "line": "LLM predicts: 'I should read existing auth patterns'",
          "highlightType": "prediction",
          "annotation": "Token prediction drives next action"
        },
        {
          "line": "Agent executes: Read(src/middleware/auth.ts)",
          "highlightType": "execution",
          "annotation": "Deterministic tool execution"
        },
        {
          "line": "File content returned to context",
          "highlightType": "feedback",
          "annotation": "Operation result available to LLM"
        },
        {
          "line": "LLM analyzes patterns and predicts: 'I'll use JWT approach'",
          "highlightType": "prediction",
          "annotation": "Prediction incorporates new context"
        },
        {
          "line": "Agent executes: Edit(src/app.ts, old, new)",
          "highlightType": "execution",
          "annotation": "Code modification"
        },
        {
          "line": "Loop continues until tests pass",
          "highlightType": "summary",
          "annotation": "Iteration condition"
        }
      ],
      "speakerNotes": { ... }
    },

COMPARISON SLIDE CONVENTION (CRITICAL - STYLING RULES):

The comparison slide type has TWO variants based on the "neutral" flag:

1. EVALUATIVE (default, neutral=false or omitted):
   - LEFT side → RED background, RED heading, ✗ icons (ineffective/worse/limited)
   - RIGHT side → GREEN background, GREEN heading, ✓ icons (effective/better/superior)
   - Use when one approach is clearly inferior to the other
   - Examples: "Ineffective vs Effective", "Traditional vs Modern", "Limited vs Superior"

2. NEUTRAL (neutral=true):
   - BOTH sides → PURPLE background, PURPLE heading, → arrows (both valid options)
   - Use for architectural trade-offs where both options are valid but have different characteristics
   - Examples: "Autonomous vs Structured sub-agents", "Synchronous vs Asynchronous APIs"

FOR EVALUATIVE COMPARISONS, YOU MUST ALWAYS follow this convention:
- LEFT: The worse/ineffective/traditional/limited approach
- RIGHT: The better/effective/modern/superior approach

Correct examples:
- "Chat Interface" (left) vs "Agent Workflow" (right)
- "Heavy Mocking" (left) vs "Sociable Tests" (right)
- "Chat/IDE Agents" (left) vs "CLI Agents" (right)
- "Traditional RAG" (left) vs "Agentic RAG" (right)

INCORRECT: Putting the better option on the left will show it with RED ✗ styling!

    {
      "type": "comparison",
      "title": "Ineffective vs Effective",
      "left": {
        "label": "Ineffective",        // MANDATORY: LEFT = worse/ineffective/limited (RED ✗)
        "content": ["Point 1", "Point 2"]
      },
      "right": {
        "label": "Effective",          // MANDATORY: RIGHT = better/effective/superior (GREEN ✓)
        "content": ["Point 1", "Point 2"]
      },
      "speakerNotes": { ... }
    },
    {
      "type": "comparison",
      "title": "Architectural Trade-offs: Option A vs Option B",
      "neutral": true,                 // OPTIONAL: Use neutral=true for valid trade-offs (PURPLE neutral styling)
      "left": {
        "label": "Option A",           // Both options valid - neutral styling
        "content": ["Point 1", "Point 2"]
      },
      "right": {
        "label": "Option B",           // Both options valid - neutral styling
        "content": ["Point 1", "Point 2"]
      },
      "speakerNotes": { ... }
    },

CODE COMPARISON SLIDE (codeComparison):

Like regular comparison slides, codeComparison also supports the "neutral" flag:

1. EVALUATIVE (default, neutral=false or omitted):
   - LEFT side → RED background, RED heading (ineffective/worse code)
   - RIGHT side → GREEN background, GREEN heading (effective/better code)
   - Use when one code example is clearly inferior

2. NEUTRAL (neutral=true):
   - BOTH sides → PURPLE background, PURPLE heading (both valid approaches)
   - Use when comparing valid code alternatives with different trade-offs
   - Examples: "Imperative vs Functional", "Optimized for Speed vs Readability"

    {
      "type": "codeComparison",
      "title": "Prompt Example: Ineffective vs Effective",
      "leftCode": {
        "label": "Ineffective",        // MANDATORY: LEFT = worse prompt (RED ✗)
        "language": "text",
        "code": "Could you help me write a function?\nThanks!"
      },
      "rightCode": {
        "label": "Effective",          // MANDATORY: RIGHT = better prompt (GREEN ✓)
        "language": "text",
        "code": "Write a TypeScript function that validates email addresses.\nHandle edge cases:\n- Invalid @ symbols\n- Missing domain\n\nReturn { valid: boolean }"
      },
      "speakerNotes": { ... }
    },
    {
      "type": "codeComparison",
      "title": "Code Style Trade-offs: Imperative vs Functional",
      "neutral": true,                 // OPTIONAL: Use neutral=true for valid alternatives (PURPLE neutral styling)
      "leftCode": {
        "label": "Imperative Style",   // Both styles valid - neutral styling
        "language": "javascript",
        "code": "const result = [];\nfor (let i = 0; i < items.length; i++) {\n  if (items[i] > 10) {\n    result.push(items[i] * 2);\n  }\n}\nreturn result;"
      },
      "rightCode": {
        "label": "Functional Style",   // Both styles valid - neutral styling
        "language": "javascript",
        "code": "return items\n  .filter(x => x > 10)\n  .map(x => x * 2);"
      },
      "speakerNotes": { ... }
    },
    {
      "type": "marketingReality",
      "title": "Marketing vs Reality: What Actually Happens",
      "metaphor": {
        "label": "Marketing Speak",
        "content": ["Metaphorical statement 1", "Metaphorical statement 2"]
      },
      "reality": {
        "label": "Technical Reality",
        "content": ["Technical explanation 1", "Technical explanation 2"]
      },
      "speakerNotes": { ... }
    },
    {
      "type": "visual",
      "title": "Visual Component",
      "component": "${getValidVisualComponents().join(" | ")}",
      "caption": "Description of what the visual shows",
      "speakerNotes": { ... }
    },
    {
      "type": "takeaway",
      "title": "Key Takeaways",
      "content": [
        "Takeaway 1",
        "Takeaway 2",
        "Takeaway 3"
      ],
      "speakerNotes": { ... }
    }
  ]
}

KEY TAKEAWAYS GENERATION (TWO-STEP PROCESS):

When creating the "takeaway" slide at the end of the presentation:

STEP 1: First, review the lesson and mentally list ALL significant takeaways
- Identify every important concept, pattern, or insight from the lesson
- Don't filter yet—just enumerate everything worth remembering

STEP 2: Then, condense to the 3-5 MOST critical takeaways
- Prioritize by impact and generality (what will matter most in production?)
- Combine related points into higher-level insights when possible
- Remove redundant or overly specific points
- **STRICT REQUIREMENT: Each takeaway MUST be 5 words or fewer**
- Use active verbs and eliminate filler words
- Examples:
  ✓ "Tests ground agent code quality" (5 words)
  ✓ "Context management improves agent reliability" (5 words)
  ✓ "Prompt versioning prevents regression bugs" (5 words)
  ✗ "Tests are critical for agent workflows in production" (8 words)
  ✗ "You should manage context to improve reliability" (7 words)

IMPORTANT: The final takeaway slide MUST have exactly 3-5 items, even if the source material lists more.
Quality over quantity—choose the most impactful insights.

WORD COUNT VALIDATION: This is strictly enforced. The build will fail if any takeaway exceeds 5 words.

CRITICAL REQUIREMENTS:

1. The output MUST be valid JSON - no preamble, no explanation, just the JSON object
2. Write the JSON directly to the file: ${outputPath}
3. Include 8-15 slides (no more, no less)
4. Every slide MUST have speakerNotes with all fields
5. Code examples must be actual code from the lesson, not pseudocode
6. Content arrays MUST have 3-5 items (except title slide) - THIS IS STRICTLY ENFORCED
7. PROMPT EXAMPLES: Use "code" or "codeComparison" slide types, NEVER bullet points
8. Learning objectives MUST be 5 words or fewer - THIS IS STRICTLY ENFORCED
9. Takeaway items MUST be 5 words or fewer - THIS IS STRICTLY ENFORCED

BEFORE YOU GENERATE - CHECKLIST:

□ Did I identify all prompt examples in the source?
□ Will I use "codeComparison" type for those slides (NOT "concept")?
□ Will I set language="text" for prompt code blocks?
□ Will I copy the EXACT prompt text without paraphrasing?
□ Did I avoid converting prompts to explanatory bullet points?

TECHNICAL CONTENT TITLE: ${fileName}

TECHNICAL CONTENT:
${content}

IMPORTANT: Write the complete presentation JSON directly to the file: ${outputPath}

The file should contain ONLY valid JSON - no preamble, no markdown, no explanation.
Just write the raw JSON to the file now.`;
}

/**
 * Call Claude Code CLI in headless mode to generate presentation
 */
async function generatePresentationWithClaude(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`  🤖 Calling Claude Code CLI (Opus 4.5)...`);

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Spawn claude process with headless mode
    const claude = spawn("claude", [
      "-p", // Headless mode
      "--model",
      "opus", // Use Opus 4.5
      "--allowedTools",
      "Edit",
      "Write", // Allow file editing and writing only
    ]);

    let stdout = "";
    let stderr = "";

    claude.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    claude.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    claude.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`));
        return;
      }

      // Check if Claude created the file
      if (!existsSync(outputPath)) {
        reject(
          new Error(
            `Claude did not create the output file: ${outputPath}\n` +
              `Claude response: ${stdout.slice(0, 200)}`,
          ),
        );
        return;
      }

      console.log(`  ✅ File created: ${outputPath}`);

      // Read and validate JSON
      let fileContent;
      try {
        fileContent = readFileSync(outputPath, "utf-8");
        const presentation = JSON.parse(fileContent);

        // Validate structure
        if (!presentation.metadata || !presentation.slides) {
          reject(
            new Error(
              "Invalid presentation structure - missing metadata or slides",
            ),
          );
          return;
        }

        if (presentation.slides.length < 8 || presentation.slides.length > 15) {
          console.log(
            `  ⚠️  Warning: ${presentation.slides.length} slides (expected 8-15)`,
          );
        }

        console.log(
          `  ✅ Valid presentation JSON (${presentation.slides.length} slides)`,
        );

        // Write the unmodified presentation to file for validation
        // Line breaking will happen after validation passes
        writeFileSync(
          outputPath,
          JSON.stringify(presentation, null, 2),
          "utf-8",
        );

        resolve(presentation);
      } catch (parseError) {
        reject(
          new Error(
            `Failed to parse JSON: ${parseError.message}\nContent preview: ${fileContent?.slice(0, 200)}`,
          ),
        );
        return;
      }
    });

    claude.on("error", (err) => {
      reject(
        new Error(
          `Failed to spawn Claude CLI: ${err.message}. Is 'claude' installed and in PATH?`,
        ),
      );
    });

    // Send prompt to stdin
    claude.stdin.write(prompt);
    claude.stdin.end();
  });
}

// ============================================================================
// FILE DISCOVERY AND SELECTION
// ============================================================================

/**
 * Find all markdown files recursively
 */
function findMarkdownFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = readdirSync(currentDir);

    for (const item of items) {
      const fullPath = join(currentDir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.match(/\.(md|mdx)$/i) && !item.includes("CLAUDE.md")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files.sort();
}

/**
 * Filter files based on config
 */
function filterFiles(files, config, baseDir) {
  if (config.file) {
    const targetFile = join(baseDir, config.file);
    return files.filter((f) => f === targetFile);
  }

  if (config.module) {
    const modulePath = join(baseDir, config.module);
    return files.filter((f) => f.startsWith(modulePath));
  }

  return files;
}

/**
 * Interactive file selection
 */
async function promptSelectFile(files, baseDir) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log(`\n📚 Available files:\n`);

    files.forEach((file, index) => {
      const relativePath = relative(baseDir, file);
      console.log(`  ${index + 1}. ${relativePath}`);
    });

    console.log("\n");

    rl.question(
      "Select a file by number (or press Ctrl+C to exit): ",
      (answer) => {
        rl.close();

        const selection = parseInt(answer, 10);

        if (isNaN(selection) || selection < 1 || selection > files.length) {
          reject(
            new Error(
              `Invalid selection: ${answer}. Please enter a number between 1 and ${files.length}.`,
            ),
          );
          return;
        }

        resolve([files[selection - 1]]);
      },
    );
  });
}

// ============================================================================
// PROCESSING
// ============================================================================

/**
 * Extract visual component names from parsed content
 * @param {string} content - Parsed markdown content
 * @returns {string[]} Array of component names
 */
function extractExpectedComponents(content) {
  const componentRegex = /\[VISUAL_COMPONENT: ([A-Za-z]+)\]/g;
  const components = [];
  let match;

  while ((match = componentRegex.exec(content)) !== null) {
    components.push(match[1]);
  }

  return components;
}

/**
 * Validate that all expected visual components appear in the presentation
 * @param {string} content - Parsed markdown content
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with missing components
 */
function validateComponents(content, presentation) {
  const expectedComponents = extractExpectedComponents(content);
  const visualSlides = presentation.slides.filter((s) => s.type === "visual");
  const renderedComponents = visualSlides.map((s) => s.component);

  const missing = expectedComponents.filter(
    (c) => !renderedComponents.includes(c),
  );

  return {
    expected: expectedComponents,
    rendered: renderedComponents,
    missing,
    allPresent: missing.length === 0,
  };
}

/**
 * Validate that visual slides reference registered components
 * Prevents AI from inventing non-existent component names
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with invalid component references
 */
function validateVisualComponentsExist(presentation) {
  const validComponents = getValidVisualComponents();
  const visualSlides = presentation.slides.filter((s) => s.type === "visual");
  const issues = [];

  for (const slide of visualSlides) {
    if (slide.component && !validComponents.includes(slide.component)) {
      issues.push({
        slide: slide.title,
        component: slide.component,
        reason: `Component "${slide.component}" is not registered`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    totalVisualSlides: visualSlides.length,
    validComponents,
  };
}

/**
 * Validate semantic correctness of comparison slides
 * Checks that better/effective options are on the RIGHT (green ✓)
 * and worse/ineffective options are on the LEFT (red ✗)
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with potential ordering issues
 */
function validateComparisonSemantics(presentation) {
  const comparisonSlides = presentation.slides.filter(
    (s) => s.type === "comparison",
  );
  const issues = [];

  // Keywords that indicate a "positive/better" option
  const positiveKeywords = [
    "cli",
    "effective",
    "better",
    "modern",
    "agentic",
    "sociable",
    "agent workflow",
  ];
  // Keywords that indicate a "negative/worse" option
  const negativeKeywords = [
    "chat",
    "ide",
    "ineffective",
    "worse",
    "traditional",
    "mocked",
    "chat interface",
  ];

  for (const slide of comparisonSlides) {
    if (!slide.left || !slide.right) continue;

    const leftLabel = slide.left.label?.toLowerCase() || "";
    const rightLabel = slide.right.label?.toLowerCase() || "";

    // Check if left side has positive keywords (should be on right instead)
    const leftIsPositive = positiveKeywords.some((k) => leftLabel.includes(k));
    // Check if right side has negative keywords (should be on left instead)
    const rightIsNegative = negativeKeywords.some((k) =>
      rightLabel.includes(k),
    );

    if (leftIsPositive || rightIsNegative) {
      issues.push({
        slide: slide.title,
        left: slide.left.label,
        right: slide.right.label,
        reason: leftIsPositive
          ? `"${slide.left.label}" appears positive/better but is on LEFT (will show RED ✗)`
          : `"${slide.right.label}" appears negative/worse but is on RIGHT (will show GREEN ✓)`,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    totalComparisons: comparisonSlides.length,
  };
}

/**
 * Validate that content arrays have 3-5 items maximum
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with issues
 */
function validateContentArrayLengths(presentation) {
  const issues = [];
  const MIN_ITEMS = 3;
  const MAX_ITEMS = 5;

  // Slide types that must have content arrays with 3-5 items
  const slidesWithContent = presentation.slides.filter((slide) => {
    // Skip title slide (different rules)
    if (slide.type === "title") return false;

    // Check slides with content arrays
    return slide.content && Array.isArray(slide.content);
  });

  for (const slide of slidesWithContent) {
    const contentLength = slide.content.length;

    if (contentLength < MIN_ITEMS || contentLength > MAX_ITEMS) {
      issues.push({
        slide: slide.title || slide.type,
        type: slide.type,
        count: contentLength,
        reason:
          contentLength < MIN_ITEMS
            ? `Only ${contentLength} item(s), need at least ${MIN_ITEMS}`
            : `Has ${contentLength} item(s), maximum is ${MAX_ITEMS}`,
      });
    }
  }

  // Check comparison slides (left/right content)
  const comparisonSlides = presentation.slides.filter(
    (s) => s.type === "comparison" || s.type === "marketingReality",
  );

  for (const slide of comparisonSlides) {
    const leftContent = slide.left?.content || slide.metaphor?.content;
    const rightContent = slide.right?.content || slide.reality?.content;

    if (leftContent && Array.isArray(leftContent)) {
      const leftLength = leftContent.length;
      if (leftLength < MIN_ITEMS || leftLength > MAX_ITEMS) {
        issues.push({
          slide: `${slide.title} (LEFT)`,
          type: slide.type,
          count: leftLength,
          reason:
            leftLength < MIN_ITEMS
              ? `Only ${leftLength} item(s), need at least ${MIN_ITEMS}`
              : `Has ${leftLength} item(s), maximum is ${MAX_ITEMS}`,
        });
      }
    }

    if (rightContent && Array.isArray(rightContent)) {
      const rightLength = rightContent.length;
      if (rightLength < MIN_ITEMS || rightLength > MAX_ITEMS) {
        issues.push({
          slide: `${slide.title} (RIGHT)`,
          type: slide.type,
          count: rightLength,
          reason:
            rightLength < MIN_ITEMS
              ? `Only ${rightLength} item(s), need at least ${MIN_ITEMS}`
              : `Has ${rightLength} item(s), maximum is ${MAX_ITEMS}`,
        });
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    totalSlidesChecked: slidesWithContent.length + comparisonSlides.length,
  };
}

/**
 * Validate that prompt examples are preserved as code blocks
 * @param {string} content - Parsed markdown content
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with issues
 */
function validatePromptExamples(content, presentation) {
  // Shared regex patterns for detecting prompt-like content
  // Common action verbs that indicate AI assistant commands
  const PROMPT_VERBS =
    "Write |You are |Calculate |Review |Debug |Add |Create |Implement |Refactor ";

  // Detect prompt examples in fenced code blocks
  const promptInCodeBlocks = new RegExp(
    `\`\`\`[^\\n]*\\n(${PROMPT_VERBS})`,
    "gi",
  );
  const hasPromptExamples = promptInCodeBlocks.test(content);

  if (!hasPromptExamples) {
    return { valid: true, issues: [], hasPromptExamples: false };
  }

  const codeSlides = presentation.slides.filter(
    (s) => s.type === "code" || s.type === "codeComparison",
  );

  const issues = [];

  if (codeSlides.length === 0) {
    issues.push(
      "Source contains prompt examples but no code/codeComparison slides were generated",
    );
  }

  // Pattern for detecting prompts in bullet points (should trigger codeComparison)
  const promptLikeContent = new RegExp(`${PROMPT_VERBS}|Return \\{`, "i");

  // Pattern for detecting full prompt sentences (more specific check)
  const fullPromptPattern =
    /Write [a-z]+ [a-z]+ function|You are a [a-z]+ engineer|Calculate the [a-z]+ [a-z]+|Review this [a-z]+ code/i;

  // Check if any comparison slides have prompt-like content that should be codeComparison
  const comparisonSlides = presentation.slides.filter(
    (s) => s.type === "comparison",
  );
  for (const slide of comparisonSlides) {
    if (slide.left?.content || slide.right?.content) {
      const leftContent = slide.left?.content?.join(" ") || "";
      const rightContent = slide.right?.content?.join(" ") || "";
      const combinedContent = leftContent + " " + rightContent;

      // Check if content looks like prompt examples
      if (promptLikeContent.test(combinedContent)) {
        issues.push(
          `Slide "${slide.title}" appears to contain prompt examples as bullet points - should use codeComparison type`,
        );
      }
    }
  }

  // Check if any concept slides have prompt-like content that should be code/codeComparison
  const conceptSlides = presentation.slides.filter((s) => s.type === "concept");
  for (const slide of conceptSlides) {
    if (slide.content && Array.isArray(slide.content)) {
      const combinedContent = slide.content.join(" ");

      // Check if content looks like prompt examples (full sentences/commands, not just explanatory text)
      if (fullPromptPattern.test(combinedContent)) {
        issues.push(
          `Slide "${slide.title}" appears to contain prompt examples as bullet points - should use code or codeComparison type`,
        );
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    hasPromptExamples,
    codeSlideCount: codeSlides.length,
  };
}

/**
 * Normalize whitespace for comparison (remove extra spaces, normalize line breaks)
 */
function normalizeWhitespace(str) {
  return str
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim();
}

/**
 * Check if a code block is a prompt example (text showing what to write to AI)
 */
function isPromptExample(slide) {
  // If language is "text" or "markdown" and contains prompt verbs, it's likely a prompt example
  const promptVerbs = [
    "Write a",
    "You are",
    "Calculate",
    "Review",
    "Debug",
    "Add ",
    "Create",
    "Implement",
    "Refactor",
  ];
  const slideCode = slide.code || "";
  const isTextLang = slide.language === "text" || slide.language === "markdown";

  return isTextLang && promptVerbs.some((verb) => slideCode.includes(verb));
}

/**
 * Validate that code examples in slides exist in source material
 * This prevents fabrication of hypothetical implementations
 * @param {string} content - Parsed markdown content
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with issues
 */
function validateCodeExamplesExistInSource(content, presentation) {
  const issues = [];

  // Extract all code blocks from source markdown
  const codeBlockRegex = /```[\s\S]*?```/g;
  const sourceCodeBlocks = content.match(codeBlockRegex) || [];

  // Normalize source code blocks for comparison
  const normalizedSourceBlocks = sourceCodeBlocks.map((block) => {
    // Remove the backticks and language specifier
    const codeContent = block.replace(/^```[^\n]*\n/, "").replace(/\n```$/, "");
    return normalizeWhitespace(codeContent);
  });

  // Check each code slide
  const codeSlides = presentation.slides.filter(
    (s) => s.type === "code" || s.type === "codeComparison",
  );

  for (const slide of codeSlides) {
    // For code slides with actual code (not prompt examples)
    if (slide.type === "code" && slide.code) {
      // Skip prompt examples (text-based prompts are valid educational content)
      if (isPromptExample(slide)) {
        continue;
      }

      const codeContent = normalizeWhitespace(slide.code);

      // Check if this code exists in any source block (allow partial matches for excerpts)
      const existsInSource = normalizedSourceBlocks.some(
        (sourceBlock) =>
          sourceBlock.includes(codeContent) ||
          codeContent.includes(sourceBlock),
      );

      if (!existsInSource && codeContent.length > 20) {
        // Ignore very short snippets
        issues.push(
          `Code in slide "${slide.title}" (${codeContent.substring(0, 50)}...) not found in source`,
        );
      }
    }

    // For code comparison slides
    if (slide.type === "codeComparison") {
      const checkCodeBlock = (codeBlock, label) => {
        if (!codeBlock || !codeBlock.code) return;

        // Skip prompt examples
        if (
          codeBlock.language === "text" ||
          codeBlock.language === "markdown"
        ) {
          return;
        }

        const codeContent = normalizeWhitespace(codeBlock.code);
        const existsInSource = normalizedSourceBlocks.some(
          (sourceBlock) =>
            sourceBlock.includes(codeContent) ||
            codeContent.includes(sourceBlock),
        );

        if (!existsInSource && codeContent.length > 20) {
          issues.push(
            `${label} code in slide "${slide.title}" (${codeContent.substring(0, 50)}...) not found in source`,
          );
        }
      };

      checkCodeBlock(slide.leftCode, "Left");
      checkCodeBlock(slide.rightCode, "Right");
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    codeSlidesChecked: codeSlides.length,
  };
}

/**
 * Validate that takeaway items have 5 words or fewer
 *
 * Takeaways are final memorable insights displayed prominently on conclusion slides.
 * Enforcing brevity ensures they're memorable and impactful for the audience.
 */
function validateTakeawayWordCount(presentation) {
  const MAX_WORDS = 5;
  const issues = [];

  const takeawaySlides = presentation.slides.filter(
    (s) => s.type === "takeaway",
  );

  for (const slide of takeawaySlides) {
    if (slide.content && Array.isArray(slide.content)) {
      slide.content.forEach((item, index) => {
        const wordCount = item.trim().split(/\s+/).length;
        if (wordCount > MAX_WORDS) {
          issues.push({
            slide: slide.title,
            index: index + 1,
            wordCount,
            content: item.substring(0, 60) + (item.length > 60 ? "..." : ""),
            excess: wordCount - MAX_WORDS,
          });
        }
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    totalTakeawaysChecked: takeawaySlides.reduce(
      (sum, s) => sum + (s.content?.length || 0),
      0,
    ),
  };
}

/**
 * Validate that learning objectives have 5 words or fewer
 *
 * Learning objectives appear on the title slide and set expectations for the lesson.
 * Brief objectives are more memorable and easier for students to internalize.
 */
function validateLearningObjectivesWordCount(presentation) {
  const MAX_WORDS = 5;
  const issues = [];

  const objectives = presentation.metadata?.learningObjectives || [];

  objectives.forEach((objective, index) => {
    const wordCount = objective.trim().split(/\s+/).length;
    if (wordCount > MAX_WORDS) {
      issues.push({
        index: index + 1,
        wordCount,
        content:
          objective.substring(0, 60) + (objective.length > 60 ? "..." : ""),
        excess: wordCount - MAX_WORDS,
      });
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    totalObjectivesChecked: objectives.length,
  };
}

/**
 * Validate that no code/codeComparison slides contain raw markdown table syntax
 * Tables rendered as code are unreadable at presentation scale and should be
 * distilled into comparison/concept/codeExecution slides instead.
 * @param {object} presentation - Generated presentation object
 * @returns {object} Validation result with issues
 */
function validateNoMarkdownTablesInCode(presentation) {
  const issues = [];
  const tablePattern = /\|.+\|.+\|\n\|[-| ]+\|/;

  for (const slide of presentation.slides) {
    const checkCode = (code, label) => {
      if (code && tablePattern.test(code)) {
        issues.push({ slide: slide.title, location: label });
      }
    };

    if (slide.type === "code") checkCode(slide.code, "code");
    if (slide.type === "codeComparison") {
      checkCode(slide.leftCode?.code, "leftCode");
      checkCode(slide.rightCode?.code, "rightCode");
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Generate presentation for a file
 */
async function generatePresentation(filePath, manifest, modifiedKeys, config) {
  const relativePath = relative(DOCS_DIR, filePath);
  const fileName = basename(filePath, extname(filePath));

  console.log(`\n📄 Generating presentation: ${relativePath}`);

  try {
    // Parse content in presentation mode, preserving code blocks for validation
    const content = parseMarkdownContent(filePath, "presentation", true);

    if (content.length < 100) {
      console.log(`  ⚠️  Skipping - content too short`);
      return null;
    }

    // Determine output path
    const outputFileName = `${fileName}.json`;
    const outputPath = join(OUTPUT_DIR, dirname(relativePath), outputFileName);

    // Delete existing output file
    if (existsSync(outputPath)) {
      unlinkSync(outputPath);
      console.log(`  🗑️  Deleted existing file for fresh generation`);
    }

    // Build prompt
    const prompt = buildPresentationPrompt(content, fileName, outputPath);

    // Debug mode: save prompt
    if (config.debug) {
      const debugPath = outputPath.replace(".json", ".debug-prompt.txt");
      mkdirSync(dirname(debugPath), { recursive: true });
      writeFileSync(debugPath, prompt, "utf-8");
      console.log(`  🔍 Debug prompt saved: ${debugPath}`);
    }

    // Generate presentation using Claude
    const presentation = await generatePresentationWithClaude(
      prompt,
      outputPath,
    );

    // ========================================================================
    // POST-GENERATION VALIDATION
    // These validations run AFTER Claude generates the JSON to ensure quality.
    // They check that the LLM followed the prompt instructions correctly.
    // Visual components and comparisons generate warnings; prompts cause errors.
    // ========================================================================

    // Validate that all visual components were included
    const validation = validateComponents(content, presentation);
    if (!validation.allPresent) {
      console.log(
        `  ⚠️  WARNING: ${validation.missing.length} visual component(s) not rendered:`,
      );
      validation.missing.forEach((c) => console.log(`      - ${c}`));
      console.log(`  ℹ️  Expected: [${validation.expected.join(", ")}]`);
      console.log(`  ℹ️  Rendered: [${validation.rendered.join(", ")}]`);
    } else if (validation.expected.length > 0) {
      console.log(
        `  ✅ All ${validation.expected.length} visual component(s) rendered correctly`,
      );
    }

    // Validate comparison slide semantics
    const semanticValidation = validateComparisonSemantics(presentation);
    if (!semanticValidation.valid) {
      console.log(
        `  ⚠️  WARNING: ${semanticValidation.issues.length} comparison slide(s) may have reversed order:`,
      );
      semanticValidation.issues.forEach((issue) => {
        console.log(`      - "${issue.slide}"`);
        console.log(`        LEFT: "${issue.left}" | RIGHT: "${issue.right}"`);
        console.log(`        ${issue.reason}`);
      });
      console.log(
        `  ℹ️  Remember: LEFT = ineffective/worse (RED ✗), RIGHT = effective/better (GREEN ✓)`,
      );
    } else if (semanticValidation.totalComparisons > 0) {
      console.log(
        `  ✅ All ${semanticValidation.totalComparisons} comparison slide(s) follow correct convention`,
      );
    }

    // Collect validation errors instead of throwing immediately
    // This allows us to write the presentation file even when validation fails
    const validationErrors = [];

    // Validate visual components exist in registry
    // CRITICAL: This prevents AI from inventing non-existent components
    const componentRegistryValidation =
      validateVisualComponentsExist(presentation);
    if (!componentRegistryValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${componentRegistryValidation.issues.length} invalid visual component(s):`,
      );
      componentRegistryValidation.issues.forEach((issue) => {
        console.log(`      - Slide "${issue.slide}": ${issue.reason}`);
      });
      console.log(
        `  ℹ️  Valid components: ${componentRegistryValidation.validComponents.join(", ")}`,
      );
      validationErrors.push(
        "Visual component validation failed - slides reference non-existent components",
      );
    } else if (componentRegistryValidation.totalVisualSlides > 0) {
      console.log(
        `  ✅ All ${componentRegistryValidation.totalVisualSlides} visual slide(s) reference valid components`,
      );
    }

    // Validate content array lengths (3-5 items)
    // CRITICAL: This validation is intentionally strict and throws an error because
    // slides with too many bullets become unreadable and overflow the layout.
    // The two-step condensation process in the prompt should prevent this.
    const contentValidation = validateContentArrayLengths(presentation);
    if (!contentValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${contentValidation.issues.length} content array violation(s):`,
      );
      contentValidation.issues.forEach((issue) => {
        console.log(
          `      - Slide "${issue.slide}" (${issue.type}): ${issue.reason}`,
        );
      });
      console.log(
        `  ℹ️  All content arrays MUST have 3-5 items (except title slide)`,
      );
      console.log(
        `  ℹ️  For takeaway slides: use the two-step condensation process`,
      );
      validationErrors.push(
        "Content array validation failed - slides have too many or too few items",
      );
    } else if (contentValidation.totalSlidesChecked > 0) {
      console.log(
        `  ✅ All ${contentValidation.totalSlidesChecked} content array(s) have 3-5 items`,
      );
    }

    // Validate prompt examples are preserved as code
    // CRITICAL: This validation is intentionally strict and throws an error because
    // prompt examples are core educational content that must be preserved exactly.
    // If the LLM converts prompts to bullet points, it loses pedagogical value.
    const promptValidation = validatePromptExamples(content, presentation);
    if (!promptValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${promptValidation.issues.length} prompt example issue(s):`,
      );
      promptValidation.issues.forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      console.log(
        `  ℹ️  Prompt examples MUST use "code" or "codeComparison" slide types, NOT bullet points`,
      );
      validationErrors.push(
        "Prompt validation failed - prompt examples were converted to bullet points instead of code blocks",
      );
    } else if (promptValidation.hasPromptExamples) {
      console.log(
        `  ✅ All prompt examples preserved as code blocks (${promptValidation.codeSlideCount} code slide(s))`,
      );
    }

    // Validate code examples exist in source material
    // CRITICAL: This validation prevents fabrication of hypothetical code implementations
    // All code shown in slides must exist verbatim in the source lesson markdown
    const codeSourceValidation = validateCodeExamplesExistInSource(
      content,
      presentation,
    );
    if (!codeSourceValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${codeSourceValidation.issues.length} fabricated code issue(s):`,
      );
      codeSourceValidation.issues.forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      console.log(
        `  ℹ️  All code in slides MUST exist verbatim in the source markdown`,
      );
      console.log(
        `  ℹ️  DO NOT generate hypothetical implementations to demonstrate prompts`,
      );
      validationErrors.push(
        "Code source validation failed - slides contain fabricated code not in source",
      );
    } else if (codeSourceValidation.codeSlidesChecked > 0) {
      console.log(
        `  ✅ All ${codeSourceValidation.codeSlidesChecked} code slide(s) verified against source`,
      );
    }

    // Validate no raw markdown tables in code slides
    // Tables rendered as <pre><code> are unreadable at presentation scale
    const tableValidation = validateNoMarkdownTablesInCode(presentation);
    if (!tableValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${tableValidation.issues.length} raw markdown table(s) in code slides:`,
      );
      tableValidation.issues.forEach((issue) => {
        console.log(
          `      - Slide "${issue.slide}" (${issue.location})`,
        );
      });
      console.log(
        `  ℹ️  Distill tables into comparison/concept/codeExecution slides instead`,
      );
      validationErrors.push(
        "Table validation failed - raw markdown tables found in code slides",
      );
    } else {
      console.log(
        `  ✅ No raw markdown tables in code slides`,
      );
    }

    // Validate takeaway word count (5 words or fewer)
    // CRITICAL: This validation is intentionally strict and throws an error because
    // takeaways are displayed prominently on conclusion slides and must be memorable.
    // Verbose takeaways defeat the purpose of distilling key insights.
    const takeawayValidation = validateTakeawayWordCount(presentation);
    if (!takeawayValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${takeawayValidation.issues.length} takeaway word limit violation(s):`,
      );
      takeawayValidation.issues.forEach((issue) => {
        console.log(
          `      - "${issue.slide}" item ${issue.index}: ${issue.wordCount} words (${issue.excess} over limit)`,
        );
        console.log(`        "${issue.content}"`);
      });
      console.log(
        `  ℹ️  All takeaway items MUST be 5 words or fewer for memorability`,
      );
      console.log(
        `  ℹ️  Examples: "Tests ground agent code quality" (5) ✓ | "Tests are critical for agent workflows" (6) ✗`,
      );
      validationErrors.push(
        "Takeaway validation failed - items exceed 5-word limit",
      );
    } else if (takeawayValidation.totalTakeawaysChecked > 0) {
      console.log(
        `  ✅ All ${takeawayValidation.totalTakeawaysChecked} takeaway item(s) are 5 words or fewer`,
      );
    }

    // Validate learning objectives word count (5 words or fewer)
    // CRITICAL: This validation is intentionally strict and throws an error because
    // learning objectives appear on the title slide and set learner expectations.
    // Brief objectives are more memorable and easier to internalize.
    const objectivesValidation =
      validateLearningObjectivesWordCount(presentation);
    if (!objectivesValidation.valid) {
      console.log(
        `  ❌ BUILD FAILURE: ${objectivesValidation.issues.length} learning objective word limit violation(s):`,
      );
      objectivesValidation.issues.forEach((issue) => {
        console.log(
          `      - Objective ${issue.index}: ${issue.wordCount} words (${issue.excess} over limit)`,
        );
        console.log(`        "${issue.content}"`);
      });
      console.log(
        `  ℹ️  All learning objectives MUST be 5 words or fewer for clarity`,
      );
      console.log(
        `  ℹ️  Examples: "Master active context engineering" (4) ✓ | "Learn how to master active context" (6) ✗`,
      );
      validationErrors.push(
        "Learning objectives validation failed - items exceed 5-word limit",
      );
    } else if (objectivesValidation.totalObjectivesChecked > 0) {
      console.log(
        `  ✅ All ${objectivesValidation.totalObjectivesChecked} learning objective(s) are 5 words or fewer`,
      );
    }

    // Write presentation to output file (even if validation failed)
    writeFileSync(outputPath, JSON.stringify(presentation, null, 2), "utf-8");

    // Copy to static directory for deployment
    const staticPath = join(
      STATIC_OUTPUT_DIR,
      dirname(relativePath),
      outputFileName,
    );
    mkdirSync(dirname(staticPath), { recursive: true });
    writeFileSync(staticPath, JSON.stringify(presentation, null, 2), "utf-8");

    // Update manifest and track modified key
    const presentationUrl = `/presentations/${join(dirname(relativePath), outputFileName)}`;
    manifest[relativePath] = {
      presentationUrl,
      slideCount: presentation.slides.length,
      estimatedDuration: presentation.metadata.estimatedDuration,
      title: presentation.metadata.title,
      generatedAt: new Date().toISOString(),
    };
    modifiedKeys.add(relativePath);

    console.log(
      `  ${validationErrors.length > 0 ? "⚠️" : "✅"} Generated: ${presentationUrl}`,
    );
    console.log(`  📊 Slides: ${presentation.slides.length}`);
    console.log(`  ⏱️  Duration: ${presentation.metadata.estimatedDuration}`);

    // Throw validation errors after writing files
    if (validationErrors.length > 0) {
      console.log(
        `  ℹ️  The presentation was saved despite validation failures for inspection.`,
      );
      throw new Error(
        `Validation failed with ${validationErrors.length} error(s):\n  - ${validationErrors.join("\n  - ")}`,
      );
    }

    return outputPath;
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const config = parseArgs();

  console.log("🎭 AI Coding Course - Presentation Generator\n");
  console.log(`📂 Docs directory: ${DOCS_DIR}`);
  console.log(`📝 Output directory: ${OUTPUT_DIR}`);
  console.log(`🌐 Static directory: ${STATIC_OUTPUT_DIR}`);
  console.log(`🤖 Model: Claude Opus 4.5 (via CLI)`);
  console.log(`📋 Mode: ${config.mode}`);

  // Find markdown files
  const sourceFiles = findMarkdownFiles(DOCS_DIR);

  if (sourceFiles.length === 0) {
    console.error("\n❌ No markdown files found.");
    process.exit(1);
  }

  console.log(
    `\n📚 Found ${sourceFiles.length} source file${sourceFiles.length !== 1 ? "s" : ""}`,
  );

  // Load existing manifest and track modified keys for merge-on-write
  let manifest = {};
  const modifiedKeys = new Set();
  if (existsSync(MANIFEST_PATH)) {
    manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  }

  // Select files to process
  let filesToProcess;

  if (config.mode === "interactive") {
    try {
      filesToProcess = await promptSelectFile(sourceFiles, DOCS_DIR);
    } catch (error) {
      console.error(`\n❌ ${error.message}`);
      process.exit(1);
    }

    const relativePath = relative(DOCS_DIR, filesToProcess[0]);
    console.log(`\n✅ Selected: ${relativePath}\n`);
  } else {
    filesToProcess = filterFiles(sourceFiles, config, DOCS_DIR);

    if (filesToProcess.length === 0) {
      console.error("\n❌ No files match the specified filter.");
      process.exit(1);
    }

    console.log(
      `\n📦 Processing ${filesToProcess.length} file${filesToProcess.length !== 1 ? "s" : ""} in batch mode\n`,
    );
  }

  console.log("=".repeat(60));

  // Process files
  let successCount = 0;
  let errorCount = 0;

  for (const file of filesToProcess) {
    try {
      await generatePresentation(file, manifest, modifiedKeys, config);
      successCount++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      errorCount++;
    }
  }

  // Merge-on-write: re-read manifest and merge only our changes to avoid race conditions
  let freshManifest = {};
  if (existsSync(MANIFEST_PATH)) {
    freshManifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  }
  for (const key of modifiedKeys) {
    freshManifest[key] = manifest[key];
  }

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, JSON.stringify(freshManifest, null, 2) + "\n");

  const staticManifestPath = join(STATIC_OUTPUT_DIR, "manifest.json");
  mkdirSync(dirname(staticManifestPath), { recursive: true });
  writeFileSync(staticManifestPath, JSON.stringify(freshManifest, null, 2) + "\n");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✨ Generation complete!");
  console.log(
    `   Success: ${successCount} file${successCount !== 1 ? "s" : ""}`,
  );
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount} file${errorCount !== 1 ? "s" : ""}`);
  }
  console.log(`📋 Manifest: ${MANIFEST_PATH}`);
  console.log(`🌐 Static manifest: ${staticManifestPath}`);
  console.log("=".repeat(60));

  if (errorCount > 0) {
    process.exit(1);
  }
}

// Run
main().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
