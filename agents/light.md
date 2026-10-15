---
name: light
description: General-purpose agent for answering questions, looking things up, and making small changes
model: claude-opus-5.5
tools: ["*"]
includeMcpJson: true
resources:
  - file:///Users/peanu/.kiro/steering/*.md
  - skill://~/.kiro/skills/*/SKILL.md
  - file://.kiro/steering/*.md
  - skill://.kiro/skills/*/SKILL.md
  - file://README.md
  - file://package.json
hooks:
  - name: format-after-write
    trigger: PostToolUse
    matcher: write
    action:
      type: command
      command: ~/.kiro/hooks/post-write-format.sh
    timeout: 10
permissions:
  rules:
    - capability: all # every capability except sandbox_network
      effect: allow
    # Reads and writes outside the workspace need confirmation
    - capability: filesystem # fs_read + fs_write
      exclude: ["./**"]
      effect: ask
    # Destructive / irreversible operations
    - capability: shell
      match:
        - "sudo *"
        - "git push *--force*"
        - "git push -f*"
        - "git reset --hard*"
        - "git clean *"
      effect: ask
    # Package changes (mirrors steering "ask first" rule)
    - capability: shell
      match:
        - "pnpm add *"
        - "pnpm remove *"
        - "pnpm update *"
        - "npm install *"
        - "npm uninstall *"
        - "brew install *"
        - "brew uninstall *"
      effect: ask
    # Never touch credentials outside the workspace
    - capability: fs_write
      match: ["~/.ssh/**", "~/.aws/**", "~/.gnupg/**"]
      effect: deny
---

# Light Agent

General-purpose assistant: answer questions, explore codebases, and make small focused changes.

When delegating via the `subagent` tool, default to `worker` unless the user names a specific agent.
