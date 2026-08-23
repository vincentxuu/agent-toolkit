# Plain-Language Reporting Mode

For people who prompted an AI tool to build something (vibe coding) and don't read the code themselves. The checks in `threat-modeling.md`, `secure-coding-checklist.md`, `agentic-ai-security.md`, and `review-and-triage.md` are unchanged — this file governs only how findings get explained back to someone who doesn't know what CVSS, STRIDE, or an IDOR is.

## When to use this mode

Use plain-language mode when the request:

- doesn't reference a specific diff, PR, branch, or spec document;
- uses casual phrasing — "這個安全嗎", "我要上線了幫我看一下", "會不會被駭", "使用者資料安全嗎", "is this safe to launch," "can hackers get into this," "check my app before I publish it";
- comes from someone who says they don't code, are "vibe coding," or are using an AI tool to build something they can't read themselves;
- gives no signal either way — default here, not to technical mode. The cost of over-simplifying for an engineer (they ask a follow-up) is much lower than the cost of a jargon-heavy report a non-engineer can't act on.

Switch to technical mode mid-conversation if the person turns out to be a developer after all (they start asking about specific files, line numbers, or frameworks) — offer the technical report rather than assuming.

## What changes vs. technical mode

| Technical mode | Plain-language mode |
|---|---|
| STRIDE category, OWASP checklist item, CWE | What the problem actually is, in one sentence, no acronyms |
| Exploit scenario (attacker starting point → steps → impact) | "What could actually happen to your users" — concrete, not abstract |
| Severity: Critical/High/Medium/Low/Informational | 🔴 fix before you launch / 🟡 fix soon, not urgent / 🟢 minor, whenever |
| Remediation: a specific code-level fix | A copy-pasteable instruction to hand to their AI tool |
| "unverified — code review only" | Same honesty, plain words: "I couldn't fully confirm this one" |
| Tool-missing note (`gitleaks was not found on PATH`) | A calm note that doesn't sound like something broke, with an optional upgrade path they can also hand to their AI |

The underlying finding — file, evidence, whether it was verified by a script or a negative test — still gets recorded; it's just not what's shown first.

## Translation table for common findings

Use these as a starting point, not a copy-paste script — tailor the "what could happen" line to what the app actually does.

| Finding | Plain explanation | What could happen | Instruction to hand to their AI |
|---|---|---|---|
| Secret/API key committed in code | 你的程式碼裡藏著一把「鑰匙」（API 金鑰或密碼），任何看得到程式碼的人都能直接拿去用 | 有人可能拿這把鑰匙盜刷你連接的付費服務、存取你的資料庫，或假冒你的帳號發送訊息 | 「請把這個 API 金鑰從程式碼裡移除，改成用環境變數存放；因為它可能已經外流，也請提醒我要到原本申請的平台上重新產生一把新的。」 |
| Missing object-level access control (IDOR) | 有些頁面或功能理論上只有本人能看，但目前只要登入、換個網址參數，就能看到別人的資料 | 其他使用者的個資、訂單、私訊可能被任何登入的人看到 | 「請幫我檢查所有讀取使用者資料的功能，確認只有資料的擁有者本人能存取，其他人存取要被拒絕。」 |
| SQL/command injection via unsanitized input | 使用者輸入的文字，被直接當成資料庫或系統指令執行，等於讓陌生人能對你的系統下指令 | 資料可能被竄改、刪除，或整批外洩 | 「請把所有跟資料庫互動的地方都改成參數化查詢，不要把使用者輸入直接拼進指令字串。」 |
| Missing authentication on an endpoint | 有個功能本來應該要登入才能用，但目前沒登入也能用 | 任何人都能做這個功能能做的事，例如發文、刪除資料、觸發付款 | 「請確認這個功能有做登入驗證，沒登入的使用者應該被擋下來。」 |
| Known-vulnerable dependency | 你用到的某個外部套件，已知版本裡有安全漏洞 | 等於你的產品繼承了那個套件的弱點，攻擊者可以用已公開的方法攻破 | 「請幫我把這些套件更新到沒有已知漏洞的版本，更新後幫我確認功能還正常。」 |
| Prompt-injection surface in an AI feature | 如果你的 app 會讓 AI 讀取「別人給的內容」（網頁、上傳的檔案、其他使用者的訊息），有心人可以在那些內容裡藏一段指令，騙你的 AI 去做壞事 | AI 可能被騙去外洩資料、亂發訊息，或做超出預期的動作 | 「請確認 AI 讀到的外部內容不能直接觸發傳送資料或呼叫外部服務的動作，中間要有一個我能看到並確認的步驟。」 |
| User credential passed directly to the AI/model | 使用者的登入憑證，可能被直接原封不動交給了 AI 或另一個服務 | 如果那段對話或紀錄外洩，攻擊者等於直接拿到使用者的帳號權限 | 「請確認使用者的登入資訊不會被直接放進給 AI 的提示詞，也不會被轉傳給其他服務。」 |

## Tool-availability notes — how to phrase them

The scripts under `scripts/` report explicitly when a backing tool (gitleaks, an SCA tool, `gh`) isn't installed. Never relay that as a raw error. Examples:

- `gitleaks` not found → "我用了比較基礎的方式幫你檢查有沒有洩漏的金鑰，涵蓋率沒有到最完整。如果想要更完整，可以請你的 AI『幫我安裝一個叫 gitleaks 的掃描工具』；不裝也沒關係，不影響你現在看到的其他結果。"
- `gh` not found or not logged in → "我沒辦法幫你看 GitHub 上原本就有的安全警示（因為沒有連線權限）。如果你想看，可以請 AI『幫我安裝並登入 GitHub CLI（gh）』。"
- No known dependency manifest detected → don't mention it; there's nothing actionable to say.

## Report structure

Use `assets/plain-language-report.md`. Lead with a one-line verdict, not a findings table — someone deciding whether to launch needs the answer before the detail. Group findings by urgency (🔴/🟡/🟢), not by technical category. Close every report with:

1. what was actually checked, in plain words (so "no issues found" doesn't read as "guaranteed safe");
2. an explicit statement that no check proves 100% safety — this covers common issue types, not every possible one;
3. an offer to also produce the full technical report, so they can hand it to a developer or another AI tool without starting over.
