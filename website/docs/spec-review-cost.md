---
title: 'Spec Review Cost'
---

The shape of a spec determines whether serious review is possible.

## Shape Follows Review Cost

The examples below demonstrate how length changes the cost of serious review. They are not token budgets, quality tiers, or reusable templates. Counts are approximate, and all three examples use neutral [lorem ipsum](https://en.wikipedia.org/wiki/Lorem_ipsum) so only the structure and reading burden remain visible.

Each example deliberately uses a different shape. Real specs should do the same when their uncertainty differs.

<div className="spec-review-examples">

### Approximately 500 tokens: a compact boundary

A short artifact can still expose intent, limits, evidence, and one unresolved decision.

```markdown
# Compact Spec

## Intent

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros, finibus nec rhoncus vitae, volutpat at turpis.

## Claims & Constraints

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.
- Vivamus interdum tortor at leo consequat maximus. In hac habitasse platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam nec viverra quam. Duis eget molestie velit.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere. Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
- Pellentesque erat leo, posuere in tortor at, lobortis luctus dui. Quisque hendrerit ex at nulla lobortis, vel condimentum eros vestibulum.

## Evidence

- [ ] Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id volutpat ante, in consequat lectus.
- [ ] Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut.
- [ ] Sed luctus sapien id ante interdum, vel lacinia augue dignissim. Integer eget enim eu libero convallis imperdiet. Mauris suscipit vel ante id lobortis.

## Unresolved

Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet tristique elit, nec congue tortor cursus nec. Donec molestie fermentum egestas. Fusce non porttitor ligula.
```

### Approximately 1K tokens: a broader review surface

At this size, scenarios and trade-offs can coexist, but the reviewer must hold more relationships in mind.

```markdown
# Review Brief

> Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros, finibus nec rhoncus vitae, volutpat at turpis.

## Context

Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat lorem. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel facilisis lacus. In in enim dictum, porta mauris id, fringilla nibh.

## Decision Notes

1. Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.
2. Vivamus interdum tortor at leo consequat maximus. In hac habitasse platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam nec viverra quam. Duis eget molestie velit.
3. Integer ultricies felis elit, in ullamcorper risus rutrum posuere. Integer tortor nunc, molestie semper pretium id, mattis ac lorem. Sed pulvinar accumsan leo, sed blandit leo iaculis vel.

## Scenarios

### Alpha

Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus tincidunt. Nullam ac leo sit amet nulla convallis mattis.

### Beta

Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id volutpat ante, in consequat lectus. Suspendisse quis est vel nulla suscipit condimentum et ac orci. Aliquam accumsan diam enim, non varius massa sollicitudin vel.

### Gamma

Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut, sodales euismod purus. Ut ac ipsum ut sem euismod sagittis non non dui. Quisque eget dictum tellus. Duis egestas elit odio. Vestibulum mattis id felis ac euismod.

## Constraints

- Duis vulputate nibh metus, quis facilisis diam feugiat nec. In facilisis metus in ante congue, eget imperdiet magna auctor.
- Aliquam erat volutpat. Suspendisse sit amet nibh non lectus dictum pretium quis commodo lorem. Nam semper diam et laoreet gravida.
- Nulla facilisi. Aliquam semper eros risus, et viverra ex ornare a. Proin a tortor mauris. Maecenas euismod magna velit.
- Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet tristique elit, nec congue tortor cursus nec.

## Acceptance Criteria

- [ ] Fusce vestibulum nunc et enim pharetra sagittis. Fusce tortor quam, hendrerit at ultrices vel, aliquam ornare leo.
- [ ] Donec sed volutpat arcu. Sed efficitur dolor id faucibus lobortis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
- [ ] Aliquam eu interdum lectus. Nulla cursus ornare sodales. Fusce feugiat dui vestibulum efficitur consectetur. Maecenas et congue mi.

## Questions

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere. Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
```

### Approximately 2K tokens: an expensive checkpoint

A longer artifact can coordinate more uncertainty. It also makes omissions, contradictions, and casual skimming harder to detect. The added structure must earn that cost.

```markdown
# Extended Proposal

## Premise

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros, finibus nec rhoncus vitae, volutpat at turpis. Phasellus placerat vulputate turpis vel egestas. Curabitur lorem tortor, ultricies ut molestie at, pellentesque id ante. Nam non ullamcorper nibh. Sed feugiat, sem a feugiat eleifend, turpis mauris convallis nisi, congue pretium sem turpis id sem.

## Narrative

### Condition Alpha

Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat lorem. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vel facilisis lacus. In in enim dictum, porta mauris id, fringilla nibh.

### Condition Beta

Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.

### Condition Gamma

Vivamus interdum tortor at leo consequat maximus. In hac habitasse platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam nec viverra quam. Duis eget molestie velit.

## Boundaries

### Included

- Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus. Mauris sollicitudin tincidunt augue vel volutpat. Aenean elementum efficitur sapien sed laoreet.
- Integer ultricies felis elit, in ullamcorper risus rutrum posuere. Integer tortor nunc, molestie semper pretium id, mattis ac lorem. Sed pulvinar accumsan leo, sed blandit leo iaculis vel.

### Excluded

- Duis vulputate nibh metus, quis facilisis diam feugiat nec. In facilisis metus in ante congue, eget imperdiet magna auctor.
- Aliquam erat volutpat. Suspendisse sit amet nibh non lectus dictum pretium quis commodo lorem. Nam semper diam et laoreet gravida.
- Nulla facilisi. Aliquam semper eros risus, et viverra ex ornare a. Proin a tortor mauris. Maecenas euismod magna velit.

## Risk Register

### Concern 1

**Condition:** Fusce vestibulum nunc et enim pharetra sagittis. Fusce tortor quam, hendrerit at ultrices vel, aliquam ornare leo. Maecenas ultrices neque in mi condimentum vehicula.

**Response:** Donec sed volutpat arcu. Sed efficitur dolor id faucibus lobortis. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Curabitur at luctus arcu.

### Concern 2

**Condition:** Aliquam eu interdum lectus. Nulla cursus ornare sodales. Fusce feugiat dui vestibulum efficitur consectetur. Maecenas et congue mi. Nam venenatis justo enim.

**Response:** Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros, finibus nec rhoncus vitae, volutpat at turpis.

### Concern 3

**Condition:** Pellentesque erat leo, posuere in tortor at, lobortis luctus dui. Quisque hendrerit ex at nulla lobortis, vel condimentum eros vestibulum. In luctus tellus metus, sit amet elementum diam imperdiet ac.

**Response:** Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus tincidunt. Nullam ac leo sit amet nulla convallis mattis.

## Evidence Plan

### Review

- [ ] Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum tellus. Nulla facilisi. Nunc ut consequat nisl.
- [ ] Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut.
- [ ] Sed luctus sapien id ante interdum, vel lacinia augue dignissim. Integer eget enim eu libero convallis imperdiet. Mauris suscipit vel ante id lobortis.

### Verification

- [ ] Mauris luctus aliquam lorem, nec mattis ex commodo sed. In laoreet tristique elit, nec congue tortor cursus nec.
- [ ] Nam euismod neque nec risus interdum convallis. Donec sed massa at risus consectetur imperdiet. Nam non tristique augue.
- [ ] Mauris vel dolor bibendum augue interdum posuere non ac leo. Praesent at semper elit. Nulla hendrerit nibh id tortor efficitur suscipit.

## Sequence

1. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam vulputate pulvinar nunc, sed fringilla sem posuere vel. Nunc metus eros, finibus nec rhoncus vitae, volutpat at turpis. Phasellus placerat vulputate turpis vel egestas. Curabitur lorem tortor, ultricies ut molestie at.
2. Duis lacinia tortor ut nibh fermentum, aliquet pellentesque erat pharetra. Vestibulum aliquet ipsum vel interdum pellentesque. Duis tincidunt sit amet augue ac ullamcorper. Phasellus nec consequat lorem. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
3. Nunc auctor ultricies nunc et fermentum. Vivamus sit amet enim a est molestie posuere at non diam. Mauris pharetra ultricies tempor. Nullam laoreet risus tincidunt, semper nibh in, hendrerit metus.
4. Vivamus interdum tortor at leo consequat maximus. In hac habitasse platea dictumst. Donec vitae maximus turpis, vel pulvinar nunc. Nullam nec viverra quam. Duis eget molestie velit.
5. Integer ultricies felis elit, in ullamcorper risus rutrum posuere. Integer tortor nunc, molestie semper pretium id, mattis ac lorem.
6. Pellentesque erat leo, posuere in tortor at, lobortis luctus dui. Quisque hendrerit ex at nulla lobortis, vel condimentum eros vestibulum.

## Decision Record

> Proin ut odio tortor. Nulla aliquet cursus leo, sit amet bibendum nisi sollicitudin at. Maecenas laoreet aliquet felis, ut volutpat odio cursus tincidunt. Nullam ac leo sit amet nulla convallis mattis.

## Unresolved

- Etiam nec consequat dolor, nec ultrices mauris. Curabitur nec vestibulum tellus. Nulla facilisi. Nunc ut consequat nisl. Vivamus id volutpat ante, in consequat lectus. Suspendisse quis est vel nulla suscipit condimentum et ac orci. Aliquam accumsan diam enim, non varius massa sollicitudin vel.
- Etiam mollis tempor purus eget consequat. Integer nec purus quis tellus ultricies tristique vel et dui. Nam elit elit, venenatis sed felis ut, sodales euismod purus. Ut ac ipsum ut sem euismod sagittis non non dui. Quisque eget dictum tellus. Duis egestas elit odio. Vestibulum mattis id felis ac euismod.
```

</div>

The useful question is not "How long should a spec be?" It is "Can the responsible reviewers still understand and challenge this intent?" Split the change, add structure, or shorten the artifact when the answer is no.

## Key Takeaways

- **Shape follows review cost.** The right spec is the smallest artifact that preserves intent and risky boundaries. Format, length, and drafting process should follow the case rather than a canonical template.
- **Length changes the review burden.** A compact spec can still expose intent, limits, and evidence. A longer spec can coordinate more uncertainty, but omissions and contradictions become harder to detect. The added structure must earn that cost.
- **The question is reviewer comprehension, not token count.** Can the responsible reviewers still understand and challenge this intent? When the answer is no, split the change, add structure, or shorten the artifact.

---

**Next:** [Spec Drafting and Approval](./spec-drafting-approval.md)
