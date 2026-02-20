# E2E Fail-fast 诊断 + 证据链（零信任门禁）

## 证据位置

| 类型 | 路径 | 说明 |
|------|------|------|
| 诊断 Markdown | `e2e/evidence/e2e-diagnostic-<ts>-<test>.md` | 超时找不到 "Connect wallet" 时写入：Connect/InstallMetaMask 可见性、`typeof window.ethereum`、body 前 800 字符 |
| 截图 | `e2e/evidence/playwright-test-results/`（CI）或 `e2e/test-results/`（本地） | 失败时 Playwright 自动保存 |
| Trace | `e2e/evidence/playwright-test-results/`（CI 首次重试） | `npx playwright show-trace <path>/trace.zip` 可回放 |

控制台：页面内 `E2E[...] typeof window.ethereum=...` 会转发到 Node，输出为 `[E2E page console] ...`。

---

## 控制台输出时序（证据链）

- `E2E[addInitScript]: (before) typeof window.ethereum= ...`
- `E2E[addInitScript]: (after) typeof window.ethereum= ...`
- `E2E[route.fulfill]: typeof window.ethereum= ...`（若根文档被 route 注入）
- `E2E[DOMContentLoaded]: typeof window.ethereum= ...`
- `E2E[load]: typeof window.ethereum= ...`

---

## 注入策略（最小化修复注入时序）

1. **Route 优先读盘**：根文档请求时，优先从 `E2E_DIST_INDEX` 或 `frontend/dist/index.html` 读盘，在 `<head>` 内首行注入 `window.ethereum` 后 `route.fulfill`；读盘失败再 `route.fetch()`。
2. **addInitScript**：同一 provider 在页面脚本前执行，前后各打一次 `typeof window.ethereum=`。
3. **evaluate + reload 兜底**：若首帧仍显示 "Install MetaMask"，spec 中调用 `injectProviderViaEvaluateAndReload(page)` 再断言 "Connect wallet"；reload 后再次走 route/addInitScript。

---

## 本机复跑步骤（目标：e2e:ui / p10:gate 稳定通过）

1. **环境**：在本机真实终端（PowerShell 或 CMD，非 Cursor 内置终端），进入仓库根目录。
2. **浏览器**：`npx playwright install`（若未安装）。
3. **端口**：确保 8545、5173 空闲。
4. **E2E 单独跑**：`npm run e2e:ui`（会起链、构建、preview、Playwright）。
5. **全量门禁**：`npm run p10:gate`（**不设** SKIP_E2E_UI）。

失败时查看：控制台 `[E2E page console]` / `[E2E diagnostic]`、`e2e/evidence/e2e-diagnostic-*.md`、`e2e/evidence/playwright-test-results/` 下截图与 trace。
