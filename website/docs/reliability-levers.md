---
title: 'Reliability Levers'
---

import AgentReliabilityDecayCurve from '@site/src/components/VisualElements/AgentReliabilityDecayCurve';
import UnevenReliabilityDecay from '@site/src/components/VisualElements/UnevenReliabilityDecay';
import DiagramFrame from '@site/src/components/VisualElements/DiagramFrame';

Every dependent transformation multiplies risk. An agent run combines model inference, retrieved context, tool results, external systems, intermediate artifacts, and final verification. Each output can become input to the next step, so a small loss early in the chain can shape everything downstream.

A useful first approximation is:

```text narration="The dependent chain model: full-task reliability equals the per-step success probability raised to the number of dependent steps. It is a smooth approximation that makes one operational point, which is that adding dependent transformations cannot improve end-to-end reliability on its own."
R(n) = p^n
```

If every step succeeds with probability `p`, then all `n` dependent steps succeed with probability `p^n`. At `p = 0.95`, a 20-step chain succeeds only about 36% of the time.

This is a **smooth simplifying model**, not a forecast. It assumes equally difficult steps, stable per-step reliability, independent failures, and a strict definition of full-task success. Real agent work violates all four assumptions. The model is still useful because it makes one operational constraint obvious: adding dependent transformations cannot improve end-to-end reliability on its own.

<DiagramFrame kicker="Reliability levers" title="Dependent transformations multiply risk" size="wide" narration="Every dependent step has to succeed, and their probabilities multiply. A strong per-step rate of 0.95 still compounds badly: a twenty-step chain succeeds only about 36 percent of the time. The operational point is that adding dependent transformations cannot improve end-to-end reliability on its own — the chain gets longer and the run gets more fragile." caption={<>
Under the simplified assumptions, full-task reliability follows R(n) = 0.95ⁿ.
Representative values show how a strong per-step rate compounds across a chain.
</>}>
<AgentReliabilityDecayCurve />
</DiagramFrame>

## Real Decay Is Uneven

Production runs do not lose reliability on a clean exponential schedule. Routine transformations may preserve state for several steps. An ambiguous decision may cause a small loss. A wrong premise can then produce a cascading drop because later steps inherit it.

Those failures are correlated. Once generated output becomes working context, the next step does not start fresh: it reasons from both the useful signal and any distortion already present. A wrong import can lead to the wrong API, then to a coherent fix for the wrong problem.

The smooth baseline and an uneven run describe different things. The baseline exposes the cost of dependency length. The uneven trajectory shows why **where** a loss occurs—and whether it propagates—matters as much as the number of steps.

<DiagramFrame kicker="Reliability levers" title="Real runs plateau, drift, and cascade" size="wide" narration="Real runs don't lose reliability on a clean exponential schedule. Routine steps can hold a plateau near 96 percent, an ambiguous decision costs a little, and then one wrong premise early on cascades because every later step inherits it — a sticky premise at step six drags a run from the high eighties down to 35 percent. Failures are correlated, so where a loss happens and whether it propagates matters as much as how many steps you took." caption={<>
A smooth baseline is useful for reasoning about chain length. Real runs are
uneven: routine steps may plateau, ambiguity causes local loss, and a sticky
premise can correlate failures across later steps.
</>}>
<UnevenReliabilityDecay />
</DiagramFrame>

This propagation tendency is **failure stickiness**: the chance that a failed step makes a later dependent step more likely to fail. Reliable workflows control both baseline step quality and the distance bad state can travel.

**Next:** [Context Quality](./reliability-context-quality.md)
