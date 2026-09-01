# my-kiro-setup

個人的 [Kiro CLI](https://kiro.dev) 設定（agents、steering、hooks），透過 symlink 連到 `~/.kiro/`,換電腦時可快速還原。

## 前置需求

- macOS
- Kiro CLI
- Node.js（用於 link script）

## 目錄結構

```
.
├── agents/      # 多代理定義（.json 設定 + .md 系統提示）
├── steering/    # 全域規則（rules.md）
├── hooks/       # Kiro hooks（驗證、通知、格式化）
├── settings/    # settings/cli.json（以單一檔案 symlink）
├── setup.js     # 建立 symlink 到 ~/.kiro/
├── .gitignore
└── README.md
```

> Skills 不由本 repo 管理：它們放在 my-agent-skills repo，透過 `npx skills` 安裝到 `~/.kiro/skills/`。

## 安裝

clone 後執行 link script,它會把 `agents/`、`steering/`、`hooks/` 目錄，以及 `settings/cli.json` 檔案 symlink 到 `~/.kiro/` 底下：

```bash
node setup.js
```

- 重跑時會自動替換既有的 symlink（冪等）。
- 目錄只會動到上述 3 個;`~/.kiro/` 裡 Kiro 自己的 runtime data（`settings/`、`sessions/`、`extensions/` 等）不會被整個碰到。`settings/cli.json` 是以「單一檔案」symlink 的方式處理,不影響 `settings/` 內其他 runtime data。
- 若某個目標已存在且**不是** symlink（例如真實目錄或檔案），script 會拒絕覆蓋並警告,需手動移開後再跑。


## Symlink 對照表

| 來源（repo）        | 目標                       |
| ------------------- | -------------------------- |
| `agents/`           | `~/.kiro/agents`           |
| `steering/`         | `~/.kiro/steering`         |
| `hooks/`            | `~/.kiro/hooks`            |
| `settings/cli.json` | `~/.kiro/settings/cli.json` |
