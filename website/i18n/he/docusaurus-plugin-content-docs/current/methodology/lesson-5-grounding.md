---
sidebar_position: 3
sidebar_label: 'שיעור 5: עיגון -  Grounding'
title: 'Grounding: עיגון סוכנים למציאות'
---

import UShapeAttentionCurve from '@site/src/components/VisualElements/UShapeAttentionCurve';
import GroundingComparison from '@site/src/components/VisualElements/GroundingComparison';

אתם מבקשים מהסוכן שלכם לתקן באג באותנטיקציה. הוא מייצר בביטחון פתרון באמצעות JWT verification patterns... שלא קיימים בבסיס הקוד שלכם. אתם משתמשים ב-sessions, לא ב-JWTs. הסוכן פשוט המציא מימוש סביר המבוסס על תבניות נפוצות מהחומר עליו הוא אומן.

הנה הבעיה הבסיסית: **הסוכן לא יודע שבסיס הקוד שלך קיים.** הוא לא מכיר את הארכיטקטורה שלך, את דפוסי הפיתוח שלך, או את המגבלות שלך. כפי שכוסה ב[שיעור 2 על הסוכנים](/docs/fundamentals/lesson-2-how-agents-work), חלון הקטנטקסט הוא העולם כולו של הסוכן—כל השאר לא קיים. ללא grounding, או "⚓עיגון" מפורש אל הקוד האמיתי שלך ואל התיעוד הנוכחי, סוכנים מייצרים פתרונות סבירים סטטיסטית שעשויים להיות שגויים לחלוטין עבור המערכת שלך.

**עיגון הוא האופן שבו מזריקים מציאות לחלון הקונטקסט.** אתם משיגים מידע חיצוני רלוונטי — דפוסים שחוזרים בקוד הבסיס שלכם, תיעוד עדכני, best practices—ומזינים אותו לסוכן לפני הביצוע. שיעור זה מכסה את טכניקות ההנדסה שמעגנות סוכנים למערכת האמיתית שלכם במקום להיפותזות.
המילה grounding באנגלית מתורגמת לעיתים כ"קרקוע" או "הארקה" ואף "ביסוס". הכוונה היא לחבר את הסוכן לקרקע המציאות.

<!-- doc-only-start -->
<GroundingComparison />
<!-- doc-only-end -->

<!-- presentation-only-start -->

**ללא Grounding:**

- עובד מ-patterns אימון גנריים שהוקפאו בינואר 2025
- מנחש את הארכיטקטורה והספריות שלך
- יוצר hallucinations של מימושים שנראים סבירים אבל לא תואמים את ה-codebase שלך
- מפספס פגיעויות אבטחה עדכניות ושינויי API
- פתרונות שגויים בביטחון הבנויים מ-patterns סטטיסטיים

**עם Grounding:**

- עובד מה-codebase האמיתי שלך (ChunkHound משיג קוד אמיתי)
- משתמש בתיעוד עדכני (ArguSeek מביא מסמכי API עדכניים)
- מודע ל-security advisories עדכניות ו-breaking changes
- עוקב אחר ה-patterns והארכיטקטורה הקיימים שלך
- פתרונות שמשתלבים בצורה נקייה במערכת שלך
<!-- presentation-only-end -->

:::info גילוי נאות
גם [ChunkHound](https://chunkhound.github.io/) וגם [ArguSeek](https://github.com/ArguSeek/arguseek) הם פרויקטים בקוד פתוח שנבנו על ידי מחבר הקורס. הם מופיעים לאורך כל הקורס כי הם מיישמים בדיוק את הרעיונות שהקורס מלמד — בידוד, sub-agents, חיפוש סמנטי, ניהול קונטקסט.

העקרונות חלים באופן אוניברסלי. חלופות לכלים האלו קיימות ומתועדות. השתמשו במה שמתאים לצורת העבודה שלכם. המתודולוגיה נשארת עקבית ללא קשר לכלים.
:::

## Grounding: עיגון סוכנים אל המציאות

**עיגון הוא האופן שבו אתה מזריק מציאות לחלון הקונטקסט.** אתם משיגים מידע חיצוני רלוונטי — דפוסים שחוזרים בקוד הבסיס שלכם, תיעוד עדכני, best practices—ומזינים אותו לסוכן לפני הביצוע. שיעור זה מכסה את טכניקות ההנדסה שמעגנות סוכנים למערכת האמיתית שלכם במקום להיפותזות.

##  בעיית החיפוש הסוכני-Discovery:

כשנותנים פרומפט כמו "תקן את באג האימות", הסוכן מתחיל עם אפס ידע על ה-codebase. הוא לא יודע איפה נמצא קוד האימות, באילו ספריות משתמשים פה, או איך הקוד בנוי.

**חיפוש אייגנטי הוא האופן שבו הסוכן מגלה את ה-codebase שלך באופן אוטונומי.** הסוכן קורא לכלים בעצמו—Glob מוצא קבצים התואמים לGrep ספציפי, מחפש מילות מפתח. Read בוחן קוד. הסוכן מחליט מה לחפש, מפרש תוצאות, וקובע את הצעדים הבאים.

**דוגמה לפלואו:**

```
Task: "Fix JWT expiration validation"

Agent: I'll search for JWT-related code
← Grep("JWT", "**/*.ts")

Tool result: Found in:
  - src/auth/jwt.ts:45: export function verifyToken(טוקן: string)
  - src/middleware/auth.ts:12: import { verifyToken } from '../auth/jwt'
  - tests/auth.test.ts:8: describe('JWT verification')

Agent: Let me read the verification logic
← Read("src/auth/jwt.ts")

Tool result: [verification logic shows expiration check missing]

Agent: Found it - the verifyToken function doesn't check exp claim
```

בבסיסי קוד קטנים (פחות מ-10,000 שורות), זה עובד יפה. שניים או שלושה חיפושים מחזירים 5-10 קבצים. בסך הכל 15,000 טוקנים. הסוכן קורא אותם, בונה מודל מנטלי, ופותר את הבעיה. הקונטקסט נשאר נקי.

**בסקייל גדול, חיפוש אייגנטי קורס.** חיפוש של "authentication" בפרויקט של 100,000 שורות יחזיר 80+ קבצים. קריאתם צורכת מעל 60,000 טוקנים לפני שהסוכן מסיים את ה-discovery—חצי מחלון הקונטקסט האפקטיבי נעלם. מידע קריטי שסיפקת מראש נדחף לאמצע, שם הוא נעלם מעיני הסוכן, ככל שתוצאות החיפוש מציפות אותו.

## בעיית הסקֶייל: מגבלות חלון הקונטקסט

Claude Sonnet 4.5 מפרסם תמיכה ב-200,000 טוקנים. והמציאות? טווח תשומת הלב האמין משתרע על 60,000-120,000 טוקנים (30-60% מהמפורסם)—**אשליית חלון הקונטקסט**.

<UShapeAttentionCurve />

**U-shaped attention הוא האופן שבו transformers באמת עובדים.** ההתחלה והסוף של הקונטקסט שלך מקבלים תשומת לב חזקה. האמצע מקבל התייחסות שטחית או מדולג עליו לחלוטין. זה לא באג—זו ארכיטקטורת transformer תחת אילוצים ריאליסטיים.

**קונטקסט מלא מוביל לאיבוד שליטה.** הגבולות והאילוצים הקריטיים שפרטת נדחפים לאמצע—לאזור שהמודל מתעלם ממנו ולעולם לא רואה.

**חיפוש אייגנטי מעצים את הבעיה הזו כשהסקייל גדל.** שלושה חיפושי Grep מחזירים 18,000 טוקנים. קריאת חמישה קבצים מוסיפה עוד 22,000 טוקנים. אתם ב-40,000 טוקנים והסוכן עוד לא סיים את ה-discovery. איפה ההגבלות והדרישות הראשוניים שלך? קבורים באמצע, והמודל מתעלם מהם.

### פתרון 1: חיפוש סמנטי

**חיפוש סמנטי מאפשר לך לחפש לפי משמעות, לא לפי מילות מפתח.** חיפוש כמו "authentication middleware that validates user credentials" ימצא קוד רלוונטי גם אם הוא לא מזכיר את המונחים המדויקים האלה.

:::tip איך חיפוש סמנטי עובד

**Vector embeddings:** הקוד שלך מומר לוקטורים רב-ממדיים (768-1536 ממדים) שלוכדים משמעות סמנטית. קונספטים דומים מתקבצים יחד ב-vector space.

**Similarity matching:** cosine similarity מוצא צ'אנקים רלוונטיים. "auth middleware", "login verification", ו-"JWT validation" ממופים ל-וקטורים קרובים—המודל מבין שהם קשורים סמנטית למרות שהם משתמשים במילים שונות.

**Infrastructure:** vector databases (ChromaDB, pgvector, Qdrant) בתוספת אלגוריתמי approximate nearest neighbor (ANN) מאפשרים חיפוש מהיר. rerankers משפרים תוצאות. אתם קוראים ל-`()code_research`, לא ל-APIs ברמה נמוכה.

**הבדל עקרוני:** embedding models עם vector similarity מחפשים לפי קונספט, לא טקסט. זה שונה מהותית מהשוואת מילות מפתח.
:::

**זמינות תלויה בכלי שלך:**

**עוזרים מבוססי IDE** כמו Cursor, Windsurf, Cline בדרך כלל כוללים חיפוש סמנטי מובנה. העורך מטפל ב-indexing ו-vector search באופן אוטומטי.

**סוכני CLI** (Claude Code, Copilot CLI, Codex) צריכים שרתי MCP כדי להוסיף חיפוש סמנטי. [Model Context Protocol (MCP)](https://modelcontextprotocol.io) מאפשר לך להרחיב סוכני CLI עם tools כמו חיפוש סמנטי, web research, וגישה ל-databases.

**שרתי MCP לחיפוש קוד סמנטי:**

- [Claude Context](https://github.com/zilliztech/claude-context)   חיפוש סמנטי מבוסס RAG 
- [Serena](https://github.com/oraios/serena) - גשר מבוסס LSP (קל יותר, מוגבל ל-LSP symbol scope)
- [ChunkHound](https://chunkhound.github.io) - תהליך מובנה מובנה עם חיפוש היברידי

ברגע שיש לך חיפוש סמנטי (מובנה או דרך MCP), הסוכן שלך משלב אותו עם Grep ל-hybrid discovery: conceptual search למציאת האזור הנכון, keyword matching מדויק לאיתור מימושים מדויקים.

**חיפוש סמנטי מרחיב את הסקייל שלך למעלה מ-100,000 שורות קוד.** אפשר למצוא קוד רלוונטי מהר יותר עם פחות תוצאות שגויות.

**אבל עדיין יש מגבלה:** חיפוש סמנטי עדיין ממלא את הקונטקסט של הסוכן הראשי, הסוכן המתזמר (orchestrator). עשרה צ'אנקים סמנטים (15,000 טוקנים) בתוספת קריאת קבצים (25,000 טוקנים) בתוספת חקירת דפוסים רלוונטים (10,000 טוקנים) אומר שהגעת ל-50,000 טוקנים - חצי מהקונטקסט האפקטיבי שלך נצרך עוד לפני שהסוכן בכלל מתחיל לחשוב על המשימה האמיתית.

## פתרון 2: Sub-Agents לבידוד קונטקסט

**תת-סוכן** הוא סוכן שמופעל על ידי סוכן אחר—כמו קריאה לפונקציה, אבל לסוכנים. הסוכן המתזמר כותב פרומפט (פרמטרי הפונקציה) המתאר את משימת המחקר: "מצא את כל קוד אימות ה-JWT והסבר את המימוש הנוכחי." התת-סוכן מבצע בקונטקסט מבודד משלו, מריץ חיפושים וקורא קבצים. עם השלמה, הוא מחזיר סיכום תמציתי (הערך המוחזר מהפונקציה): "מימוש JWT נמצא ב-src/auth/jwt.ts משתמש ב-Passport.js..." סיכום זה נטען לקונטקסט של המתזמר — בדרך כלל 2,000-5,000 טוקנים לעומת 50,000-150,000 הטוקנים שתת-הסוכן עיבד פנימית.

**איך זה עובד בפועל:**

```
Your orchestrator (clean context with your task and constraints):
  "I need to understand how JWT authentication is implemented.
   Delegate research to code sub-agent."

Code sub-agent spawns (fresh isolated context):
  - Runs semantic search: "JWT authentication patterns" → 12,000 tokens of results
  - Reads 3 files: src/auth/jwt.ts, middleware/auth.ts, config/jwt.ts → 18,000 tokens
  - Searches related patterns: "token validation" → 7,000 tokens
  - Total consumed in sub-agent context: 37,000 tokens

Sub-agent synthesizes and returns to orchestrator:
  "JWT authentication implementation found:
   - Location: src/auth/jwt.ts:45-67
   - Library: Passport.js with JWT strategy
   - Pattern: Express middleware → Passport strategy → token validation
   - Algorithm: RS256 with public key verification
   - Current issue: Missing expiration check in verifyToken()"

Your orchestrator receives: 180 tokens instead of 37,000
```

**הפשרה היא עלות טוקנים, לא דיוק.** משלמים על עיבוד טוקנים בשני הקונטקסטים, מגדילים את העלות הכוללת באופן משמעותי, אבל ה-orchestrator שלך שומר על קונטקסט נקי לאורך כל הדרך. זה אומר דיוק באיטרציה הראשונה, שבדרך כלל חוסך טוקנים בהשוואה למחזורי תיקון מרובים הנובעים מקונטקסט עמוס.

**ללא תת-סוכנים, עדיין אפשר להסתדר.** נצלו את ה-U-curve: שימו אילוצים קריטיים בהתחלה, שימו משימות בסוף. מידע תומך הולך באמצע—שם המודל יכול לסרוק אותו במידת הצורך, אבל הוא עדיין נגיש.

### שתי ארכיטקטורות תת-סוכן

**Autonomous architecture:** נותנים לתת-סוכן כלים (Grep, Read, Glob) ו-system prompt שמגדירה את אסטרטגיית המחקר שלו. הסוכן מחליט באופן אוטונומי מה לחפש, מה לקרוא, ואיך לסנתז.

דוגמה: Explore agent של Claude Code. אתה שולח לו שאלת מחקר, הוא בוחר באופן אוטונומי כלים ורצפים, ואז מסנתז תוצאות. פשוט יותר לבנות, זול יותר להפעיל, גמיש למשימות מחקר שונות.

**Structured architecture:** את בונה מישור בקרה דטרמיניסטי שמגדיר את אלגוריתם החיפוש המדויק (breadth-first traversal, hybrid semantic + symbol search). ה-LLM מקבל החלטות טקטיות בתוך המבנה שלך ("האם להרחיב את הסימבול הזה?" "האם הצ'אנק הזה רלוונטי?").

דוגמה: ChunkHound משתמש ב-multi-hop pipeline קבוע שבו המערכת שולטת באסטרטגיית המעבר וה-LLM מדרג שייכות בנקודות החלטה. מורכב יותר לבנות, עלות גבוהה יותר, אבל שומר על אחידות רמת התוצאות בסקייל קיצוני.

**ה-architectural trade-off:** סוכנים אוטונומיים עובדים היטב אבל מתדרדרים בבסיסי קוד גדולים שבהם הם עושים בחירות חיפוש לא אופטימליות. סוכנים מובנים מתרחבים באופן אמין אבל עולים יותר לבנות ולהפעיל.

<!-- presentation-only-start -->

**השוואת ארכיטקטורות תת-סוכן - שתי הגישות תקפות בהתאם לסקייל של ה-codebase. השתמש ב-styling ניטרלי.**

| גישה A (Autonomous)                    | גישה B (Structured)                       |
| ------------------------------------------ | --------------------------------------------- |
| סוכן מחליט search strategy באופן אוטונומי | Control plane דטרמיניסטי מגדיר algorithm |
| פשוט יותר לבנות ולתחזק              | מתרחב באופן אמין למיליוני שורות קוד            |
| עובד היטב למשימות research מגוונות       | LLM מקבל החלטות טקטיות בתוך structure |
| מתדרדר ב-codebases גדולים מאוד           | עלות ומורכבות גבוהות יותר לבנייה           |

<!-- presentation-only-end -->

### זמינות תת-סוכנים

**זמינות תלויה בפלטפורמת הסוכן שלך:**

**Claude Code** כולל את סוכן הExplore המובנה—תת-סוכן אוטונומי למחקר לתוך הקוד שעובד ישר מהקופסה.

**סוכני CLI אחרים** (Copilot CLI, Aider, וכו') ו**לרוב עוזרי ה-IDE** אין פונקציונליות תת-סוכן מובנית למחקר בקוד. לפלטפורמות אלה, [ChunkHound](https://chunkhound.github.io) דרך MCP היא כרגע האפשרות היחידה להוסיף יכולות מחקר לתוך הקוד מבוססות תת-סוכנים.

**עוזרי IDE** (Cursor, Windsurf, Cline) בדרך כלל לא חושפים ארכיטקטורות תת-סוכן ישירות, אם כי לחלקם עשויות להיות יכולות פנימיות למחקר לתוך הקוד. כדאי לבדוק את התיעוד של ה-IDE שלך כדי לראות מה זמין.

## Code Grounding: בחירת כלים לפי סקייל

גודל 
בסיס הקוד שלך קובע איזו גישת עיגון עובדת. כך לבחור:

### טבלת עזר לבחירת הכלי המתאים

| סקייל           | כלים מומלצים                                                                                                                                             | נקודת השבירה                                                 | למה                                                                                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **< 10k שורות קוד**   | חיפוש אייגנטי (Grep, Read, Glob)                                                                                                                             | N/A - עובד באופן אמין בסקייל זה                             | מהיר, זול, כיסוי מספיק. ללא indexing overhead.                                                                                                                 |
| **10-100K שורות קוד** | **Claude Code:** סוכן Explore<br/>**סוכני CLI אחרים:** ChunkHound מחקר לתוך הקוד (MCP)<br/>**חלופה:** חיפוש סמנטי (Claude Context, Serena דרך MCP) | חיפושים המחזירים 50+ קבצים מתחילים להציף את הקונטקסט        | תת-סוכנים מבודדים מחקר בקונטקסטים נפרדים. חיפוש סמנטי מרחיב חיפוש אייגנטי עם שאילתות על משמעות. ChunkHound היא אפשרות התת-סוכן MCP היחידה. |
| **100K+ שורות קוד**   | ChunkHound code research מחקר לתוך הקוד (תת-סוכן מובנה)                                                                                               | חיפוש אייגנטי מפספס הקשרים ארכיטקטונים בין מודולים | חיוני ב-1M+ שורות קוד. הגישה היחידה עם progressive aggregation על פני בסיסי קוד גדולים.                                                                                |

:::tip מדידת שורות קוד

השתמש|י ב-[`cloc`](https://github.com/AlDanial/cloc) למדידת גודל בסיס הקוד שלך: ` . cloc` מחזיר פירוט לפי שפה. התמקדו בעמודת "Code" לספירות שורות קוד מדויקות.
:::

### Deep Dive: ארכיטקטורת ChunkHound

[ChunkHound](https://chunkhound.github.io)—structured pipeline למחקר לתוך קוד בסקייל גדול.

**מיצוב עיקרי:** ChunkHound הוא כרגע התת-סוכן המבוסס-MCP היחיד למחקר לתוך הקוד. לסוכני CLI מלבד Claude Code (שיש לו Explore מובנה), ChunkHound דרך MCP היא הדרך היחידה להוסיף פונקציונליות תת-סוכן.

**ה-Pipeline:**

1. **Multi-hop BFS traversal** דרך semantic relationships
2. **Hybrid semantic + symbol search**—conceptual discovery, ואז exhaustive regex לכל סימבול
3. **Map-reduce synthesis**—architectural relationships עם תוצאות של `שם-קובץ:שורה` 

**הנחיות לסקייל:**

- **מתחת ל-10,000 שורות קוד:** סוכן Explore זול יותר (ChunkHound מוסיף עלות ו-latency של 1-2x)
- **בערך 10,000 שורות קוד:** Inflection point—ChunkHound הופך בעל ערך אם אתה שוב ושוב מחבר components לאורך בסיס הקוד
- **100,000+ שורות קוד:** Highly valuable—סוכנים אוטונומיים מתחילים להראות תוצאות לא שלמות
- **1,000,000+ שורות קוד:** Essential—הגישה היחידה עם progressive aggregation

**שימוש:** `Research our authentication middleware architecture`

**מחזיר:** מיקומי components, architectural patterns, relationships בין modules עם ציטוטים.

**שימושי עבור:** הכנה למימוש feature, complex debugging, refactoring analysis, code archaeology, כאשר Explore מחזיר תוצאות לא שלמות.

**Alternatives:** [Claude Context](https://github.com/zilliztech/claude-context)—semantic search via RAG. [Serena](https://github.com/oraios/serena)—LSP bridge instead of full semantic search (faster, lighter, but limited to language server symbol scope). Neither implements structured multi-hop traversal.

## Web Grounding: אותו רעיון, מקורות שונים

אנחנו צריכים יותר מרק את בסיס הקוד שלנו. אנחנו צריכים ידע עדכני לגבי האקוסיסטם שלנו:: API docs, best practices, security advisories, research.

**עיגון באינטרנט סובל מאותה התנהגות כמו עיגון לקוד:** כלים פשוטים עובדים בהתחלה, ואז פוגעים במגבלות הקונטקסט, ואז צריכים פתרונות מתוחכמים.

### חיפוש אינטרנט מובנה

רוב העוזרים (Claude Code, Copilot, Cursor) כוללים חיפוש אינטרנט בסיסי. זה עובד לשאילתות פשוטות.

**המגבלה:** אותה בעיית זיהום קונטקסט. כל חיפוש צורך 8,000-15,000 טוקנים. כל עמוד שמתווסף מוסיף 3,000-10,000 טוקנים. דיאגרמת ה-U  עדיין חלה— אם הקונטקסט שלך מתמלא עם תוצאות חיפוש האילוצים וההנחיות המקוריים שלך נדחפים לאמצע שהמודל מתעלם ממנו.

### כלי סינתזה (Perplexity)

:::tip Synthesis Tools
כלי סינתזה הם רכיבים במערכת GenAI שמאחדים ומעבדים מידע קיים כדי ליצור תוצר חדש ובעל ערך גבוה יותר.
הם משלבים תוצאות של סוכנים, מסמכים או שלבי חשיבה לכדי סיכום, החלטה, תכנית או פלט מובנה אחד.
כלי סינתזה לא מביאים מידע חדש, אלא מחברים ומזקקים את מה שכבר קיים.
:::

Perplexity וכלים דומים מחפשים, מביאים, מאחדים ומסנתזים לפני החזרת התוצאות אליך.

**השיפור:** הבאה גולמית הייתה עולה 15,000-30,000 טוקנים. סינתזה דוחסת זאת ל-3,000-8,000 טוקנים לכל שאילתה.

**המגבלות:**

- משתמש באינדקסים מותאמים אישית (Bing) במקום Google, כך שאיכות החיפוש סובלת
- אתה פוגע במגבלות הקונטקסט אחרי 3-5 שאילתות
- ללא ניהול מצב—שאלות המשך מכריחות את הכלי להסביר מחדש יסודות במקום לבנות על מחקר קודם

### ArguSeek: קונטקסט מבודד + ניהול מצב

[ArguSeek](https://github.com/ArguSeek/arguseek) הוא תת-סוכן מחקר אינטרנט עם קונטקסט מבודד וניהול מצב סמנטי.

**יתרון הסקייל:** ArguSeek מעבד 12-30 מקורות לכל קריאה. אפשר לבצע עשרות קריאות לכל משימה, לסרוק 100+ מקורות בסך הכל תוך שמירת קונטקסט המתזמר שלך נקי.

**איך זה עובד:**

1. **Google Search API** מספק איכות חיפוש במקום חלופות Bing/Brave
2. **פירוק שאילתות** (דרך Gemini) מריץ 3 וריאציות שאילתות במקביל: תיעוד רשמי + דיונים קהילתיים + התראות אבטחה
3. **חיסור סמנטי** אומר ששאילתות המשך מדלגות על תוכן שכבר כוסה ומקדמות את המחקר שלך במקום לחזור על יסודות

**רצף מחקר לדוגמה:**

```
Q1: "Passport.js JWT authentication best practices?"
    → Processes 15 sources
    → Returns 2,800 tokens to your orchestrator

Q2: "Known security vulnerabilities in Passport JWT?" (builds on Q1 context)
    → Processes 20 sources, skipping duplicate content from Q1
    → Returns 3,600 tokens (no repeated basics)

Q3: "RS256 vs HS256 implementation trade-offs?" (builds on Q1+Q2 context)
    → Processes 18 sources, skipping already-covered territory
    → Returns 2,900 tokens (advances research)

Total research: 53 sources processed
Total cost to your orchestrator: 9,300 tokens instead of 42,000+ from raw fetching
```

### צלילה לעומק: ארכיטקטורת ArguSeek

[ArguSeek](https://github.com/ArguSeek/arguseek)—צינור מובנה למחקר אינטרנט עם ניהול מצב סמנטי.

**מבדילים עיקריים:**

1. **Google Search API**—איכות לעומת Bing/proprietary
2. **חיסור סמנטי**—חסר מצב אבל מודע לקונטקסט. שאילתות המשך מדלגות על תוכן שכבר כוסה, מקדמות מחקר במקום להסביר מחדש
3. **פירוק שאילתות**—3 וריאציות במקביל לכל שאילתה (תיעוד + קהילה + התראות)
4. **זיהוי הטיה**—מסמן שיווק ספקים, מפעיל מחקר נגדי
5. **סינתזת PDF**—חילוץ ויזואלי של Gemini

<div dir="ltr">
**Tools כלים:**
- `research_iteratively`—multi-source synthesis with citations
- `fetch_url`—targeted page extraction
</div>

**שימושי עבור:** מחקר שיטות עבודה מומלצות, גישות מתחרות, התראות אבטחה, לימוד טכנולוגיות חדשות, אימות הטיה.

**חלופות:** [Perplexity](https://perplexity.ai) (Bing), [OpenAI Deep Research](https://platform.openai.com/docs/guides/deep-research), [Consensus](https://consensus.app), [Elicit](https://elicit.com). לרובם חסר שילוב Google API + חיסור סמנטי.

## תבנית פרודקשן: עיגון מרובה מקורות

בכתיבה לפרודקשן, בדרך כלל נשלב עיגון לקוד עם עיגון לאינטרנט:

```
Task: "Implement OAuth2 client credentials flow for our API"

1. Code research: How does existing authentication work? (ChunkHound)
   → Returns: Current session-based auth architecture, middleware patterns,
              where auth config lives (3,200 tokens)

2. Web research: What are current OAuth2 best practices and known CVEs? (ArguSeek)
   → Returns: RFC 6749 implementation guidance, security considerations,
              recent vulnerabilities in popular libraries (4,800 tokens)

3. Implementation: Synthesize both sources
   → Follows your existing architecture patterns (code-grounded)
   → Uses 2025 security standards (web-grounded)
   → Avoids known vulnerabilities (web-grounded)
   → Integrates cleanly with your middleware (code-grounded)
```

גישה מרובת מקורות זו מונעת שני מצבי כשל:

- עיגון לקוד בלבד מונע הזיות אבל מסתכן בשימוש בתבניות מיושנות
- עיגון לאינטרנט בלבד נותן לך שיטות עבודה מומלצות עדכניות אבל לא מתאים לארכיטקטורה שלך

שילוב של שניהם נותן לך פתרונות שעובדים למערכת הספציפית שלך תוך שימוש בתקנים עדכניים.

## נקודות מפתח

**הסוכן יודע רק מה שבחלון הקונטקסט**
ללא עיגון, סוכנים יוצרים הזיות—פתרונות שנראים סבירים אבל מבוססים על תבניות נתוני אימון בלבד. אנחנו מעגנים סוכנים על ידי הזרקת מידע חיצוני (בסיס הקוד שלך, תיעוד עדכני, מחקר) לקונטקסט לפני הייצור.

**חיפוש אייגנטי הוא גילוי אוטונומי מבוסס כלים**
הסוכן קורא ל-Grep, Read, ו-Glob בעצמו לחקור את בסיס הקוד שלך. זה עובד יפה לפרויקטים קטנים (מתחת ל-10,000 שורות). בסקייל גדול, תוצאות חיפוש מציפות את חלון הקונטקסט ודוחפות את האילוצים שלך לאמצע—לאזור שהמודל מתעלם ממנו.

**אשליית חלון הקונטקסט: הקיבולת המפורסמת ≠ תשומת הלב האפקטיבית**
מודלים מפרסמים תמיכה ב200,000 טוקנים אבל מעבדים באופן אמין 60,000-120,000 טוקנים (30-60%). עקומת תשומת הלב בצורת U אומרת שההתחלה והסוף מקבלים תשומת לב חזקה, בעוד האמצע מקבל התייחסות שטחית או מדולג עליו. זו ארכיטקטורת transformer תחת אילוצים ריאליסטיים, לא באג.

**חיפוש סמנטי מחפש לפי משמעות במקום מילות מפתח**
הטמעות וקטוריות מאפשרות לך לחפש לפי קונספט: "authentication middleware" מוצא קוד רלוונטי גם ללא התאמות מדויקות של מילות מפתח. זה מרחיב את הסקייל שלך ל-100,000+ שורות קוד.

**תת-סוכנים מבודדים מחקר בקונטקסטים נפרדים**
אתה מאציל מחקר לתת-סוכן עם קונטקסט משלו. הוא מעבד 50,000-150,000 טוקנים של תוצאות חיפוש ומחזיר סינתזה של 2,000-5,000 טוקנים. זה עולה יותר טוקנים אבל מספק דיוק באיטרציה ראשונה דרך קונטקסט מתזמר נקי.

**שתי ארכיטקטורות תת-סוכן משרתות סקיילים שונים**
סוכנים אוטונומיים (Explore של Claude Code) מחליטים על אסטרטגיה משלהם—פשוטים וגמישים. סוכנים מובנים (ChunkHound) עוקבים אחר אלגוריתמים דטרמיניסטיים—יקרים יותר אבל מתרחבים באופן אמין למיליוני שורות.

**ביחרו כלי עיגון לפי סקייל בסיס הקוד** - 
מתחת ל-10,000 שורות קוד: חיפוש אייגנטי עובד באופן אמין. 10,000-100,000 שורות קוד: הוסיפו חיפוש סמנטי או סוכן Explore. מעל 100,000 שורות קוד: השתמשו בכלי מחקר קוד מובנה (ChunkHound).הכלי שאתם צריכים תלוי בסקייל שלכם.

**עיגון לאינטרנט - אותו רעיון**:
חיפוש מובנה עובד לשאילתות פשוטות. כלי סינתזה (Perplexity) דוחסים תוצאות. תת-סוכנים (ArguSeek) שומרים מצב על פני 100+ מקורות תוך שמירת הקונטקסט שלך נקי.

**מערכות פרודקשן משלבות עיגון לקוד + לאינטרנט**
עגן בבסיס הקוד שלך למניעת הזיות והתאמה לארכיטקטורה שלך. עגן במקורות אינטרנט עדכניים לקבלת שיטות עבודה מומלצות ולהימנעות מתבניות מיושנות. שילוב של שניהם מונע פתרונות שעובדים בתיאוריה אבל לא מתאימים למערכת שלך.

---

**הבא:** מודול המתודולוגיה הושלם. כעת יש לך את תהליכי העבודה הבסיסיים (Plan > Execute > Validate), תבניות תקשורת (Prompting 101), ואסטרטגיות ניהול קונטקסט (עיגון) להפעלת סוכני AI ביעילות בסביבות פרודקשן.
