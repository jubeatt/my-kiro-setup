---
inclusion: always
---

# 語言

- 以繁體中文（zh-TW）回應。
- 程式碼註解與 commit message 用英文。

# 工作方式

- **repo 既有的慣例與設定優先於本文件的預設**，衝突時跟著 repo 走。
- 使用者在提問或徵詢意見時，先說明作法，等到明確指示才動手改檔案。
- 專案有 test / lint 指令時，收工前跑過。
- 改完檔案後格式化：優先用專案設定的 formatter，沒有設定就用 `biome format --write <file>`（Biome 已全域安裝，直接呼叫，不要透過 npx / pnpx 之類的 runner）。
- 指令用非互動形式，例如 `git --no-pager diff`。

# 預設技術選擇

repo 沒有既有設定時採用：

| 面向               | 預設         |
| ------------------ | ------------ |
| formatter / linter | Biome        |
| 套件管理           | pnpm         |
| 模組匯出           | named export |
| TypeScript 型別    | `type`       |

# 需要先問過

- 安裝、移除或升級套件
- 刪除檔案
- 變更資料庫 schema

# 硬護欄

- 不提交 secrets、`.env`，或任何含個人資訊（憑證、token 等）的檔案。
