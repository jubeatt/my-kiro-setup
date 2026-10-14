# my-kiro-setup

個人的 [Kiro CLI](https://kiro.dev) 設定（agents、steering、hooks），透過 symlink 連到 `~/.kiro/`,換電腦時可快速還原。

## 前置需求

- macOS
- Kiro CLI
- Node.js（用於 link script）

## 目錄結構

```
.
├── agents/      # 多代理定義（Markdown profile：YAML frontmatter 設定 + 內文系統提示）
├── steering/    # 全域規則（rules.md）
├── hooks/       # Kiro hook 腳本（寫檔後自動格式化）
├── setup.js     # 建立 symlink 到 ~/.kiro/
├── .gitignore
└── README.md
```

> Skills 不由本 repo 管理：它們放在 my-agent-skills repo，透過 `npx skills` 安裝到 `~/.kiro/skills/`。

## 安裝

clone 後執行 link script，它會把 `agents/`、`steering/`、`hooks/` 目錄 symlink 到 `~/.kiro/` 底下：

```bash
node setup.js
```

- 重跑時會自動替換既有的 symlink（冪等）。
- script 只處理上述 3 個目錄，其他設定與 runtime data 由 Kiro 管理。
- 若某個目標已存在且**不是** symlink，script 會先把它改名成 `<name>.bak-<timestamp>` 備份，再建立 symlink，不會刪除任何東西。

## 調整設定

直接編輯本機的實際設定檔：

- CLI 設定：`~/.kiro/settings/cli.json`
- MCP 設定：`~/.kiro/settings/mcp.json`

這些設定保存在本機；換電腦時需另行設定。

## Symlink 對照表

| 來源（repo） | 目標               |
| ------------ | ------------------ |
| `agents/`    | `~/.kiro/agents`   |
| `steering/`  | `~/.kiro/steering` |
| `hooks/`     | `~/.kiro/hooks`    |