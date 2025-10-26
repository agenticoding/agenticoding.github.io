---
sidebar_position: 2
sidebar_label: 'Lesson 4: Prompting 101'
---

# Prompting 101: Operating AI Agents Effectively

Prompting is the interface between your intent and the agent's execution. Like writing clear API documentation or crafting precise SQL queries, effective prompts are specific, structured, and unambiguous.

This lesson covers the fundamental techniques that separate productive agent operation from frustrating iteration loops.

## Learning Objectives

- Write imperative, unambiguous prompts that minimize iteration cycles
- Apply persona assignment strategically to constrain agent behavior
- Use Chain-of-Thought (CoT) and Chain-of-Draft (CoD) patterns to improve reasoning quality
- Structure prompts with markdown, JSON, or XML to enforce output format

## Clear Instruction-Based Prompting

AI agents execute literal instructions. Ambiguity leads to probabilistic interpretation, which leads to rework.

### Imperative Commands

Use direct, action-oriented language. Skip pleasantries - they consume tokens without adding clarity.

**Bad:**

```
Could you please help me write a function that validates email addresses?
It would be great if you could also handle edge cases. Thanks!
```

**Good:**

```
Write a TypeScript function that validates email addresses according to RFC 5322.
Handle these edge cases:
- Multiple @ symbols (invalid)
- Missing domain (invalid)
- Internationalized domain names (valid)
- Plus addressing (valid)

Return { valid: boolean, reason?: string }
```

The difference:

- **Specific output format** (TypeScript, return type defined)
- **Explicit requirements** (RFC 5322 standard)
- **Enumerated edge cases** (no guessing)
- **Zero ambiguity** (what "handle" means is clear)

### Action Verbs and Specificity

Strong verbs eliminate interpretation overhead:

| Weak Verb             | Strong Verb                                               | Context        |
| --------------------- | --------------------------------------------------------- | -------------- |
| "Make a function"     | "Write a function"                                        | Implementation |
| "Fix the bug"         | "Debug and resolve the null pointer exception in line 47" | Bug fixing     |
| "Update the docs"     | "Add JSDoc comments to all exported functions in auth.ts" | Documentation  |
| "Improve performance" | "Optimize the database query to use indexed columns"      | Performance    |

**Specificity compounds effectiveness:**

```
Refactor the UserRepository class to use dependency injection:
1. Extract database connection into IDatabaseAdapter interface
2. Inject adapter via constructor
3. Update all 7 query methods to use adapter.execute()
4. Add unit tests that mock the adapter
```

This prompt defines the refactoring strategy, specifies the interface name, enumerates affected methods, and includes verification requirements.

### Constraints and Guardrails

Agents execute to completion. If you don't constrain the scope, they'll make assumptions.

**Example: Undefined behavior**

```
Add authentication to the API
```

What does this mean?

- JWT? Session tokens? OAuth?
- Which endpoints need auth?
- What permission model?

**Example: Constrained behavior**

```
Add JWT authentication to the API:
- Use jsonwebtoken library
- Protect all /api/v1/* endpoints except /api/v1/auth/login
- Token expiry: 24 hours
- Store user ID and role in payload
- Return 401 for missing/invalid tokens
- Do NOT modify the existing session middleware
```

Now the agent has precise boundaries.

### Using System-Level Directives

For critical constraints, use explicit markers:

```
IMPORTANT: This function will run in a production Lambda with 128MB memory.
Keep dependencies minimal and avoid in-memory caching.

YOU MUST: Validate all inputs at function entry and return descriptive errors.

Write a Lambda handler that processes S3 events...
```

These directives improve adherence to requirements. The agent's attention mechanism weighs "IMPORTANT" and "YOU MUST" more heavily during token prediction.

## Assigning Personas

Personas constrain the agent's behavior by biasing its output toward specific patterns learned from training data.

### When to Use Personas

**Use personas when:**

- You need domain-specific terminology or patterns
- The task benefits from a particular perspective (security, performance, readability)
- You want consistent style across multiple interactions

**Skip personas when:**

- The task is straightforward and well-defined
- Adding persona context wastes tokens without added value

### Effective Persona Assignment

**Generic persona (low value):**

```
You are a helpful programming assistant.
```

**Specific persona (high value):**

```
You are a senior platform engineer focused on production reliability.
When reviewing code, prioritize:
1. Error handling and observability
2. Resource cleanup and leak prevention
3. Graceful degradation under load
```

The specific persona biases the agent toward production concerns rather than algorithmic cleverness.

### Persona Examples for Different Tasks

**Code review:**

```
You are a security engineer conducting a production code review.
Flag potential vulnerabilities: SQL injection, XSS, auth bypasses, secrets in code.
Assume adversarial input and untrusted networks.
```

**Performance optimization:**

```
You are a performance engineer optimizing for high-throughput systems.
Focus on: algorithmic complexity, memory allocation patterns, I/O efficiency.
Assume production load: 10K requests/second, 100ms p99 latency SLA.
```

**Refactoring:**

```
You are a staff engineer refactoring legacy code for maintainability.
Prioritize: clear naming, minimal abstractions, testability, low coupling.
Preserve existing behavior - no feature changes.
```

### System Prompts vs Inline Personas

- **System prompts:** Set persistent behavior for the session (e.g., CLAUDE.md files)
- **Inline personas:** Override or supplement system prompts for specific tasks

Use system prompts for project-wide conventions (code style, testing standards). Use inline personas for task-specific behavior.

## Chain-of-Thought (CoT) and Chain-of-Draft (CoD)

LLMs generate tokens sequentially. Complex reasoning benefits from explicit intermediate steps.

### Chain-of-Thought (CoT)

CoT prompts the agent to articulate its reasoning before generating the final output.

**Without CoT:**

```
Debug the failing test in UserService.test.ts
```

**With CoT:**

```
Debug the failing test in UserService.test.ts:

1. Read the test file and identify which test is failing
2. Analyze the test assertion and expected vs actual values
3. Trace the code path through UserService to find the bug
4. Explain the root cause
5. Propose a fix

Explain your reasoning at each step before implementing the fix.
```

**Why it works:**

- Forces the agent to break down the problem into steps
- Intermediate reasoning tokens influence subsequent token predictions
- Makes the agent's logic visible and debuggable

### Chain-of-Draft (CoD)

CoD generates multiple iterations or alternatives before committing to a solution.

**Example:**

```
Design a database schema for a multi-tenant SaaS application.

Generate three alternative designs:
1. Shared schema with tenant_id column
2. Separate schemas per tenant
3. Separate databases per tenant

For each design, analyze:
- Scalability implications
- Cost (compute, storage)
- Query complexity
- Data isolation

Then recommend the best approach for a system with:
- 500 tenants, growing 20%/month
- 10GB average data per tenant
- Strict data isolation requirements (compliance)
```

The agent will produce three drafts with explicit trade-off analysis, then synthesize a recommendation. This multi-stage reasoning typically produces higher-quality outputs than direct "design a schema" prompts.

### Combining CoT and CoD

For complex architectural decisions:

```
Design a rate limiting system for our API.

Step 1: Propose three algorithms (token bucket, leaky bucket, sliding window)
Step 2: For each algorithm, analyze implementation complexity and accuracy
Step 3: Recommend one based on our requirements (distributed system, Redis available, 1ms latency budget)
Step 4: Implement the recommended algorithm in TypeScript with tests
```

This combines CoT (explicit steps) with CoD (multiple alternatives), guiding the agent through structured reasoning.

## Applying Structure to Prompts

Structured prompts improve both clarity and output format consistency.

### Markdown for Hierarchical Prompts

Use headings, lists, and code blocks to organize complex prompts:

```
# Task: Implement OAuth 2.0 Client Credentials Flow

## Requirements
- Support multiple authorization servers (configurable)
- Cache tokens until expiry (Redis)
- Auto-retry on 401 with token refresh
- Expose as Express middleware

## Implementation Steps
1. Create `OAuthClient` class with `getToken()` method
2. Implement token caching with TTL
3. Add retry logic with exponential backoff
4. Write middleware that injects token into req.context

## Testing
- Unit tests for OAuthClient
- Integration tests against mock OAuth server
- Error cases: network failure, invalid credentials, expired tokens

## Constraints
- Use `axios` for HTTP requests
- Use `ioredis` for caching
- No global state - client must be instantiated
```

The structure makes requirements scannable and reduces the chance of missed details.

### JSON for Structured Output

When you need machine-parseable output, specify JSON schemas:

```
Analyze the database query performance issues in the attached log file.
Return a JSON array with this schema:

{
  "queries": [
    {
      "sql": "SELECT * FROM users WHERE email = ?",
      "executionTimeMs": 1250,
      "issue": "Missing index on email column",
      "recommendation": "CREATE INDEX idx_users_email ON users(email)",
      "estimatedImprovement": "95% reduction in query time"
    }
  ]
}

Respond ONLY with the JSON array. No preamble, no markdown code blocks.
```

Many LLMs have native JSON modes that enforce schema adherence (OpenAI, Gemini). For strict validation, use API-native structured outputs with Pydantic schemas or JSON Schema definitions.

### XML for Nested Context

XML is token-efficient for providing nested context or examples:

```
Refactor the following React component to use hooks instead of class components.

<original>
class UserProfile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: true, user: null };
  }

  componentDidMount() {
    fetch(`/api/users/${this.props.userId}`)
      .then(res => res.json())
      .then(user => this.setState({ loading: false, user }));
  }

  render() {
    if (this.state.loading) return <div>Loading...</div>;
    return <div>{this.state.user.name}</div>;
  }
}
</original>

<requirements>
- Use functional component with hooks
- Replace componentDidMount with useEffect
- Replace state with useState
- Add error handling for fetch failures
</requirements>
```

XML tags provide clear semantic boundaries, making it easier for the agent to parse context vs requirements vs code.

### Format Enforcement Patterns

**For code output:**

````
Write the implementation in a TypeScript code block:

```typescript
// Your code here
````

**For multi-file output:**

```
Generate the following files. Use this format:

--- FILE: src/models/User.ts ---
[content]

--- FILE: src/models/Post.ts ---
[content]
```

**For explanations with code:**

````
Explain the bug and provide a fix.

Format:
## Root Cause
[Explanation]

## Fix
```typescript
[Code]
````

## Testing

[How to verify]

```

Explicit format instructions reduce the need for post-processing.

## Hands-On Exercise: Prompt Engineering for Production Code

**Scenario:** You're integrating a third-party payment API (Stripe) into your e-commerce platform. The existing codebase has minimal error handling and no retry logic.

**Your Task:**

Write a prompt that guides an AI agent to implement a production-ready Stripe payment integration. Your prompt should:

1. Use imperative commands and specific constraints
2. Assign an appropriate persona
3. Apply CoT to ensure the agent considers failure modes
4. Use structured formatting (markdown sections)

**Deliverable:** A complete prompt that would produce production-quality code on the first iteration (minimal back-and-forth).

**Evaluation Criteria:**
- Does the prompt specify error handling requirements?
- Are retry strategies defined (idempotency, timeouts)?
- Is logging/observability addressed?
- Does it include testing requirements?
- Is the output format specified (TypeScript, return types, etc.)?

**Bonus Challenge:** Write a follow-up prompt using CoD to compare webhook vs polling for payment status updates. The prompt should generate trade-off analysis for both approaches.

<details>
<summary>Example Solution</summary>

```

You are a senior backend engineer implementing payment integrations for a high-volume e-commerce platform.
Focus on reliability, error handling, and observability.

# Task: Implement Stripe Payment Processing

## Requirements

- Use Stripe Node.js SDK (v14+)
- Support payment intents for card payments
- Handle asynchronous payment confirmations
- Implement idempotent retry logic for transient failures
- Add structured logging for all payment events

## Implementation Steps

1. Read the existing `OrderService` class to understand the payment flow
2. Create a `StripePaymentProvider` class implementing the `IPaymentProvider` interface
3. Implement these methods:
   - `createPayment(orderId: string, amount: number, currency: string): Promise<PaymentResult>`
   - `confirmPayment(paymentIntentId: string): Promise<PaymentStatus>`
   - `handleWebhook(event: Stripe.Event): Promise<void>`

4. Add error handling for:
   - Network timeouts (10s max, retry with exponential backoff)
   - Invalid card errors (do NOT retry, return user-facing error)
   - Rate limits (retry after Retry-After header)
   - Stripe API errors (log error code, return generic message to user)

5. Implement idempotency:
   - Use `orderId` as idempotency key for `createPayment`
   - Store payment intent ID in database before calling Stripe
   - Check for existing payment intent before creating new one

6. Add observability:
   - Log all Stripe API calls (method, payment intent ID, duration)
   - Emit metrics for success/failure rates
   - Include trace ID in all log entries

## Testing Requirements

- Unit tests with mocked Stripe SDK (test error cases)
- Integration tests against Stripe test mode
- Test scenarios:
  - Successful payment
  - Card declined
  - Network timeout with retry
  - Duplicate payment attempt (idempotency)

## Output Format

```typescript
// src/payments/StripePaymentProvider.ts
[implementation];
```

```typescript
// src/payments/__tests__/StripePaymentProvider.test.ts
[tests];
```

## Constraints

- MUST use async/await (no callbacks)
- MUST NOT store card details (use Stripe tokens only)
- MUST validate webhook signatures
- Response times: p99 < 2s (excluding network latency)

```

</details>

## Key Takeaways

- **Imperative prompts eliminate ambiguity** - Use action verbs, specify constraints, enumerate requirements
- **Personas constrain behavior** - Apply strategic personas to bias output toward domain-specific patterns (security, performance, maintainability)
- **CoT improves reasoning quality** - Force the agent to articulate intermediate steps for complex tasks
- **CoD generates better solutions** - Prompt for multiple alternatives with trade-off analysis before committing
- **Structure enforces clarity** - Use markdown for organization, JSON for machine-parseable output, XML for nested context

Effective prompting is precision engineering, not conversation. Treat it like writing API contracts: be specific, be unambiguous, define success criteria.

---

**Next:** [Lesson 5: Grounding](./lesson-5-grounding.md)
```
