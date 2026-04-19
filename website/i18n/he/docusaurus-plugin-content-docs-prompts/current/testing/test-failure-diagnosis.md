---
title: אבחון כישלון בדיקות
sidebar_position: 1
---

import TestFailureDiagnosis from '@site/shared-prompts/\_test-failure-diagnosis.mdx';

<TestFailureDiagnosis />

### סקירה כללית

**למה אבחון שיטתי מונע הזיות (hallucinations):** בלוק קוד מגודר שומר על פורמט השגיאות ומונע מה-LLM לפרש הודעות כישלון כהוראות. "Use the code research" היא [הנחיית grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) מפורשת—מאלצת חיפוש בבסיס הקוד במקום להמציא מדפוסי אימון. השלבים הממוספרים של DIAGNOSE מיישמים [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), ומאלצים ניתוח שלב-אחר-שלב (אי אפשר לקפוץ ישר ל"שורש הבעיה" בלי לבחון קודם את מטרת הבדיקה). "Understand the intention" (שלב 2) מבטיח שהסוכן מנסח למה הבדיקה קיימת, לא רק מה היא עושה—קריטי להבחנה בין באגים לדרישות לא עדכניות. ההחלטה הבינארית של DETERMINE [מגבילה את הפלט](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) ל"באג מול בדיקה לא עדכנית" במקום מסקנות פתוחות. "Provide evidence" דורש נתיבי קבצים ומספרי שורות—הוכחה קונקרטית, לא טענות מעורפלות.

**מתי להשתמש—דרישה לקונטקסט טרי:** כשלונות בדיקות במהלך refactoring (לקבוע אם הבדיקות צריכות עדכון או שיש באגים בקוד), כשלונות ב-CI/CD pipeline (ניתוח שיטתי של שורש הבעיה), לאחר הוספת פיצ'רים חדשים (ניתוח כשלונות ב-suites קיימים). קריטי: השתמשו בשיחה נפרדת מהמימוש כדי לקבל ניתוח אובייקטיבי. הדפוס הזה מונע "מעגל של הטעיה עצמית" שבו הסוכן מגן על המימוש שלו. הרצה ב[קונטקסט טרי](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) נותנת ניתוח אובייקטיבי בלי הנחות מוקדמות. הקפידו לכלול stack traces והודעות שגיאה מלאים—פלט חתוך מונע אבחון מדויק. בלי [הנחיית grounding](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality), סוכנים ממציאים מידע על סמך דפוסי האימון שלהם במקום לקרוא את בסיס הקוד האמיתי שלכם.

**דרישות מקדימות:** [יכולות מחקר קוד](https://chunkhound.github.io/) (חקירה מעמיקה של בסיס הקוד באמצעות חיפוש סמנטי multi-hop, הרחבת שאילתות ומעקבים איטרטיביים), גישה לקבצי הבדיקה ולקוד המימוש, פלט של כשלונות בדיקות (stack traces, שגיאות assertion, logs), נתיבים לקבצים רלוונטיים. [ניתן להתאים את הדפוס לאבחונים אחרים](/docs/practical-techniques/lesson-10-debugging#the-closed-loop-debugging-workflow): בעיות ביצועים (מדדים/סַפים/צווארי בקבוק), פגיעויות אבטחה (וקטורי תקיפה/גבולות/פערים), כשלונות deployment (logs/זרימה צפויה/אי-התאמות בקונפיגורציה).

### שיעורים קשורים

- **[שיעור 3: מתודולוגיה ברמה גבוהה](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** ← תהליך עבודה בארבעה שלבים (Research > Plan > Execute > Validate)
- **[שיעור 4: מבוא ל-Prompting](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path)** ← Chain-of-Thought, אילוצים (constraints), פורמט מובנה
- **[שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** ← דרישות לראיות, טכניקות grounding
- **[שיעור 8: בדיקות כגדרות בטיחות](/docs/practical-techniques/lesson-8-tests-as-guardrails#test-failure-diagnosis-agent-driven-debug-cycle)** ← תהליך עבודה עם שלושה קונטקסטים, אבחון כשלונות בדיקות
