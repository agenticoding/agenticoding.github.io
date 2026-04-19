---
title: יצירת מפרט מערכת (System Specification)
sidebar_position: 1
---

import GenerateSpec from '@site/shared-prompts/_generate-spec.mdx';

<GenerateSpec />

### סקירה כללית

**למה חילוץ שיטתי עובד:** כלי מחקר קוד ([ChunkHound](/docs/methodology/lesson-5-grounding#code-grounding-choosing-tools-by-scale)) מחלצים ידע ארכיטקטוני מקוד מקור באופן דינמי. תבנית ה-spec מתרגמת מידע גולמי זה לחשיבה מובנית—מודולים, גבולות, contracts, state, כשלים—שחושפת אילוצים לפני תחילת המימוש. זה מיישם [גראונדינג (Grounding) מרובה-מקורות](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) להבנה ארכיטקטונית: מחקר קוד מספק את העובדות, והתבנית מספקת את המבנה לחשיבה עליהן.

**מתי להשתמש בדפוס הזה:** שינויים ב-brownfield (תבינו לפני שתשנו), חקירה ארכיטקטונית (איך המערכת הזו עובדת?), תכנון מקדים (pre-planning) לפיצ'רים מורכבים (פרקו לפני prompting), onboarding לקודבייסים לא מוכרים (חלצו את המודל המנטלי). הכי שימושי כששינויים משתרעים על מספר מודולים או נוגעים בקוד לא מוכר. דלגו על תיקוני באגים מבודדים—שם חלון הקונטקסט משמש כ-spec מספיק.

**דרישות מקדימות:** [מחקר קוד ChunkHound](https://chunkhound.github.io/) לחקירת קודבייס, וקוד קיים לניתוח. למערכות חדשות (greenfield), השתמשו בתבנית ישירות ככלי דיזיין במקום יעד לחילוץ. לאחר החילוץ, וודאו טענות עם ראיות file:line—סוכנים נוטים להזות (hallucinate) מבנים שלא קיימים. מחקו specs לאחר המימוש; הקוד הופך למקור האמת ([שיעור 12](/docs/practical-techniques/lesson-12-spec-driven-development)).

### שיעורים קשורים

- **[שיעור 5: גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding)** ← כלי מחקר קוד, חיפוש סמנטי, דרישות ראיות
- **[שיעור 12: פיתוח מונחה-Spec](/docs/practical-techniques/lesson-12-spec-driven-development)** ← מחזור החיים של Spec, קוד כמקור אמת, מחיקה לאחר המימוש
- **[שיעור 13: חשיבת מערכות ל-Specs](/docs/practical-techniques/lesson-13-systems-thinking-specs)** ← שימוש בתבנית כשלד חשיבה, התאמת פורמליות למורכבות
