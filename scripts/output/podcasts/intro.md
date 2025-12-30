---
source: intro.md
speakers:
  - name: Alex
    role: Instructor
    voice: Kore
  - name: Sam
    role: Senior Engineer
    voice: Charon
generatedAt: 2025-12-30T13:21:26.115Z
model: claude-opus-4.5
tokenCount: 1535
---

Alex: Welcome to Agentic Coding. I'm Alex, and joining me is Sam. We're here to talk about something that's become impossible to ignore in 2025—AI coding assistants and why most engineers are using them wrong.

Sam: Before we dive in, I have to point out something a bit recursive here. This course, including the script we're reading right now, was developed using the exact AI-assisted techniques we're about to teach. We're AI-generated voices reading an AI-generated script about how to work with AI.

Alex: It's meta, I know. But that's actually the point. If these techniques can produce production-grade training material about their own application, they're robust enough for your codebase. Consider it validation, not just instruction.

Sam: Fair enough. So let's get into the actual problem. What's going wrong out there?

Alex: The numbers tell the story. Over 77,000 organizations have adopted GitHub Copilot. 51% of developers use AI tools daily. Companies are shipping features faster. Peer-reviewed research shows baseline efficiency gains over 55%, and practitioners with proper methodology—including the author of this course—report 10x improvements. The technology works.

Sam: But there's a catch, right? I've seen the frustration firsthand.

Alex: 66% of developers say AI solutions are "almost right, but not quite." Only 3% highly trust the output. The tools aren't the problem. The operating model is.

Sam: What do you mean by operating model?

Alex: Most engineers treat AI agents like junior developers. They wait for the AI to "understand" the task. They fix code line-by-line. They fight context limits constantly. That's the wrong mental model entirely. AI agents aren't teammates—they're power tools. You don't wait for a power drill to understand what you want. You learn to operate it.

Sam: That reframe is significant. I've definitely fallen into the "just let it figure it out" trap.

Alex: And the research confirms the consequences. Developers without proper methodology are actually 19% slower with AI tools. Meanwhile, practitioners using systematic approaches report up to 10x efficiency gains. The difference is entirely operator skill.

Sam: So this course is operator training.

Alex: Exactly. We teach a systematic approach used in production environments. Four phases: Research, Plan, Execute, Validate. Research means grounding agents in codebase patterns and domain knowledge before they act. Planning means designing changes strategically—exploring when you're uncertain, being directive when you're clear. Execution means running agents supervised or autonomous based on trust and task criticality. Validation means verifying against your mental model, then iterating or regenerating.

Sam: Let's set expectations. What is this course not?

Alex: It's not AI theory—we cover enough internals to operate effectively, nothing more. It's not prompt templates—copying prompts doesn't work because understanding principles does. It's not a replacement for fundamentals—you still need architecture, design patterns, and system design knowledge. And it's explicitly not for beginners. If you don't have production experience, start there first.

Sam: Who should be listening then?

Alex: You're the target audience if you have three or more years of professional engineering experience. If you've already tried AI coding assistants and hit frustration points. If you want to move faster without sacrificing code quality. If you need to understand codebases, debug issues, or plan features more efficiently. And critically, if you care about production-readiness, not demos.

Sam: How should people approach the material?

Alex: This is a reference manual, not a traditional course with exercises. I recommend reading sequentially first—Module 1 covers fundamentals and mental models, Module 2 covers methodology including prompting and grounding and workflow design, Module 3 covers practical techniques for onboarding, planning, testing, reviewing, and debugging. Then return to specific lessons as you encounter relevant situations in your actual work. The value comes from having the right mental models when you need them.

Sam: What outcomes should people expect?

Alex: After completing this course, you'll be able to onboard to unfamiliar codebases 5 to 10x faster using agentic research. You'll refactor complex features reliably with test-driven validation. You'll debug production issues by delegating log and database analysis to agents. You'll review code systematically with AI assistance while maintaining critical judgment. And you'll plan and execute features with parallel sub-agent delegation.

Sam: What do people need to get started?

Alex: Three things. First, experience—three or more years of professional software engineering. Second, tools—access to a CLI coding agent like Claude Code, OpenAI Codex, or Copilot CLI. If you haven't picked one yet, Claude Code is recommended at time of writing for its plan mode, sub-agents, slash commands, hierarchical configuration, and status bar support. Third, mindset—willingness to unlearn "AI as teammate" and adopt "AI as tool."

Sam: There's something deeper here though, isn't there? Beyond just tool proficiency.

Alex: This course isn't really about AI. It's about rigorous engineering with tools that happen to be stochastic systems. AI agents are amplifiers—of your architectural clarity, your testing discipline, your code patterns. Good or bad, they compound what exists. Research shows AI-assisted code has 8x more duplication—not because agents create it, but because they amplify existing patterns in your codebase.

Sam: So the quality of what you put in determines what you get out.

Alex: You are the circuit breaker. Every accepted line becomes pattern context for future agents. Your engineering judgment—in review, in architecture, in pattern design—determines which direction the exponential curve bends. The tools changed. The fundamentals didn't.

Sam: Where do we start?

Alex: Lesson 1: LLMs Demystified. We'll cover exactly enough about how these systems work to operate them effectively. No more, no less.
