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
├── settings/    # cli.json、mcp.json（以單一檔案 symlink）
├── setup.js     # 建立 symlink 到 ~/.kiro/
├── .gitignore
└── README.md
```

> Skills 不由本 repo 管理：它們放在 my-agent-skills repo，透過 `npx skills` 安裝到 `~/.kiro/skills/`。

## 安裝

clone 後執行 link script,它會把 `agents/`、`steering/`、`hooks/` 目錄，以及 `settings/cli.json`、`settings/mcp.json` 檔案 symlink 到 `~/.kiro/` 底下：

```bash
node setup.js
```

- 重跑時會自動替換既有的 symlink（冪等）。
- 目錄只會動到上述 3 個;`~/.kiro/` 裡 Kiro 自己的 runtime data（`settings/`、`sessions/`、`extensions/` 等）不會被整個碰到。`settings/` 底下的檔案是以「單一檔案」symlink 的方式處理,不影響 `settings/` 內其他 runtime data。
- 若某個目標已存在且**不是** symlink（例如 Kiro 改寫設定時把 symlink 換成了實體檔案），script 會先把它改名成 `<name>.bak-<timestamp>` 備份，再建立 symlink，不會刪除任何東西。


## Symlink 對照表

| 來源（repo）        | 目標                       |
| ------------------- | -------------------------- |
| `agents/`           | `~/.kiro/agents`           |
| `steering/`         | `~/.kiro/steering`         |
| `hooks/`            | `~/.kiro/hooks`            |
| `settings/cli.json` | `~/.kiro/settings/cli.json` |
| `settings/mcp.json` | `~/.kiro/settings/mcp.json` |

hello
hello
