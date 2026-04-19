---
sidebar_position: 1
sidebar_label: 'שיעור 6: אונבורדינג אל הפרויקט'
title: 'שיעור 6: אונבורדינג אל הפרויקט'
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import GenerateAgentsMD from '@site/shared-prompts/\_generate-agents-md.mdx';

כשמצטרפים לפרויקט חדש, השבוע הראשון הוא אכזרי. את|ה שוחה בארכיטקטורה לא מוכרת, החלטות טכנולוגיות, ידע שבטי (tribal knowledge) קבור בשרשורי Slack, ואותו סקריפט bash קריטי שכולם מריצים אבל אף אחד לא תיעד.

סוכני AI מתמודדים עם אותה בעיה—רק שהם לא יכולים לשבת על קפה עם מהנדס בכיר כדי לסגור פערים. הם רואים בדיוק מה שנמצא בחלון הקונטקסט שלהם (~200K טוקנים) ותו לא. אין זיכרון משיחת אתמול. אין הבנה של "איך עושים דברים אצלנו".

**הפתרון: לקודד את הקונטקסט של הפרויקט בקבצים היררכיים וקריאים למכונה.**

שיעור זה עוסק בקבצי קונטקסט ובאיך לבנות אותם ברמות המשתמש, הפרויקט והמודול כדי להפוך את סוכן ה-AI שלך ממחולל קוד גנרי לאופרטור שמכיר את הפרויקט.

## האקוסיסטם של קבצי הקונטקסט

<!-- presentation-only-start -->

**השוואת AGENTS.md לעומת CLAUDE.md - שתי הגישות תקפות בהתאם לכלים ומורכבות הפרויקט של הצוות. להשתמש בעיצוב ניטרלי.**

<!-- presentation-only-end -->

קבצי קונטקסט הם מסמכי Markdown שמזריקים ידע ספציפי לפרויקט בין פרומפט המערכת לבין הקלט שלך, נותנים לסוכני AI "זיכרון פרויקט" ללא צורך בהסברים חוזרים של הסטאק הטכנולוגי, הקונבנציות והארכיטקטורה שלך. התעשייה התכנסה על שתי גישות: `AGENTS.md` (תקן ניטרלי לספקים שעובד על פני רוב כלי ה-AI המרכזיים כמו Cursor, Windsurf, ו-GitHub Copilot) והרחבות ספציפיות לכלי כמו `CLAUDE.md` (לתכונות מתקדמות כמו קונטקסט היררכי ב-Claude Code).

<Tabs groupId="ai-tool">
<TabItem value="agents" label="AGENTS.md (סטנדרטי)" default>

`AGENTS.md` הוא התקן הניטרלי לספקים שאומץ על ידי 20,000+ פרויקטי קוד פתוח, עובד על GitHub Copilot, Cursor, Windsurf, ורוב כלי הקידוד AI אחרים (הערה: Claude Code לא תומך ב-AGENTS.md—יש להשתמש ב-CLAUDE.md במקום). יש לשמור אותו מינימלי—ה-README שלכם צריך להכיל 90% ממה ש-AI צריך; AGENTS.md מוסיף רק קונטקסט תפעולי ספציפי ל-AI כמו תצורות שרת MCP, משתני סביבה, פקודות בדיקה מותאמות להרצה לא-אינטראקטיבית, ואזהרות על תלויות לא ברורות. יש למקם אותו בשורש (תיקיית הroot של) הריפו שלכם לתאימות מקסימלית.

</TabItem>
<TabItem value="claude" label="Claude Code (CLAUDE.md)">

`CLAUDE.md` של Claude Code משתמש בקונטקסט היררכי שבו קבצים מרובים מתיקיות שונות (גלובלי `~/.claude/CLAUDE.md`, תיקיית שורש הפרויקט, תת-תיקיות) נטענים אוטומטית וממוזגים בהתבסס על תיקיית העבודה שלך, עם הוראות ספציפיות יותר שדורסות את הכלליות בעוד כללים לא מתנגשים מכל הרמות נשארים פעילים. מערכת שכבתית זו מאפשרת לך להגדיר העדפות אוניברסליות בצורה גלובלית, סטנדרטים של פרויקט בתיקיית השורש שלו, ודריסות ספציפיות למודול בתת-תיקיות—ללא שכפול כללים.

</TabItem>
</Tabs>

----
**השוואה מהירה:**

| תכונה               | AGENTS.md                                                | CLAUDE.md                     |
| --------------------- | -------------------------------------------------------- | ----------------------------- |
| **מיקום קובץ**     | קובץ יחיד בשורש הריפוזיטורי                           | קבצים מרובים בכל רמה   |
| **טעינת קונטקסט**   | קובץ אחד בלבד                                            | כל הקבצים הרלוונטיים ממוזגים   |
| **היררכיה**         | לא                                       | כן (גלובלי ← שורש ← תת-תיקיות) |
| **התנהגות override** | לא רלוונטי (קובץ יחיד)                                        | ספציפי עושה override לכללי    |
| **התנהגות merge**    | לא רלוונטי (קובץ יחיד)                                        | כל הקבצים מוזרקים יחד   |
| **תמיכת כלים**      | GitHub Copilot, Cursor, Windsurf, וכו' (לא Claude Code) | Claude Code בלבד              |

**השורה התחתונה:** AGENTS.md הוא קובץ אוניברסלי אחד. CLAUDE.md היא מערכת היררכית שבה קבצים מרובים נטענים וממוזגים בהתאם לתיקיית העבודה שלך.

:::tip אקוסיסטם מעורב: שימוש ב-Claude Code עם AGENTS.md
Claude Code הוא עוזר הקידוד AI המרכזי היחיד שלא תומך ב-AGENTS.md באופן מובנה. אם אתם עובדים בסביבה מעורבת כלים (למשל, חברי צוות משתמשים ב-Codex/Copilot בעוד אתם משתמשים ב-Claude Code), הימנעו משכפול תוכן על ידי שימוש ב-**@linking** ב-`CLAUDE.md` שלכם להפניה ל-`AGENTS.md` המשותף:

```markdown
# CLAUDE.md - Claude-specific configurations

@/AGENTS.md

# Additional Claude Code-specific context below
```

זה מייבא את כל תוכן AGENTS.md לקונטקסט של Claude, ושומר על מקור אמת יחיד תוך תמיכה בשני פורמטי הקבצים.
:::

:::warning שיקולי אבטחה (Security)
קבצי קונטקסט מוזרקים ישירות לפרומפטי המערכת. חוקרי אבטחה זיהו התקפות "Rules File Backdoor" שבהן הוראות זדוניות מוזרקות באמצעות תווי Unicode או טכניקות התחמקות. שמרו על קבצי קונטקסט מינימליים, מנוהלים בבקרת גרסאות, ועוברים קוד ריוויו כמו כל קוד אחר.
:::

## קונטקסט היררכי: רמות המשתמש, הפרויקט והמודול

קבצי קונטקסט פועלים ברמות שונות של ספציפיות. **קונטקסט גלובלי** מכיל העדפות אישיות שחלות על כל הפרויקטים שלך—סגנון קידוד, הלך רוח, כללים תפעוליים. **קונטקסט ברמת פרויקט** לוכד סטאק טכנולוגי, ארכיטקטורה, וקונבנציות ספציפיות לבסיס קוד אחד. שניהם ניתנים ליישום באמצעות `AGENTS.md` (תקן ניטרלי לספקים) או `CLAUDE.md` (מערכת היררכית של Claude Code שממזגת קבצים מרובים).

### דוגמת קובץ לרמה הגלובלית

קונטקסט גלובלי נמצא בתיקיית הבית שלכם וחל על כל הפרויקטים. הנה ה-`~/.claude/CLAUDE.md` האמיתי של מחבר הקורס—דוגמה מסביבת ייצור שאפשר להתאים לצרכיכם:

```markdown
# Mindset

You are a senior architect with 20 years of experience across all software domains.

- Gather thorough information with tools before solving
- Work in explicit steps - ask clarifying questions when uncertain
- BE CRITICAL - validate assumptions, don't trust code blindly
- MINIMALISM ABOVE ALL - less code is better code

# Search Protocol

- Use ChunkHound's Code Research tool to learn the surrounding code style, architecture and module responsibilities
- PREFER THE CODE RESEARCH TOOL OVER ALL SUB AGENTS
- Use ArguSeek to read documentation and research relevant background for the task
- Search for best practices, prior art, and technical context with research_iteratively
- Use `search_semantic` and `search_regex` with small, focused queries
- Multiple targeted searches > one broad search

# Architecture First

LEARN THE SURROUNDING ARCHITECTURE BEFORE CODING.

- Understand the big picture and how components fit
- Find and reuse existing code - never duplicate
- When finding duplicate responsibilities, refactor to shared core
- Match surrounding patterns and style

# Coding Standards

KISS - Keep It Simple:

- Write minimal code that compiles and lints cleanly
- Fix bugs by deleting code when possible
- Optimize for readability and maintenance
- No over-engineering, no temporary compatibility layers
- No silent errors - failures must be explicit and visible
- Run tests after major changes
- Document inline when necessary

# Operational Rules

- Time-box operations that could hang
- Use `uuidgen` for unique strings
- Use `date +"%Y-%m-%dT%H:%M:%S%z" | sed -E 's/([+-][0-9]{2})([0-9]{2})$/\1:\2/'` for ISO-8601
- Use flat directories with grep-friendly naming
- Point out unproductive paths directly

# Critical Constraints

- NEVER Commit without explicit request
- NEVER Leave temporary/backup files (we have version control)
- NEVER Hardcode keys or credentials
- NEVER Assume your code works - always verify
- ALWAYS Clean up after completing tasks
- ALWAYS Produce clean code first time - no temporary backwards compatibility
- ALWAYS Use sleep for waiting, not polling
```

### דוגמת קובץ לרמת הפרויקט

קונטקסט ברמת פרויקט מכיל את מה שחבר צוות חדש צריך כדי להיות פרודוקטיבי בשעה הראשונה: פרטי הסטאק הטכנולוגי, פקודות נפוצות, ידע שבטי, וקונבנציות קידוד. הנה ה-`CLAUDE.md` האמיתי מהריפו של הקורס הזה:

````markdown
# AI Coding Course - Project Context

## Mindeset

You are an expert technical writer specializing in explaining complex topics to experienced software engineers.

## Project Overview

This is an **AI Coding Course designed for Senior Software Engineers**. The course teaches experienced developers how to effectively leverage AI coding assistants in production environments.

**Target Audience:** Senior engineers with 3+ years of professional experience
**Estimated Course Duration:** 24-33 hours of hands-on training

## Technology Stack

**Platform:** Docusaurus 3.9.2 (Static site generator)
**Languages:** TypeScript 5.6.2, React 19.0
**Key Features:**

- Live code blocks with `@docusaurus/theme-live-codeblock`
- MDX support for interactive components
- Full-text search with `@easyops-cn/docusaurus-search-local`
- Versioning system for content snapshots

## Development Commands

```bash
# Development
cd website && npm start              # Start dev server (localhost:3000)
npm run build                        # Production build
npm run serve                        # Preview production build locally

# Deployment
npm run deploy                       # Deploy to GitHub Pages
```

## Tone & Communication Style

**Coworker-level communication** - Professional, direct, no hand-holding

- Assume strong fundamentals (data structures, design patterns, system design)
- Skip basic explanations - link to external docs if needed
- Focus on practical application and production considerations
- Use industry-standard terminology without over-explaining

## Content Philosophy

**Production-Ready Architecture Focus**

- Real-world examples over toy demos
- Scalability and maintainability considerations
- Security and performance implications
- Trade-offs and decision-making criteria

**Minimalism & Clarity**

- Concise explanations
- Code examples that compile and run
- Clear learning objectives per lesson
- Hands-on exercises with real scenarios

## Key Configuration Files

- `website/docusaurus.config.ts` - Site configuration
- `website/sidebars.ts` - Auto-generated from docs structure
- `website/package.json` - Dependencies and scripts
- `.github/workflows/deploy.yml` - GitHub Pages deployment

## Deployment

- **Platform:** GitHub Pages
- **URL:** https://agenticoding.ai
- **Trigger:** Automatic on push to main branch
- **Base URL:** `/`
````

## יצירה אוטומטית: Bootstrap עם AI

**מהלך העל: יישום החומר משיעורים 3-5 כדי לייצר קבצי קונטקסט בצורה אוטומטית.** במקום לכתוב ידנית `AGENTS.md` או `CLAUDE.md`, השתמשו בתהליך העבודה בארבעה שלבים ([שיעור 3](/docs/methodology/lesson-3-high-level-methodology)) כדי לתת לסוכנים לעשות bootstrap לקונטקסט שלהם. **שלב המחקר:** השתמשו בכלי `code_research` של ChunkHound להבנת הארכיטקטורה, התבניות והקונבנציות של הפרויקט—שאלו על ארכיטקטורה, סגנונות קידוד, אחריות מודולים, וקונבנציות בדיקה, וכו' לבניית הבנה ארכיטקטונית מקיפה. השתמשו ב-`research_iteratively` ו-`fetch_url` של ArguSeek להבאת תיעוד הפריימוורק, שיטות עבודה מומלצות, והנחיות אבטחה רלוונטיות לסטאק הטכנולוגי שלכם. **שלב התכנון:** הסוכן מסנתז תובנות מבסיס הקוד (מ-ChunkHound) וידע תחומי (מ-ArguSeek) לתוכנית קובץ קונטקסט מובנית. **שלב הביצוע:** צרו את קובץ הקונטקסט באמצעות טכניקות אופטימיזציית פרומפט ספציפיות למודל שלכם. **שלב האימות:** בדקו את הקונטקסט שנוצר עם משימה טיפוסית, ועשו איטרציה על סמך פערים.
<div dir='ltr'>
<GenerateAgentsMD />
</div>

הפרומפט הזה מדגים עיגון ([שיעור 5](/docs/methodology/lesson-5-grounding)): ChunkHound מספק קונטקסט ספציפי לבסיס הקוד, ArguSeek מספק ידע אקוסיסטם עדכני, ושרשרת חשיבה מובנית מבטיחה שהסוכן עוקב אחר נתיב שיטתי. התוצאה: קבצי קונטקסט מוכנים לסביבת ייצור שנוצרו באיטרציה אחת, במקום לאסוף חוקים והוראות ידנית לאורך שבועות. הוסיפו ידע שבטי ידנית אחר כך—תקלות ייצור, קונבנציות צוות, מלכודות נסתרות שרק בני אדם מכירים.

:::tip הפניה
ראו את תבנית הפרומפט המלאה עם הנחיות אימות והתאמות: [Generate AGENTS.md](/prompts/onboarding/generate-agents-md)
:::

---

**הבא:** [שיעור 7: תכנון וביצוע](./lesson-7-planning-execution.md)
