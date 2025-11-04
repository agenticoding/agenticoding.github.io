---
source: methodology/lesson-4-prompting-101.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-11-04T07:17:35.899Z
model: claude-haiku-4.5
tokenCount: 3169
---

Alex: So we need to talk about something that most people get fundamentally wrong about AI coding assistants. They treat them like conversational partners. They'll write prompts like "Hey, could you please help me write a TypeScript function that validates user input?" They're polite. They're conversational. And they're being inefficient.

Sam: I've definitely done that. It feels natural—like you're asking a colleague for help. But I'm hearing you say that's not how these models actually work?

Alex: Exactly. These aren't conversational partners. They're sophisticated pattern completion engines. Think about it: when you prompt an AI model, you're not really making a request. You're drawing the beginning of a pattern, and the model's job is to predict what comes next based on statistical patterns from its training data.

Sam: So it's more like... I'm giving the model a starting point, and it's predicting the most likely continuation based on what it's seen before?

Alex: Precisely. That's the fundamental shift in understanding. When you write "Write a TypeScript function that validates...", you're not asking a question. You're starting a code block pattern. The model then completes this pattern with what naturally follows.

Sam: That's a useful mental model. So the implication is that I should structure my prompts differently than I would if I were emailing a colleague?

Alex: Completely different. For one thing, skip the pleasantries. "Please" and "thank you" don't add clarity—they just dilute your signal. Those tokens could be doing real work describing what you actually want.

Sam: That feels weird to me. Don't they help set a tone?

Alex: With other people, sure. With a pattern completion engine, they're just noise. The model doesn't need social cues. It needs clear, specific instruction. The stronger your pattern start, the more constrained the completion space becomes.

Sam: Right, so more specificity means less room for the model to go off track.

Alex: Exactly. Let's take a concrete example. If you say "Make a function that validates email addresses," that's weak. It's vague. "Make" is vague. But if you say "Write a function that validates email addresses using RFC 5322 standards and returns a boolean," now you've defined the pattern much more clearly. TypeScript function signature, specific requirements, return type. The model has less ambiguity about what to complete.

Sam: So the instruction verb matters too?

Alex: Yes. "Make" is weak. "Write" is stronger because it carries the implication of code. But even stronger is being specific about what exactly you're writing. "Debug the null pointer exception in UserService.ts:47" is much more precise than "Fix the bug." You're not just saying there's a problem—you're showing the model exactly where it is and what kind of problem it is.

Sam: And that specificity cascades, right? Because I'm giving the model more context about what I want?

Alex: Exactly. It's not just about being nice or specific for its own sake. It's about constraining the completion space. Here's where it gets interesting: without constraints, the model fills gaps with assumptions. That's dangerous.

Sam: Give me an example.

Alex: Say you write "Implement authentication in this API." The model has to guess: JWT? OAuth? Session tokens? Which endpoints? How should tokens be validated? What's the refresh strategy? It'll generate something plausible, but it might not match your actual requirements.

Sam: So constraints are essentially guardrails that keep the model from making bad assumptions?

Alex: Right. If you instead write "Implement JWT-based authentication for the /login and /protected endpoints. Tokens expire after one hour. Validate tokens using RS256 signature verification. Return 401 for invalid tokens," now you've defined the completion space completely. No ambiguity. No bad assumptions.

Sam: Okay, that makes sense for straightforward code generation. But you mentioned something about personas in the material—assigning the model a role. When does that actually matter?

Alex: Personas are interesting because they work differently than people think. Most people imagine that assigning a persona like "You are a security engineer" somehow transfers domain knowledge to the model. But that's not what's happening.

Sam: So what is happening?

Alex: Personas work by shifting vocabulary distribution. When you write "You are a security engineer," you're increasing the probability that security-specific terms like "threat model," "attack surface," "least privilege" appear in the response. Those terms act as semantic queries during the model's attention mechanism. They retrieve different patterns from training data than generic terms like "check for issues."

Sam: Ah, so the persona is really just a vocabulary shortcut.

Alex: Exactly. Instead of listing every security term you want to see, the persona triggers the entire cluster of knowledge associated with "security engineer." This principle actually applies everywhere—when you search a codebase with tools, when you do web research. The vocabulary you choose determines which patterns get retrieved.

Sam: So "authentication middleware patterns" would retrieve different code chunks than just "login code"?

Alex: Right. The specificity of your vocabulary is the control interface for what you retrieve. But here's the important nuance: use personas when domain-specific terminology actually matters. Skip them when the task is straightforward. Don't waste tokens adding a persona if it doesn't actually improve the response.

Sam: Got it. So personas are a tool, not a requirement. When would you actually use one?

Alex: When you need consistent vocabulary across related tasks, or when the domain-specific terminology genuinely improves accuracy. Security reviews, performance optimization, accessibility—these have specific vocabularies that matter. But if you're asking the model to write a simple utility function? Skip the persona. You're wasting tokens.

Sam: Makes sense. Now, the material mentions something called Chain-of-Thought. I've heard that term before, but I'm not sure I actually understand what it does.

Alex: Chain-of-Thought is about control. When tasks require multiple steps, you need to control the execution path. CoT does that by explicitly defining each step the model must follow—like giving turn-by-turn directions instead of just the destination.

Sam: So instead of asking the model to do something, I'm telling it how to do it, step by step?

Alex: Exactly. You're dictating the path. Here's why that matters: the model can't skip steps or take shortcuts. Each step must complete before the next begins. Errors surface early rather than compounding through multiple steps.

Sam: That sounds particularly important for complex operations.

Alex: It is. For simple tasks, the model can usually get it right without CoT. But when you're doing something with five or more steps—especially in QA workflows or debugging scenarios—CoT becomes essential. It makes the execution transparent so you can verify each stage.

Sam: Do you have an example of when that would matter in production?

Alex: Absolutely. Imagine you're debugging a complex issue. Without CoT, you might ask the model "Debug this performance problem in our database queries." The model might jump around, guess, make assumptions. With CoT, you'd say "Step 1: Identify which queries are slow. Step 2: Analyze the execution plans. Step 3: Check for missing indexes. Step 4: Propose specific optimizations." Now you see exactly what the model found at each stage, and you can validate it before moving to the next step.

Sam: And if something goes wrong at step two, you know that's where the problem is?

Alex: Exactly. You don't have bad analysis from step two contaminating steps three and four.

Sam: Alright, so that's about controlling execution. What about structure? The material mentions using markdown, JSON, and XML effectively.

Alex: Structure is about directing attention and organizing information. Different formats have different information density—how much meaning is conveyed per token. Markdown is highly information-dense. Headings, lists, code blocks provide clear semantic structure with minimal overhead.

Sam: So a well-structured prompt is easier for the model to parse?

Alex: Right. It's not just about readability for humans. The model benefits too. Well-structured prompts help it understand intent and respond with matching structure. If you send markdown with clear sections and headings, you're more likely to get markdown back with that same structure.

Sam: That's a good optimization. What about things to avoid? I imagine there are patterns that reliably break or confuse models?

Alex: Yes. Two big ones. First: negation. LLMs struggle with negation because attention mechanisms treat "NOT" as just another token competing for weight. If "NOT" receives low attention during processing, the model focuses on the concepts mentioned—"passwords," "plain text"—rather than their negation.

Sam: So if I say "Don't store passwords in plain text," the model might actually generate code that stores passwords in plain text?

Alex: It's risky, yes. The better pattern is negation followed immediately by the positive opposite. "Do NOT store passwords in plain text. Instead, always store passwords as hashed values using bcrypt with 12 salt rounds." Now you're explicitly stating what you want, not just what you don't want.

Sam: That makes sense. What was the other one?

Alex: Math. LLMs are probabilistic text predictors, not calculators. They're terrible at arithmetic. If you ask the model to calculate something and generate the answer as text, you'll get plausible-sounding numbers that might be completely wrong.

Sam: So don't ask them to do math?

Alex: Don't ask them to generate numeric answers directly. Have them write code that does the math instead. Let the code execute and produce the actual answer.

Sam: That's practical. Okay, so let me try to synthesize all of this. The core idea is that I need to think of prompting as initializing a pattern completion engine, not having a conversation?

Alex: Yes. Be specific. Be structured. Be explicit. Skip pleasantries. Use vocabulary that triggers the patterns you need. Use constraints to eliminate bad assumptions. Use personas selectively when domain vocabulary matters. Use CoT when execution paths matter. Avoid negation without stating the positive opposite. Don't rely on models for math.

Sam: And the whole point is precision. I'm not trying to be friendly or conversational—I'm trying to give the model the clearest possible starting point for the pattern I want it to complete?

Alex: Exactly. Prompting is precision engineering. Most people approach it like they're writing an email. You should approach it like you're defining a specification. The more specific and constrained your prompt, the better the completion.

Sam: That's a significant mental shift. Most of my interactions with AI assistants have probably been way too conversational.

Alex: Most people's are. That's why understanding that fundamental distinction—conversation versus pattern completion—matters so much. Once you internalize that, everything about effective prompting becomes clearer.

Sam: Great. So we've covered clear instruction-based prompting, personas, Chain-of-Thought, structure, and things to avoid. Is there anything else critical about prompting that we haven't touched on?

Alex: The big theme underneath all of this is that effective prompting is about reducing ambiguity. Every technique we've discussed serves that goal. Specific language reduces ambiguity. Constraints reduce ambiguity. Structure reduces ambiguity. CoT reduces ambiguity about execution order. Personas reduce ambiguity about vocabulary domain.

Sam: So the mental model is always "What ambiguity am I leaving in this prompt that the model will have to fill in with assumptions?"

Alex: Exactly. That's the question to ask yourself every time you write a prompt. And then you structure your prompt to eliminate as much of that ambiguity as possible.

Sam: That's a useful framework. Alright, I think I have a much clearer understanding of how to approach prompting now. It's less about being conversational and more about being precise.

Alex: Right. And once you start thinking about it that way, you'll naturally start writing better prompts. You'll be more intentional about constraints, more specific about language, more structured in your instructions. It's a discipline, but it's learnable.

Sam: Good. Let's move on to the next lesson.
