---
sidebar_position: 2
sidebar_label: 'Lesson 2: How LLMs Work'
---

# How LLMs Generate Code

Before diving into workflows and techniques, you need to understand how your AI coding assistant actually behaves. This isn't about neural network architecture—it's about the behavioral quirks that will impact your daily work.

## Learning Objectives

- Understand LLM behavior patterns that affect code generation
- Recognize when and why hallucinations occur
- Build mental models for effective AI interaction
- Know what to verify and when

## The Core: Token Prediction

**An LLM is sophisticated autocomplete.** That's it.

It predicts the next token (roughly a word or code symbol) based on statistical patterns from millions of training examples. When you prompt it with:

```python
def calculate_
```

It generates a probability distribution: `total` (32%), `sum` (28%), `price` (15%), `average` (12%)...

Then samples from that distribution to produce output.

### Why This Matters

This prediction mechanism creates specific behavioral patterns you'll encounter every day:

## 5 Behavioral Facts That Impact Your Workflow

### 1. Pattern Matching ≠ Reasoning

The model recognizes patterns from training data. It doesn't reason about correctness.

**Example:**
```typescript
// Prompt: "Add error handling to this function"
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

// AI might generate:
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  } catch (error) {
    console.log('Error:', error); // ❌ Logs but doesn't handle
    return null; // ❌ Type-unsafe
  }
}
```

**The pattern looks right** (try-catch), but the logic is wrong (silent failures, incorrect return type).

**Implication:** Review for correctness, not just syntax. The code will *look* professional.

### 2. Non-Deterministic Output

Same prompt generates different code on each run (controlled by `temperature` parameter).

**Try it:**
1. Ask: "Write a function to validate email addresses"
2. Ask again (same prompt)
3. Compare the two implementations

You'll get different regex patterns, different validation logic, different function signatures.

**Implication:** If you don't like the first answer, regenerate. Treat it like a junior developer—sometimes their second attempt is better.

### 3. Hallucinations Are Inevitable

The model will confidently generate:
- Functions from libraries that don't exist
- APIs with wrong signatures
- Deprecated methods as if they're current
- Plausible documentation for fake features

**Real example:**
```python
# Prompt: "Use pandas to remove outliers"
import pandas as pd

df = df.remove_outliers(method='iqr', threshold=1.5)  # ❌ No such method
```

`remove_outliers()` doesn't exist in pandas. But it *should*, and the AI has seen similar patterns, so it hallucinates it.

**Implication:**
- **Always verify imports** - Check the actual library docs
- **Always verify API signatures** - Don't trust method names or parameters
- **Higher risk with newer libraries** - Less training data = more hallucinations

### 4. Limited Context Window

The model only sees recent conversation history (typically ~200K tokens ≈ 150K words of code/text).

**Consequences:**
- Can't see your entire codebase
- Forgets earlier conversation after many exchanges
- No memory across sessions

**Example:**
```
You (start of session): "We're using React 19 with the new `use` hook"
[... 50 messages of conversation ...]
You: "Add a data fetching hook"
AI: [Generates React 18 pattern, forgot you said React 19]
```

**Implication:**
- Re-state critical context when starting new conversations
- For large refactors, break into smaller, focused sessions
- Don't assume it remembers constraints from 30 messages ago

### 5. No Execution Feedback (Without Tools)

Base LLMs don't compile or run code. They don't know if their output works.

Modern coding agents (like Cursor, Aider, Claude Code) *do* have execution tools, but the core LLM still doesn't inherently know.

**Implication:** Close the feedback loop yourself:
1. Generate code
2. Run/compile/test
3. Paste errors back
4. Let it fix based on actual failures

This iteration is where AI really shines—rapid error fixing when you provide concrete feedback.

## Practical Mental Model

Think of an LLM as a **extremely well-read intern** who:

- ✅ Has read every Stack Overflow post and GitHub repo
- ✅ Can quickly draft code that matches common patterns
- ✅ Works 24/7 and responds instantly
- ❌ Doesn't verify their work compiles
- ❌ Sometimes confidently cites documentation that doesn't exist
- ❌ Forgets context from last week (or even yesterday)
- ❌ Can't reason about business logic without examples

**You wouldn't merge their PR without review.** Same applies here.

## Interactive Example: Seeing Probabilities

While we can't see the actual probability distributions, you can observe non-determinism:

```javascript live
function TokenPredictionDemo() {
  const [outputs, setOutputs] = React.useState([]);

  const generateCompletion = () => {
    // Simulating different completions for the same prompt
    const possibilities = [
      'total',
      'sum',
      'average',
      'result',
      'value'
    ];
    const choice = possibilities[Math.floor(Math.random() * possibilities.length)];
    setOutputs([...outputs, choice]);
  };

  return (
    <div>
      <p><code>def calculate_</code> → <strong>?</strong></p>
      <button onClick={generateCompletion} style={{padding: '8px 16px', marginBottom: '10px'}}>
        Generate Next Token
      </button>
      <div>
        {outputs.map((output, i) => (
          <div key={i}>Attempt {i + 1}: <code>calculate_{output}</code></div>
        ))}
      </div>
    </div>
  );
}
```

Click multiple times—same prompt, different outputs. This is temperature and sampling at work.

## What About Visual Explanations?

If you want deeper intuition about how transformers work:

- **3Blue1Brown**: ["But what is a GPT?"](https://www.youtube.com/watch?v=wjZofJX0v4M) - Visual introduction to transformers (27 min)
- **TensorFlow Playground**: [Interactive neural network](https://playground.tensorflow.org/) - See how networks learn patterns
- **Transformer Explainer**: Interactive visualization of token flow through layers

**But for using AI coding agents effectively, you don't need to understand attention mechanisms or backpropagation.** The 5 behavioral facts above are what matter.

## Hands-On Exercise: Spotting Hallucinations

**Scenario:** You need to integrate with the Stripe payment API. You're not familiar with the latest Stripe SDK.

**Your Task:**

1. Prompt your AI assistant: "Write a TypeScript function to create a Stripe payment intent for $50 USD"
2. Review the generated code
3. Open the [actual Stripe docs](https://docs.stripe.com/api/payment_intents/create) in parallel
4. Identify discrepancies:
   - Wrong parameter names?
   - Missing required fields?
   - Deprecated methods?
   - Invented convenience methods?

**Expected Findings:** The AI will likely get 70-80% correct, but might:
- Use slightly wrong parameter names (`payment_method` vs `paymentMethod`)
- Miss required fields like `currency`
- Use a non-existent helper method
- Generate outdated API patterns

**Key Lesson:** Even for well-documented, popular APIs, hallucinations happen. Always verify against source documentation.

**Bonus Challenge:** Try the same prompt with a newer, less popular library (e.g., Hono, Effect-TS). Notice more hallucinations? Less training data = less reliable patterns.

## Key Takeaways

1. **LLMs predict tokens statistically** - They don't reason or verify correctness
2. **Non-determinism is a feature** - Regenerate if first output isn't great
3. **Hallucinations are inevitable** - Always verify imports, APIs, and library calls
4. **Context is limited and temporary** - Re-state important constraints
5. **Close the feedback loop** - Paste errors back for rapid iteration

**Rule of thumb:** Treat AI output like code review for a smart junior developer. It's often 80% correct, fast to generate, but needs verification.

---

**Next:** Lesson 3: Mental Models for AI Collaboration (coming soon)
