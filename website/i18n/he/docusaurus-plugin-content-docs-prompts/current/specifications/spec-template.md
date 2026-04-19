---
title: תבנית System Specification
sidebar_position: 2
---

import SpecTemplate from '@site/shared-prompts/_spec-template.mdx';

## תבנית System Specification

תבנית מובנית לכתיבת specifications למערכות מאפס. השתמשו בה כשמעצבים פיצ'רים חדשים, מתכננים שינויים ארכיטקטוניים, או מתעדים מערכות קיימות לצורך שינוי.

ל**חילוץ** specs מבסיס קוד קיים אוטומטית, השתמשו
בפרומט [צור System Spec](/prompts/specifications/generate-spec) במקום.

### התבנית

<SpecTemplate />

### איך להשתמש

1. התחילו עם Architecture + Interfaces + State, ואז הוסיפו סעיפים כשהקוד דורש אותם
   (ראו [Converge, Don't Count Passes](/docs/practical-techniques/lesson-13-systems-thinking-specs#converge-dont-count-passes))
2. מלאו עם הספציפיקה של הדומיין שלכם — דלגו על סעיפים שלא רלוונטיים
3. השתמשו כקונטקסט לסוכן שמממש את הקוד, או כ-design document לסקירת צוות
4. מחקו לאחר המימוש — קוד הוא מקור האמת
   ([שיעור 12](/docs/practical-techniques/lesson-12-spec-driven-development))

### ראו גם

- [שיעור 13: חשיבה במערכות](/docs/practical-techniques/lesson-13-systems-thinking-specs) ← מסביר את ההגיון מאחורי כל סעיף
- [שיעור 12: Spec-Driven Development](/docs/practical-techniques/lesson-12-spec-driven-development) ← מחזור החיים של spec
- [צור System Spec](/prompts/specifications/generate-spec) ← חילוץ אוטומטי של specs מקוד
