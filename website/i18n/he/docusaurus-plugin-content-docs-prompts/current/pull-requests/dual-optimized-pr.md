---
title: מחולל תיאור PR
sidebar_position: 1
---

import DualOptimizedPR from '@site/shared-prompts/\_dual-optimized-pr.mdx';

<DualOptimizedPR />

### סקירה כללית

**למה אופטימיזציה לשני קהלים עובדת:** [תת-סוכנים](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage) משמרים קונטקסט על ידי הפעלת סוכנים נפרדים לחקירת היסטוריית git—ללא האצלה זו, 20-30 שינויי קבצים צורכים 40K+ טוקנים, דוחפים אילוצים קריטיים לתוך [האמצע שמתעלמים ממנו בעקומת ה-attention](/docs/methodology/lesson-5-grounding#the-scale-problem-context-window-limits). [גראונדינג (grounding) מרובה-מקורות](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding) משלב ArguSeek (best practices של PR מתיעוד GitHub ובלוגי הנדסה) עם ChunkHound (דפוסי ארכיטקטורה ספציפיים לפרויקט, אחריויות מודולים), ומונע עצות גנריות מנותקות מהמציאות של בסיס הקוד שלכם. מסגור [פרסונה (persona)](/docs/methodology/lesson-4-prompting-101#assigning-personas) של "עמית לעבודה" עם [אילוצי](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails) סגנון מפורשים (ישיר, תמציתי, הנח שהקורא מבין, דלג על המובן מאליו) מונע הסברים מיותרים שמבזבזים את תשומת הלב של הסוקרים. אילוצים כפולים מאזנים בין הקהלים: "1-3 פסקאות מקסימום" לאנשים מונע הצפת maintainers בקירות של טקסט, בעוד "הסבר ביעילות" שומר על קונטקסט AI מקיף אך מובנה—קריטי כי [סוקרי AI](/prompts/pull-requests/ai-assisted-review) צריכים קונטקסט ארכיטקטוני (יחסי קבצים, גבולות מודולים) שאנשים מסיקים מניסיון.

**מתי להשתמש—אינטגרציה בתהליך עבודה:** לפני הגשת PRs עם changesets מורכבים (10+ קבצים, מודולים מרובים שהשתנו, cross-cutting concerns) או שיתוף פעולה בין-צוותי שבו לסוקרים אין היכרות עמוקה עם המודול. שלבו ב[תהליך עבודה בארבעה שלבים](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow): השלימו מימוש → אמתו עם טסטים → self-review לבעיות → תקנו בעיות שהתגלו → צרו תיאורים כפולים → הגישו PR עם שני הקבצים. היו ספציפיים עם `$CHANGES_DESC`—תיאורים מעורפלים ("תקן באגים", "עדכן לוגיקה") מייצרים פלט גנרי כי [גראונדינג](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) דורש כוונה קונקרטית. ללא תיאור שינויים ספציפי, לסוכן אין עוגן להעריך "מה חשוב" ב-git diff. קריטי: אם אתם עורכים ידנית תיאורים שנוצרו, צרו מחדש את שני הקבצים—קונטקסט מיושן בתיאור המותאם ל-AI גורם [להזיות (hallucinations) במהלך סקירה](/docs/practical-techniques/lesson-9-reviewing-code) כשהסברים ארכיטקטוניים סותרים את השינויים בפועל. לצוותים שעדיין לא משתמשים בסוקרי AI, הפלט המותאם לאנשים לבדו מספק סיכומים תמציתיים שמכבדים את זמן הסוקר.

**דרישות קדם:** [כלי תת-סוכן/משימה](/docs/methodology/lesson-5-grounding#solution-2-sub-agents-for-context-isolation) ([Claude Code CLI](/developer-tools/cli-coding-agents#claude-code) מספק כלי Task מובנה—פלטפורמות אחרות דורשות ניהול קונטקסט ידני דרך פרומפטים רצופים), [ArguSeek](https://github.com/ofrivera/ArguSeek) (מחקר רשת ל-best practices של PR), [ChunkHound](https://chunkhound.github.io/) (מחקר בסיס קוד דרך חיפוש סמנטי multi-hop וחקירה איטרטיבית), גישה להיסטוריית git עם שינויים ב-commit על feature branch. דורש base branch להשוואה (בדרך כלל `main` או `develop`), תיעוד ארכיטקטורה ([קונטקסט פרויקט CLAUDE.md](/docs/practical-techniques/lesson-6-project-onboarding#the-context-file-ecosystem), AGENTS.md לתהליכי עבודה אגנטיים). הסוכן מייצר שני קבצי markdown: **מותאם לאנשים** (1-3 פסקאות המכסות מה השתנה, למה זה חשוב, breaking changes אם יש, והערך שנמסר) ו**מותאם ל-AI** (נתיבי קבצים עם מספרי שורות, אחריויות מודולים, דפוסי ארכיטקטורה שיושמו, שינויי גבולות, כיסוי טסטים, edge cases שטופלו). [התאימו דפוס זה](/docs/practical-techniques/lesson-7-planning-execution) לצרכי תיעוד אחרים: release notes (פיצ'רים מוכווני-משתמש מול changelog טכני), postmortems של תקריות (סיכום מנהלי מול ניתוח root cause טכני), design docs (סקירה ל-stakeholders מול deep-dive של מימוש).

**לסקירה בפועל**, השתמשו בפרומפטים אלה עם התוצרים שנוצרו:

- **[סקירת PR בסיוע AI](/prompts/pull-requests/ai-assisted-review)** ← סקרו PRs באמצעות התיאור מותאם-ל-AI עם אינטגרציית GitHub CLI
- **[סקירת קוד מקיפה](/prompts/code-review/comprehensive-review)** ← סקרו שינויי worktree לפני commit (שלב pre-PR)

### שיעורים קשורים

- **[שיעור 2: הסרת המסתורין מסוכנים](/docs/fundamentals/lesson-2-how-agents-work#the-stateless-advantage)** ← תת-סוכנים, האצלת משימות, שימור קונטקסט
- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#assigning-personas)** ← Persona, אילוצים, עקומות attention
- **[שיעור 5: גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding#production-pattern-multi-source-grounding)** ← גראונדינג מרובה-מקורות, מניעת הזיות
- **[שיעור 9: סקירת קוד](/docs/practical-techniques/lesson-9-reviewing-code)** ← אופטימיזציה לשני קהלים, תהליכי עבודה של PR, סקירה בסיוע AI
