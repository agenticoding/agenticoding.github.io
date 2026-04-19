---
title: גילוי מקרי קצה
sidebar_position: 2
---

import EdgeCaseDiscovery from '@site/shared-prompts/\_edge-case-discovery.mdx';

<EdgeCaseDiscovery />

### סקירה כללית (Overview)

**למה דפוס דו-שלבי מונע עצות גנריות:** שלב 1 טוען אילוצים קונקרטיים—הסוכן מחפש פונקציה, קורא את המימוש, מוצא בדיקות קיימות. זה מאכלס את הקונטקסט עם מקרי קצה אמיתיים מבסיס הקוד שלכם ("משתמשי OAuth מדלגים על אימות email," "משתמשי admin עוקפים rate limits"). שלב 2 מזהה פערים—עם המימוש בקונטקסט, הסוכן מנתח מה לא נבדק במקום לרשום קטגוריות בדיקה גנריות. [הנחיות גראונדינג (grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) מכריחות חיפוש בבסיס הקוד לפני הצעת בדיקות. בדיקות קיימות חושפות דפוסי כיסוי ומקרי קצה ספציפיים לדומיין. פרטי המימוש חושפים מצבי כשל אמיתיים, לא היפותטיים. מונע [specification gaming](/docs/practical-techniques/lesson-8-tests-as-guardrails#the-three-context-workflow) על ידי גילוי מקרי קצה בנפרד מהמימוש—דומה ל[דרישת קונטקסט טרי](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) לניתוח אובייקטיבי.

**מתי להשתמש—גישת research-first:** לפני יישום פיצ'רים חדשים (גלו דפוסים קיימים), פיתוח TDD (זהו מקרי קצה לפני המימוש), הגדלת כיסוי (מצאו פערים ב-test suites קיימים), שכתוב קוד legacy (הבינו טיפול מקרי קצה מרומז), code review (וודאו ש-PRs כוללים בדיקות רלוונטיות). קריטי: אל תדלגו על שלב 1—לשאול ישירות "אילו מקרי קצה צריך לבדוק?" מייצר עצות גנריות ללא גראונדינג בבסיס הקוד. היו ספציפיים בשלב 2 עם קטגוריות רלוונטיות לדומיין (ראו דוגמאות בפרומפט). אם אתם מייצרים מקרי קצה ומימוש באותה שיחה, הבדיקות יתאימו להנחות המימוש—השתמשו בדפוס זה ב[קונטקסט טרי](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) או לפני המימוש. ללא [גראונדינג](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality), סוכנים מייצרים הזיות (hallucinations) על בסיס דפוסי אימון במקום לנתח את הקוד האמיתי שלכם.

**דרישות מוקדמות (Prerequisites):** [יכולות מחקר קוד](https://chunkhound.github.io/) (חקירה עמוקה של בסיס הקוד דרך חיפוש סמנטי multi-hop, הרחבת queries ומעקבים איטרטיביים), גישה לקבצי המימוש ו-test suites קיימים, שם פונקציה/מודול לניתוח. לאחר שלב 1, הסוכן מספק סיכום מימוש עם נתיבי קבצים, מקרי קצה שנבדקים כרגע עם ראיות מקבצי בדיקה, לוגיקת טיפול מיוחדת וענפים מותנים (conditional branches). לאחר שלב 2, הסוכן מזהה נתיבי קוד לא נבדקים עם מספרי שורות, כיסוי מקרי קצה חסר עם דוגמאות קונקרטיות מהדומיין שלכם, מצבי כשל פוטנציאליים על בסיס ניתוח המימוש.

### שיעורים קשורים (Related Lessons)

- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** ← Chain-of-Thought, פרומפטים מובנים עם שלבים רצופים
- **[שיעור 5: גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** ← טעינת קונטקסט של בסיס הקוד לפני יצירה, מניעת הזיות (hallucinations)
- **[שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** ← גישת research-first, דרישות ראיות
- **[שיעור 8: בדיקות כגארדריילס (Guardrails)](/docs/practical-techniques/lesson-8-tests-as-guardrails#the-three-context-workflow)** ← three-context workflow, מניעת specification gaming
