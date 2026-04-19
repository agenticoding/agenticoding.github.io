---
sidebar_position: 2
sidebar_label: 'שיעור 4: Prompting 101'
title: 'Prompting 101'
---

עוזרי קידוד AI כמו קופיילוט הם לא שותפי שיחה—הם מנועי השלמת דפוסים (pattern completion engines) מתוחכמים. הבנת ההבחנה היסודית הזו משנה איך אתם כותבים פרומפטים.

חשבו על prompting כציור התחלה של תבנית או דפוס. המודל מנחש ומשלים מה שבא אחרי בהתבסס על דפוסים סטטיסטיים מנתוני האימון שלו. הפרומפט שלכם הוא לא בקשה; זו התחלת רצף שהמודל ישלים.

## Prompting ברור מבוסס הוראות

דלגו על נימוסים. מודלי AI לא צריכים "please" או "thank you"—טוקנים אלה מדללים את הכוונה שלכם מבלי להוסיף בהירות.

### פקודות ציווי

התחילו את הדפוס שאתם רוצים שיושלם. השתמשו בשפה ישירה ומוכוונת-פעולה.

**לא יעיל:**

```
Could you help me write a function to validate email addresses?
Thanks in advance!
```

**יעיל:**

```
Write a TypeScript function that validates email addresses per RFC 5322.
Handle edge cases:
- Multiple @ symbols (invalid)
- Missing domain (invalid)
- Plus addressing (valid)

Return { valid: boolean, reason?: string }
```

הפרומט היעיל מצייר התחלת דפוס מדויק: חתימת פונקציית TypeScript, כללי validation, return type. המודל משלים דפוס זה עם קוד מתאים.

### הבנת השלמת דפוסים

כשאתם כותבים "Write a TypeScript function that validates...", אתם לא שואלים שאלה. אתם מתחילים דפוס של קטע קוד. תפקיד המודל הוא לחזות מה באופן טבעי עוקב בהתבסס על דפוסים דומים בנתוני האימון שלו.

**התחלת דפוס:**

```typescript
// Write a secure authentication middleware for Express
function authMiddleware(
```

**המודל משלים:**

```typescript
  req: Request,
  res: Response,
  next: NextFunction
) {
  // המימוש עוקב אחר הדפוס...
}
```

ככל שהתחלת הדפוס שלכם יותר ספציפית, מרחב ההשלמה יותר מוגבל.

### פעלים חזקים וספציפיות

פעלים חזקים מבססים דפוסים ברורים:

| חלש | חזק |
| --------------------- | --------------------------------------------------------- |
| "תעשה פונקציה" | "כתוב פונקציה" |
| "תקן את הבאג" | "דבג את ה-null-pointer-exception ב-UserService.ts:47" |
| "עדכן את הדוקומנטציה" | "הוסף JSDoc  לכל הפונקציות הexported ב-auth.ts" |
| "שפר ביצועים" | "שפר את השאילתה להשתמש בעמודות מאונדקסות" |

**ספציפיות מצטברת ביעילות:**

```
Refactor UserRepository to use dependency injection:
1. Extract database connection to IDatabaseAdapter interface
2. Inject adapter via constructor
3. Update all 7 query methods to use adapter.execute()
4. Add unit tests mocking the adapter
```

זה מגדיר את דפוס הריפקטורינג לחלוטין. לא צריך ניחושים.

### אילוצים כגארדריילס (Constraints as Guardrails)
גארדריילס הם מעקות הבטיחות ששומרים על המודל שלא יפול.
ללא אילוצים, המודל ממלא פערים עם הנחות. הגדירו גבולות במפורש.

**ללא אילוצים:**

```
Add authentication to the API
```

איזה authentication? JWT? OAuth? טוקני Session? אילו endpoints?

**עם אילוצים:**

```
Add JWT authentication to the API:
- Do NOT modify existing session middleware
- Use jsonwebtoken library
- Protect all /api/v1/* endpoints except /api/v1/auth/login
- תוקף טוקן: 24 שעות
- שמור user ID ו-role ב-payload
- החזר 401 לטוקנים חסרים/לא-תקפים
```

עכשיו מרחב ההשלמה מוגדר היטב.

## הקצאת דמויות

 **השתמשו בפרסונות** (personas) או **דמויות** - כשטרמינולוגיה ספציפית לדומיין חשובה (אבטחה, ביצועים, נגישות) או כשאתם צריכים אוצר מילים עקבי לאורך משימות קשורות. **דלגו על דמויות כש**המשימה פשוטה והוספת קונטקסט של דמות מבזבזת טוקנים בלי להוסיף ערך.

דמויות עובדות על ידי הטיית התפלגות אוצר מילים. כתיבת "You are a security engineer" מגדילה את ההסתברות שמונחים ספציפיים לאבטחה כמו "threat model", "attack surface", "least privilege" יופיעו בתגובה. מונחים אלה פועלים כשאילתות סמנטיות במהלך תשומת לב, ומאחזרים דפוסי אימון שונים ממונחים גנריים כמו "check for issues". ה-persona הוא קיצור דרך לאוצר מילים—במקום לרשום כל מונח אבטחה במפורש, אתם מפעילים את אשכול המילים המשויך ל-"security engineer".

**דוגמה: פרומט גנרי**

```
Review this authentication code for issues.
```

תוצאה: עצות גנריות כמו "Check for proper validation and error handling"

**דוגמה: פרומט ממוקד-אבטחה**

```
You are a security engineer conducting a code review.
Review this authentication code. Flag vulnerabilities:
SQL injection, XSS, auth bypasses, secrets in code.
Assume adversarial input and untrusted networks.
```

תוצאה: ניתוח אבטחה ממוקד שמזהה פגיעויות ספציפיות עם אסטרטגיות מיטיגציה

השימוש בדמות לא הוסיף ידע—הוא שינה _איזה_ ידע מאוחזר על ידי הזזת אוצר מילים. עיקרון זה חל באופן אוניברסלי: אוצר מילים הוא ממשק הבקרה לאחזור סמנטי (semantic retrieval). אותו קונספט קובע איך אתם שולחים שאילתות לכלי חיפוש בסיס קוד (ChunkHound), לסוכני מחקר אינטרנט (ArguSeek), למסדי נתונים וקטוריים, או איך אתם מנחים תת-סוכנים. "Authentication middleware patterns" מאחזר chunks של קוד שונים מ-"login code". "Rate limiting algorithms" מוצא מחקרים שונים מ-"slow down requests". בחרו מונחים שמאחזרים את הדפוסים שאתם צריכים. (ראו [שיעור 5: עיגון Grounding](./lesson-5-grounding.md) לכלי חיפוש סמנטי.)

## Chain-of-Thought: סלילת נתיב ברור

כשמשימות דורשות צעדים מרובים, לעתים קרובות אתם צריכים שליטה על נתיב הביצוע. Chain-of-Thought (CoT), חוט או שרשרת מחשבה, מספק זאת על ידי הגדרה מפורשת של כל צעד שהמודל חייב לעקוב—כמו לתת הוראות נסיעה צעד-אחרי-צעד במקום רק את היעד. אתם שולטים במסלול, מבטיחים דיוק בכל שלב, והופכים את תהליך החשיבה לשקוף.

### הוראות צעד-אחר-צעד מפורשות

CoT מגדיר כל צעד שהמודל חייב לבצע ברצף. אתם לא מבקשים נימוקים—אתם מכתיבים את הנתיב.

**ללא CoT:**

```
Debug the failing test in UserService.test.ts
```

**עם CoT:**

```
Debug the failing test in UserService.test.ts:

1. Read the test file, identify which test is failing
2. Analyze test assertion: expected vs actual values
3. Trace code path through UserService to find the bug
4. Explain root cause
5. Propose fix

Provide your conclusions with evidence.
```

**למה CoT נותן לכם שליטה:**

- **אתם מכתיבים את הרצף**—המודל לא יכול לדלג על צעדים או לקחת קיצורים. כל צעד חייב להסתיים לפני שהבא מתחיל.
- **אימות בכל שלב**—שגיאות עולות מוקדם במקום להצטבר על פני צעדים מרובים.
- **ביצוע שקוף**—אתם רואים בדיוק מה קרה בכל צעד, מה שהופך דיבוג לפשוט.
- **חיוני לפעולות מורכבות**—מודלים מודרניים מטפלים במשימות פשוטות ללא CoT, אבל פעולות מרובות-שלבים (5+ צעדים) דורשות הנחיה מפורשת לדיוק.

CoT חזק במיוחד לביצוע עבודות QA שבהן אתם צריכים ביצוע שיטתי. ראו [שיעור 8: בדיקות כמעקות בטיחות](../practical-techniques/lesson-8-tests-as-guardrails.md) לדוגמאות פרודקשן של שימוש בבדיקות כגארדריילס בעבודה של של סוכנים.

## יישום מבנה לפרומפטים

מבנה מארגן מידע ומכוון את תשומת הלב של המודל. Markdown, JSON ו-XML יעילים במיוחד לארגון מידע כי הם פורמטים צפופי-מידע שמיוצגים היטב בנתוני האימון של המודלים.

### צפיפות מידע חשובה

לפורמטים שונים יש צפיפות מידע שונה—כמה משמעות מועברת לכל טוקן. Markdown צפוף מאוד במידע: כותרות, רשימות וקטעי קוד מספקים מבנה סמנטי ברור עם overhead מינימלי.

זה חשוב ליעילות טוקנים ולעיגון (grounding). פרומפטים מובנים היטב עוזרים למודל לנתח כוונה ולהגיב עם מבנה מתאים.

### Markdown לארגון היררכי

```markdown
# Task: Implement OAuth 2.0 Client Credentials Flow

## Requirements

- Support multiple authorization servers (configurable)
- שמור טוקנים במטמון עד פקיעה (Redis)
- נסה שוב אוטומטית על 401 עם רענון טוקן
- Expose as Express middleware

## שלבי המימוש

1. Create OAuthClient class with getToken() method
2. Implement caching של טוקנים with TTL
3. Add retry logic with exponential backoff
4. Write middleware injecting טוקן into req.context

## Testing

- Unit tests for OAuthClient
- Integration tests against mock OAuth server
- Error cases: network failure, invalid credentials, טוקנים שפג תוקפם

## Constraints

- Use axios for HTTP requests
- Use ioredis for caching
- No global state—client must be instantiated
```

המבנה הופך דרישות לקלות לסריקה ומושך תשומת לב לסעיפים נפרדים: מה לבנות, איך לבנות, איך לבדוק, וממה להימנע.

## דברים להימנע מהם

למודלי AI יש מצבי כשל צפויים. הבנת מצבים אלה עוזרת לכם לכתוב פרומפטים באופן דפנסיבי.

### בעיות שלילה

LLMs מתקשים עם שלילה כי מנגנוני תשומת לב מתייחסים ל-"NOT" כסתם עוד טוקן שמתחרה על משקל. כש-"NOT" מקבל תשומת לב נמוכה במהלך עיבוד, המודל מתמקד בקונספטים שהוזכרו ("passwords", "plain text") במקום בשלילה שלהם—תופעה שנקראת "affirmation bias" (הטיית אישור). יצירת טוקנים של המודל באופן יסודי נוטה לבחירה חיובית (מה לכלול) ולא להחרגה שלילית (ממה להימנע).

**מסוכן:**

```
Write a user registration endpoint.
Do NOT store passwords in plain text.
```

המודל עלול לפספס את ה"NOT" ולייצר אחסון סיסמאות בטקסט רגיל כי תשומת הלב מתמקדת ב-"passwords" + "plain text" תוך התעלמות מהשלילה.

**עדיף—שלילה ואז ההיפך החיובי:**

```
Write a user registration endpoint.

Password handling:
Do NOT store passwords in plain text.
Instead, always store passwords as hashed values.
Use bcrypt with 10 salt rounds before storing.
```

דפוס זה עובד על ידי:

1. **שלילה מפורשת קודם**: "Do NOT store passwords in plain text" מציין בבירור את האילוץ
2. **ההיפך החיובי מיד אחרי**: "Instead, always store passwords as hashed values" מספק את ה-NOT הלוגי בצורה חיובית
3. **פרטי אימפלמנטציה**: הוראות קונקרטיות (bcrypt, salt rounds) מחזקות את הדפוס הנכון

### מגבלות מתמטיקה

LLMs הם מנבאי טקסט הסתברותיים, לא מחשבונים. הם גרועים בחשבון.

**אל תסתמכו על LLMs למתמטיקה:**

```
Calculate the optimal cache size for 1M users with 2KB average data per user,
assuming 80% hit rate and 4GB available memory.
```

המודל ייצר מספרים שנשמעים סבירים שעלולים להיות לחלוטין שגויים.

**במקום זאת, בקשו מהמודל לכתוב קוד:**

```
Write a Python function that calculates optimal cache size.

Inputs:
- user_count: number of users
- avg_data_per_user_kb: average data size in KB
- hit_rate: cache hit rate (0.0 to 1.0)
- available_memory_gb: available memory in GB

Return optimal cache size in MB with reasoning.

Include unit tests validating the calculation.
```

## נקודות מפתח

- **Prompting הוא השלמת דפוסים, לא שיחה**—ציירו את התחלת הדפוס שאתם רוצים שהמודל ישלים
- **דלגו על נימוסים**—"please" ו-"thank you" מדללים את המידע בלי להוסיף ערך
- **שמויות משפיעות על אוצר מילים, לא על יכולת**—השתמשו בהן להטות לכיוון מונחים ספציפיים לדומיין שמשפרים עיגון
- **CoT סולל נתיב ברור**—השתמשו בהוראות צעד-אחר-צעד מפורשות למשימות מורכבות כשאתם צריכים שליטה ודיוק; יעיל במיוחד לעבודה של QA (ראו [שיעור 8](../practical-techniques/lesson-8-tests-as-guardrails.md))
- **מבנה מכוון את תשומת הלב**—Markdown, JSON, XML הם פורמטים צפופי-מידע ומיוצגים היטב בנתוני אימון של המודלים
- **הימנעו משלילה**—נסחו מה אתם רוצים במפורש; קל לפספס שלילה
- **LLMs לא יכולים לעשות מתמטיקה**—בקשו מהם לכתוב קוד שעושה מתמטיקה במקום

Prompting יעיל הוא הנדסת דיוק. אתם לא מנהלים שיחה—אתם מאתחלים מנוע השלמת דפוסים. היו ספציפיים, היו מובנים, היו מפורשים.

---

**הבא:** [שיעור 5: עיגון Grounding](./lesson-5-grounding.md)
