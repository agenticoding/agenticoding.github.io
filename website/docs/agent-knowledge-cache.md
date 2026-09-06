---
title: 'Knowledge Cache'
---

## The Knowledge Cache Anti-Pattern

You've extracted architectural knowledge from your codebase with an agent—clean diagrams, comprehensive API documentation, detailed component relationships. You save it as `ARCHITECTURE.md` and commit it. Now you have a cache invalidation problem: code changes (always), documentation doesn't (usually), and future agents find both during code research. The diagram below shows the divergence.

```mermaid
sequenceDiagram
    participant KB as 🗄️ Codebase<br/>(Persistent)
    participant Agent as ⚡ Agent<br/>(Stateless)

    rect rgb(147, 142, 235, 0.1)
        Note over Agent: 1. GROUNDING
        Agent->>KB: Read source code
        KB->>Agent: Knowledge extracted
    end

    alt ✅ Good Path
        Note over Agent: Knowledge stays in context
        rect rgb(147, 142, 235, 0.1)
            Note over Agent: 2. PLAN
            Note over Agent: 3. EXECUTE
            Agent->>KB: Edit code
            Note over KB: Code changes
        end
        Note over Agent: Done ✓
        Note over KB: Code = source of truth
    else ❌ Bad Path: Cache Grounding
        Agent->>KB: Save ARCHITECTURE.md
        Note over KB: Cache committed
        rect rgb(147, 142, 235, 0.1)
            Note over Agent: 2. PLAN
            Note over Agent: 3. EXECUTE
            Agent->>KB: Edit code
            Note over KB: Code changes<br/>⚠️ Cache now stale!
        end

        Note over Agent: Future agent spawns
        Agent->>KB: Grounding (read KB)
        KB->>Agent: Finds BOTH:<br/>① Current code<br/>② Outdated cache
        Note over Agent: Confusion!
    end
```

The moment you commit extracted knowledge, every code change requires documentation updates you'll forget. Source code is your single source of truth—code research tools (ChunkHound, semantic search, Explore) extract architectural knowledge dynamically every time, fresh and accurate. The distinction: **HOW** knowledge (implementation details, data flows, component relationships) is redundant with code—code research regenerates it on demand. **WHY** knowledge (rejected alternatives, business rationale, compliance mandates) can't be expressed in code. Commit the WHY as decision records—short documents capturing what was decided, why, and what alternatives were rejected. Let code research handle the HOW.

## Key Takeaways

- **Avoid knowledge cache anti-patterns** — Code research tools extract architectural knowledge dynamically from source code every time. Saving extracted knowledge to .md files creates unnecessary caches that become stale. Commit the WHY as decision records; let code research handle the HOW.

---

**Next:** [About](/about)
