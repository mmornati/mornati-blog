---
title: 'From Tools to Agents: The Evolution of Nexus-Dev'
categories:
- ai-coding-agents
tags:
- ai
- coding
- agents
- mcp
- mcp-server
date: '2026-01-17T13:01:03.593000+00:00'
slug: from-tools-to-agents-the-evolution-of-nexus-dev
description: Discover how Nexus-Dev transforms from tools to AI agents, enhancing
  your IDE with customizable, collaborative coding assistants powered by MCP
---



If you've played with the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) recently, you've probably felt the power of giving your LLM explicit **tools**. Being able to say "Hey Claude, search my code" or "Hey helper, restart the server" is magical. It turns a chatbox into a command center.

But after using MCP on real projects for a while, I hit a wall. Tools are great, but they are *passive*. They wait for you to drive. I didn't just want a smarter CLI; I wanted a pair programmer. I wanted **Agents**.

Today, I'm excited to share a major update to [Nexus-Dev](https://github.com/mmornati/nexus-dev) that brings true, configurable AI Agents to your IDE, powered by the MCP protocol.

## Tools vs. Agents: What's the Difference?

Before we dive into the implementation, let's clarify the shift.

A **Tool** is a stateless function. `readFile(path)` is a tool. It does exactly one thing when asked. An **Agent** is a system with a **Goal**, a **Persona**, and **Memory**.

[Andrew Ng highlighted back in 2024](https://www.deeplearning.ai/the-batch/issue-242/) the power of "Agentic workflows": where an AI iteratively plans, executes, and critiques its own work. Two years later, this is no longer just a theory; it's how we build software. Gartner now predicts that [40% of enterprise applications will embed task-specific AI agents by 2026](https://www.gartner.com/en/newsroom/press-releases/2024-04-15-gartner-predicts-40-percent-of-enterprise-applications-will-have-embedded-conversational-ai-by-2026), and we're seeing this unfold in real time.

In Nexus-Dev, we're moving from:

> *User:* "Find the file `auth.py`. Now read it. Now find the `login` function. Now explain it."

To:

> *User:* "Ask the **Security Auditor** to review the authentication flow."

## Introducing Dynamic Agents

With the latest release, Nexus-Dev scans your project for an `agents/` directory. Inside, you can define your own specialized AI team members using simple YAML files.

Here is what `agents/code_reviewer.yaml` might look like:

```yaml
name: "code_reviewer"
display_name: "Code Reviewer"
description: "Delegate code review tasks to the Code Reviewer agent."

profile:
  role: "Senior Code Reviewer"
  goal: "Identify bugs, security issues, and suggest improvements"
  backstory: "Expert developer with 10+ years of experience in code quality."
  tone: "Professional and constructive"

memory:
  enabled: true
  rag_limit: 5
  search_types: ["code", "documentation", "lesson"]
```

When you start your IDE, Nexus-Dev automatically registers a new MCP tool called `ask_code_reviewer`. When you invoke it, the server instantiates that specific persona, loads its specific memory context, and executes the task.

### Getting Started with Templates

You don't need to write these from scratch. We've added a CLI command to generate them from best-practice templates:

```bash
# List available templates
nexus-agent templates
📋 Available Agent Templates:

  • API Designer (api_designer)
    Role: API Architect
    Model: claude-sonnet-4.5

  • Code Reviewer (code_reviewer)
    Role: Senior Code Reviewer
    Model: claude-sonnet-4.5

  • Debug Detective (debug_detective)
    Role: Debugging Specialist
    Model: claude-sonnet-4.5

  • Documentation Writer (doc_writer)
    Role: Technical Writer
    Model: claude-opus-4.5

  • Performance Optimizer (performance_optimizer)
    Role: Performance Engineer
    Model: gemini-3-pro

  • Refactor Architect (refactor_architect)
    Role: Refactoring Expert
    Model: gemini-3-deep-think

  • Security Auditor (security_auditor)
    Role: Security Analyst
    Model: claude-opus-4.5

  • Test Engineer (test_engineer)
    Role: QA Engineer
    Model: gpt-5.2-codex

# Create a new agent based on a template
nexus-agent init nexus_doc_writer --from-template doc_writer
✅ Created agent from template: doc_writer
✅ Created agent: /Users/mmornati/Projects/nexus-dev/agents/nexus_doc_writer.yaml

Next steps:
  1. Edit /Users/marco/nexus-dev/agents/nexus_doc_writer.yaml to customize your agent
  2. Restart the MCP server to activate this agent
  3. Use the 'ask_nexus_doc_writer' tool in your IDE
```

Available templates include: `code_reviewer`, `doc_writer`, `debug_detective`, `refactor_architect`, `test_engineer`, `security_auditor`, `api_designer`, and `performance_optimizer`.

## The Technical Challenge: The "Refresh" Workaround

Now, let's talk about the specific challenges of building this on top of MCP. It wasn't all smooth sailing.

### The "Which Project?" Problem

MCP servers are often global system processes (started by your IDE configuration). But your agents are *local* to your project. When you open VS Code or Cursor, the MCP server starts up, but it doesn't inherently know that you just opened `/Users/marco/projects/my-app`. It just runs.

This means we can't efficiently pre-load your project-specific agents at startup because we don't know where "here" is yet.

### The MCP Specification Today

If you've been following MCP, you know the protocol has matured significantly. The [June 2025 update](https://modelcontextprotocol.io/blog) introduced **structured tool outputs** (making tool responses more reliable) and **OAuth-based authorization**. The [November 2025 revision](https://modelcontextprotocol.io/blog) added the **Tasks primitive** for asynchronous, long-running operations and improved **server discovery** via `.well-known` URLs.

Crucially, the spec has long supported `notifications/tools/list_changed`: a mechanism for servers to tell clients "my tool list has changed, please re-fetch it."

### The Client Support Gap

The problem isn't the protocol; it's the **client implementations**.

Ideally, when you open a project, the client (IDE) would:

1. Tell the server "Hey, I'm in this folder."
    
2. The server would emit `notifications/tools/list_changed`.
    
3. The client would re-fetch the tool list.
    

In practice:

1. **Context Awareness**: Passing the current working directory reliably during the initialization handshake isn't always standardized across different clients.
    
2. **Notification Handling**: Not all clients react instantly to `notifications/tools/list_changed`. Some cache tool lists aggressively. Some don't implement the notification handler at all.
    
3. **Sampling Support**: For agents to work, the client must support the MCP Sampling capability (allowing the server to request LLM completions). Not all IDEs fully support this yet.
    

This is an evolving landscape. As MCP clients mature, these gaps will close.

### The Solution: `refresh_agents`

To bridge this gap *today*, we introduced a pragmatic workaround: the `refresh_agents` tool.

When you start a session, or if you add a new agent YAML file, you (or the model) simply invoke:

```plaintext
refresh_agents()
```

This forces the Nexus-Dev server to:

1. Query the IDE for the current active project path (discovered via `NEXUS_PROJECT_ROOT` environment variable or inferred from context).
    
2. Scan the `agents/` folder.
    
3. Dynamically register the `ask_<agent_name>` tools.
    
4. Emit `notifications/tools/list_changed` to tell the client to update its UI.
    

It's a small extra step, but it unlocks the ability to have per-project, fully customized AI teams without needing complex global configuration management.

> **Tip:** The ideal setup is to configure your IDE's MCP settings with `NEXUS_PROJECT_ROOT` pointing to your project. This eliminates the need for manual refresh in most cases. See the [Quick Start Guide](https://github.com/mmornati/nexus-dev/blob/main/docs/quick-start.md) for configuration examples.

![](/images/from-tools-to-agents-the-evolution-of-nexus-dev/00-17beca6e-5afd-4ee9-a285-a6ff95f9f57f.png)

## Why This Matters

This update transforms Nexus-Dev from a "RAG Search Engine" into a "Team Management System" for your AI. You can now curate the exact help you need.

* **Refactoring?** Spin up a `refactor_architect`.
    
* **Writing Docs?** Use the `doc_writer`.
    
* **Learning a new codebase?** Ask the `onboarding_buddy`.
    

The shift from tools to agents mirrors the broader trend in software development: we're moving from commanding machines to *collaborating* with them. Your AI isn't just a faster grep; it's a teammate with a defined role and responsibility.

## What's Next?

The MCP ecosystem is evolving fast. I'm keeping an eye on:

* **Better client-side tooling**: As IDEs like Cursor and VS Code mature their MCP implementations, the need for `refresh_agents` will diminish.
    
* **Multi-Agent Collaboration**: The ability to have agents talk *to each other*, a security\_auditor that flags issues, which a code\_reviewer then addresses, is an active area of research.
    
* **Server Discovery**: The MCP Registry (now in general availability preview) will make sharing and discovering useful agents much easier.
    

Go ahead and give it a try. The future of coding isn't just about faster typing; it's about better delegating.

---

*Check out the documentation on* [*GitHub*](https://github.com/mmornati/nexus-dev) *to get started.*
