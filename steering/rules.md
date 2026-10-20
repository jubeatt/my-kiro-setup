---
inclusion: always
---

# 語言

- 以繁體中文（zh-TW）回應。
- 程式碼註解與 commit message 用英文。

# 工作方式

- 專案有 lint / test 指令時，收工前跑到綠燈才算完成。
- 指令用非互動形式，例如 `git --no-pager diff`。
- 需要開瀏覽器測試時，優先用 ego-browser，ego-browser 不能用時才改用 playwright-cli。

# 預設技術選擇

repo 已有設定就跟 repo 走；沒有時採用：

## 通用

- 套件管理用 pnpm。
- 模組匯出用 named export。

## TypeScript

- 型別宣告用 `type` alias。
- 型別靠推論與收窄得出，避開 `as` / `!` 斷言：外部資料用 zod parse，內部資料把型別寫完整，字面值物件用 `satisfies`。
- 繞不開斷言時，附一行英文註解說明原因。

# 需要先問過

- 安裝、移除或升級套件
- 刪除檔案
- 變更資料庫 schema

# 硬護欄

- commit 前檢查 staged 檔：secrets、`.env`、憑證、token 一律留在 commit 外，並告知使用者。
