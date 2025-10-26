---
sidebar_position: 4
sidebar_label: 'Lesson 9: Reviewing Code'
---

# Reviewing Code with AI

Code review is a high-leverage activity. When done well, it catches bugs, maintains architectural consistency, and shares knowledge. When done poorly, it wastes time on trivial issues while missing critical flaws.

AI agents excel at the mechanical aspects of code review - syntax, style, common patterns - freeing you to focus on architecture, business logic, and context that requires human judgment.

## Learning Objectives

By the end of this lesson, you will be able to:

- Conduct pre-commit reviews using AI to catch issues before submission
- Generate atomic commits with contextual, meaningful commit messages
- Leverage AI to analyze pull requests for architectural concerns and security issues
- Apply a systematic review workflow that balances AI automation with human oversight

## Pre-Commit Review: Quality Gate Before Submission

The most effective code review happens before you commit. AI agents can perform comprehensive self-reviews in seconds, catching issues that would otherwise waste reviewer time.

### The Self-Review Workflow

Before committing code, use your AI agent to perform a critical review:

```bash
# Stage your changes
git add .

# Review with AI
# Prompt: "Review the staged changes critically. Check for:
# - Logic errors and edge cases
# - Security vulnerabilities (injection, auth, data exposure)
# - Performance issues (N+1 queries, unnecessary allocations)
# - Architectural inconsistencies with existing patterns
# - Missing error handling
# - Test coverage gaps
# Be specific about file and line numbers."
```

**What AI catches effectively:**

- **Security issues:** SQL injection, XSS, auth bypasses, sensitive data exposure
- **Performance patterns:** N+1 queries, unnecessary loops, inefficient algorithms
- **Error handling:** Missing try-catch, unchecked returns, silent failures
- **Code smells:** Duplicated logic, god objects, tight coupling
- **Style inconsistencies:** Formatting, naming conventions, file organization

**What requires human judgment:**

- **Business logic correctness:** Does this implement the actual requirement?
- **Architectural fit:** Does this belong in this module?
- **UX implications:** Will this confuse users?
- **Operational concerns:** How does this behave under load? During deployments?

### Example: Pre-Commit Review Session

**Scenario:** You've implemented a new API endpoint for user data export.

```typescript
// src/api/export.ts
export async function exportUserData(userId: string) {
  const user = await db.users.findUnique({ where: { id: userId } });
  const posts = await db.posts.findMany({ where: { authorId: userId } });
  const comments = await db.comments.findMany({ where: { authorId: userId } });

  return {
    user,
    posts,
    comments,
  };
}
```

**AI Review Output:**

```
Issues found in src/api/export.ts:

1. SECURITY (Critical): No authorization check - any userId can be exported
   Line 2: Missing auth validation before data access
   Fix: Add auth middleware or explicit permission check

2. PERFORMANCE (High): N+1 query pattern
   Lines 2-4: Three sequential database calls
   Fix: Use Promise.all() or single query with joins

3. ERROR HANDLING (High): No error handling
   Lines 2-4: Unhandled database errors will crash the request
   Fix: Add try-catch with appropriate error responses

4. SECURITY (Medium): Potential data exposure
   Line 6-10: Returning raw database objects may include sensitive fields
   Fix: Use explicit DTOs to control exposed fields

5. MISSING TESTS: No test coverage for this endpoint
   Add tests for: auth failure, user not found, successful export
```

**Post-AI iteration:**

```typescript
// src/api/export.ts
import { verifyUserAccess } from './auth';
import { UserExportDTO, PostDTO, CommentDTO } from './dto';

export async function exportUserData(
  requestingUserId: string,
  targetUserId: string
): Promise<UserExportDTO> {
  // 1. Authorization check
  if (requestingUserId !== targetUserId) {
    throw new UnauthorizedError('Cannot export other users data');
  }

  try {
    // 2. Parallel queries for performance
    const [user, posts, comments] = await Promise.all([
      db.users.findUnique({ where: { id: targetUserId } }),
      db.posts.findMany({ where: { authorId: targetUserId } }),
      db.comments.findMany({ where: { authorId: targetUserId } }),
    ]);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 3. Explicit DTOs - no sensitive data leakage
    return {
      user: sanitizeUser(user),
      posts: posts.map(sanitizePost),
      comments: comments.map(sanitizeComment),
    };
  } catch (error) {
    // 4. Proper error handling
    if (error instanceof NotFoundError || error instanceof UnauthorizedError) {
      throw error;
    }
    throw new InternalServerError('Failed to export user data');
  }
}
```

**This is the power of pre-commit review:** Catching critical issues before they hit CI, before reviewers see them, before they become technical debt.

:::tip Production Pattern
Run pre-commit AI reviews on every change. It's faster than waiting for CI failures and cheaper than reviewer time on trivial issues.
:::

## Atomic Commits with AI: Meaningful Git History

Git history is your codebase's documentation. Good commits tell the story of why changes happened. Bad commits are noise.

### The Atomic Commit Principle

**Atomic commit:** The smallest complete unit of change. One logical change, one commit. Tests pass. Can be reverted cleanly.

**Why it matters:**

- **Reviewability:** Small, focused changes are easy to review
- **Reversibility:** `git revert` works cleanly on atomic commits
- **Bisectability:** `git bisect` pinpoints the exact commit that introduced a bug
- **Context:** Each commit message explains why a specific change was made

### Commit Message Structure (Conventional Commits)

Industry standard format that enables automation and clarity:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types (semantic versioning integration):**

- `feat:` New feature (minor version bump)
- `fix:` Bug fix (patch version bump)
- `docs:` Documentation only
- `style:` Code style/formatting (no logic change)
- `refactor:` Code restructuring (no behavior change)
- `perf:` Performance improvement
- `test:` Test changes
- `build:` Build system or dependency changes
- `ops:` Infrastructure or deployment changes
- `chore:` Maintenance (last resort - usually there's a better type)

**Breaking changes:** Add `!` before the colon:

```
feat(api)!: remove deprecated /v1/status endpoint

BREAKING CHANGE: The /v1/status endpoint has been removed.
Use /v2/health instead.
```

### AI-Generated Commit Messages: Good vs Bad

**Bad (AI default without guidance):**

```
fix: update code
```

**Why bad:** Useless. Doesn't explain what or why.

**Good (with proper prompting):**

```
fix(auth): prevent session fixation attack

Sessions were reused after login, allowing session fixation attacks.
Now generating new session IDs post-authentication per OWASP guidelines.

Fixes: #2847
```

**Why good:** Clear what changed, why it changed, what security issue it addresses, traceable to ticket.

### Prompting AI for Good Commit Messages

**Poor prompt:**

```
Write a commit message for my changes
```

**Better prompt:**

```
Generate a conventional commit message for the staged changes.
Requirements:
- Use conventional commits format (type(scope): description)
- Subject line: imperative mood, 50 chars max, no period
- Body: explain WHY (not what - the diff shows what)
- Reference any related issues
- If breaking change, add ! and BREAKING CHANGE footer
```

**AI output:**

```
feat(export): add user data export API endpoint

Implements GDPR data portability requirement. Users can now export
their complete account data (profile, posts, comments) in JSON format.

- Added authorization check (user can only export own data)
- Optimized with parallel queries (Promise.all)
- Sanitized output to prevent sensitive data exposure
- Added comprehensive test coverage

Refs: #3421
```

### Multi-Commit Workflow: Breaking Up Large Changes

Large PRs should contain multiple atomic commits, not one monolithic commit.

**Example scenario:** Implementing a feature that requires database migration, backend API, and frontend UI.

**Bad approach (single commit):**

```
feat: add user preferences feature
[247 files changed, 3,842 insertions, 891 deletions]
```

**Good approach (atomic commits):**

```
1. feat(db): add user_preferences table schema
   [Migration only - 2 files changed]

2. feat(api): add GET/PUT /api/preferences endpoints
   [Backend API with tests - 8 files changed]

3. feat(ui): add preferences page component
   [Frontend UI with tests - 12 files changed]

4. docs: update API documentation for preferences
   [Documentation - 3 files changed]
```

**Benefits:**

- Each commit is independently reviewable
- Tests pass at each commit
- Can cherry-pick or revert individual changes
- Clear history of implementation progression

:::warning Squashing Considered Harmful
Don't squash all commits in a PR by default. Preserve atomic commits for future archaeology. Only squash fixup commits (typos, linter fixes) into their parent commits.
:::

### AI Workflow for Commit Staging

```bash
# 1. Check what changed
git status
git diff

# 2. Ask AI to analyze and suggest commit grouping
# Prompt: "Review git diff output. Suggest how to group these changes
# into atomic commits. For each group, draft a conventional commit message."

# 3. Stage and commit each atomic group
git add src/db/migrations/
git commit -m "feat(db): add user_preferences table schema

Adds migration for user preferences storage with columns for
theme, language, notification settings, and timezone.

Refs: #3421"

# 4. Repeat for each logical group
```

## Reviewing Pull Requests with AI

You're reviewing a teammate's PR. AI can handle mechanical checks while you focus on architecture and business logic.

### The AI-Assisted PR Review Workflow

**Step 1: Automated Analysis (AI)**

```bash
# Fetch the PR
gh pr checkout 1234

# Let AI analyze
# Prompt: "Review this PR critically:
# 1. Security vulnerabilities
# 2. Performance issues
# 3. Error handling gaps
# 4. Test coverage
# 5. Architectural concerns
# 6. Breaking changes
# Provide specific file:line references."
```

**Step 2: Human Judgment (You)**

Focus your attention on:

- **Business logic correctness:** Does this solve the actual problem?
- **Architectural fit:** Does this belong here? Does it create coupling?
- **UX implications:** Edge cases, error states, loading states
- **Operational concerns:** Monitoring, rollback strategy, performance under load
- **Team knowledge:** Does this need documentation? Will others understand it?

**Step 3: Feedback (AI + Human)**

Use AI to draft constructive feedback:

```
# Prompt: "Draft a PR review comment for this issue:
# File: src/api/billing.ts
# Line: 142
# Issue: Using floating point for currency calculations
# Tone: Constructive, explain why it's problematic and suggest fix"
```

**AI output:**

```
Hey! Quick concern about the currency calculation on line 142.

Using floating point (`Number`) for currency can lead to precision errors:
  0.1 + 0.2 === 0.30000000000000004

Suggestion: Use integers (cents) or a decimal library:
  - Stripe approach: Store amounts in cents (integer)
  - Dinero.js: Currency-safe decimal math
  - Decimal.js: General-purpose decimal library

This prevents the classic "$0.01 discrepancy" bugs in billing.
```

### PR Review Checklist (AI-Augmented)

**AI handles:**

- [ ] Code compiles and tests pass
- [ ] No obvious security vulnerabilities (SQL injection, XSS, etc.)
- [ ] Error handling exists for failure paths
- [ ] No hardcoded secrets or credentials
- [ ] Performance patterns are sound (no obvious N+1, etc.)
- [ ] Code style is consistent
- [ ] New code has test coverage

**You handle:**

- [ ] Business requirements are actually met
- [ ] Architecture aligns with system design
- [ ] UX flows make sense (error states, loading, edge cases)
- [ ] No unnecessary complexity or over-engineering
- [ ] Changes are appropriately scoped (not sneaking in unrelated refactors)
- [ ] Breaking changes are documented and necessary
- [ ] Rollback strategy is clear for risky changes

### Common AI Code Review Patterns

**Pattern 1: Security Audit**

```
# Prompt: "Security audit of this PR:
# - Input validation and sanitization
# - Authentication and authorization checks
# - Sensitive data exposure
# - Injection vulnerabilities (SQL, NoSQL, command)
# - Insecure dependencies
# Provide CVE references where applicable."
```

**Pattern 2: Performance Analysis**

```
# Prompt: "Analyze for performance issues:
# - Database query patterns (N+1, missing indexes)
# - Algorithmic complexity
# - Memory allocations in hot paths
# - Unnecessary network calls
# Estimate impact and suggest optimizations."
```

**Pattern 3: Error Handling Review**

```
# Prompt: "Review error handling:
# - Are all failure paths handled?
# - Are errors logged with sufficient context?
# - Are user-facing errors informative but not leaking internals?
# - Are resources cleaned up on error?
# List specific gaps with line numbers."
```

**Pattern 4: Test Coverage Analysis**

```
# Prompt: "Analyze test coverage:
# - What's covered?
# - What critical paths are missing tests?
# - Are edge cases tested?
# - Are error paths tested?
# Suggest specific test cases to add."
```

### When NOT to Use AI in Code Review

AI is a tool, not a replacement for human judgment. Skip AI when:

1. **Architectural discussions:** "Should we use microservices or a monolith?" requires context AI doesn't have
2. **Product decisions:** "Is this the right user flow?" requires domain knowledge
3. **Team dynamics:** "Is this person being overloaded?" requires human awareness
4. **Subjective style:** "Do we prefer X or Y pattern?" is a team decision
5. **Context-heavy changes:** Refactors that span months of history benefit from human memory

:::info Human in the Loop
AI finds mechanical issues. You make judgment calls. Use both. The best code review combines AI's consistency with human context.
:::

## Hands-On Exercise: AI-Assisted Code Review

**Scenario:** You're reviewing a PR that adds a password reset feature to your authentication system.

**PR Changes:**

```typescript
// src/auth/password-reset.ts
export async function resetPassword(email: string, newPassword: string) {
  const user = await db.users.findUnique({ where: { email } });

  await db.users.update({
    where: { id: user.id },
    data: { password: newPassword },
  });

  return { success: true };
}
```

### Your Task

**Part 1: AI Security Audit**

1. Prompt your AI agent to perform a security audit of this code
2. Document all issues found (expected: 5+ critical issues)
3. For each issue, note the severity and potential exploit

**Part 2: AI-Assisted Iteration**

1. Ask the AI to suggest a secure implementation
2. Review the AI's suggestion critically
3. Identify what the AI got right and what still needs human judgment

**Part 3: Human Review**

Beyond AI's findings, consider:

- What operational concerns exist? (Rate limiting, email deliverability)
- What UX considerations? (What happens if email doesn't exist?)
- What monitoring/logging is needed?
- What's the rollback plan if this causes issues?

**Part 4: Constructive Feedback**

Use AI to draft review comments that:

- Explain the issue clearly
- Suggest specific fixes
- Link to relevant documentation (OWASP, RFCs, etc.)
- Maintain a collaborative tone

### Expected Findings

**AI should catch:**

- No password hashing (storing plaintext passwords)
- No token-based reset flow (anyone with email can reset password)
- No rate limiting (brute force attacks)
- No input validation (email format, password strength)
- No error handling (crashes if user not found)
- No logging/audit trail
- No email verification before reset

**You should catch:**

- No password reset email sent (how does user know password changed?)
- No session invalidation (existing sessions remain active)
- No notification to old email address (security best practice)
- Missing requirements context (does this meet product spec?)

**Combined review:** AI finds mechanical issues, you find product/operational gaps. Together, you prevent shipping a critical security flaw.

## Key Takeaways

- **Pre-commit AI reviews** catch issues before they waste reviewer time - run them on every change
- **Atomic commits with meaningful messages** make git history a powerful debugging and documentation tool - use Conventional Commits format
- **AI excels at mechanical code review** (security, performance, style) - automate this
- **Humans excel at contextual review** (architecture, UX, operations) - focus your energy here
- **The best code review workflow combines both** - AI for consistency, humans for judgment

### Production Checklist

Before merging any PR:

- [ ] AI pre-commit review completed (security, performance, errors)
- [ ] Commits are atomic with conventional messages
- [ ] Human review covered business logic and architecture
- [ ] Tests pass and cover new functionality
- [ ] Breaking changes are documented
- [ ] Rollback strategy is clear

**Code review is quality assurance for your codebase.** AI makes you faster and more thorough. Use it systematically.

---

**Next:** [Lesson 10: Debugging with AI](./lesson-10-debugging.md)
