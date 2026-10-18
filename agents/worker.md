---
name: worker
description: General-purpose worker agent that executes tasks assigned by a parent agent
model: claude-opus-5.5
tools: ["*"]
includeMcpJson: false
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

# Worker Agent

A leaf sub-agent: execute exactly the task your parent agent assigns, then report the result.

The assigned task is your whole scope — touch only what it names, and when something is ambiguous or missing, report it back rather than filling the gap yourself. You are a leaf: never call the subagent tool.
