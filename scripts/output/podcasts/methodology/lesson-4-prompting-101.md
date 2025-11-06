---
source: methodology/lesson-4-prompting-101.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-05T13:01:32.174Z
model: claude-haiku-4.5
tokenCount: 2010
---

Alex: Let's talk about how AI models actually work when you prompt them. Most people think of it like a conversation—you ask a question, the model answers. That's not what's happening at all.

Sam: What's actually happening?

Alex: These models are pattern completion engines. You're not asking a question. You're drawing the beginning of a pattern, and the model predicts what comes next based on statistical patterns from its training data. This distinction fundamentally changes how you should approach prompting.

Sam: So I'm not really asking, I'm initializing?

Alex: Exactly. Think of it like this: when you type "Write a TypeScript function that validates email addresses", you're not making a request. You're starting a code block pattern. The model's job is to predict what naturally follows. The more specific your pattern start, the more constrained the completion space becomes.

Sam: That makes sense for code, but does that apply to all prompting?

Alex: Completely. It's the foundation for everything else we'll cover. Once you understand that you're pattern-completing, you start optimizing differently. First, you skip pleasantries. "Please" and "thank you" are just tokens that dilute your actual signal without adding any clarity.

Sam: That feels unnatural, but I see the logic. It's noise from a pattern-completion perspective.

Alex: Right. You also move toward imperative, action-oriented language. Instead of "Make a function", you say "Write a function". Instead of "Fix the bug", you say "Debug the null pointer exception in UserService.ts:47". The specificity matters because you're defining the pattern you want completed.

Sam: Specificity seems like the theme here. More specific patterns constrain the output space?

Alex: Exactly. And this gets interesting when you add constraints. Without them, the model fills gaps with assumptions. So if you say "Add authentication", that's ambiguous—JWT? OAuth? Session tokens? Which endpoints? You need to define the boundaries explicitly so the completion space is narrow and predictable.

Sam: Is that the same as what you mean by specificity, or is it different?

Alex: They work together. Specificity controls what pattern you're drawing. Constraints control the boundaries of that pattern. In practice, they often overlap. When you say "Add JWT-based authentication to the /login endpoint", you're being specific about the pattern AND defining constraints on the implementation.

Sam: Got it. Now, you mentioned personas earlier. How do those fit into pattern completion?

Alex: Personas work by biasing vocabulary distribution. When you write "You are a security engineer", you're increasing the probability that security-specific terminology gets used—threat model, attack surface, least privilege. Those terms act like semantic queries. Instead of listing every security concern explicitly, you're triggering the cluster of patterns associated with "security engineer".

Sam: So the persona isn't adding new knowledge, it's just retrieving a different set of patterns from training?

Alex: Precisely. This applies universally across tools. When you search a codebase with "Authentication middleware patterns", you get different results than "login code". When you research "Rate limiting algorithms" versus "slow down requests", you retrieve different patterns. Vocabulary is the control interface.

Sam: But you said use personas only when domain-specific terminology matters. When would you skip them?

Alex: When the task is straightforward and adding persona context wastes tokens without value. If I'm asking for a simple function to parse JSON, I don't need "You are a performance engineer"—the task is clear enough. Personas are overhead when specificity and constraints already define the pattern tightly.

Sam: That makes sense. Now let's talk about more complex tasks. The course mentions Chain-of-Thought for multi-step operations.

Alex: Right. When a task requires multiple steps, you often need to control the execution path. Chain-of-Thought explicitly defines each step the model must follow. You're not asking for reasoning—you're dictating the route.

Sam: Why is that necessary? Can't the model just figure out the right sequence?

Alex: It can for simple tasks, but complex operations—five steps or more—require explicit guidance. CoT gives you three things: you dictate the sequence, so the model can't skip steps; errors surface early rather than compounding; and the execution becomes transparent. You see exactly what happened at each stage, making debugging straightforward.

Sam: So it's especially valuable for QA workflows?

Alex: Absolutely. When you're debugging or validating something methodically, CoT keeps the model honest. It forces step-by-step execution rather than jumping to conclusions. That matters in production contexts where you need to verify each stage.

Sam: Okay, let's move to structure. The material talks about Markdown, JSON, XML being information-dense. What does that mean?

Alex: It means how much meaning you convey per token. Markdown is highly information-dense—headings, lists, code blocks provide clear semantic structure with minimal overhead. When you structure a prompt with markdown sections like "Requirements", "Implementation", "Testing", you're making requirements scannable and drawing attention to distinct areas.

Sam: Does structure actually change the model's behavior, or is it just about human readability?

Alex: It changes the model's behavior. The structure itself becomes part of the pattern the model completes. When you provide structured input, the model learns to produce structured output that matches. It's not magical—it's because well-structured documents are common in training data, so the model predicts structured completions.

Sam: Makes sense. Now, the failure modes. You mentioned negation is problematic.

Alex: Yes. LLMs struggle with negation because attention mechanisms treat "NOT" as just another token. When "NOT" receives low attention, the model focuses on the concepts mentioned—"passwords", "plain text"—rather than the negation. It's called affirmation bias. The model's token generation fundamentally leans toward positive selection, what to include, not negative exclusion.

Sam: So if I say "Don't store passwords in plain text", there's a real risk the model misses the negation?

Alex: Real risk, yes. Better approach: state the negation clearly, then immediately provide the positive opposite. "Do NOT store passwords in plain text. Instead, always store passwords as hashed values using bcrypt with a salt round of 12." The pattern now includes both the constraint and the correct implementation.

Sam: That's specific enough that it's hard to get wrong. What about the math limitation?

Alex: LLMs are probabilistic text predictors, not calculators. They're terrible at arithmetic. If you ask them to calculate a complex number, they'll generate plausible-sounding results that may be completely wrong.

Sam: So don't use them for math at all?

Alex: Don't rely on them for calculations. Instead, have them write code that does the math. The model is good at predicting code patterns. Let the code execute and do the arithmetic. That's a much safer approach.

Sam: Let me synthesize what we've covered. Prompting is about understanding you're pattern-completing, being specific about the pattern, constraining the boundaries, using structure, and avoiding failure modes.

Alex: That's the core. And the meta-principle underneath all of it: you're not conversing with an intelligence that understands your intent. You're initializing a statistical engine that predicts what comes next in a sequence. Everything follows from that.

Sam: It changes how you think about the interaction completely.

Alex: It does. Once you internalize that, you stop trying to be polite or conversational. You start being precise. You start thinking about the patterns you're drawing and the completion space you're defining. That's where effective prompting lives.
