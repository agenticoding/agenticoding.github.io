---
title: שרתי MCP
sidebar_position: 4
---

# שרתי MCP

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) מרחיב סוכני CLI עם יכולות מתמחות - מחקר קוד, עיגון (grounding) לאינטרנט, אוטומציית דפדפן. בעוד שעוזרים מבוססי IDE כמו Cursor ו-Windsurf לרוב כוללים תכונות אלה מובנות, סוכני CLI כמו Claude Code, Copilot CLI ו-Aider מסתמכים על שרתי MCP כדי להוסיף פונקציונליות מעבר לפעולות בסיסיות על קבצים.

שרתי MCP אלה מטפלים בפערים הקריטיים בתהליכי עבודה של פיתוח בסיוע AI.

## מחקר קוד

### ChunkHound

[ChunkHound](https://chunkhound.github.io) מספק חיפוש קוד סמנטי ומחקר מובנה באמצעות תת-סוכנים (sub-agents) עבור בסיסי קוד גדולים.

**מה הוא עושה:**

- חיפוש סמנטי multi-hop דרך קשרים בקוד
- חיפוש היברידי סמנטי + סימבולי (גילוי קונספטואלי, ואז regex ממצה)
- סינתזה בגישת map-reduce עם קשרים ארכיטקטוניים וציטוטי `file:line`

**מתי להשתמש בו:**

- **10,000-100,000 שורות קוד:** שימושי כשמחברים רכיבים שוב ושוב ברחבי בסיס הקוד
- **100,000+ שורות קוד:** בעל ערך רב כאשר סוכנים אוטונומיים מחזירים תוצאות חלקיות
- **1,000,000+ שורות קוד:** חיוני - הגישה היחידה עם אגרגציה פרוגרסיבית (progressive aggregation) בסקייל קיצוני

**Trade-off מרכזי:** עלות טוקנים גבוהה יותר (1-2x) לעומת חיפוש אוטונומי, אבל שומר על דיוק כבר באיטרציה הראשונה הודות לבידוד קונטקסט.

**התקנה:**

```bash
uv tool install chunkhound
```

דורש Python 3.10+ ומנהל החבילות uv. ראה [ChunkHound ב-GitHub](https://github.com/chunkhound/chunkhound) להגדרת מפתח API ופרטי הגדרה.

**למד עוד:** [שיעור 5: עיגון](/docs/methodology/lesson-5-grounding#deep-dive-chunkhound-architecture) מכסה את הארכיטקטורה של ChunkHound, עיצוב pipeline והנחיות סקייל בפירוט.

## מחקר אינטרנט

### ArguSeek

[ArguSeek](https://github.com/ArguSeek/arguseek) הוא תת-סוכן למחקר אינטרנט עם קונטקסט מבודד וניהול state סמנטי.

**מה הוא עושה:**

- Google Search API (איכות לעומת Bing/אלטרנטיבות קנייניות)
- פירוק שאילתות (query decomposition) - 3 וריאציות במקביל לכל שאילתה (docs + קהילה + security advisories)
- חיסור סמנטי (semantic subtraction) - שאילתות המשך מדלגות על תוכן שכבר כוסה ומקדמות את המחקר
- זיהוי הטיה (bias detection) - מסמן שיווק של ספקים ומפעיל מחקר נגדי

**מתי להשתמש בו:**

- מחקר best practices וגישות מתחרות
- מציאת security advisories ו-CVEs
- לימוד טכנולוגיות חדשות עם מידע עדכני (post-training)
- מחקר מרובה-מקורות (מעבד 12-30 מקורות לכל קריאה, מתרחב ל-100+ מקורות למשימה)

**יתרון מרכזי:** שומר state בין שאילתות - בונה על מחקר קודם במקום להסביר שוב את הבסיס, ושומר על הקונטקסט של ה-orchestrator שלך נקי.

**התקנה:**

```bash
brew install arguseek
```

דורש Go 1.23+ ו-credentials של Google API. ראה [ArguSeek ב-GitHub](https://github.com/ArguSeek/arguseek) להוראות הגדרה מפורטות ואפשרויות תצורה.

**למד עוד:** [שיעור 5: עיגון](/docs/methodology/lesson-5-grounding#deep-dive-arguseek-architecture) מסביר את הארכיטקטורה של ArguSeek, חיסור סמנטי ודפוסי מחקר.

## אוטומציית דפדפן

אוטומציית דפדפן לסוכני AI מטופלת על ידי **agent-browser CLI** - כלי ייעודי שמספק באופן עקבי תוצאות טובות יותר מאלטרנטיבות מבוססות MCP.

ראה [agent-browser בכלי CLI](/developer-tools/cli-tools#agent-browser) להתקנה ושימוש.

**למה CLI ולא MCP לאוטומציית דפדפן:**
- **תוצאות טובות יותר:** עץ נגישות (accessibility tree) מבוסס ref מייצר בחירת אלמנטים דטרמיניסטית ואמינה
- **יעיל בטוקנים:** 500-2000 טוקנים לכל snapshot לעומת 5,000-15,000 ב-DOM dumps של MCP
- **הגדרה פשוטה יותר:** ללא קונפיגורציית MCP, עובד עם כל סוכן שמסוגל להריץ shell
- **איטרציה מהירה יותר:** CLI נייטיב ב-Rust עם פרסור פקודות מיידי

:::note Deprecated: שרתי MCP לדפדפן
המלצות קודמות כללו Playwright MCP ו-Chrome DevTools MCP. כלים אלה כעת deprecated עבור תהליכי עבודה אגנטיים - הגישה מבוססת-ref של agent-browser מספקת אוטומציה אמינה יותר עם פחות overhead של טוקנים. שרתי MCP עדיין זמינים לאינטגרציות legacy אבל לא מומלצים לפרויקטים חדשים.
:::

---

**תוכן קורס קשור:**

- [שיעור 5: עיגון](/docs/methodology/lesson-5-grounding) - ארכיטקטורה מפורטת ומקרי שימוש עבור ChunkHound ו-ArguSeek
- [שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution) - תהליכי עבודה מרובי סוכנים שמנצלים יכולות MCP
