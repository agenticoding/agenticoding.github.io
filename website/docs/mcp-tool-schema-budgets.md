---
title: 'MCP Tool Schemas and Budgets'
---

import MCPToolSchemaDiagram from '@site/src/components/VisualElements/MCPToolSchemaDiagram';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

## MCP Tools

Every tool the agent can call ships with a schema: name, description, parameters. Built-in tools (Read, Edit, Bash) are modest at ~50–1000 tokens each. MCP servers are a different story entirely.

**Context effect:** eager loading places every schema in the fixed request prefix before the model plans its first action. Deferred loading keeps most schemas out initially, but adds a Tool Search decision boundary: the model must search, choose a candidate, load its schema, then call it. A near match can append the wrong schema, call, and result before recovery. Those artifacts are not discarded; they persist and can drift into the low-attention middle.

The cost is structural: every tool schema is serialized as JSON with repeated type annotations, nested `required` arrays, and verbose natural-language descriptions. A typical tool runs 300–600 tokens; complex API tools like GitHub's file operations hit 1,000–2,000. These costs compound quickly across multi-server setups. The governing rule is simple: **small, high-frequency toolsets favor eager loading; large, broad catalogs favor deferred loading.**

### Eager vs Deferred Loading

Eager loading keeps calls simple because the model already has the schema when it starts planning. Deferred loading protects the startup prompt, but every deferred tool depends on probabilistic candidate selection. Catalog breadth controls how much eager schema mass enters the prefix; task breadth controls how many schemas the work actually needs; selection quality controls whether discovery takes a wrong path. They are separate variables.

<DiagramFrame
  kicker="Context management"
  title="Deferred loading adds a Tool Search decision boundary"
  size="wide"
  caption={
    'Tool Search saves prefix tokens, but a near match can leave wrong schemas, calls, and results in the context middle.'
  }
>
  <MCPToolSchemaDiagram />
</DiagramFrame>

Drag the catalog control: it changes installed breadth, not what the representative task needs. The task always requires two schemas. Eager loading puts the full catalog in the fixed prefix; deferred loading exposes only schemas selected at runtime and keeps the remainder out of the request.

Switch the Tool Search outcome. A direct match takes the short path. A near match loads a wrong schema, produces a false call and result, then retries. The wrong-path artifacts remain in history and occupy the attention valley even after the correct schemas load. The crossover therefore depends on schema size, task breadth, result breadth, and selection quality—not catalog size alone.

**Takeaway:** the more your catalog behaves like infrastructure, the more you should optimize for what stays out of the valley instead of immediate tool visibility. The same logic applies one layer up to reusable procedures: if a workflow library is broad, discover it cheaply and load the full instructions only when needed. The same automation-versus-reliability tradeoff applies here.

**Next:** [Skills and Procedures](./skills-and-procedures.md)
