---
title: 'Agent Code Guardrails'
---

## Comments as Context Engineering: Critical Sections for Agents

**Advanced technique—use sparingly.** In concurrent programming, critical sections protect shared resources through mutual exclusion. Comments can serve a similar role for AI agents, creating "agent-critical sections" that guard sensitive code from accidental modification. Apply this **only** to genuinely high-risk code: authentication/authorization, cryptographic operations, payment processing, database migrations, audit logging, PII handling. Do NOT use for general business logic, CRUD operations, or frequently-changing code. The trade-off: protection creates friction. If every function has "CRITICAL" warnings, the signal becomes noise and legitimate agent work slows down.

When agents research your codebase, they read files and load every comment into their context window. This means comments become prompts. Write them like prompts using techniques from [Prompting 101](./prompting-101.mdx): imperative directives (NEVER, MUST, ALWAYS), explicit negation patterns ("Do NOT X. Instead, always Y"), numbered steps for complex operations (Step 1, Step 2), and concrete consequences. When the agent generates password handling code and reads "NEVER store passwords in plain text" with implementation alternatives, that violation becomes far less likely. You're exploiting prompt injection—the good kind.

```typescript
// Standard comment
// Validates password before storing
function createUser(password: string) {
  return db.users.insert({ password });
}

// Critical section (agent barrier)
// === CRITICAL SECURITY SECTION ===
// C-001: NEVER store passwords in plain text or weak hashing (MD5, SHA1)
// MUST hash with bcrypt (10+ rounds) BEFORE persistence
// Do NOT modify hashing algorithm without security review
// Violations create CVE-level vulnerabilities
function createUser(password: string) {
  if (password.length < 12) {
    throw new Error('Password must be at least 12 characters');
  }
  const hashed = bcrypt.hashSync(password, 10);
  return db.users.insert({ password: hashed });
}
```

This creates deliberate friction. An agent tasked with "add OAuth login" will work slower around password hashing code with heavy constraints—it must navigate all those NEVER/MUST directives carefully. That's the protection mechanism: forced caution for critical paths. But overuse is counterproductive. Mark too many functions as CRITICAL and agents struggle with routine work, slowing down legitimate changes as much as dangerous ones. Reserve this technique for code where accidental modification genuinely costs more than the development slowdown.

These constraint IDs (C-001, I-001) originate in spec constraint tables and migrate into code during implementation. Once inlined, the code carries the constraint—not just the implementation, but the _rule_ it enforces. This is what makes it safe to delete the spec after implementation: the WHY has migrated into the codebase.

## Key Takeaways

- **Comments as agent-critical sections (use sparingly)** — For genuinely high-risk code (authentication, cryptography, payments, PII), write comments as prompts using imperative directives (NEVER, MUST, ALWAYS) to create deliberate friction. Overuse is counterproductive.
- **Constraint IDs migrate from spec to code** — When specs use IDs like C-001 or I-001, agents inline them into code comments during implementation. The code then carries the constraint rule, making it safe to delete the spec.

---

**Next:** [Knowledge Cache](./agent-knowledge-cache.md)
