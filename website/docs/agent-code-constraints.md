---
title: 'Agent Code Constraints'
---

## Co-locate Related Constraints

Agents discover your codebase through **agentic search**—Grep, Read, Glob. **Agents only see code they explicitly find.** When constraints scatter across files, search determines what the agent sees and what it misses.

**Anti-pattern (scattered constraints):**

```typescript
// File: services/auth.ts
function createUser(email: string, password: string) {
  return db.users.insert({ email, password: hashPassword(password) });
}

// File: config/validation.ts
const MIN_PASSWORD_LENGTH = 12; // ← Agent never searches for this file
```

**What happens:** Agent searches `Grep("createUser")` → reads `services/auth.ts` → generates code accepting 3-character passwords because it never saw `MIN_PASSWORD_LENGTH`.

**Production pattern (co-located constraints):**

```typescript
// File: services/auth.ts
const MIN_PASSWORD_LENGTH = 12; // ← Agent sees this in same file

function createUser(email: string, password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
    );
  }
  return db.users.insert({ email, password: hashPassword(password) });
}
```

**What happens:** Agent searches `Grep("createUser")` → reads `services/auth.ts` → sees `MIN_PASSWORD_LENGTH` in same read → generates code that enforces constraint.

### Semantic Bridges When DRY Requires Separation

When constraints must be shared across modules, create **semantic bridges**—comments with related semantic keywords enabling semantic search and code research tools to discover relationships:

```typescript
// File: shared/constants.ts
// Password strength requirements: minimum character length enforcement
export const MIN_PASSWORD_LENGTH = 12;

// File: services/auth.ts
import { MIN_PASSWORD_LENGTH } from '@/shared/constants';

// User credential validation: enforce security constraints
function createUser(email: string, password: string) {
  return db.users.insert({ email, password: hashPassword(password) });
}
```

**How semantic bridges work:** Semantic search matches meaning, not exact words. Query "password validation requirements" finds BOTH files because embeddings recognize semantic similarity:

- "password" ≈ "credential"
- "requirements" ≈ "constraints"
- "strength" ≈ "security"

The comments use different words with overlapping meaning—semantic breadcrumbs that connect related concepts across files.

### Automate Through Prompting

Rather than manually managing discoverability strategies, configure your agent to handle this automatically. Add instructions like `"Document inline when necessary"` and `"Match surrounding patterns and style"` to your `CLAUDE.md` or `AGENTS.md` ([Context Engineering](./context-engineering.mdx)). These phrases make agents automatically add semantic bridge comments during generation, follow existing code conventions, and maintain consistency without explicit oversight. The agent reads your co-located constraints and semantic bridges during code research, then generates new code that follows the same patterns—turning discoverability into a self-reinforcing system rather than manual organizational work.

**Caveat:** You'll need to occasionally remind the agent about these instructions in your task-specific prompts. Due to the [U-shaped attention curve](./context-engineering.mdx#the-attention-curve-why-placement-matters), instructions buried in configuration files can fall into the ignored middle of the context window during long interactions. A quick reminder like "document inline where necessary and match surrounding style" at the end of your prompt ensures these constraints stay in the high-attention zone.

## Key Takeaways

- **Co-locate constraints, create semantic bridges when necessary** — Scattered code compounds into harder-to-navigate codebases. When separation is required (DRY), use explicit comments pointing to related files.
- **Automate discoverability through prompting** — Add instructions to AGENTS.md that make agents automatically add semantic bridges and follow patterns, turning discoverability into a self-reinforcing system.

---

**Next:** [Agent Code Guardrails](./agent-code-guardrails.md)
