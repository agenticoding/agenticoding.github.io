---
title: סקירת PR בסיוע AI
sidebar_position: 2
---

import AIAssistedReview from '@site/shared-prompts/\_ai-assisted-review.mdx';

<AIAssistedReview />

### סקירה כללית

**למה תהליך עבודה דו-שלבי עם אימות אנושי:** שלב 1 מייצר ניתוח מובנה באמצעות חשיבת [Chain of Draft (CoD)](/docs/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work)—עד 5 מילים לכל צעד חשיבה, מפחית צריכת טוקנים ב-60-80% תוך שמירה על איכות ההיסק. אינטגרציית GitHub CLI (`gh pr view --comments`) מספקת [גראונדינג (Grounding) ממקורות מרובים](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality) מעבר ל-code diff: metadata של PR, threads של דיון, issues מקושרים, כוונת המחבר. [הנחיית persona](/docs/methodology/lesson-4-prompting-101#assigning-personas) ("maintainer") מטה לכיוון ניתוח ביקורתי במקום אישור גנרי. דרישת ראיות ("never speculate...investigate files") מכריחה מחקר קוד לפני טענות, ומונעת הזיות (hallucinations). **בין השלבים, אתם מאמתים ממצאים**—LLMs יכולים להיות בטוחים בטעות לגבי הפרות ארכיטקטוניות. בדקו הפניות file:line, הטילו ספק בביקורות מעורפלות. שלב 2 הופך ניתוח מאומת לפלט לשני קהלים: HUMAN_REVIEW.md (תמציתי, אקשנבילי) ו-AGENT_REVIEW.md (קונטקסט טכני יעיל). זה משקף את דפוס [מחולל תיאור PR](/prompts/pull-requests/dual-optimized-pr)—המשך של אותו קונטקסט, לא ניתוח מאפס.

**מתי להשתמש—מקרי שימוש עיקריים:** סקירת PR שיטתית לשינויים ארכיטקטוניים שנוגעים במודולי ליבה, הצגת patterns חדשים, או refactoring משמעותי. הכי יעיל עם תיאור מותאם-AI מ-[מחולל תיאור PR](/prompts/pull-requests/dual-optimized-pr) (נתיבי קבצים מפורשים, גבולות מודולים, breaking changes). מומלץ לשימוש pre-merge כאימות סופי ב[שלב Validate](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow), לא במהלך פיתוח פעיל (השתמשו ב[סקירה מקיפה](/prompts/code-review/comprehensive-review) לשינויי worktree). קבצי הפלט הכפול מאפשרים: HUMAN_REVIEW.md לדיון maintainer (1-3 פסקאות, שבחים + מיקוד אקשנבילי), AGENT_REVIEW.md לכלי AI ב-downstream שעשויים לעבד את הסקירה. פחות יעיל ל-PRs טריוויאליים (תיעוד בלבד, עדכוני dependencies, תיקוני באגים פשוטים) שבהם ה-overhead של הסקירה עולה על התועלת.

**דרישות קדם:** [GitHub CLI](https://cli.github.com/) (`gh`) מותקן ומאומת (`gh auth status`), [ChunkHound](https://chunkhound.github.io/) לחיפוש סמנטי בקודבייס, [ArguSeek](https://github.com/ofrivera/ArguSeek) ללימוד דפוסי אופטימיזציה לאדם/LLM בשלב 2. דורש קישור PR (URL או מספר), תיאור מותאם-AI מתהליך העבודה של [מחולל תיאור PR](/prompts/pull-requests/dual-optimized-pr). פלטים: שלב 1 מייצר verdict מובנה (Summary/Strengths/Issues/Decision), שלב 2 מייצר קבצי HUMAN_REVIEW.md ו-AGENT_REVIEW.md. [התאימו Critical Checks למיקוד מתמחה](/docs/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work): אבטחה (input validation, בדיקות auth, טיפול ב-credentials, וקטורי injection), ביצועים (complexity, שאילתות N+1, memory patterns, caching), נגישות (HTML סמנטי, ניווט מקלדת, ARIA, contrast).

### שיעורים קשורים

- **[שיעור 3: מתודולוגיה ברמה גבוהה](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow)** ← תהליך עבודה בארבעה שלבים (Research > Plan > Execute > Validate)—סקירת PR היא שלב Validate
- **[שיעור 4: Prompting 101](/docs/methodology/lesson-4-prompting-101#assigning-personas)** ← [הנחיות Persona](/docs/methodology/lesson-4-prompting-101#assigning-personas), [Chain-of-Thought](/docs/methodology/lesson-4-prompting-101#chain-of-thought-paving-a-clear-path), [אילוצים](/docs/methodology/lesson-4-prompting-101#constraints-as-guardrails), פלט מובנה
- **[שיעור 5: גראונדינג (Grounding)](/docs/methodology/lesson-5-grounding#grounding-anchoring-agents-in-reality)** ← גראונדינג מרובה-מקורות (GitHub CLI + מחקר קוד + תיאורים מותאמים-ל-AI), הנחיות גראונדינג מפורשות
- **[שיעור 7: תכנון וביצוע](/docs/practical-techniques/lesson-7-planning-execution#require-evidence-to-force-grounding)** ← דרישות ראיות מכריחות ציטוטי file:line, מאתגרות טענות מעורפלות
- **[שיעור 9: סקירת קוד](/docs/practical-techniques/lesson-9-reviewing-code#mechanisms-at-work)** ← יעילות Chain of Draft (CoD), וורקפלואו של dual-optimized PR, התאמות סקירה מתמחות
