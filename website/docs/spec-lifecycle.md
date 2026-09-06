---
title: 'Spec Lifecycle'
---

## Choose Location and Lifecycle Deliberately

A spec should live where the people and agents doing the work can review, retrieve, and update it. Several locations can be valid:

| Location                                | Useful when                                                    | Main trade-off                                         |
| --------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Issue or project tracker**            | Discussion, assignment, and approval happen with delivery work | May be separated from code history and offline tooling |
| **In-repo RFC or design document**      | Versioning beside code and repository-native review matter     | Can look authoritative after behavior has moved on     |
| **Shared document or knowledge system** | Cross-functional review and rich collaboration matter          | Access, versioning, and agent retrieval may be weaker  |

Choose based on review workflow, access controls, versioning, traceability, agent access, and expected lifetime—not on a universal default.

Lifecycle follows the same rule. A delivery spec may be closed after implementation. An RFC may remain as a historical decision record. A protocol or policy spec may continue to define behavior and require updates alongside code. Whatever the model, name the active authority and the update rule so agents do not have to guess between conflicting descriptions.

When implementation becomes the operational authority, perform an explicit handoff:

- Put enforceable behavior in code, types, validation, configuration, and tests.
- Keep non-obvious local rationale near the code when future changes depend on it.
- Retain broader decisions or rejected alternatives in an appropriate durable record when they still matter.
- Archive, close, update, or remove the spec according to its intended lifecycle.

This resolves deliberate duplication without imposing one destination for every kind of knowledge. [Writing Agent-Friendly Code](./agent-friendly-code.md) covers how to make operational constraints recoverable during code research.

## Key Takeaways

- **Location and lifecycle are design choices.** Make authority, update rules, and the eventual handoff explicit.
- **Lifecycle follows the spec's purpose.** A delivery spec closes after implementation; an RFC may remain as a historical record; a policy spec continues alongside code.
- **Hand off deliberately.** When implementation becomes the operational authority, put enforceable behavior in code, keep rationale near the code, and retain broader decisions where they still matter.

---

**Next:** [Validation](./validation.md)
