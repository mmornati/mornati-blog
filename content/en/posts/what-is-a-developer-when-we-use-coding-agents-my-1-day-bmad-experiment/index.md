---
title: What is a Developer When We Use Coding Agents? My 1-Day BMAD Experiment
tags:
- ai
- development
- developer
- ai-coding-agent
date: '2026-03-14T17:41:36.693000+00:00'
slug: what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment
description: Is coding dead? A 1-day experiment with the BMAD method. Discover why
  Agent Supervisor is the future and why architecture is the only stack that matte
---



I’ve spent the better part of the last year "vibecoding" with AI. The coding results have been quite good, but recently, I’ve been looking to improve the top of the funnel: how to move smoothly from a raw idea to a strictly defined, "ready to dev" project that does *exactly* what I want.

To test this, I decided to dedicate a full day to really digging into the **BMAD method** (which stands for *Breakthrough Method for Agile AI-Driven Development*). If you aren't familiar with it, BMAD is an open-source framework that basically applies Agile discipline to AI coding. Instead of just treating the AI as a single, chaotic autocomplete tool, BMAD forces you to interact with specialized AI "personas" (like an Analyst, Product Manager, and Architect). It makes you generate strict, version-controlled artifacts, like a PRD and technical architecture, *before* any actual code is written.

I’d used it a few times before and found it a bit long, but this time, I gave it the time it deserved. The goal? Take a raw idea through every phase of software design using these AI agents, right up to the point of coding. Here is how it went, and more importantly, what it taught me about the future of our jobs.

## The Journey from Idea to MVP

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/00-98800595-ad89-403a-9e15-ec74bdbc0497.png)

Using the BMAD method, I took my test idea through five distinct phases:

*   **1\. Market Search:** Let’s be honest, most of our "genius" ideas have already been built by someone else! The Analyst agent guides you through a complete market analysis, pulling in data and results. It acts as an early reality check to see if the project is actually worth pursuing.
    
*   **2\. The Analyst (Building the PRD):** This is where you build the Product Requirements Document, and it’s where I spent a *lot* of time. The method drives you down different paths, asking relentless questions and adapting to your answers. It was fascinating because my idea actually grew stronger throughout the process. Step by step, the AI helped me bolt on new features to improve the core product.
    
*   **3\. Epics and Stories:** Once the PRD is locked, the Product Manager agent steps in to define the epics and user stories for the MVP. The agent continues to guide and ask questions, but you have full control to adapt its proposals.
    
*   **4\. The Tech Architect:** Here is where rubber meets the road. You move from functional/non-functional requirements to technical ones. The Architect agent proposes stacks and architecture directions based on SLA requirements. You then drive it toward your preferred solution: identifying components, frameworks, specific versions, and deployment strategies.
    
*   **5\. The UX:** Since my application had a frontend, I entered the design phase. The agent generated Markdown files describing page styles and even spit out sample HTML pages to visualize the result.
    

At this point, you ask the agent for a "readiness check." It reviews everything, fixes a few lingering issues, and boom: step one of your project is done.

## Breaking the "AI Aesthetic" with Stitch

There’s a frustrating reality in vibe coding: if you don’t give the AI highly specific prompts, it will default to the exact same theme style. All AI-generated apps start to look suspiciously similar.

To fix this, I spent some time using a different tool for the UX. Since I have a Google AI subscription, I jumped into **Stitch**. It was honestly quite impressive.

I took the Markdown files generated in the previous step (describing the project and pages) and asked the LLM to draw the different pages. Stitch acts almost like an AI-empowered Figma. You can manually tweak text, positions, and images, or just ask the AI to modify them for you.

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/01-54453557-eacf-4b3d-b663-35c39b56ae9f.png)

**A Quick Tooling Tip:** For this entire discovery and design process, I strictly used `gemini-cli` (also part of my subscription). Because it uses a different quota, it allowed me to save all my tokens in `antigravity` purely for the heavy lifting of the actual development phase.

Once the design is done, the next steps are standard: feed the product info and architecture into the developer agents, ask them to generate highly-detailed, "AI-implementable" tech stories, and let the agents code and test them.

## So... Are Developers Being Replaced?

Going through this process made me think deeply about the current state of the "Developer."

Right now, anyone with a solid idea and enough domain knowledge to challenge an AI can do almost all of the first part of this process... **except for the technical architecture.** When the AI proposes architecture, it asks technical questions to move forward. It asks for guidance on deployment, performance bottlenecks, data flows, and language choices. **This is where technical skills are still absolutely required.** Recent industry data heavily supports this shift. According to late-2025/early-2026 reports from firms like Gartner and DX:

*   **Code generation is mainstream, but it's not the whole job:** ~93% of developers now use AI coding assistants. Furthermore, around **27% of all production code** is now entirely AI-authored.
    
*   **The "10x Developer" myth is dead:** While AI speeds up raw coding tasks by about 26% (saving devs ~3.6 hours a week), the overall *organizational* delivery speed has only improved by about 8-10%. Why? Because the bottleneck simply shifted from *writing* code to *reviewing* and *architecting* systems.
    
*   **The 70% Problem:** AI gets you 70% of the way there incredibly fast. But bridging that final 30%—fixing edge cases, ensuring security, and tying complex microservices together—requires deep human expertise. In fact, unmonitored AI code has been shown to introduce 1.7x more defects.
    

![](/images/what-is-a-developer-when-we-use-coding-agents-my-1-day-bmad-experiment/02-bc651568-36a0-4b96-aa6d-daee142bd23a.png)

I don't necessarily want to call someone who doesn't type code a "Developer" anymore. Maybe we are all evolving into "Software Engineers" in the truest sense of the word. Or perhaps we need a completely new job title: **Agent Supervisor**? (Gartner actually predicts that by 2028, the developer's role will officially shift from *implementation* to *orchestration*—so we are already there!).

### The Junior and PM Dilemmas

This evolution brings up two massive questions for the industry:

1.  **What about Juniors?** How does someone who doesn't yet know architecture become an "expert" Agent Supervisor? Recent studies have shown a worrying trend: developers who use AI just to generate code for them (without understanding it) score significantly *lower* on comprehension tests. If they aren't grinding out the code, how do they learn? The answer is the same as it has always been: reading, breaking things, and mentorship. People must work together and share experiences. AI doesn't replace the senior-junior mentorship dynamic; it makes it more critical than ever.
    
2.  **What about Non-Technical Roles?** This is the harder pill to swallow. If a technical "Agent Supervisor" can use AI to do all the discovery, market research, and PRD analysis (like I did in a single day), where does that leave traditional Product Managers? Why shouldn't technical people just own the product readiness phase and then immediately move on to the coding agents?
    

The landscape is shifting rapidly. Typing the code itself is becoming the easy part. The real value is now in the vision, the architecture, and the ability to confidently supervise the machine that builds it.
