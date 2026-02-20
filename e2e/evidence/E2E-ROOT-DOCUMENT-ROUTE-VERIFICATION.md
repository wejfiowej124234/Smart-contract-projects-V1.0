# E2E 根文档拦截验证证据

## 1. 验证结论

- **Route 谓词**：`page.route((url) => url.pathname === "/" || url.pathname === "", handler)` 已**命中**根文档请求。
- **Handler 执行**：每次根文档请求均执行「读盘 → `<head>` 注入 → fulfill」。
- **证据**：控制台出现 `[E2E route] hit root document → read disk → inject <head> → fulfill`，且页面控制台出现 `E2E[route.fulfill]: typeof window.ethereum= object`、`E2E[DOMContentLoaded]: typeof window.ethereum= object`、`E2E[load]: typeof window.ethereum= object`。

## 2. 控制台证据（节选）

```
[E2E route] hit root document → read disk → inject <head> → fulfill
[E2E page console] E2E[addInitScript]: (before) typeof window.ethereum= undefined
[E2E page console] E2E[route.fulfill]: typeof window.ethereum= object
[E2E page console] E2E[addInitScript]: (after) typeof window.ethereum= object
[E2E page console] E2E[route.fulfill]: typeof window.ethereum= object
[E2E page console] E2E[DOMContentLoaded]: typeof window.ethereum= object
[E2E page console] E2E[load]: typeof window.ethereum= object
```

## 3. Locator 稳定性补丁

- **现象**：注入成功后应用可能直接显示「已连接」（Disconnect），不出现「Connect wallet」。
- **处理**：`expectConnectWalletOrDiagnose` 改为等待「Connect wallet」或「Disconnect」任一可见；新增 `ensureWalletConnected`：先等钱包按钮，若为 Connect 则点击，再等 Disconnect。
- **结果**：用例「connects wallet and shows dashboard」在本机稳定通过。

## 4. 诊断 md 与门禁

- 失败时诊断写入 `e2e/evidence/e2e-diagnostic-<ts>-<test>.md`。
- 全量门禁：在本机终端执行 `npm run p10:gate`（不设 SKIP_E2E_UI），取得 exit 0 后即 Full GO；evidence-pack、SHA256、四锚点以当轮输出为准。
