---
sidebar_position: 3
sidebar_label: 'Lesson 8: Tests as Guardrails'
---

# Lesson 8: Tests as Guardrails

Autonomous agent execution requires automated verification. You don't manually review every line a CNC machine cuts - you verify the output against specifications. Same principle applies to AI agents operating on your codebase.

## Learning Objectives

By the end of this lesson, you will:

- Design verification strategies for autonomous agent execution
- Implement automated tests as guardrails for agent work
- Use test failures to guide agent debugging workflows
- Build reliable TDD cycles with AI agents

## The Verification Problem

When you delegate a task to an agent, you have three verification options:

**Option 1: Manual Human Verification**

- Agent generates code → You review every line → Ship
- Same overhead as code review
- Bottlenecks on your attention
- Defeats the purpose of autonomous execution

**Option 2: Trust Agent Output (No Verification)**

- Agent generates code → Ship immediately
- Zero safety guarantees
- Production incidents waiting to happen
- Professionally irresponsible

**Option 3: Automated Test Verification**

- Agent generates code → Tests run automatically → Ship if green
- Scales to any codebase size
- Provides objective correctness signal
- Enables true autonomous execution

**The only viable approach for autonomous agents is Option 3.**

## Tests as Guardrails

Automated tests define the **operational boundaries** within which agents can safely execute. Think of them as physical constraints on a CNC machine - the agent can't ship code that violates these constraints.

### What Tests Guardrail Against

**Regression failures:**

```typescript
// Existing behavior must not break
test('authentication preserves session state', () => {
  const session = authenticate(validCredentials);
  expect(session.isActive).toBe(true);
  expect(session.userId).toBeDefined();
});
```

**Specification violations:**

```typescript
// New features must meet requirements
test('rate limiter blocks after threshold', async () => {
  const requests = Array(101)
    .fill(null)
    .map(() => fetch('/api/endpoint'));
  const results = await Promise.all(requests);
  const blocked = results.filter((r) => r.status === 429);
  expect(blocked.length).toBeGreaterThan(0);
});
```

**Security requirements:**

```typescript
// Critical properties must hold
test('password reset tokens expire after 1 hour', () => {
  const token = generateResetToken();
  jest.advanceTimersByTime(60 * 60 * 1000 + 1);
  expect(validateResetToken(token)).toBe(false);
});
```

**Performance constraints:**

```typescript
// Performance budgets must not regress
test('query completes within 100ms for 10K records', async () => {
  const start = performance.now();
  await db.query('SELECT * FROM users WHERE active = true');
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(100);
});
```

### Guardrails Enable Autonomous Execution

With comprehensive tests, your workflow becomes:

1. Provide specification to agent
2. Agent implements feature
3. Agent runs test suite
4. **If green:** Agent commits and moves to next task
5. **If red:** Agent debugs failures and iterates

**You're not in the loop for happy-path execution.** Your attention is required only for:

- Test failures the agent can't resolve
- Architectural decisions
- Specification clarifications

## TDD with AI Agents: Red-Green-Refactor

Test-Driven Development naturally constrains agent behavior to safe operations. The cycle is:

### Red: Write Failing Test (Human)

**You define the contract:**

```typescript
// Human writes this first
describe('UserService.deactivateAccount', () => {
  test('marks user as inactive and clears sensitive data', async () => {
    const user = await createTestUser({
      email: 'test@example.com',
      status: 'active',
      paymentMethod: 'visa-1234',
    });

    await UserService.deactivateAccount(user.id);

    const deactivated = await UserService.findById(user.id);
    expect(deactivated.status).toBe('inactive');
    expect(deactivated.email).toBeNull();
    expect(deactivated.paymentMethod).toBeNull();
    expect(deactivated.deactivatedAt).toBeInstanceOf(Date);
  });
});
```

**Why humans write tests:**

- Tests encode business requirements and security constraints
- Agents might "hallucinate" passing tests for buggy code
- Tests are your specification language

### Green: Minimal Implementation (Agent)

**Agent generates code to pass the test:**

```typescript
// Agent generates this
class UserService {
  static async deactivateAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await db.users.update({
      where: { id: userId },
      data: {
        status: 'inactive',
        email: null,
        paymentMethod: null,
        deactivatedAt: new Date(),
      },
    });
  }
}
```

**Agent runs tests automatically:**

```bash
$ npm test -- UserService.deactivateAccount
✓ marks user as inactive and clears sensitive data (45ms)
```

**Green = Agent proceeds without your intervention.**

### Refactor: Improve Design (Agent or Human)

With passing tests as safety net:

**Agent prompt:**

```
Refactor UserService.deactivateAccount to:
1. Extract data clearing logic into UserDataCleaner.clearPersonalData()
2. Add audit logging for GDPR compliance
3. Run all tests after each change
```

**Agent refactors in steps:**

```typescript
// Step 1: Extract data cleaner
class UserDataCleaner {
  static async clearPersonalData(userId: string): Promise<void> {
    await db.users.update({
      where: { id: userId },
      data: {
        email: null,
        paymentMethod: null,
        phone: null,
        address: null,
      },
    });
  }
}

// Run tests → Green ✓
```

```typescript
// Step 2: Add audit logging
class UserService {
  static async deactivateAccount(userId: string): Promise<void> {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    await db.transaction(async (tx) => {
      await tx.users.update({
        where: { id: userId },
        data: { status: 'inactive', deactivatedAt: new Date() },
      });

      await UserDataCleaner.clearPersonalData(userId);

      await AuditLog.record({
        action: 'user.deactivated',
        userId,
        timestamp: new Date(),
        reason: 'user_request',
      });
    });
  }
}

// Run tests → Green ✓
```

**Tests remain green throughout refactoring = safe autonomous execution.**

## Debug Workflow: Agent Fixes Failing Tests

When tests fail, agents can autonomously debug and fix issues. This is where the iteration loop closes.

### Scenario: Integration Test Failure

**Test output:**

```bash
$ npm test

FAIL src/api/auth.test.ts
  ● POST /auth/login › returns 429 after rate limit exceeded

    Expected status: 429
    Received status: 200

    Request count: 101
    Expected blocked requests: > 0
    Actual blocked requests: 0

      47 |   const results = await Promise.all(requests);
      48 |   const blocked = results.filter(r => r.status === 429);
    > 49 |   expect(blocked.length).toBeGreaterThan(0);
         |                          ^
      50 | });
```

### Agent Debug Process

**Prompt pattern:**

```
The test "POST /auth/login › returns 429 after rate limit exceeded" is failing.

Test output:
[paste full output above]

Debug this failure:
1. Read the rate limiter implementation
2. Identify why it's not blocking requests
3. Fix the bug
4. Re-run the test
5. Verify it passes
```

**Agent execution trace:**

```
[Agent reads src/middleware/rateLimiter.ts]

Found issue: Rate limiter checks req.ip but test requests
don't have IP addresses set.

[Agent reads test file]

Confirmed: Test creates requests without setting req.ip.

Two possible fixes:
A. Update test to set req.ip
B. Update rate limiter to handle missing IP

Choosing B - rate limiter should handle edge cases defensively.

[Agent edits src/middleware/rateLimiter.ts]
[Agent runs tests]

✓ POST /auth/login › returns 429 after rate limit exceeded (89ms)

Fix verified. Test now passes.
```

**Agent's fix:**

```typescript
// Before (buggy)
function rateLimiter(req, res, next) {
  const key = req.ip; // undefined in tests
  const count = cache.get(key);
  // ...
}

// After (defensive)
function rateLimiter(req, res, next) {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  if (key === 'unknown') {
    logger.warn('Rate limiter: unable to determine client IP');
  }
  const count = cache.get(key);
  // ...
}
```

### When Agent Gets Stuck

Agents can fail to fix tests due to:

- Insufficient context about architecture
- Ambiguous test failures
- Genuine bugs in specification

**Escape hatch workflow:**

```bash
# Agent attempts fix 3 times, still failing
# Agent surfaces to you:

"Unable to resolve test failure after 3 attempts.

Test: UserService › deactivateAccount › clears payment data
Error: Expected null, received 'visa-1234'

Hypothesis: Payment data might be stored in separate table
that's not being cleared.

Request: Confirm payment data storage architecture."
```

**You provide context:**

```
Payment methods are in separate `payment_methods` table
with foreign key to users. Update UserDataCleaner to cascade delete.
```

**Agent continues:**

```typescript
class UserDataCleaner {
  static async clearPersonalData(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.paymentMethods.deleteMany({
        where: { userId },
      });
      await tx.users.update({
        where: { id: userId },
        data: { email: null, phone: null, address: null },
      });
    });
  }
}

// Run tests → Green ✓
```

**Agent only escalates when genuinely stuck.** Most failures resolve autonomously.

## CI/CD Integration

Tests as guardrails are most effective when enforcement is automatic.

### Pre-Commit Validation

**Git pre-commit hook:**

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running test suite before commit..."
npm test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit blocked."
  echo "Fix failing tests or use --no-verify to skip (not recommended)."
  exit 1
fi

echo "✅ All tests passed. Proceeding with commit."
```

**Agent workflow with pre-commit:**

```
1. Agent implements feature
2. Agent attempts git commit
3. Pre-commit hook runs tests
4. If tests fail:
   - Agent sees failure output
   - Agent debugs and fixes
   - Agent retries commit
5. Commit succeeds only when tests pass
```

### Pull Request Checks

**GitHub Actions workflow:**

```yaml
name: Test Suite

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - name: Block merge if tests fail
        if: failure()
        run: exit 1
```

**Agent creates PR workflow:**

```
1. Agent implements feature on branch
2. Agent runs tests locally → Green
3. Agent creates PR
4. CI runs full test suite
5. If CI fails:
   - Agent reads failure logs from GitHub
   - Agent fixes issues
   - Agent pushes fix
   - CI re-runs
6. PR merges only when CI green
```

### Test Coverage Requirements

**Enforce coverage thresholds:**

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

**Agent behavior:**

- If agent's implementation drops coverage below threshold, tests fail
- Agent adds missing test cases to restore coverage
- Prevents shipping under-tested code

## Production Patterns

### Test Pyramid for Agent Work

**Structure your test suite to maximize agent effectiveness:**

```
        /\
       /  \      E2E Tests (Few)
      /    \     - Critical user paths
     /------\    - Integration points
    /        \
   /  Unit    \  Unit Tests (Many)
  /   Tests    \ - Business logic
 /--------------\- Pure functions
                 - Edge cases
```

**Why this works with agents:**

- **Unit tests** provide fast feedback loops (agents iterate quickly)
- **Integration tests** catch architectural issues (agents verify contracts)
- **E2E tests** validate complete workflows (agents confirm user-facing behavior)

**Prompt pattern:**

```
Implement password reset flow:

1. Write unit tests for:
   - Token generation
   - Token validation
   - Email formatting

2. Write integration tests for:
   - POST /auth/reset-password
   - POST /auth/confirm-reset

3. Write E2E test for:
   - Complete user journey: request reset → receive email → reset password → login

Implement each layer, ensuring all tests pass before proceeding to next.
```

### Mutation Testing

**Verify your tests actually catch bugs:**

```bash
$ npx stryker run

Mutant 1: Removed null check in UserService.deactivateAccount
Status: Killed by test "throws error for non-existent user" ✓

Mutant 2: Changed status from 'inactive' to 'active'
Status: Killed by test "marks user as inactive" ✓

Mutant 3: Removed paymentMethod clearing
Status: Survived (no test caught this) ⚠️

Mutation Score: 92% (23/25 mutants killed)
```

**Use mutation testing to improve test quality:**

```
Prompt: "Mutation testing shows that removing paymentMethod clearing
doesn't fail any tests. Add test case that specifically verifies
payment methods are cleared during deactivation."
```

**Agent adds missing test:**

```typescript
test('clears payment method during deactivation', async () => {
  const user = await createTestUser({
    paymentMethod: 'visa-1234',
  });

  await UserService.deactivateAccount(user.id);

  const deactivated = await UserService.findById(user.id);
  expect(deactivated.paymentMethod).toBeNull();
});
```

## Hands-On Exercise: TDD Cycle with Agent

**Scenario:** You're adding a feature flag system to your application. Business requirements:

- Flags can be enabled/disabled per environment
- Flags support percentage-based rollouts (e.g., enable for 25% of users)
- Flag state must be cached for performance
- Cache invalidates when flag configuration changes

**Your Task:**

### Part 1: Write Failing Tests (Human)

Write comprehensive test suite covering:

1. Flag evaluation (enabled/disabled)
2. Percentage rollout logic
3. Cache behavior
4. Cache invalidation

**Hint:** Start with test structure:

```typescript
describe('FeatureFlagService', () => {
  describe('isEnabled', () => {
    test('returns true when flag is enabled globally', () => {
      // Your test here
    });

    test('returns false when flag is disabled globally', () => {
      // Your test here
    });

    test('returns true for X% of users when rollout is X%', () => {
      // Your test here
    });
  });

  describe('caching', () => {
    test('caches flag evaluation results', () => {
      // Your test here
    });

    test('invalidates cache when flag config changes', () => {
      // Your test here
    });
  });
});
```

### Part 2: Agent Implementation (Agent)

Prompt your agent:

```
Implement FeatureFlagService to pass all tests in feature-flags.test.ts.

Requirements:
- Run tests after each logical unit of code
- If tests fail, debug and fix before continuing
- Do not modify tests (they define the contract)
- Commit only when all tests pass

Start by reading the test file to understand requirements.
```

**Observe the agent's workflow:**

- Does it read tests first?
- Does it implement incrementally?
- Does it run tests automatically?
- How does it handle test failures?

### Part 3: Refactor (Agent or Human)

Once tests pass, prompt for refactoring:

```
Refactor FeatureFlagService:
1. Extract percentage calculation into separate function
2. Add TypeScript types for flag configurations
3. Add JSDoc comments for public methods
4. Ensure all tests remain green after each change
```

**Verify:**

- Tests stay green throughout refactoring
- Code quality improves without breaking behavior

### Part 4: Add CI Integration

Create GitHub Actions workflow:

```yaml
name: Feature Flag Tests

on:
  pull_request:
    paths:
      - 'src/feature-flags/**'
      - 'tests/feature-flags/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- feature-flags
```

**Expected Outcome:**

- Complete feature flag system
- Comprehensive test coverage
- Agent-driven implementation with human-written tests
- CI enforcement preventing regressions

## Key Takeaways

1. **Autonomous execution requires automated verification** - Manual code review doesn't scale for agent work. Tests provide objective correctness signals that enable true autonomy.

2. **Tests define operational boundaries** - Agents can safely operate within constraints defined by your test suite. Comprehensive tests = broad operational freedom.

3. **Humans write tests, agents write code** - You encode specifications and constraints as tests. Agents generate implementations that satisfy those tests. Clear separation of concerns.

4. **TDD constrains agent behavior to safe operations** - Red-Green-Refactor cycle naturally prevents agents from shipping untested code. Tests fail first, code passes tests, refactoring preserves behavior.

5. **Debug workflow closes the iteration loop** - Agents can autonomously fix most test failures by reading error output, hypothesizing causes, and iterating on fixes. Escalate to human only when genuinely stuck.

6. **CI integration enforces guardrails automatically** - Pre-commit hooks and PR checks prevent untested code from reaching main branch. Agents treat test failures as hard blockers, not suggestions.

---

**Next:** [Lesson 9: Reviewing Code](./lesson-9-reviewing-code.md)
