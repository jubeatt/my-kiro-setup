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
├── setup.js     # 建立 symlink 到 ~/.kiro/
└── README.md
```

## 安裝

clone 後執行 link script,它會把 `agents/`、`steering/`、`hooks/` 分別 symlink 到 `~/.kiro/` 底下：

```bash
node setup.js
```

- 重跑時會自動替換既有的 symlink（冪等）。
- 只會動到上述 3 個目錄;`~/.kiro/` 裡 Kiro 自己的 runtime data（`settings/`、`sessions/`、`extensions/` 等）不會被碰到。
- 若某個目標已存在且**不是** symlink（例如真實目錄），script 會拒絕覆蓋並警告,需手動移開後再跑。


## Symlink 對照表

| 來源（repo） | 目標               |
| ------------ | ------------------ |
| `agents/`    | `~/.kiro/agents`   |
| `steering/`  | `~/.kiro/steering` |
| `hooks/`     | `~/.kiro/hooks`    |

---

# Kiro CLI 多代理工作流使用指南

## 1. 系統概覽

這是一套基於 Kiro CLI 的多代理系統。`code_supervisor` 是主要的協調者，負責拆解任務、分派子代理、管控品質迴圈。另有 `light` 代理用於快速問答與小型變更。

## 2. Agent 一覽

| Agent           | 角色                       | Model           |
| --------------- | -------------------------- | --------------- |
| code_supervisor | 任務協調與品質管控         | claude-opus-4.8 |
| light           | 通用助手，快速任務         | claude-opus-4.8 |
| planner         | 結構化執行計畫產生器       | claude-opus-4.8 |
| developer       | 程式碼實作（需 plan 驗證） | claude-opus-4.8 |
| worker          | 通用執行者（無 plan 驗證） | claude-opus-4.8 |
| reviewer        | 程式碼審查 + YAGNI 執行者  | claude-opus-4.8 |
| designer        | Figma 設計擷取 + UI/UX     | claude-opus-4.8 |
| simplifier      | 程式碼精煉                 | claude-opus-4.8 |
| tester          | 測試撰寫 + 瀏覽器驗證      | claude-opus-4.8 |
| debugger        | 深度調查持續性 bug         | claude-opus-4.8 |
| explorer        | 程式碼庫探索與研究         | claude-opus-4.8 |
| researcher      | 學術論文研究               | claude-opus-4.8 |
| council-master  | 綜合議員回應               | claude-opus-4.8 |
| councillor-a    | 議會顧問                   | claude-opus-4.8 |
| councillor-b    | 議會顧問                   | glm-5           |
| councillor-c    | 議會顧問                   | claude-opus-4.5 |

### Developer vs Worker

|           | developer                      | worker                        |
| --------- | ------------------------------ | ----------------------------- |
| 用途      | 走完整 plan 流程的程式碼實作   | 不走 plan 流程的通用執行任務  |
| Plan hook | ✅ `validate-developer-plan.js` | ❌ 無                          |
| 適用場景  | 功能開發、重構、bug 修復       | deps 升級驗證、腳本執行、雜務 |
| 派遣者    | code_supervisor                | code_supervisor, light        |

## 3. 工作流程

`code_supervisor` 遵循 8 階段工作流：

| 階段 | 名稱                             | 說明                                                   |
| ---- | -------------------------------- | ------------------------------------------------------ |
| 1    | Understand                       | 理解需求，確認範圍                                     |
| 2    | Path Selection                   | 判斷任務複雜度，選擇直接執行或完整流程                 |
| 3    | Delegation Check                 | 決定是否需要委派子代理                                 |
| 4    | Split and Parallelize            | 拆分獨立子任務，平行執行                               |
| 5    | Task Initialization              | explore → plan → grill loop → confirm                  |
| 6    | Code Iteration                   | developer → simplifier → reviewer → 迴圈至通過         |
| 7    | User Feedback & Issue Resolution | debugger → planner → developer → simplifier → reviewer |
| 8    | Verify                           | 最終驗證與交付                                         |

### `.plan/` 資料夾結構

每個任務會在 `.plan/<task-name>/` 下產生：

```
.plan/<task-name>/
├── exploration-brief.md    # 程式碼庫探索摘要（explorer）
├── task.md                 # 執行計畫（planner）
├── questions.md            # 釐清問題（planner）
├── answers.md              # 使用者回答（supervisor）
├── design-spec.md          # UI 設計規格（designer）
├── assets/                 # 設計素材（designer）
├── .planner-ready.json     # 計畫就緒標記（planner）
├── dev-notes.md            # 實作筆記（developer）
├── simplifier-notes.md     # 精煉摘要（simplifier）
├── test-notes.md           # 測試筆記（tester）
├── review.md               # 審查結果（reviewer）
└── feedback-investigation.md # 問題調查報告（debugger）
```

## 4. 瀏覽器自動化

使用 `playwright-cli` 作為瀏覽器自動化工具（取代 agent-browser）。

| 角色     | 用途                                        |
| -------- | ------------------------------------------- |
| tester   | 瀏覽器流程驗證（browser-flow verification） |
| debugger | 瀏覽器 bug 重現                             |
| reviewer | 判斷瀏覽器證據是否充分（不直接執行）        |

Specialist 參考 `playwright-cli` skill 取得命令語法。

## 5. Council 機制

Council 是一個多模型決策機制，適用於高風險、需要多元觀點的決策場景。

**運作方式：**

1. 3 位 councillor（分別使用不同模型）平行回答同一問題
2. `council-master` 綜合三方回應，產出最終建議

**適用時機：**

- 架構決策
- 技術選型
- 有爭議的設計取捨

## 6. 依賴項目

### MCP Servers

| MCP Server           | 使用的 Agent                        | 用途                 |
| -------------------- | ----------------------------------- | -------------------- |
| @context7 (Context7) | explorer, worker, light             | 函式庫文件查詢       |
| @exa (Exa)           | explorer, researcher, worker, light | 程式碼範例、學術論文 |
| @figma-developer-mcp | designer, light                     | Figma 設計擷取       |
| @chrome-devtools     | explorer, developer                 | 瀏覽器除錯           |
| @atlassian           | light                               | Jira/Confluence      |
| @git                 | worker, light                       | Git 操作             |

### Hooks

| Hook                              | 觸發時機                                                                     | 說明                                           |
| --------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------- |
| phase-reminder.sh                 | `userPromptSubmit` on `code_supervisor`                                      | 提醒 supervisor 當前工作流階段                 |
| cmux-notify.sh                    | `stop` on `code_supervisor`, `light`                                         | 回應完成時透過 cmux 發送桌面通知               |
| post-write-format.sh              | `postToolUse` on `light` (matcher: `fs_write`)                               | 寫入檔案後自動格式化                           |
| validate-developer-plan.js        | `preToolUse` on `developer`, `simplifier`, `tester`                          | 驗證 `.plan/.active-developer-plan` 存在且有效 |
| validate-artifact-plan-write.js   | `preToolUse` on `reviewer`, `debugger`, `explorer`, `designer` | 限制寫入路徑僅限 `.plan/`                      |
| validate-supervisor-plan-write.js | `preToolUse` on `code_supervisor` (matcher: `write`)                         | 限制 supervisor 寫入範圍                       |
| validate-read-allowed-paths.js    | `preToolUse` on `code_supervisor` (matcher: `read`)                          | 限制 supervisor 讀取範圍                       |
| validate-local-rm.js              | `preToolUse` on `developer`, `worker` (matcher: `shell`)                     | 防止誤刪操作                                   |

### Steering

- `steering/rules.md`：全域規則，套用於所有 agent — zh-TW 回應、Biome 格式化、pnpm、named exports、程式碼風格慣例

## 7. Light Agent 委派規則

`light` 需要委派任務時，**預設一律指派 `worker`**，除非使用者明確指定要使用特定 specialist。

## 8. 常用指令

| 情境              | 做法                                     |
| ----------------- | ---------------------------------------- |
| 啟動完整工作流    | 以 `code_supervisor` agent 開啟 Kiro CLI |
| 快速問答 / 小改動 | 以 `light` agent 開啟 Kiro CLI           |
| 任務計畫資料夾    | `.plan/<task-name>/` 會自動建立          |

## 9. 注意事項

- **測試是 opt-in**：`tester` 僅在明確要求或計畫要求時才執行
- **Debugger 門檻**：修復失敗 2 次以上才會派遣 `debugger`
- **Council 成本高**：4 個 agent 同時運行，僅用於高風險決策
- **所有 agent 以 zh-TW 回應**（由 `steering/rules.md` 強制）
- **程式碼註解與 commit message 一律使用英文**
- **Biome** 是唯一的 formatter — 不使用 ESLint 或 Prettier
- **pnpm** 是唯一的套件管理器 — 不使用 npm 或 yarn
- **瀏覽器自動化使用 `playwright-cli`** — 不使用 agent-browser
- **Worker 無 plan hook 保護** — 適合不走 plan 流程的任務，但寫入範圍依賴 parent 指令品質
