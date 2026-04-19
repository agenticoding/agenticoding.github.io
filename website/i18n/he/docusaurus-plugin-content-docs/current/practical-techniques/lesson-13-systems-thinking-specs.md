---
sidebar_position: 8
sidebar_label: 'שיעור 13: חשיבה מערכתית'
title: 'שיעור 13: חשיבה מערכתית'
---

import SystemFlowDiagram from '@site/src/components/VisualElements/SystemFlowDiagram';
import SystemBoundaryDiagram from '@site/src/components/VisualElements/SystemBoundaryDiagram';
import SpecCodeZoomDiagram from '@site/src/components/VisualElements/SpecCodeZoomDiagram';

[שיעור 12](/docs/practical-techniques/lesson-12-spec-driven-development) קבע ש-specs הם פיגומים—כלי חשיבה זמניים שנמחקים לאחר המימוש. אבל מה הופך spec ל*טוב מספיק* כדי לייצר קוד איכותי?

חשבו על spec כעדשת זום. בזום-אאוט, רואים ארכיטקטורה—מודולים, גבולות, התכונות הקבועות של המערכת (invariants) . בזום-אין, רואים מימוש—מקרי קצה, טיפול בשגיאות, מקביליות. קופצים הלוך ושוב בין דרכי ההסתכלות, וה-spec מתחדד דרך המעבר במימוש[^5].

## דיוק דרך איטרציה

specs מעורפלים מייצרים קוד מעורפל. דיוק מצמצם את מרחב הפתרונות:

| מעורפל | מדויק |
|-------|---------|
| "תעשה אימות ל webhook" | <div dir='ltr'>`C-001: NEVER process unsigned webhook — Signature validation on line 1 of handler`</div> |
| "אחסן נתוני תשלום" | <div dir='ltr'>`I-001: SUM(transactions) = account.balance — Verified by: generate 1K transactions, check sum after each batch`</div> |

אבל דיוק לא מושג דרך התבוננות בלבד—הוא מתגלה דרך איטרציה[^4]. כל מעבר דרך המימוש חושף אילוצים שה-spec החמיץ: מעבר בין מצבים שלא צפיתם, מקרה קצה של עבודה במקביל, תקציב ביצועים לא ריאליסטי. צוואר הבקבוק עבר מ"פרודקשן" ל"אורקסטרציה (Orchestration) + ולידציה (Verification)"[^1]—אתם מתזמרים מה נבנה ומוודאים שזה תואם לכוונה.

לזה יש השלכה מעשית על תהליך הדיבאג. כשהמימוש סוטה מהכוונה, שאלו: **האם הארכיטקטורה תקינה?** אם כן, תקנו את הקוד—הסוכן עשה שגיאה מכנית. אם המודל או הגבולות שגויים, תקנו את ה-spec וחוללו מחדש.

## תהליך העבודה האיטרטיבי
<div dir='ltr'>
<SpecCodeZoomDiagram />
</div>

התחילו עם שלושה חלקים: **ארכיטקטורה**, **ממשקים**, ו**סטייט**—מספיק כדי לייצר מעבר ראשון. ה-spec הוא היפותזה. הקוד הוא ניסוי. המימוש חושף מה ה-spec החמיץ: מעבר בין מצבים שלא צפיתם, אילוץ של מקביליוּת, תקציב ביצועים לא ריאליסטי. זום-אאוט—חלצו את ההבנה המעודכנת מהקוד באמצעות [ChunkHound code research](https://chunkhound.github.io/code-research). תקנו את הארכיטקטורה. זום-אין—ייצרו מחדש. חזרו עד התכנסות, ואז [מחקו את ה-spec](/docs/practical-techniques/lesson-12-spec-driven-development).

זהו [מחזור ארבעת השלבים של שיעור 3](/docs/methodology/lesson-3-high-level-methodology#the-four-phase-workflow) מיושם באופן "פרקטלי". ברמת ה-spec: עשו מחקר על הדומיין, תכננו ארכיטקטורה, כתבו spec, ולידציה לרמה של שלמות. ברמת הקוד: עשו מחקר על בסיס הקוד, תכננו שינויים, בצעו, ודאו שהטסטים עוברים. כל מעבר זום—spec←קוד או קוד←spec—הוא בעצמו לולאת "מחקר->תיכנון->ביצוע->אימות". עומק האיטרציה מותאם למורכבות: פיצ'ר פשוט מתכנס במעבר אחד; שינוי ארכיטקטוני מורכב עשוי לקחת חמישה.

הסעיפים למטה מייצגים את השאלות שתהליך זה מעלה. אתם לא תענו על כולן מראש— אתם תגלו אילו מהן חשובות כי הקוד חושף פערים.

## ארכיטקטורה: מודולים, גבולות, חוזים

לכל מערכת יש מבנה פנימי. הארכיטקטורה מכריחה אתכם להפוך את המבנה הזה למפורש.

### מודולים

מודול הוא יחידה עם אחריות בודדת. לא "מטפל בתשלומים"—זו קטגוריה. "מעבד אירועי Stripe webhook ומעדכן מצב תשלום"—זו אחריות.

| מודול | אחריות | גבול |
|--------|---------------|----------|
| webhook-handler | עיבוד Stripe webhooks, עדכון מצב תשלום | `src/payment/webhooks/` |
| notification | שליחת מיילים על אירועי תשלום | `src/notification/` |

כשאי אפשר לנסח מה מודול עושה במשפט אחד, הוא עושה יותר מדי.

### גבולות

גבולות מגדירים מה מודול *לא יכול* לייבא—אילוץ הצימוד (coupling).

- **webhook-handler** — לעולם לא מייבא מ-notification או מ-order
- **webhook-handler** — מפרסם אירועים לתור, הצרכנים מחליטים על הפעולה

גבולות מוֹנעים משינויים במודול אחד להתפשט במערכת.

### חוזים

חוזים מגדירים איך מודולים מתקשרים—מה הקורא מספק (preconditions) ומה הנקרא מבטיח (postconditions).

| ספק | צרכן | חוזה | תאור |
|----------|----------|----------|----------|
| webhook-handler | payment | `processEvent(stripeEventId): PaymentIntent`  |  precondition: אירוע עדיין לא עובד |
| payment | notification | `PaymentEvent { type, paymentId, amount, timestamp }` |postcondition: לא בר-שינוי לאחר פרסום |
| payment | checkout | `createIntent(orderId, amount): PaymentIntent` | precondition: הזמנה קיימת ולא שולמה |

### נקודות אינטגרציה

נקודות אינטגרציה הן הדלתות בקיר הגבול—איפה תעבורה חוצה מחיצוני לפנימי או להפך.

| נקודה | סוג | כיוון | בעלות |
|-------|------|-----------|-------|
| `/webhooks/stripe` | HTTP endpoint | inbound | webhook-handler |
| `/api/v1/payments` | REST API | inbound | payment |
| `payment-events` | Message queue | internal pub/sub | payment |

כיוון חשוב: נקודות כניסה צריכות אימות והגנה על כמות קריאות; pub/sub פנימי צריך דרך לוודא שהודעות התקבלו. אבל כיוון לבדו לא מסביר *למה* אימות מסוים קיים—זה דורש לציין מה אתם מניחים לגבי השירות החיצוני.

### הנחות צד שלישי

נקודות אינטגרציה אומרות לכם *איפה* שירותים חיצוניים מתחברים. הנחות צד שלישי לוכדות *מה אתם מאמינים לגבי אותם שירותים*—ערבויות התנהגותיות שהדיזיין שלכם תלוי בהן בשקט. כשלא הופכים אותן למפורשות, החלטות דיזיין נראות שרירותיות: סוכן רואה דרישה ספציפית "C-001" עבור "idempotency" אבל לא את סמנטיקת המסירה שדורשת אותה.

עבור מערכת ה-Stripe webhook, ההנחות שמניעות החלטות דיזיין מפתח הן:

| הנחה | מקור | מניע |
|------------|--------|--------|
| Webhooks מועברים at-least-once, לא exactly-once | Stripe docs | C-001 (idempotency), Redis lock, מודל event-driven-state |
| Webhooks עשויים להגיע שלא בסדר | Stripe docs | מכונת מצבים עם מעברים מפורשים |
| Payloads חתומים ב-HMAC-SHA256 | Stripe docs | C-002 (אימות חתימה) |
| זמינות API ~99.99% | Stripe SLA | Circuit breaker, תור להרצה מחדש, פולבק ידני |

עמודת ה**מניע** היא הנקודה. היא יוצרת יכולת מעקב מהנחה לאלמנט spec—כך שכשהנחה משתנה (מעבר מ-Stripe ל-Adyen, או ש-Stripe משנה סמנטיקת מסירה), תדעו בדיוק אילו אילוצים, מודלי state, והחלטות אבטחה לבחון מחדש. בלעדיה, מיגרציה של spec הופכת בעצם למעבר מחדש על כל ה-spec. באמצעות המניע, הביקורת מוגבלת אך ורק לשורות שההנחות שלהן כבר לא מתקיימות.

### נקודות הרחבה

לפעמים לא כל נקודות האינטגרציה ממומשות עדיין. כשוריאציה ספציפית *מחויבת*—ממומנת, מתוזמנת, נדרשת בדדליין ידוע—הצהירו על ממשק ברור שישאר יציב עכשיו כדי שהמימוש הנוכחי לא יתקבע.

| וריאציה | ממשק יציב | נוכחי | מתוכנן עד |
|-----------|-----------------|---------|------------|
| PayPal checkout | ממשק `PaymentGateway` | מימוש Stripe בלבד | Q3 — מחויב |
| Multi-currency | `Amount { value, currency }` | USD hardcoded | לא נסגר עדיין — יש להשמיט |

העיקרון הוא Protected Variation[^3] (Cockburn/Larman): זַהו נקודות של שינויים צפויים וצרו ממשק יציב סביבן. השורה השנייה נשארת בחוץ—YAGNI שומר אילו שינויים נכנסים ל-spec. רק צרכים עסקיים שהחליטו להכניס אותם מקבלים אבסטרקציה.

בלי זה, סוכנים בונים את המימוש הנכון הפשוט ביותר—Stripe client קשיח. כש-PayPal מגיע ב-Q3, זה הופך לשכתוב מאפס, לא הרחבה. הצהרה על הממשק עכשיו עולה אבסטרקציה אחת; השמטתו עולה מיגרציה.

## State: מה שנשמר, מה שמשתנה, מה שמתאושש

State הוא המקום שבו באגים מסתתרים. חלק ה-state מכריח אתכם לתת דין וחשבון על מה שהמערכת זוכרת.

### ישויות

מה נשמר מעבר לבקשה בודדת? איפה זה חי? מי הבעלים?

| ישות | שמירה | אחסון | בעלות |
|--------|-------------|---------|-------|
| PaymentIntent | persistent | טבלת payments | payment service |
| WebhookEvent | persistent | טבלת webhooks | payment service |
| ProcessingLock | ephemeral (ארעי) | Redis | payment service |

ההבחנה חשובה להתאוששות מקריסה (Crash Recovery). אם התהליך מת באמצע פעולה, state ארעי נעלם. המערכת שלכם חייבת להתמודד עם זה.

### מודלי State

איך שאתם ממדלים state קובע איך אתם חושבים על מעברים (transitions).

| מודל | מתי להשתמש | Trade-off | שאלת מפתח |
|-------|----------|----------|-------------|
| דקלרטיבי | רינדור UI, תשתיות, התכנסות schema | פשוט להבנה; צריך reconciler שיעשה diff ולהתכנס | "מה צריך להיות מצב הסיום?" |
| Event-Driven | Webhooks, messaging, event sourcing, CQRS | audit trail מלא והפעלה חוזרת (replay); eventual consistency, מורכבות סדר | "מה קרה, ובאיזה סדר?" |
| מכונת מצבים | מחזורי חיי תשלום, זרימות הזמנה, שרשראות אישור | מעברים לא חוקיים בלתי אפשריים; כל קו מחבר חייב להיות מוגדר מראש | "אילו מעברים חוקיים ממצב זה?" |

המודל הדקלרטיבי הולך והופך לברירת מחדל בתחומים רבים — React מבצע reconcile לUI וTerraform מיישב תשתיות, SQL מצהיר תוצאות שאילתה, GitOps מיישב deployments. התבנית הבסיסית היא תמיד אותו דבר: `desired_state + reconciliation_loop`. אתם מצהירים מה, משהו אחר מבין איך. כשאין reconciler לתחום שלכם, אתם בונים אחד — זו העלות.

בחרו מודל אחד לכל ישות. מחזור חיי תשלום = מכונת מצבים (pending → processing → succeeded/failed). קליטת webhook = event-driven (append-only log, at-least-once delivery). יתרת חשבון = declarative (`SUM(transactions)` חייב להתכנס ל-`account.balance`). המודל מעצב את הקוד שסוכנים מייצרים: מכונות מצבים מייצרות `switch/case` עם מעברים מפורשים, event-driven מייצר handlers ו-projections, מודל דקלרטיבי מייצר reconcilers של diff-and-patch.

### מצבי שגיאה

שגיאות אינן חריגות למודל הנתונים שלכם—הן חלק ממנו.

| קוד | משמעות | התאוששות |
|------|---------|----------|
| PAYMENT_PENDING | ממתין לאישור Stripe | נסה שוב בדיקת webhook |
| PAYMENT_FAILED | Stripe דחה | הודע למשתמש, אפשר ניסיון חוזר |
| WEBHOOK_DUPLICATE | כבר עובד | החזר 200, דלג על עיבוד |

כשממדלים מצבי שגיאה במפורש, נתיבי התאוששות (Recovery Paths) הופכים ברורים.

### אתחול והתאוששות מקריסה

מערכות לא מתחילות במצב יציב. סדר אתחול והתאוששות מקריסה קובעים האם restart משחית נתונים או ממשיך בצורה נקייה.

| סדר | רכיב | תלוי ב | מוכן כש | בכישלון |
|-------|-----------|------------|------------|---------|
| 1 | Database | — | מקבל חיבורים | abort |
| 2 | Cache | Database | Ping מצליח | degrade |
| 3 | HTTP server | DB, Cache | Healthcheck 200 | retry 3×, abort |

אם צעד אתחול כלשהו לא תומך בהתעלמות מהרצה כפולה ,crash-and-restart יכול להשחית state. ציינו מה "Ready" אומר לגבי כל רכיב, ומה קורה כשמוכנות נכשלת.

---

ארכיטקטורה מגדירה את השלד הפנימי—מודולים, גבולות, חוזים. החלק הבא מחליף פרספקטיבה: איך המערכת נראית מ*בחוץ*?
<div dir='ltr'>
<SystemBoundaryDiagram />
</div>

הקו המקווקו הוא המפתח. כל מה שבתוכו הוא ארכיטקטורה: מודולים מחוברים בחוזים. כל מה שחוצה אותו הוא ממשק: נתונים שנכנסים (inputs) או יוצאים (outputs) מהמערכת. נקודות אינטגרציה הן הדלתות בקיר.

## ממשקים: כניסות ויציאות

לכל מערכת יש שטח פַּנים — המקום שדרכו נתונים נכנסים ויוצאים. בעוד ארכיטקטורה מתארת מבנה פנימי, ממשקים מתארים את המשטח החיצוני של המערכת: מה חוצה את הגבול, באיזה פורמט, ותחת אילו אילוצים.

### כניסות

| שם | מקור | פורמט | ולידציה | הגבלת כמות |
|------|--------|--------|------------|------------|
| Stripe webhook | Stripe (HTTPS POST) | `StripeEvent` JSON | חתימת HMAC-SHA256, timestamp < 5min | 10K/min |
| Payment request | Client app (REST API) | `{ orderId: UUID, amount: number }` | JWT auth, orderId קיים, amount > 0 | 100/min per client |

כל כניסה חוצה את הגבול ממקור חיצוני. עמודת ה"פורמט" היא מה שמפרסרים; עמודת ה"ולידציה" היא מה שדוחים; עמודת "הגבלת הכמות" היא מה שמגבילים. כניסות ללא שלושתם הן באגים שמחכים לקרות.

### יציאות

| שם | יעד | פורמט | SLA |
|------|-------------|--------|-----|
| Webhook ack | Stripe (HTTP response) | `200` ריק / `400` קוד שגיאה | < 100ms p95 |
| Payment notification | RabbitMQ (AMQP) | `{ event_type, payment_id, amount, timestamp }` | at-least-once, < 500ms |
| Payment response | Client app (HTTP response) | `{ paymentId, status, created_at }` | < 200ms p95 |

כל שורת יציאה היא הבטחה לצרכן חיצוני. עמודת ה"פורמט" היא החוזה שהם תלויים בו. עמודת ה"SLA" היא ההבטחה שיחייבו אתכם לעמוד בה.

## אילוצים ו-Invariants: הגדרת נכונות

אילוצים מגבילים *פעולות* (לעולם אל תעשה X). Invariants מתארים *state* קבוע (X תמיד נכון). יחד הם מגדירים מה "נכון" אומר למערכת שלכם.

### אילוצים

| ID | כלל | מאומת על ידי | נתונים | עומס |
|----|------|-------------|------|--------|
| C-001 | לעולם אל תעבד webhook כפול | Unique constraint על stripe_event_id | 10K אירועים סינתטיים, 5% כפולים | 100 מסירות מקבילות |
| C-002 | לעולם אל תסמוך על webhook לא חתום | אימות חתימה לפני עיבוד | payloads תקינים + מזויפים | — |
| C-003 | לעולם אל תרשום מספרי כרטיס | סורק PCI compliance ב-CI | payloads המכילים PAN data | — |

עמודות **נתונים** ו**עומס** הופכות אילוץ ממשאלה לדרישה שניתן לבדוק. "לעולם אל תעבד כפולים" היא מדיניות. "לעולם אל תעבד כפולים, מאומת עם 10K אירועים ב-100 מסירות מקבילות" היא דרישה הנדסית עם תוכנית אימות. (שימו לב ש-C-001 ו-C-002 מתחקים חזרה ל[הנחות צד שלישי](#הנחות-צד-שלישי)—הם קיימים *בגלל* סמנטיקת המסירה והחתימה של Stripe, לא כבחירות אבטחה שרירותיות.)

במהלך המימוש, IDs אלה מהגרים לקוד כהערות מובנות ([שיעור 11](/docs/practical-techniques/lesson-11-agent-friendly-code#comments-as-context-engineering-critical-sections-for-agents)):

```typescript
// C-001: NEVER process duplicate webhook — idempotency via unique constraint on stripe_event_id
// C-002: NEVER trust unsigned webhook — HMAC-SHA256 validation before any processing
export async function handleWebhook(req: Request): Promise<Response> {
  verifySignature(req)  // C-002
  if (await isDuplicate(req.body.id)) return new Response(null, { status: 200 })  // C-001
  // ...
}
```

טבלת ה-spec היא מקור האמת היחיד בזמן הדיזיין. הערות הקוד הופכות למקור האמת היחיד אחרי המימוש. זה מה שהופך את [מחיקת ה-spec](/docs/practical-techniques/lesson-12-spec-driven-development) לבטוחה—האילוצים הִגרוּ אל הקוד.

### Invariants

| ID | תנאי | טווח | מתבטא על ידי |
|----|-----------|-------|---------------|
| I-001 | `payment.status IN (pending, processing, succeeded, failed)` | PaymentIntent | הכנס status לא תקין, ודא דחייה |
| I-002 | `webhook.processed_at IS NULL OR webhook.event_id IS UNIQUE` | WebhookEvent | עבד אותו אירוע פעמיים, ודא רשומה בודדת |
| I-003 | `SUM(transactions) = account.balance` | Account ledger | צור 1K טרנזקציות, ודא סכום אחרי כל batch |

עמודת ה**מתבטא על ידי** עונה איך טסט מפעיל את ה-invariant. בלעדיו, invariants הם assertions שאף אחד לא בודק. הפרת invariant אומרת שמודל הנתונים שלכם פגום—ודאו שאתם יכולים לזהות את זה.

## אימות התנהגות: תרחישים קונקרטיים בגבולות

אילוצים אומרים לעולם לא. Invariants אומרים תמיד. אף אחד מהם לא עונה: מה *צריך* לקרות כש-`amount=0`?

תרחישים התנהגותיים ממלאים את הפער הזה—דוגמאות Given-When-Then קונקרטיות בגבולות המערכת, ספציפיות מספיק להפוך לטסטים בלי להכתיב framework, mocks, או תחביר assertion.

| ID | Given | When | Then | קטגוריית הגבול |
|----|-------|------|------|---------------|
| B-001 | PaymentIntent במצב `pending` | Webhook מעביר `succeeded` עם amount=0 | מעבר ל-`succeeded`, balance ללא שינוי | boundary value |
| B-002 | אין PaymentIntent תואם | Webhook מעביר אירוע תקין ל-intent לא ידוע | החזר 200, רשום warning, אין שינוי state | null / missing |
| B-003 | Stripe API מחזיר 503 | לקוח שולח בקשת תשלום | החזר 502, העמד בתור ל-retry, לא נוצר charge | error propagation |
| B-004 | שני webhooks זהים תוך 10ms | שניהם עוברים אימות חתימה | הראשון מעובד, השני מחזיר 200, אין שינוי state | concurrency |

כל תרחיש מקושר חזרה לאילוץ או לinvariant. למשל B-001 מפעיל את I-003 (שלמות balance), B-004 מפעיל את C-001 (אין עיבוד כפול). עמודת **קטגוריית הגבול** היא צ'קליסט שיטתי: boundary values, null/empty, error propagation, concurrency, temporal. עברו על כל קטגוריה לכל ממשק; שגיאות מתרכזות בגבולות[^2] כי סוכנים לא מסיקים אותן באופן אמין.

ה-spec מתאר *מה צריך לקרות*, לא *איך לבדוק את זה*. בחירת פריימוורק, קונפיגורציות mock, וסינטקס של assertion שייכים למימוש—הם משתנים עם בסיס הקוד. דוגמאות התנהגותיות שורדות ריפקטורינג.

## תכונות איכות: כמה טוב זה מספיק טוב?

תכונות איכות מגדירות ספי מדידה בשלוש רמות: יעד (פעולות רגילות), ירידה בביצועים (התראות), וכישלון (פתיחת קריאה לטיפול).

| תכונה | יעד | ירידה בביצועים | כישלון | מדידה |
|-----------|--------|----------|---------|-------------|
| Latency p95 | 100ms | 200ms | 1s | APM traces |
| Availability | 99.9% | 99.5% | 99% | uptime/month |
| Recovery | 15min | 30min | 1h | incident drill |

 שלוש רמות נותנות לכם תקציב לתקלות לפני ה-outage הראשון והופכות "מספיק טוב" למשהו קונקרטי במקום שאיפה ערטילאית.

## תקציב ביצועים: פירוק SLOs

תכונות איכות אומרות "Latency p95: 100ms." אבל לתהליך ה-webhook יש חמישה צעדים. איזה צעד מקבל כמה מילישניות?

| צעד זרימה | תקציב | Hot/Cold |
|-----------|--------|----------|
| אימות חתימה | 2ms | hot |
| בדיקת Idempotency - מניעת טיפול כפול (Redis) | 5ms | hot |
| Parse + validate payload | 3ms | hot |
| עדכון state תשלום (DB) | 15ms | hot |
| פרסום אירוע (queue) | 5ms | cold |
| **סה"כ** | **30ms** | |
| **מרווח** | **70ms** | |

התקציב מכריח שתי החלטות שסוכנים לא יכולים לקבל לבד. ראשית, *hot vs. cold path*: אימות חתימה הוא סינכרוני וחוסם—הוא מקבל תקציב צמוד. פרסום אירועים הוא אסינכרוני — הוא סובל יותר. שנית, *מרווח (headroom)*: הסה"כ הוא 30ms מול SLO של 100ms, משאיר 70ms לפעולות עתידיות בנתיב הזה. ללא פירוק, סוכן עשוי לבזבז את כל התקציב על query לא אופטימלי בודד.

תקציבים לכל פעולה גם מעלים אילוצים אלגוריתמיים. אם "בדיקת idempotency" חייבת להסתיים ב-5ms, זה שולל full-table scan—הסוכן יודע להשתמש ב-indexed lookup או bloom filter בלי שיגידו לו.

## תרשימי זרימה: מעקב אחר ביצוע

תרשימי זרימה עוקבים אחר ביצוע מהטריגר עד להשלמה, הם חושפים נקודות אינטגרציה ופערים בטיפול בשגיאות.

<SystemFlowDiagram />

לכל צעד יש שלושה חלקים: מה קורה, מה קורה בהצלחה, מה קורה בכישלון. תרשימי זרימה מכריחים אתכם לחשוב על נתיב הביצוע בפועל, לא אבסטרקציה אידיאלית של ה-happy path.

## אבטחה ואובזרבביליות (Observability): תכונות מערכת

אלה לא פיצ'רים שמוסיפים בדיעבד— אלה תכונות מערכת שנובעות מגבולות נכונים ומכשור (Instrumentation) נכון.

### אבטחה

איפה האמון נגמר? במה תוקף יכול לשלוט?

| איום | מיטיגציה |
|--------|------------|
| Webhook מזויף | אימות חתימה עם STRIPE_WEBHOOK_SECRET |
| התקפת replay | בדיקת idempotency על event_id |
| חשיפת secrets | Secrets מ-env vars, לעולם לא נרשמים |

:::tip צ'קליסט מעמיק לאבטחה
למערכות עם attack surface משמעותי, ציינו גם: **Authentication** (איך זהויות מאומתות?), **Authorization** (מי יכול לעשות מה? default deny), **הגנת נתונים** (מה PII? מוצפן at rest? מדיניות retention?). ראו את [התבנית המלאה](/prompts/specifications/spec-template) לפורמט המלא.
:::

### אובזרבביליות - היכולת להבין את מצב המערכת

איך יודעים שזה עובד?

| מטריקה | סוג | סף התראה |
|--------|------|-----------------|
| webhook_processing_duration | histogram | p99 > 5s |
| payment_success_rate | gauge | < 95% over 5min |
| duplicate_webhook_rate | counter | > 10/min |

:::tip צ'קליסט מעמיק לאובזרבביליות
למערכות קריטיות של פרודקשן, ציינו גם: **Logging** (פורמט מובנה, correlation IDs, redaction של PII), **SLOs** (יעדי availability/latency, התראות burn-rate), **Tracing** (תקן propagation, אסטרטגיית דגימות, ספאנים מרכזיים. ראו את [התבנית המלאה](/prompts/specifications/spec-template) לפורמט המלא.
:::

## Deployment ואינטגרציה: הגבול התפעולי

איך מערכת מגיעה לפרודקשן ואיך היא מתנהגת כשתלויות נכשלות—אלה חלק מה-spec בדיוק כמו הלוגיקה העסקית.

### אסטרטגיית Deployment

ציינו את שיטת הפריסה לפרודקשן (blue-green, canary, rolling), טריגרים ל-rollback (אילו מטריקות גורמות ל-auto-rollback?), וגישת מיגרציה (שינויי schema תואמים לאחור לכמה זמן?). החלטות אלו משפיעות על מבנה הקוד—canary deployments דורשים פיצ'ר-פלֶגס; rolling updates דורשים APIs תואמים לאחור.

### תלויות אינטגרציה

| שירות | חוזה | בכישלון | Timeout |
|---------|----------|------------|---------|
| Stripe API | REST, idempotency key | העמד בתור ל-retry, degrade לידני | 5s, circuit breaker ב-50% כישלון |

Circuit breakers, timeouts, ומצבי fallback מגדירים איך המערכת שלכם מתדרדרת בחן (Graceful Degradation). בלעדיהם, תלות איטית אחת יכולה להוביל לנפילה מלאה. מצבי כישלון תפעוליים אלה מממשים את [ההנחות הארכיטקטוניות](#הנחות-צד-שלישי) שהוצהרו קודם—ה-circuit breaker קיים כי הנחתם ~99.99% זמינות, לא 100%.

## המטרה היא להתכנס, אל תספרו מעברים

ה-spec הוא היפותזה. הקוד הוא ניסוי. הולידציה היא תצפית או תובנה. זו השיטה המדעית מיושמת להנדסה—והיא מסתיימת בהתכנסות (Convergence), לא במספר מעברים קבוע מראש.

תמיד התחילו עם שלושה חלקים: **ארכיטקטורה**, **ממשקים**, ו**סטייט**. חוללו מעבר ראשון. ואז שאלו שאלה אחת: **האם הארכיטקטורה תקינה?**

- **כן** ← תקנו את הקוד. הסוכן עשה שגיאה מכנית - תקנו את המימוש.
- **לא** ← תקנו את ה-spec וייצרו מחדש. אל תעשו איזה האק בקוד בתוך גבולות פגומים.

כל לולאה דרך המחזור הזה חושפת מה ה-spec החמיץ. המעבר הראשון עשוי לחשוף אילוצי מקביליוּת. המעבר השני עשוי להעלות צוואר בקבוק בביצועים—הוסיפו תקציב ביצועים. הקוד *מושך* עומק מכם; אתם לא דוחפים עומק עליו על ידי קטגוריזציה של מורכבות מראש. אי אפשר לדעת אילו חלקים חשובים לפני שהקוד מראה לכם איפה הפערים[^4].

**סיימתם כשהלולאה לא מייצרת פערים חדשים:** הקוד עובר את כל התרחישים ההתנהגותיים, ה-spec מכסה את כל האילוצים שהקוד חשף, והמעבר האחרון לא מעלה דבר חדש. זה תנאי סיום בר בדיקה. פיצ'ר פשוט מתכנס בלולאה אחת. שינוי ארכיטקטוני מורכב עשוי לקחת חמש. אבל מגלים עם איזה מהם מתמודדים *על ידי הרצת הלולאה*, לא על ידי חיזוי.

**מהירות איטרציה היא המכפיל.** קידוד מתקרב לעידן של שפע, פוסט-מחסור (Post-Scarcity)[^1]—המשאב הנדיר הוא שיקול הדעת שלכם לגבי *מה* לבנות. המהנדס שמריץ עשר לולאות היפותזה←ניסוי←ולידציה ביום עולה על מי שמריץ שתיים עם spec יסודי יותר מראש[^4][^5]. זו אותה תובנה שגרמה ל-Agile להיות טוב יותר מ-Waterfall. השתמשו ב[תכנון בגישת החקירה](/docs/methodology/lesson-3-high-level-methodology#שלב-2-תכנון-החלטה-אסטרטגית) (שיעור 3) ו-[ArguSeek](/docs/methodology/lesson-5-grounding#arguseek-isolated-context--state) (שיעור 5) למחקר לפני כל לולאה. לעבודה ברמת מערכת, התחילו מ[התבנית המלאה](/prompts/specifications/spec-template). ולידציה דרך [תהליך SDD](/docs/practical-techniques/lesson-12-spec-driven-development)—נתחו פערים, ממשו, ואז מחקו את ה-spec. הדברים ששורדים הם מחיקה: IDs של אילוצים שמוטבעים אל הקוד ([שיעור 11](/docs/practical-techniques/lesson-11-agent-friendly-code#comments-as-context-engineering-critical-sections-for-agents)), והשאריות הקטנות של ה"למה" (אלטרנטיבות שנדחו, רציונל עסקי) שנשמרות כ-decision records.

:::info חלקי תבנית שלא כוסו
[תבנית ה-spec המלאה](/prompts/specifications/spec-template) כוללת חלקים שלא נלמדו בשיעור זה: **רקע** (הצהרת בעיה + מטריקות baseline), **Caching** (אסטרטגיה/TTL/invalidation), **Endpoints** (פרטי חוזה REST), **Cleanup Flows** (רצפי teardown/rollback), **Code Traceability** (עמודות ראיה file:line). השתמשו בהם כשהקוד מושך אותם מכם—לא לפני.
:::

## נקודות מפתח

- **Specs הם עדשת זום, לא  תוכניות מתאר** — דלגו בין ארכיטקטורה ממבט ציפור לבין מימוש ברמת הפרטים.

- **Spec = היפותזה, קוד = ניסוי** — כל לולאה דרך המחזור בודקת האם ההנחות הארכיטקטוניות שלכם מחזיקות. עיצרו כשהלולאה לא מייצרת פערים חדשים.

- **דיוק מתגלה עם הזמן, לא כתוב מראש** — כל מעבר spec←קוד חושף פערים שה-spec הקודם החמיץ. הקוד מושך עומק מכם.

- **מהירות איטרציה היא המכפיל** — קוד הוא זול, שיקול דעת נדיר. שימו דגש על לולאות "היפותזה←ניסוי←ולידציה" לכל יום, ולא על יסודיות ה-spec בכל לולאה.

- **ארכיטקטורה הופכת מבנה למפורש** — מודולים בעלי אחריות בודדת, גבולות מונעים תלות, חוזים מגדירים תקשורת.

- **הנחות צד שלישי הן מניעים ארכיטקטוניים** — הפכו אותן למפורשות כדי שסוכנים ידעו אילו החלטות לבחון מחדש כשספקים משתנים.

- **מידול state מעצב קוד מעברים** — בחרו מודל דקלרטיבי, event-driven, או מכונת מצבים לכל ישות.

- **תקנו specs לארכיטקטורה, תקנו קוד לבאגים** — גבולות פגומי-> ג'נרטו מחדש מ-spec מעודכן; שגיאות מכניות -> תקנו את המימוש.

- **מחקו את ה-spec כשסיימתם** — הקוד הוא מקור האמת.

---

[^1]: Xu et al. (2025) - "When Code Becomes Abundant: Implications for Software Engineering in a Post-Scarcity AI Era" - טוען שהנדסת תוכנה עוברת מפרודקשן לאורקסטרציה + ולידציה כש-AI הופך פרודקשן קוד לזול. מקור: [arXiv:2602.04830](https://arxiv.org/html/2602.04830v1)
[^2]: מחקר Boundary Value Analysis מראה באופן עקבי ששגיאות מתרכזות בקצוות קלט (min, max, off-by-one). ראו Ranorex — ["What Is Boundary Value Analysis in Software Testing?"](https://www.ranorex.com/blog/boundary-value-analysis) ו-NVIDIA — ["Building AI Agents to Automate Software Test Case Creation"](https://developer.nvidia.com/blog/building-ai-agents-to-automate-software-test-case-creation) (HEPH framework ל-AI-driven positive/negative test specification).
[^3]: Cockburn, Alistair / Larman, Craig — "Protected Variation: The Importance of Being Closed" (IEEE Software). מנסח מחדש את Open-Closed Principle כ: "זהו נקודות של וריאציה צפויה וצרו ממשק יציב סביבן." ראו גם Fowler, Martin — [YAGNI](https://martinfowler.com/bliki/Yagni.html) להבחנה בין פיצ'רים presumptive ל-known.
[^4]: Eberhardt, Colin (2025) — ["Putting Spec Kit Through Its Paces: Radical Idea or Reinvented Waterfall?"](https://blog.scottlogic.com/2025/11/26/putting-spec-kit-through-its-paces-radical-idea-or-reinvented-waterfall.html) — מצא ש-iterative prompting ~10x יותר מהיר מ-specification-driven development. Li et al. (2025) — "Specine: An AI Agent That Writes Your Spec" ([arXiv:2509.01313](https://arxiv.org/abs/2509.01313)) — מאשר ש-LLMs טועים בתפיסת איכות specification, דורש iterative alignment.
[^5]: Lloyd, Zach (2025) — [ראיון First Round Capital](https://www.firstround.com/ai/warp) — משווה specs מבוססי outcome מראש ל"כתיבת design doc ענק למשהו מראש"; תומך בהנחיית agent איטרטיבית והדרגתית במקום. Beck, Kent (2025) — ["Augmented Coding: Beyond the Vibes"](https://tidyfirst.substack.com/p/augmented-coding-beyond-the-vibes) — מדגים תוכניות שנכשלות במגע עם מורכבות המימוש; תומך במחזורי TDD הדרגתיים על פני specification מראש.
