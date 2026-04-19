---
title: דיבוג מבוסס-ראיות
sidebar_position: 1
---

import EvidenceBasedDebug from '@site/shared-prompts/\_evidence-based-debug.mdx';

<EvidenceBasedDebug />

### סקירה כללית

**למה דרישות ראיות מונעות הזיות (hallucinations):** "ספק ראיות (נתיבי קבצים, מספרי שורות, ערכים בפועל)" היא [הנחיית גראונדינג (grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) מפורשת—סוכנים לא יכולים לספק את הראיות האלה בלי לשלוף אותן מבסיס הקוד. בלי דרישות ראיות, סוכנים מייצרים השלמת דפוסים מנתוני אימון ("כנראה timeout של מסד נתונים"), ולא ניתוח אמיתי. ראיות מכריחות קריאת קוד, מעקב ביצוע, וציטוטים קונקרטיים. הצעדים הממוספרים INVESTIGATE/ANALYZE/EXPLAIN מיישמים [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), ומכריחים ניתוח רציף (אי אפשר לקפוץ ישר ל"שורש הבעיה" בלי לבחון קודם את הקונטקסט של השגיאה). "Use the code research" היא הנחיית אחזור מפורשת—שמונעת הסתמכות על דפוסי אימון. בלוק קוד מגודר משמר את פורמט השגיאות ומונע מה-LLM לפרש הודעות כישלון כהוראות. ראיות טובות כוללות נתיבי קבצים עם מספרי שורות, ערכים בפועל של משתנים וקונפיגורציה, שמות פונקציות ספציפיים, ו-stack traces מלאים—לא טענות מעורפלות.

**מתי להשתמש—דרישת קונטקסט טרי (fresh context):** שגיאות פרודקשן עם stack traces/logs, התנהגות לא צפויה בתרחישים ספציפיים, כשלים שקטים שדורשים מעקב אחרי נתיב הקוד, צווארי בקבוק בביצועים שדורשים ניתוח profiling, בעיות ארכיטקטוניות שמשתרעות על מספר קבצים. קריטי: השתמשו בשיחה נפרדת מהמימוש כדי לקבל ניתוח לא מוטה. הדפוס הזה מונע "מעגל של הונאה עצמית" שבו סוכנים מגנים על המימוש שלהם. הרצה ב[קונטקסט טרי](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) נותנת ניתוח אובייקטיבי בלי הנחות קודמות. תמיד ספקו פלט שגיאה מלא—logs חתוכים מונעים אבחון מדויק. תאתגרו את ההסברים של הסוכן כשהם לא מסתדרים עם ההתנהגות בפועל: "אמרת ש-X גורם ל-timeout, אבל ה-logs מראים שהחיבור הוקם. תסביר את הפער הזה עם ראיות." דחו ניחושים בלי ציטוטים: "תראה לי את הקובץ ומספר השורה שבהם זה קורה."

**דרישות קדם:** [יכולות מחקר קוד](https://chunkhound.github.io/) (חקירה עמוקה של בסיס הקוד דרך חיפוש סמנטי multi-hop, הרחבת שאילתות ומעקבים איטרטיביים), גישה למערכת קבצים לקריאת מימוש וקונפיגורציה, הודעות שגיאה/stack traces/logs מלאים (לא פלט חתוך), אופציונלי: נתיבי קבצים או שמות פונקציות אם ידועים. תוודאו את כל נתיבי הקבצים ומספרי השורות שצוטטו—סוכנים יכולים להמציא מיקומים. השתמשו בשיקול דעת הנדסי לאימות ההיגיון—LLMs משלימים דפוסים, לא לוגיקה. [התאימו את הדפוס לאבחונים אחרים](/docs/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow): בעיות ביצועים (מדדים/thresholds/נתוני profiling), פגיעויות אבטחה (וקטורי תקיפה/גבולות/פערי קונפיגורציה), כשלי deployment (logs של תשתית/מצב צפוי מול בפועל), בעיות אינטגרציה (חוזי API/זרימת נתונים/שגיאות גבולות).

### שיעורים קשורים

- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** ← Chain-of-Thought, אילוצים, חשיבה מובנית
- **[שיעור 5: גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** ← הנחיות גראונדינג, RAG, כפיית אחזור
- **[שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** ← דרישות ראיות, אתגור הלוגיקה של הסוכן
- **[שיעור 10: דיבוג](/docs/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow)** ← תהליך עבודה closed-loop, סקריפטי reproduction, גישה מבוססת-ראיות
