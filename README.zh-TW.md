<div align="center">

# Agent Toolkit

**給 coding agent 與 Web agent 的可重複使用研究、寫作、軟體交付、資安工作流。**

[![CI](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/vincentxuu/agent-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

[快速開始](#快速開始) · [外掛總覽](#外掛總覽) · [安裝](#安裝) · [相容性](#相容性) · [CLI](#cli-參考) · [文件](#儲存庫結構)

[English](README.md) · [繁體中文](README.zh-TW.md)

</div>

Agent Toolkit 將每個工作流做成可攜式的 [Agent Skill](https://agentskills.io/)，並為 Agent Plugins、Codex 與 Claude Code 打包薄型相容層。工作流寫一次，哪裡需要就裝到哪裡。

> [!IMPORTANT]
> Agent Toolkit 仍在早期階段，可直接從 GitHub marketplace 安裝。選用的 npm CLI 尚未發布，plugin manifest 格式在版本之間仍可能變動。

**Plugin（外掛）** 指可發佈的套件包，**skill（技能）** 指 agent 遵循的可重複使用指令，**native manifest（原生清單）** 指圍繞同一份 canonical skill 的主機特定詮釋資料。

## 外掛總覽

| 外掛 | 技能 | 用途 |
|---|---|---|
| `deep-research` | `deep-research` | 規劃研究問題、蒐集並交叉查核來源、記錄證據品質，產出結構化研究筆記。可搭配本地或遠端 Groundlane MCP 及其他可用研究工具。 |
| `content-authoring` | `manage-post` | 以單一入口建立、更新或驗證 Markdown 文章。預設使用可攜式寫作規則；當目標是 Quidproquo 時自動加上該站的 schema、雙語、glossary 與驗證規則。 |
| `software-delivery` | `develop-with-spec` | 從對齊後的規格驅動單一或多儲存庫變更，依依賴順序實作、清理感知的驗證、審查與 CI 交接。涉及瀏覽器可見的工作必須以通過的 Playwright 場景與經驗證的影片證據收尾。 |
| `security-engineering` | `develop-securely` | 對軟體與 AI agent 變更執行威脅建模、以 OWASP 為基礎的安全程式碼檢查清單，以及分級嚴重度的安全審查，涵蓋 agent/LLM 特有的信任邊界、prompt injection 與委派授權風險。內建腳本會在環境有安裝時呼叫 gitleaks／SCA 工具／`gh`，讓發現建立在掃描結果上，而非只靠程式碼閱讀。會自動偵測「這個安全嗎」「我要上線了幫我看一下」這類非技術口吻的請求，改用白話文報告並附上可直接貼給 AI 工具的修復指令，不會端出技術性的嚴重度表格。 |

- `manage-post` 刻意設計為單一生命週期技能——不拆成 create、update、verify 三個技能。它從你的請求推斷操作類型，並尊重目標儲存庫自己的指令與驗證命令。
- `deep-research` 需要目前 agent 具備至少一個搜尋/抓取能力。Groundlane 為選用；詳見[安全性與限制](#安全性與限制)。
- `develop-with-spec` 會先採用目標儲存庫既有的 OpenSpec、Kiro、ADR、RFC 或任務工作流；若無原生 SDD，則建立輕量的檔案系統版 spec、design、plan 與驗證紀錄。
- `develop-securely` 涵蓋安全專屬的一層，與 `develop-with-spec` 的一般驗證步驟互補；不需要安裝該外掛也能單獨使用。

## 快速開始

先加入 marketplace 一次，再安裝想要的外掛：

```bash
codex plugin marketplace add vincentxuu/agent-toolkit
codex plugin add software-delivery@agent-toolkit
```

開啟新的 Codex session，然後使用內建技能：

```text
$develop-with-spec

Add this account setting from spec through implementation, then record the passing browser flow with Playwright.
```

marketplace 指令只需執行一次。其餘外掛各一行指令即可安裝：

```bash
codex plugin add deep-research@agent-toolkit
codex plugin add content-authoring@agent-toolkit
codex plugin add security-engineering@agent-toolkit
```

### 使用 `develop-securely`

不需要特殊語法，直接說你實際在做的事，skill 會自己判斷該跑哪個階段：

```text
幫我威脅建模這個新的付款功能，我們還沒開始寫。

審查這份 PR 的安全問題，重點看新的檔案上傳端點。

有人回報 A 使用者可以看到 B 使用者的訂單，幫我 triage。

這個安全嗎？我是 vibe coding 出來的 app，準備要給真的使用者用了。
```

前三個會得到技術版報告——嚴重度、攻擊情境、程式碼位置、修復建議。最後一個，或任何講得這麼口語的請求，會改成白話報告：一句話結論、按「上線前必修／建議快修／小提醒」分組的發現，每一項都附一句可以直接複製貼給你的 AI 工具的修復指令。想知道每種模式實際檢查什麼，看[外掛總覽](#外掛總覽)。

### 授權寫入權限前

Skills 以宿主 agent 的權限執行：

- `deep-research` 可能呼叫外部研究服務，在具檔案系統的環境中會在 `.research/` 下寫入筆記。
- `manage-post` 在驗證請求時保持唯讀，但當 prompt 明確授權時可建立或編輯內容。
- `develop-with-spec` 在獲得授權時可能編輯應用程式碼、執行儲存庫命令、啟動本地服務與瀏覽器，並寫入測試影片。
- `develop-securely` 可能編輯應用程式碼、在 `.agent-toolkit/security/` 下寫入威脅模型與審查紀錄，並在本機已安裝時呼叫 gitleaks、npm/pnpm/yarn audit、pip-audit、govulncheck、cargo-audit 或 `gh` CLI；未經審查請求以外的明確授權，不會修復安全關鍵發現。
- 沒有任何技能會把「編輯內容或程式碼」視為 commit、push、deploy 或 publish 的許可。
- MCP endpoint 與憑證由宿主 client 控制，絕不會被打包進本專案。

## 安裝

### 如果你是 vibe coding、自己不寫程式

你還是可以安裝 `security-engineering`，在上線前請它幫你檢查——不需要看得懂程式碼。前提是你是透過 **Claude Code** 或 **Codex CLI**（這兩個有終端機的 AI 寫程式工具）在開發。目前還沒辦法在 Lovable、bolt.new、v0、Replit 簡易模式這類純圖形介面的工具裡使用——那些平台要先自己支援 plugin/skill 匯入，這件事沒辦法從這個 repo 這邊補上，老實講清楚這個限制。

如果你用的是 Claude Code，打開你平常叫它幫你寫程式的那個終端機視窗，貼上這兩行、執行一次：

```bash
claude plugin marketplace add vincentxuu/agent-toolkit
claude plugin install security-engineering@agent-toolkit
```

（用 Codex CLI 的話，改用 `codex plugin marketplace add vincentxuu/agent-toolkit`，再 `codex plugin add security-engineering@agent-toolkit`。）

就這樣，不會動到你電腦上其他任何東西。之後在同一個你一直在開發 app 的對話裡，直接用你自己的話問：

> 「這個安全嗎，我要上線了」／「Is this safe to launch?」／「幫我看一下這個，我要給真的使用者用了。」

它會用白話文回覆——不會有安全術語——按「上線前必修」／「不急，建議修」／「小提醒，有空再看」分組，每一項都附上一句可以直接複製貼給你的 AI 工具的修復指令。想知道它實際會檢查什麼，看[外掛總覽](#外掛總覽)；想知道它不能保證什麼，看[安全性與限制](#安全性與限制)。

### Codex

先註冊這個 GitHub 儲存庫一次：

```bash
codex plugin marketplace add vincentxuu/agent-toolkit
```

安裝任一外掛：

```bash
codex plugin add software-delivery@agent-toolkit
codex plugin add deep-research@agent-toolkit
codex plugin add content-authoring@agent-toolkit
codex plugin add security-engineering@agent-toolkit
```

### Claude Code

註冊同一個儲存庫一次，然後安裝外掛：

```bash
claude plugin marketplace add vincentxuu/agent-toolkit
claude plugin install software-delivery@agent-toolkit
```

當專案需要向協作者宣告 Claude plugin 時，在安裝指令加上 `--scope project`。

### 純 Agent Skills 客戶端

不支援原生 marketplace 的客戶端，可將 canonical skill 複製到目前專案的 `.agents/skills` 目錄。此 fallback 需要 Node.js 20 以上：

```bash
npx --yes github:vincentxuu/agent-toolkit add develop-with-spec
```

`--claude`、`--all`、`--global` 僅用於直接複製技能的工作流。原生 Codex 與 Claude 安裝請優先使用上方的 marketplace 指令。

### 貢獻者 checkout

想修改 skills 或建置 plugin artifacts 時再 clone 儲存庫：

```bash
git clone https://github.com/vincentxuu/agent-toolkit.git
cd agent-toolkit
npm test
node bin/agent-toolkit.mjs list
```

`--link` 僅供本地開發使用。一般安裝會複製技能，確保此 checkout 搬走後安裝不會壞掉。

## 為什麼選擇 Agent Toolkit？

- **寫一次，到處裝：** 一份 canonical skill 透過薄型 native manifests 同時支援 Codex、Claude Code 與純 Agent Skills 客戶端。
- **單一事實來源：** 技能內容只存在於 `plugins/<plugin>/skills/`；adapter 絕不 fork 或複製。
- **設計上不含憑證：** MCP endpoint、token 與 provider key 由宿主 client 控制，永遠不進入 plugin 或 skill。
- **經過測試的打包格式：** 每個發佈目標都由測試套件與 CI 驗證，涵蓋 Linux、macOS 與 Windows。

## 相容性

共享技能是可攜性的基礎層。Plugin manifest 與探索路徑則因主機而異。

| 目標 | 支援 | 發佈方式 |
|---|---:|---|
| Agent Plugins v1 客戶端 | ✅ | `plugins/<plugin>/` 或 `dist/standard/<plugin>/` |
| Codex | ✅ | Git marketplace + 共置的 `.codex-plugin` manifest |
| Claude Code | ✅ | Git marketplace + 共置的 `.claude-plugin` manifest |
| 其他 Agent Skills 客戶端 | ◐ | Canonical skill，前提是客戶端支援相容的探索/匯入路徑 |
| 可上傳技能的 Web agent | ◐ | 自包含的 `dist/web/.../skills/<skill>/` artifact |
| 不支援 skill/plugin 匯入的 Web agent | — | 使用該平台原生的指令與工具 |
| Gemini CLI adapter | — | 刻意不維護 |

`✅` 表示本儲存庫提供經過測試的安裝或打包路徑。`◐` 取決於宿主暴露的能力。Web agent 無法存取本地 checkout 或 `localhost`，除非平台明確提供該連線。

## CLI 參考

```text
agent-toolkit add <skill>              Install into .agents/skills in the current project
agent-toolkit add <skill> --claude     Install into .claude/skills
agent-toolkit add <skill> --all        Install into both discovery directories
agent-toolkit add <skill> --global     Install for the current user
agent-toolkit add <skill> --link       Link instead of copy for local development
agent-toolkit list                     List available plugins and skills
agent-toolkit doctor                   Run the full validation suite
agent-toolkit pack <plugin>            Build every supported package variant
```

執行 `npx --yes github:vincentxuu/agent-toolkit help` 查看最新的內建說明。進階使用者可使用 `--project <directory>` 或 `--agent shared|claude|all`。

### 更新與移除

原生 plugin 安裝使用各宿主的生命週期指令：

```bash
# Codex
codex plugin marketplace upgrade agent-toolkit
codex plugin add software-delivery@agent-toolkit
codex plugin remove software-delivery@agent-toolkit

# Claude Code
claude plugin marketplace update agent-toolkit
claude plugin update software-delivery@agent-toolkit
claude plugin uninstall software-delivery@agent-toolkit
```

複製式安裝是快照。檔案相同時重跑 `add` 是 no-op；內容不同時會拒絕覆蓋。fallback CLI 目前尚未提供 `update` 或 `remove`。

### 疑難排解

| 問題 | 檢查方向 |
|---|---|
| 找不到 plugin | 確認 host 的 marketplace 清單中有 `agent-toolkit`，重新整理後使用 `plugin@agent-toolkit`。 |
| Agent 找不到 skill | 確認 skill 存在於 client 的探索目錄中，然後開新的 agent session。 |
| `Destination differs; refusing to overwrite` | 已安裝的副本與 toolkit 不同。先檢視再手動取代或移除。 |
| Research 無法存取網路 | 確認目前 agent 有搜尋/抓取工具，或已設定 Groundlane MCP 連線。 |
| Web agent 無法匯入 artifact | 宿主必須支援 skill 或 plugin 上傳；本地安裝無法讓檔案對 hosted agent 可見。 |
| 不確定檔案裝到哪 | 專案安裝使用目前工作目錄；使用者安裝使用家目錄。不加 `--global` 即為儲存庫層級行為。 |

## 建置 plugin 套件

原生 marketplace 使用者不需要建置 artifacts。維護者與其他發佈者在 contributor checkout 中產生主機特定的封裝：

```bash
node bin/agent-toolkit.mjs pack deep-research
node bin/agent-toolkit.mjs pack content-authoring
node bin/agent-toolkit.mjs pack software-delivery
node bin/agent-toolkit.mjs pack security-engineering
```

Artifacts 輸出至 `dist/<host>/<plugin>/`：

- `standard` — Agent Plugins v1 套件
- `codex` — Codex 原生 manifest 與 canonical skills
- `claude` — Claude Code 原生 manifest 與 canonical skills
- `web` — 無 CLI 專屬 manifest 的自包含 skills

產生的套件包含 MIT 授權與 checksums。憑證絕不會被打包。

## 儲存庫結構

```text
plugins/
  deep-research/
    plugin.json                 # portable Agent Plugins manifest
    .codex-plugin/plugin.json   # Codex-native metadata
    .claude-plugin/plugin.json  # Claude Code-native metadata
    skills/deep-research/       # canonical skill and references
  content-authoring/
    plugin.json
    skills/manage-post/         # canonical article lifecycle skill
  software-delivery/
    plugin.json
    skills/develop-with-spec/   # spec, implementation, and video evidence
  security-engineering/
    plugin.json
    skills/develop-securely/    # threat modeling, secure coding, and review
.agents/plugins/marketplace.json       # Codex Git marketplace
.claude-plugin/marketplace.json        # Claude Code Git marketplace
bin/agent-toolkit.mjs           # user-facing CLI
scripts/                        # validation, packaging, and tests
```

Canonical skill 內容只存在於 `plugins/<plugin>/skills/`。Adapters 不得 fork 或複製 `SKILL.md`。

## 安全性與限制

- Skills 以宿主 agent 的完整權限執行——安裝前請先閱讀[授權寫入權限前](#授權寫入權限前)。
- 憑證請存放於各宿主的 secret-backed MCP 設定。切勿將 token commit 到 plugin manifest 或 skill。
- `deep-research` 在目前 agent 有提供時，可使用本地或遠端的 [Groundlane](https://github.com/vincentxuu/groundlane) MCP 連線。桌面 agent 可連到已設定好的伺服器；Web-hosted agent 需要透過平台註冊公開可達的 HTTPS endpoint。Groundlane 無法使用時，skill 會改用實際存在的研究工具並回報 fallback。
- 本儲存庫目前不是通用套件管理器、hosted MCP 服務、憑證儲存庫，也不承諾每個 agent host 實作相同的 plugin 功能。它提供 canonical 工作流與經過測試的封裝格式；探索、權限、工具與認證仍由各宿主控制。

## 開發

需要 Node.js 20 以上，沒有任何 runtime dependencies。

```bash
npm test
```

測試套件會驗證 plugin 與 skill metadata、檢查版本一致性、打包所有支援的目標、驗證 artifact 內容與 checksums，並演練 copy/link 安裝路徑。CI 在 Linux、macOS 與 Windows 上以 Node.js 20、22、24 執行。

新增 plugin 或調整 release metadata 前，請先閱讀 [CONTRIBUTING.md](CONTRIBUTING.md) 與 [RELEASING.md](RELEASING.md)。所有 plugins 目前使用鎖步版本管理：

```bash
npm run set-version -- <semver>
```

## 社群與安全

- Bug 與功能需求：[GitHub Issues](https://github.com/vincentxuu/agent-toolkit/issues)
- 貢獻指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全政策：[SECURITY.md](SECURITY.md)
- 行為準則：[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- 變更紀錄：[CHANGELOG.md](CHANGELOG.md)

## 授權條款

[MIT](LICENSE)
