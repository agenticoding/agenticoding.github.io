---
title: צור AGENTS.md
sidebar_position: 1
---

import GenerateAgentsMD from '@site/shared-prompts/\_generate-agents-md.mdx';

<GenerateAgentsMD />

### סקירה כללית

**למה גראונדינג (grounding) מרובה-מקורות עובד:** [ChunkHound](/docs/methodology/lesson-5-grounding#code-grounding-choosing-tools-by-scale) מספק קונטקסט ספציפי לקוד-בייס (פטרנים, קונבנציות, ארכיטקטורה) בעוד [ArguSeek](/docs/methodology/lesson-5-grounding#arguseek-isolated-context--state) מספק ידע אקוסיסטם עדכני (best practices של פריימוורק, הנחיות אבטחה)—זה מיישם [גראונדינג מרובה-מקורות](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) כדי לשלב מציאות פרויקט אמפירית עם best practices של אקוסיסטם. [פורמט אאוטפוט מובנה](/docs/methodology/lesson-4-prompting-101#applying-structure-to-prompts) עם סעיפים מפורשים מבטיח כיסוי מקיף על ידי כפיית מעבר שיטתי על כל הסעיפים במקום טקסט חופשי. [אילוץ תמציתיות](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) של ≤200 שורות מכריח תעדוף—בלעדיו, סוכנים מייצרים תיעוד מנופח שבסוף מתעלמים ממנו. הנחיית אי-כפילות שומרת פוקוס על פרטים תפעוליים ספציפיים ל-AI שסוכנים לא יכולים להסיק בקלות מהקוד לבד (הגדרת סביבה, התאמות לפקודות שרצות ללא אינטראקציה, gotchas של דיפלוימנט). זה מיישם את [שלב הריסרץ׳](/docs/methodology/lesson-3-high-level-methodology#phase-1-research-grounding) של [הוורקפלואו בארבעה שלבים](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow), ומאפשר לסוכנים לבנות בסיס משלהם לפני שמתחילים במשימות מימוש.

**מתי להשתמש בפטרן הזה:** אונבורדינג לפרויקט חדש (בנו קונטקסט בסיסי לפני משימת האימפלמנטציה הראשונה), תיעוד פרויקטי legacy (תיעוד שיטתי של ידע שבטי - tribal knowledge), רענון קונטקסט אחרי שינויים ארכיטקטוניים (הריצו מחדש אחרי מיגרציות, שדרוגי פריימוורק, או ריפקטורים גדולים). הריצו מוקדם בתחילת עבודה עם פרויקט כדי לבסס [קבצי קונטקסט](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem) בסיסיים, הריצו מחדש אחרי שינויים משמעותיים, ואז הוסיפו ידנית ידע שבטי (תקריות פרודקשן, קונבנציות צוות, gotchas לא-ברורים) ש-AI לא מסוגל לגלות מהקוד. בלי גראונדינג של קונטקסט התחלתי, סוכנים מהזים (hallucinate) קונבנציות על בסיס פטרנים מהטריינינג במקום לקרוא את הקוד-בייס האמיתי שלכם—זה מתבטא בהפרות סגנון, הנחות שגויות על ארכיטקטורה, והתעלמות מאילוצים ספציפיים לפרויקט.

**דרישות קדם:** [ריסרץ׳ קוד ChunkHound](https://chunkhound.github.io/) (חקירה עמוקה של קוד-בייס דרך חיפוש סמנטי multi-hop, הרחבת queries ומעקבים איטרטיביים), [ריסרץ׳ ווב ArguSeek](https://github.com/ArguSeek/arguseek) (תיעוד אקוסיסטם ו-best practices עדכניים), הרשאות כתיבה ל-root של הפרויקט. נדרש קוד-בייס קיים עם קבצי מקור ו-README או תיעוד בסיסי כדי להימנע מכפילויות. אחרי יצירה, [ולדטו על ידי בדיקה עם משימה טיפוסית](/docs/methodology/lesson-3-high-level-methodology#phase-4-validate-the-iteration-decision)—אם הסוכן לא עוקב אחרי קונבנציות מתועדות, קובץ הקונטקסט צריך איטרציה נוספת. בלי ולידציה, אתם מסתכנים בהטמעת הנחות שגויות בקונטקסט הפרויקט שיצטברו ויחמירו במשימות עתידיות.

### שיעורים קשורים

- **[שיעור 3: מתודולוגיה ברמה גבוהה](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** ← וורקפלואו בארבעה שלבים (Research > Plan > Execute > Validate), החלטות איטרציה
- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#applying-structure-to-prompts)** ← Prompting מובנה, אילוצים כגארדריילס, צפיפות מידע
- **[שיעור 5: גראונדינג](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding)** ← גראונדינג מרובה-מקורות (ChunkHound + ArguSeek), חיפוש סמנטי, תת-סוכנים
- **[שיעור 6: אונבורדינג לפרויקט](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem)** ← קבצי קונטקסט (AGENTS.md, CLAUDE.md), קונטקסט היררכי, ידע שבטי (tribal knowledge)
