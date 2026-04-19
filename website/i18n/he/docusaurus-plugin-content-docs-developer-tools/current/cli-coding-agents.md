---
title: סוכני קידוד CLI
sidebar_position: 1
---

# סוכני קידוד CLI

**סוכני קידוד CLI הם שכבת התזמור (orchestration) לפיתוח מרובה סוכנים.** בעוד ש[טרמינלים](/developer-tools/terminals) מספקים את הסביבה ו[כלי CLI](/developer-tools/cli-tools) מאפשרים פעולות יעילות, סוכני קידוד הם מה שבפועל כותב, עורך ומבצע refactor לקוד שלך. הם משלבים יכולות של מודל שפה עם גישה למערכת קבצים, הרצת shell והבנה של ה-codebase.

עמוד זה מכסה סוכנים שפועלים בעיקר משורת הפקודה (command line) - שונים מעוזרים משובצי IDE כמו Cursor או Windsurf. סוכני CLI מציעים יתרונות למהנדסים בכירים: יכולת סקריפטינג, תאימות SSH, פחות אוברהד משאבים (resource overhead), ואינטגרציה חלקה עם תהליכי עבודה מרובי worktree.

## Claude Code

[**Claude Code**](https://claude.com/product/claude-code) הוא סוכן ה-CLI הרשמי של Anthropic, שיצא בפברואר 2025. הוא מניע את זרימות העבודה לאורך הקורס הזה ומייצג גישת "tool use first" - הסוכן פועל דרך קריאות כלים מפורשות במקום יצירת קוד אוטונומית.

**מאפיינים מבדלים עיקריים:**

- **CLAUDE.md היררכי:** קבצי קונטקסט מרובי-רמות (גלובלי ← פרויקט ← תת-תיקייה) ש[מתמזגים אוטומטית בהתאם לתיקיית העבודה](/docs/practical-techniques/lesson-6-project-onboarding) - הגדר סטנדרטים בשורש הפרויקט, דרוס לכל מודול, והגדר העדפות אישיות גלובלית
- **תת-סוכנים דרך Task(...):** הפעל מופעי סוכן מבודדים למחקר מקביל, חקירת קוד או משימות מתמחות מבלי לזהם את הקונטקסט הראשי
- **מצב תכנון:** תהליך עבודה מפורש של תכנן-לפני-ביצוע לשינויים מורכבים - התאם גישה לפני שקבצים משתנים
- **מערכת hooks:** כללים דטרמיניסטיים לפני/אחרי ביצוע לוולידציה, פורמט או תהליכי עבודה מותאמות שמופעלות בנקודות ספציפיות
- **אינטגרציית MCP:** הרחב יכולות דרך [שרתי Model Context Protocol](/developer-tools/mcp-servers) למחקר קוד, עיגון לאינטרנט (web grounding) ואוטומציית דפדפן
- **פקודות slash:** קיצורי דרך מותאמים לפעולות תכופות (`/commit`, `/pr`, `/test`) מוגדרים לכל מאגר

**מתאים במיוחד ל:** מהנדסים שבונים תהליכי עבודה מורכבים מרובי סוכנים שצריכים שליטה מפורשת על התנהגות הסוכן. צוותים שדורשים קונפיגורציות סוכן שניתנות לשחזור בין מפתחים באמצעות קבצי CLAUDE.md שנשמרו ב-git. מפתחים שעובדים עם בסיסי קוד גדולים (50k+ שורות) שבהם בידוד קונטקסט של תת-סוכנים מונע בלבול.

**פשרות (trade-offs):** רק מודלים של Anthropic - אין תמיכה ב-OpenAI, Google או מודלים מקומיים. עקומת למידה לפיצ'רים מתקדמים (hooks, MCP, תת סוכנים).

**תמחור:** מנוי Max ב-$100/חודש (5x שימוש Pro) או $200/חודש (20x שימוש Pro) - עלויות צפויות ללא חיוב לפי טוקן. אלטרנטיבה: מבוסס-שימוש דרך Anthropic API - Sonnet 4 ב-$3/$15 לכל MTok (קלט/פלט), Opus 4.5 ב-$5/$25 לכל MTok.

**התקנה:**

```bash
# npm (recommended)
npm install -g @anthropic-ai/claude-code

# Requires Node.js 18+
# Authenticate via Claude Max subscription or set ANTHROPIC_API_KEY
```

### כלי Status Line

הגדרת `statusLine` של Claude Code מאפשרת תצוגות סטטוס בר מותאמות דרך פקודות חיצוניות. כלים קהילתיים מספקים מעקב עלויות בזמן אמת, אינטגרציית git וניטור סשן.

**[CCometixLine (ccline)](https://github.com/Haleclipse/CCometixLine)** - statusline מבוסס Rust עם אינטגרציית git, תצוגת מודל, מעקב שימוש ותצורת TUI. כולל patches להשבתת אזהרות קונטקסט והפעלת מצב verbose. התקנה: `npm install -g @cometix/ccline`

**[ccusage](https://github.com/ryoppippi/ccusage)** - ניטור שימוש בטוקנים ועלויות המציג עלות סשן, סיכומים יומיים, מעקב בלוקים של 5 שעות וקצב צריכה בזמן אמת. התקנה: `npx ccusage@latest statusline`

**אפשרויות נוספות:** [claude-statusline](https://github.com/ersinkoc/claude-statusline) (Python, 100+ ערכות נושא), [CCStatusLine](https://github.com/sirmalloc/ccstatusline) (פירוט טוקנים מרובה-שורות)

## OpenAI Codex CLI

[**Codex CLI**](https://developers.openai.com/codex/cli/) הוא סוכן שורת הפקודה הרשמי של OpenAI, שיצא באפריל 2025. הוא מספק אינטגרציה נייטיבית עם האקוסיסטם של מודלי OpenAI כולל סדרת GPT-5-Codex שמותאמת לקידוד אגנטי.

**מאפיינים מבדלים עיקריים:**

- **אינטגרציית אקוסיסטם OpenAI:** תמיכה נייטיבית במודלי GPT-5-Codex (ברירת מחדל ב-macOS/Linux) עם פקודת `/model` למעבר בין GPT-5.1, GPT-5-Codex-Max ומודלי reasoning
- **הרצה בסנדבוקס:** סביבת הרצת קוד מובנית לבדיקת קוד שנוצר לפני יישום שינויים
- **קונטקסט מרובה-קבצים (multi-file context):** מבין מבנה פרויקט ומתחזק עריכות קוהרנטיות בין קבצים
- **פקודות בשפה טבעית:** המר תיאורים בשפה טבעית ישירות לפקודות shell ושינויי קוד

**מתאים במיוחד ל:** צוותים שכבר מושקעים באקוסיסטם של OpenAI (מפתחות API, חיובים, היכרות). מפתחים שרוצים גישה למודלי OpenAI האחרונים ברגע שהם יוצאים. מהנדסים שמעדיפים כלים רשמיים של הספק עם ערוצי תמיכה ייעודיים.

**פשרות:** רק מודלים של OpenAI - אין תמיכה ב-Anthropic, Google או מודלים מקומיים. כלי חדש יותר עם קהילה קטנה יותר בהשוואה ל-Aider. תיעוד פחות מקיף מאלטרנטיבות מבוססות יותר. דורש גישה ל-OpenAI API ועלויות נלוות.

**תמחור:** כלול במנוי ChatGPT Plus ($20/חודש), Pro, Team ו-Enterprise עם מגבלות שימוש מדורגות. אלטרנטיבה: מבוסס-שימוש דרך מפתח OpenAI API בתעריפים סטנדרטיים.

**התקנה:**

```bash
# npm
npm install -g @openai/codex

# Requires Node.js 18+
# Set OPENAI_API_KEY environment variable
```

## Gemini CLI

[**Gemini CLI**](https://geminicli.com/) הוא סוכן שורת הפקודה של Google למשפחת מודלי Gemini, שיצא ביוני 2025. הוא מציע את חלון הקונטקסט הגדול ביותר (מיליון טוקנים) בין סוכני CLI וגישה ל-Gemini 3 Pro.

**מאפיינים מבדלים עיקריים:**

- **חלון קונטקסט עצום (context window):** קונטקסט של מיליון טוקנים (2 מיליון בקרוב) - נתח בסיסי קוד שלמים בפרומפט אחד
- **Gemini 3 Pro:** גישה למודל ה-reasoning האחרון של Google עם יכולות מולטימודליות חזקות
- **אינטגרציית Google Cloud:** תאימות נייטיבית עם Vertex AI, שירותי Google Cloud ו-Google Workspace
- **MCP והרחבות:** הרחב יכולות דרך Model Context Protocol או הרחבות מובנות; עגן פרומפטים עם Google Search

**מתאים במיוחד ל:** צוותים שמנתחים בסיסי קוד גדולים שחורגים ממגבלות הקונטקסט של סוכנים אחרים. מפתחים שכבר משתמשים בתשתית Google Cloud. מהנדסים שצריכים יכולות מולטימודליות (ניתוח תמונה, וידאו, אודיו לצד קוד).

**פשרות:** קריאת כלים (tool calling) ומעקב אחר הוראות פחות מלוטשים מ-Claude Code או Codex - טוב יותר לניתוח מאשר קידוד אוטונומי מרובה-שלבים. הטייר החינמי (free tier) מוגבל מאוד (דצמבר 2025) - מגבלות API צומצמו לכמעט אפס עבור 2.5 Pro. שיקולי פרטיות - התנאים של Google מאפשרים איסוף נתונים (טיירים של enterprise מציעים הגנה).

**תמחור:** מנויי Google AI Pro/Ultra ל-rate limits עדיפים. מבוסס-שימוש דרך Vertex AI - Gemini 3 Pro ב-$2/$12 לכל MTok (קלט/פלט). הטייר החינמי מוגבל להתנסות קלה בלבד.

**התקנה:**

```bash
# npm
npm install -g @google/gemini-cli

# Requires Node.js 18+
# Set GOOGLE_API_KEY or configure Google Cloud credentials
```

## GitHub Copilot CLI

[**GitHub Copilot CLI**](https://github.com/features/copilot/cli) הוא סוכן הקידוד הנייטיבי לטרמינל של GitHub, שנכנס ל-public preview בספטמבר 2025. לצוותים עם רישיונות Copilot Business/Enterprise קיימים, זוהי נקודת הכניסה עם החיכוך הנמוך ביותר לתהליכי עבודה אגנטיים - אפס רכש נוסף, גישה מיידית.

**מאפיינים מבדלים עיקריים:**

- **יכולות אגנטיות מלאות:** קרא, כתוב והרץ קוד באופן אוטונומי - לא רק הצעות פקודות
- **אינטגרציית GitHub:** גישה נייטיבית למאגרים, issues ו-pull requests דרך שאילתות בשפה טבעית
- **תמיכה בשרתי MCP:** ניתן להרחבה עם כלים מותאמים ומקורות קונטקסט דרך Model Context Protocol
- **backend מרובה-מודלים:** ממנף מודלים של OpenAI, Anthropic ו-Google דרך התשתית של GitHub

**מתאים במיוחד ל:** צוותים ארגוניים שבודקים תהליכי עבודה אגנטיים עם רישיונות Copilot קיימים. דפוסי שימוש קלים עד בינוניים שבהם תמחור מבוסס-בקשות נשאר כלכלי. תהליכי עבודה ממוקדי-GitHub שבהם אינטגרציית repo/issue/PR native מוסיפה ערך.

**פשרות:** תמחור מבוסס-בקשות יוצר עקומת עלות לא שגרתית - זול להתחיל ($10/חודש flat), אבל יקר בסקייל. ב-300 בקשות premium/חודש (טייר Pro), שימוש יומי מתון מכלה את ההקצאה במהירות; חריגות ב-$0.04/בקשה מצטברות מהר. Power users באופן טבעי עוברים לכלים מבוססי טוקן כמו [Claude Code](#claude-code) או [Codex CLI](#openai-codex-cli) שבהם העלויות עולות בצורה ליניארית יותר. באגים ידועים באינטראקציה עם הטרמינל - הסוכן לא יכול לזהות באופן אמין מתי פקודות הסתיימו, מה שמוביל למצבי stuck ובקשות מבוזבזות.

**תמחור:** מבוסס-בקשות, כלול במנויי Copilot.

| Plan       | Cost           | Premium Requests | Overage       |
| ---------- | -------------- | ---------------- | ------------- |
| Pro        | $10/month      | 300/month        | $0.04/request |
| Pro+       | $39/month      | 1,500/month      | $0.04/request |
| Business   | $19/user/month | 300/user/month   | $0.04/request |
| Enterprise | $39/user/month | 1,000/user/month | $0.04/request |

מודלים כלולים (GPT-5 mini, GPT-4.1, GPT-4o) לא צורכים בקשות premium. למודלים מתקדמים יש מכפילים - Claude Opus 4.1 עולה 10x לכל אינטראקציה.

**התקנה:**

```bash
# npm (requires Node.js 18+)
npm install -g @github/copilot

# Requires active GitHub Copilot subscription (Pro/Business/Enterprise)
# For Business/Enterprise: admin must enable preview features
```

## Aider

[**Aider**](https://aider.chat) הוא סוכן CLI בקוד פתוח שמתמקד בתהליכי עבודה native ל-git וגמישות מודלים. יצא במאי 2023, הוא הבשיל לסוכן הקידוד בקוד הפתוח הנפוץ ביותר עם 38.9k כוכבי GitHub, 3.9M הורדות PyPI ו-15 מיליארד טוקנים מעובדים שבועית.

**מאפיינים מבדלים עיקריים:**

- **תהליך עבודה native ל-git:** commits אוטומטיים אחרי כל שינוי עם הודעות תיאוריות - היסטוריה נקייה וניתנת לסקירה ללא staging ידני
- **Provider agnostic:** תומך ב-OpenAI, Anthropic, Google, DeepSeek, Groq ומודלים מקומיים דרך Ollama או LiteLLM - אזן איכות מול עלות לכל משימה
- **מיפוי מאגר (repository mapping):** Tree-sitter בונה גרף תלויות של סימבולים (מחלקות, מתודות, חתימות) - אלגוריתם דירוג גרפים בוחר קונטקסט רלוונטי ללא embeddings או חיפוש סמנטי
- **מצבים מרובים:** מצב code (עריכות ישירות), מצב architect (תכנון ועיצוב), מצב ask (שאילתות ללא שינויים)
- **קלט מולטימודלי (multimodal input):** הוסף תמונות ודפי אינטרנט לצ'אט לקונטקסט ויזואלי, צילומי מסך או תיעוד ייחוס
- **קול-לקוד:** פקודת `/voice` לקידוד ללא ידיים - דבר בקשות לפיצ'רים, בדיקות או תיקוני באגים
- **Polyglot benchmark:** מתחזק [לוח מובילים LLM](https://aider.chat/docs/leaderboards) שבודק מודלים על 225 תרגילי Exercism ב-C++, Go, Java, JavaScript, Python ו-Rust
- **ניטור עלויות:** תצוגה בזמן אמת של טוקנים שנשלחו/התקבלו ועלויות הודעה - זהה מודלים זולים יותר לתהליך העבודה שלך
- **משתפר באופן עצמאי:** ~70% מהקוד האחרון של Aider נכתב על ידי Aider עצמו

**מתאים במיוחד ל:** מפתחים שרוצים גמישות בבחירת מודל - השתמש ב-Claude לשכתובים מורכבים, מודלים זולים יותר לתיקונים מהירים, מודלים מקומיים לקוד רגיש. מהנדסים שמעדיפים היגיינת git עם משמעת commit אוטומטית. צוותים עם מגבלות תקציב שיכולים לערבב מודלים יקרים וזולים באופן אסטרטגי. פריסות enterprise שדורשות תשתית מאוחסנת עצמאית לחלוטין ללא נעילה לספק.

**פשרות:** auto-commits של git יכולים ליצור היסטוריה רועשת אם לא מוגדר בזהירות. אין ארכיטקטורת תת-סוכנים מובנית - מודל ביצוע single-threaded. ממשק דפדפן ניסיוני ופחות מלוטש מ-CLI. חלק מהמשתמשים מדווחים על תוצאות לא עקביות עם מודלים מקומיים.

**תמחור:** חינם וקוד פתוח. שלם רק עבור טוקני API לספק שבחרת - ללא שכבת מנוי.

**התקנה:**

```bash
# pip (recommended)
pip install aider-chat

# Or with pipx for isolation
pipx install aider-chat

# Requires Python 3.9+
# Set API keys for your chosen provider (OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.)
```

## OpenCode

[**OpenCode**](https://opencode.ai) הוא סוכן CLI בקוד פתוח עם עיצוב TUI-first, בנוי ב-Go על ידי חובבי neovim. עם 38k+ כוכבי GitHub ו-375 תורמים, הוא מדגיש אינטגרציית LSP וארכיטקטורה privacy-first לפריסות enterprise.

**מאפיינים מבדלים עיקריים:**

- **אינטגרציית LSP:** מפעיל אוטומטית שרתי שפה לפרויקט שלך - ה-AI מקבל דיאגנוסטיקת קומפיילר ושגיאות טיפוס בזמן אמת (יכולות LSP מלאות כמו rename/go-to-definition עדיין לא חשופות)
- **סוכנים מובנים:** סוכן `build` (גישה מלאה לפיתוח), סוכן `plan` (ניתוח קריאה-בלבד שדורש אישור לפקודות bash), תת-סוכן `general` (חיפושים מורכבים מרובי-שלבים דרך `@general`)
- **ארכיטקטורת client/server:** ליבת הסוכן רצה על מכונה אחת בעוד שנשלט מרחוק - TUI הוא אפשרות קליינט אחת; מאפשר שליטה מאפליקציית מובייל והפעלה headless
- **תמיכת MCP:** אינטגרציית Model Context Protocol לכלים חיצוניים - התחבר ל-Playwright לאוטומציית דפדפן, שרתים מותאמים לתהליכי עבודה מתמחים
- **75+ ספקים:** OpenAI, Anthropic, Google, GitHub Copilot, AWS Bedrock, Groq, Azure OpenAI, OpenRouter ומודלים מקומיים דרך Ollama - או השתמש ב-OpenCode Zen להמלצות מודל מאוצרות
- **Privacy-first:** ללא אחסון קוד או קונטקסט - מתאים לבסיסי קוד רגישים ודרישות compliance של enterprise
- **מרובה-סשנים:** הרץ סוכנים מרובים במקביל על אותו פרויקט עם שיתוף סשן דרך קישורים
- **פקודות מותאמות:** צור פרומפטים לשימוש חוזר באמצעות קבצי Markdown עם ארגומנטים בעלי שם

**מתאים במיוחד ל:** צוותים מודעי-פרטיות שדורשים פריסות on-premise. משתמשי Neovim שרוצים מצוינות TUI. מפתחים שרוצים הבנה משופרת-LSP של ה-AI לבסיס הקוד שלהם. סביבות enterprise שצריכות audit trails ו-data residency compliance.

**פשרות:** במקור פרויקט שהועבר לארכיון (archived), כעת מתוחזק על ידי SST - כדאי לוודא מחויבות לתחזוקה לטווח ארוך. קהילה קטנה יותר מ-Aider.

**תמחור:** חינם וקוד פתוח. שלם רק עבור טוקני API LLM לספק שבחרת.

**התקנה:**

```bash
# Quick install
curl -fsSL https://opencode.ai/install | bash

# Or via npm
npm i -g opencode-ai@latest

# Or Homebrew (macOS/Linux)
brew install opencode

# Requires provider API keys or OpenCode Zen subscription
```

---

**קשור:**

- [כלי מפתח: טרמינלים](/developer-tools/terminals) - אמולטורי טרמינל מותאמים לסשנים מרובי-סוכנים
- [כלי מפתח: כלי CLI מודרניים](/developer-tools/cli-tools) - כלי shell שמשלימים תהליכי עבודה של סוכנים
- [כלי מפתח: שרתי MCP](/developer-tools/mcp-servers) - הרחב סוכני CLI עם מחקר קוד ועיגון לאינטרנט
