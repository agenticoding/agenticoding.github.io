---
sidebar_position: 2
sidebar_label: 'Prompting 101'
sidebar_custom_props:
  sectionNumber: 4
title: 'Prompting 101'
---

AI coding assistants aren't conversational partners—they're sophisticated pattern completion engines. Understanding this fundamental distinction changes how you prompt.

Think of prompting as drawing the beginning of a pattern. The model predicts and completes what comes next based on statistical patterns from its training data. Your prompt isn't a request; it's the start of a sequence the model will finish.

## Clear Instruction-Based Prompting

Skip pleasantries. AI models don't need "please" or "thank you"—these tokens dilute your signal without adding clarity.

### Imperative Commands

Start the pattern you want completed. Use direct, action-oriented language.

**Ineffective:**

```
Could you help me write a function to validate email addresses?
Thanks in advance!
```

**Effective:**

```
Write a TypeScript function that validates email addresses per RFC 5322.
Handle edge cases:
- Multiple @ symbols (invalid)
- Missing domain (invalid)
- Plus addressing (valid)

Return { valid: boolean, reason?: string }
```

The effective prompt draws the beginning of a precise pattern: TypeScript function signature, validation rules, return type. The model completes this pattern with matching code.

### Understanding Pattern Completion

When you write "Write a TypeScript function that validates...", you're not asking a question. You're starting a code block pattern. The model's job is to predict what naturally follows based on similar patterns in its training data.

**Pattern start:**

```typescript
// Write a secure authentication middleware for Express
function authMiddleware(
```

**Model completes:**

```typescript
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Implementation follows the pattern...
}
```

The more specific your pattern start, the more constrained the completion space.

### Action Verbs and Specificity

Strong verbs establish clear patterns:

| Weak                  | Strong                                                    |
| --------------------- | --------------------------------------------------------- |
| "Make a function"     | "Write a function"                                        |
| "Fix the bug"         | "Debug the null pointer exception in UserService.ts:47"   |
| "Update the docs"     | "Add JSDoc comments to all exported functions in auth.ts" |
| "Improve performance" | "Optimize the query to use indexed columns"               |

**Specificity compounds effectiveness:**

```
Refactor UserRepository to use dependency injection:
1. Extract database connection to IDatabaseAdapter interface
2. Inject adapter via constructor
3. Update all 7 query methods to use adapter.execute()
4. Add unit tests mocking the adapter
```

This defines the refactoring pattern completely. No guessing required.

### Constraints as Guardrails

Without constraints, the model fills gaps with assumptions. Define boundaries explicitly.

**Unconstrained:**

```
Add authentication to the API
```

What authentication? JWT? OAuth? Session tokens? Which endpoints?

**Constrained:**

```
Add JWT authentication to the API:
- Do NOT modify existing session middleware
- Use jsonwebtoken library
- Protect all /api/v1/* endpoints except /api/v1/auth/login
- Token expiry: 24 hours
- Store user ID and role in payload
- Return 401 for missing/invalid tokens
```

Now the completion space is well-defined.

## Assigning Personas

**Use personas when** domain-specific terminology matters (security, performance, accessibility) or you need consistent vocabulary across related tasks. **Skip personas when** the task is straightforward and adding persona context wastes tokens without adding value.

Personas work by biasing vocabulary distribution. Writing "You are a security engineer" increases the probability of security-specific terms like "threat model," "attack surface," "least privilege" appearing in the response. These terms act as semantic queries during attention, retrieving different training patterns than generic terms like "check for issues." The persona is a vocabulary shortcut—instead of listing every security term explicitly, you trigger the cluster associated with "security engineer."

**Example: Generic prompt**

```
Review this authentication code for issues.
```

Result: Generic advice like "Check for proper validation and error handling"

**Example: Security-focused prompt**

```
You are a security engineer conducting a code review.
Review this authentication code. Flag vulnerabilities:
SQL injection, XSS, auth bypasses, secrets in code.
Assume adversarial input and untrusted networks.
```

Result: Targeted security analysis identifying specific vulnerabilities with mitigation strategies

The persona didn't add knowledge—it changed _which_ knowledge gets retrieved by shifting vocabulary. This principle applies universally: vocabulary is the control interface for semantic retrieval. The same concept governs how you query codebase search tools (ChunkHound), web research agents (ArguSeek), vector databases, or instruct sub-agents. "Authentication middleware patterns" retrieves different code chunks than "login code." "Rate limiting algorithms" finds different research than "slow down requests." Choose terms that retrieve the patterns you need. (See [Lesson 5: Grounding](./lesson-5-grounding.md) for semantic search tools.)

## Chain-of-Thought: Paving a Clear Path

When tasks require multiple steps, you often need control over the execution path. Chain-of-Thought (CoT) provides this by explicitly defining each step the model must follow—like giving turn-by-turn directions instead of just the destination. You control the route, ensure accuracy at each stage, and make the reasoning transparent.

### Explicit Step-by-Step Instructions

CoT defines each step the model must execute in sequence. You're not asking for reasoning—you're dictating the path.

**Without CoT:**

```
Debug the failing test in UserService.test.ts
```

**With CoT:**

```
Debug the failing test in UserService.test.ts:

1. Read the test file, identify which test is failing
2. Analyze test assertion: expected vs actual values
3. Trace code path through UserService to find the bug
4. Explain root cause
5. Propose fix

Provide your conclusions with evidence.
```

**Why CoT gives you control:**

- **You dictate the sequence**—The model can't skip steps or take shortcuts. Each step must complete before the next begins.
- **Validation at each stage**—Errors surface early rather than compounding through multiple steps.
- **Transparent execution**—You see exactly what happened at each step, making debugging straightforward.
- **Essential for complex operations**—Modern models handle simple tasks without CoT, but multi-step operations (5+ steps) require explicit guidance for accuracy.

CoT is particularly powerful for QA workflows where you need methodical execution. See [Lesson 8: Tests as Guardrails](../practical-techniques/lesson-8-tests-as-guardrails.md) for production examples of using tests as guardrails in agent workflows.

## Applying Structure to Prompts

Structure organizes information and directs the model's attention. Markdown, JSON, and XML are particularly effective because they're information-dense formats well-represented in training data.

### Information Density Matters

Different formats have different information density—how much meaning is conveyed per token. Markdown is highly information-dense: headings, lists, and code blocks provide clear semantic structure with minimal overhead.

This matters for token efficiency and grounding. Well-structured prompts help the model parse intent and respond with matching structure.

### Markdown for Hierarchical Organization

```markdown
# Task: Implement OAuth 2.0 Client Credentials Flow

## Requirements

- Support multiple authorization servers (configurable)
- Cache tokens until expiry (Redis)
- Auto-retry on 401 with token refresh
- Expose as Express middleware

## Implementation Steps

1. Create OAuthClient class with getToken() method
2. Implement token caching with TTL
3. Add retry logic with exponential backoff
4. Write middleware injecting token into req.context

## Testing

- Unit tests for OAuthClient
- Integration tests against mock OAuth server
- Error cases: network failure, invalid credentials, expired tokens

## Constraints

- Use axios for HTTP requests
- Use ioredis for caching
- No global state—client must be instantiated
```

The structure makes requirements scannable and draws attention to distinct sections: what to build, how to build it, how to test it, what to avoid.

## Things to Avoid

AI models have predictable failure modes. Understanding these helps you prompt defensively.

### Negation Issues

LLMs struggle with negation because attention mechanisms treat "NOT" as just another token competing for weight. When "NOT" receives low attention during processing, the model focuses on the concepts mentioned ("passwords", "plain text") rather than their negation—a phenomenon called "affirmation bias." The model's token generation fundamentally leans toward positive selection (what to include) rather than negative exclusion (what to avoid).

**Risky:**

```
Write a user registration endpoint.
Do NOT store passwords in plain text.
```

The model might miss "NOT" and generate plain text password storage because attention focuses on "passwords" + "plain text" while ignoring the negation.

**Better—Negation then positive opposite:**

```
Write a user registration endpoint.

Password handling:
Do NOT store passwords in plain text.
Instead, always store passwords as hashed values.
Use bcrypt with 10 salt rounds before storing.
```

This pattern works by:

1. **Explicit negation first**: "Do NOT store passwords in plain text" clearly states the constraint
2. **Positive opposite immediately after**: "Instead, always store passwords as hashed values" provides the logical NOT in positive form
3. **Implementation details**: Concrete instructions (bcrypt, salt rounds) reinforce the correct pattern

### Math Limitations

LLMs are probabilistic text predictors, not calculators. They're terrible at arithmetic.

**Don't rely on LLMs for math:**

```
Calculate the optimal cache size for 1M users with 2KB average data per user,
assuming 80% hit rate and 4GB available memory.
```

The model will generate plausible-sounding numbers that may be completely wrong.

**Instead, have the model write code:**

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

## Key Takeaways

- **Prompting is pattern completion, not conversation**—Draw the beginning of the pattern you want the model to complete
- **Skip pleasantries**—"Please" and "thank you" dilute signal without adding value
- **Personas affect vocabulary, not capability**—Use them to bias toward domain-specific terms that improve grounding
- **CoT paves a clear path**—Use explicit step-by-step instructions for complex tasks when you need control and accuracy; particularly effective for QA workflows (see [Lesson 8](../practical-techniques/lesson-8-tests-as-guardrails.md))
- **Structure directs attention**—Markdown, JSON, XML are information-dense and well-represented in training data
- **Avoid negation**—State what you want explicitly; negation is easy to miss
- **LLMs can't do math**—Have them write code that does math instead

Effective prompting is precision engineering. You're not having a conversation—you're initializing a pattern completion engine. Be specific, be structured, be explicit.

---

**Next:** [Lesson 5: Grounding](./lesson-5-grounding.md)
