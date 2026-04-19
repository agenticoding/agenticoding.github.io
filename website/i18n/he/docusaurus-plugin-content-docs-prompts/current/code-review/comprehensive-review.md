---
title: סקירת קוד מקיפה
sidebar_position: 1
---

import ComprehensiveReview from '@site/shared-prompts/\_comprehensive-review.mdx';

<ComprehensiveReview />

### סקירה כללית (Overview)

**למה framework ארבע-קטגוריות עובד:** [הנחיית Persona](/docs/methodology/lesson-4-prompting-101#assigning-personas) ("סוקר קוד מומחה") מכוונת את אוצר המילים לניתוח ביקורתי במקום סיכום תיאורי—"מפר single responsibility" מול "הפונקציה הזו עושה כמה דברים." תיאור שינויים מפורש (`$DESCRIBE_CHANGES`) מעגן את ה[גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) דרך הגדרת הכוונה, ומאפשר לזהות פערים בין מטרות לביצוע (התכוונו להוסיף caching, בפועל נוספו side effects). מבנה רציף וממוספר מיישם חשיבה מסוג [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path) על פני ממדי הסקירה, ומונע מסקנות מוקדמות—אי אפשר להעריך maintainability בלי להבין קודם את הארכיטקטורה. הנחיית הגראונדינג ("Use ChunkHound") מכריחה חקירה אמיתית של בסיס הקוד במקום הזיה (hallucination) של דפוסים מנתוני אימון. ה[אילוץ](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) "DO NOT EDIT" שומר על הפרדה בין שלבי סקירה ומימוש, ומונע תיקונים מוקדמים לפני ניתוח מקיף. ארבע קטגוריות מבטיחות כיסוי שיטתי: ארכיטקטורה (נכונות מבנית, התאמת דפוסים, גבולות מודולים), איכות קוד (קריאות, עקביות סגנון, עמידה ב-KISS), תחזוקתיות (Maintainability) (הבנת LLM עתידית, סנכרון תיעוד, בהירות כוונה), UX (שיפורים משמעותיים, איזון פשטות-ערך).

**מתי להשתמש—דרישה קריטית לקונטקסט טרי:** תמיד הריצו ב[קונטקסט טרי](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) נפרד מהמקום שבו נכתב הקוד—סוכנים שסוקרים את העבודה שלהם באותה שיחה נוטים להגן על החלטות קודמות במקום לספק ניתוח אובייקטיבי (confirmation bias מקונטקסט מצטבר). השתמשו לאחר השלמת המימוש (שלב Execute הסתיים), לאחר refactoring (שינויי ארכיטקטורה), לפני הגשת PR ([שלב Validate](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)). קריטי: היו ספציפיים עם `$DESCRIBE_CHANGES`—תיאורים מעורפלים ("תקן באגים", "עדכן קוד") מונעים ניתוח של ההתאמה בין כוונה למימוש; תיאורים יעילים מציינים את המטרה הארכיטקטונית ("הוסף שכבת Redis caching ל-user service", "שכתב authentication לשימוש בטוקני JWT"). סקירה היא איטרטיבית: סקור בקונטקסט טרי → תקן בעיות → הרץ בדיקות → סקור מחדש בשיחה חדשה → חזור עד green light או diminishing returns (תועלת פוחתת). הפסיקו לחזור כשהבדיקות עוברות והמשוב הנותר הוא מינורי (3-4 מחזורים מקסימום)—איטרציה מוגזמת גורמת לרגרסיות שנובעות מהסקירה עצמה, כשתיקונים עונים לביקורת אבל לא באמת משפרים את הפונקציונליות.

**דרישות קדם (Prerequisites):** [יכולות מחקר קוד](https://chunkhound.github.io/) (חיפוש סמנטי על פני בסיס הקוד, גילוי דפוסים ארכיטקטוניים, קריאת מימוש), גישה לשינויי git working tree (`git diff`, `git status`), תיעוד ארכיטקטורת הפרויקט (CLAUDE.md, AGENTS.md, README). דורש תיאור מפורש של שינויים מתוכננים (`$DESCRIBE_CHANGES`), גישה הן לקבצים שהשתנו והן לקונטקסט המקיף לצורך התאמת דפוסים. הסוכן מספק משוב מובנה לפי קטגוריה עם נתיבי קבצים, מספרי שורות, בעיות ספציפיות והמלצות ישימות ([דרישות ראיות](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)). [התאימו את הדפוס לסקירות מתמחות](/docs/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work): אבטחה (מיפוי attack surface/גבולות אימות קלט/זרימות authentication/טיפול ב-credentials/OWASP Top 10), ביצועים (מורכבות אלגוריתמית/יעילות שאילתות DB/הקצאת זיכרון/פעולות I/O/אסטרטגיית caching), נגישות (מבנה HTML סמנטי/ניווט מקלדת/ARIA labels/תאימות קורא מסך/יחסי ניגוד צבעים), עיצוב API (מוסכמות REST/תגובות שגיאה/versioning/תאימות לאחור).

### שיעורים קשורים

- **[שיעור 3: מתודולוגיה ברמה גבוהה](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** ← תהליך עבודה בארבעה שלבים (Research > Plan > Execute > Validate) — סקירה היא שלב ה-Validate
- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101)** ← [הנחיות Persona](/docs/methodology/lesson-4-prompting-101#assigning-personas), [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), [אילוצים](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails), פרומפטינג מובנה
- **[שיעור 5: גראונדינג](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** ← ChunkHound למחקר בסיס קוד, מניעת הזיות (hallucinations)
- **[שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** ← דרישות ראיות, טכניקות גראונדינג
- **[שיעור 8: בדיקות כמעקות בטיחות](/docs/practical-techniques/lesson-8-tests-as-guardrails#the-three-context-workflow)** ← ולידציה בקונטקסט טרי, מניעת confirmation bias דרך תהליך עבודה של שלושה קונטקסטים
- **[שיעור 9: סקירת קוד](/docs/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work)** ← מחזורי סקירה איטרטיביים, diminishing returns, בסיסי קוד מעורבים מול קוד בסיוע סוכן בלבד
