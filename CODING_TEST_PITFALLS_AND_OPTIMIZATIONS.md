# Coding Test Assignment（Web3 JS Engineer）—坑点与优化建议（严格边界版）

本文基于题面中文翻译稿：[_translation_work/translated/Coding Test Assignment - Web3 engineer（中文翻译）.md](_translation_work/translated/Coding%20Test%20Assignment%20-%20Web3%20engineer（中文翻译）.md)

目标：
- **严格执行题面要求**（不添加题面没有要求的“新功能/新范围”）。
- 帮你识别“最容易翻车的坑”，并给出在不越界前提下的**可加分优化**。

---

## 1) 题目里常见“坑”有多少个？

按实际交付中最常见的翻车点计：
- **12 个高概率坑点**（不处理很容易直接不达标）
- 另外还有 **6 个中等概率坑点**（不一定致命，但很容易丢分或造成演示失败）

合计：**18 个坑点**（见下文逐条）。

---

## 2) 12 个高概率坑点（按翻车概率排序）

### 合规性与最佳实践核对（适用于下文所有“解决方案”）
- **题面合规性**：是否满足/支持题面明确要求（Mandatory / UI 展示 / 事件监听 / 交易状态等），且不引入题面以外的新范围。
- **行业最佳实践**：是否符合常见 DApp 前端与链上交互的工程实践（安全数值处理、错误分类、监听器清理、可复现性等）。

结论：下文给出的“严格做法/建议做法”均以**不越界**为前提；其中标注为“可选/建议”的内容属于最佳实践或加分项，不是题面硬性要求。

### 坑 1：`.docx/.pdf` 里写的“USD8 + WETH”与合约接口不对齐
题面要求前端展示 USD8 与 WETH 余额，并部署 USD8/WETH 测试代币；但常见给的借贷合约只接收**单一 token**（例如 SimpleLending 构造参数只有 `_token`）。

**严格不越界的做法**：
- 部署两个 ERC20 测试代币：`USD8`、`WETH`。
- SimpleLending 只绑定其中一个（通常绑定 `USD8`），WETH 仅用于**余额展示**（满足题面“显示 USD8/WETH 余额”）。

合规性：✅（题面要求展示 USD8/WETH 余额；并未要求 WETH 必须参与抵押/借贷逻辑）

最佳实践：✅（关键是把“WETH 不参与借贷，仅作余额展示”的假设写进 README 的 Assumptions/Decisions，避免被认为漏做功能）

### 坑 2：MetaMask 不在 Hardhat 本地链（31337）上
很多人只起了 `hardhat node`，但 MetaMask 没加网络，或 chainId/ RPC URL 填错。

**严格做法**：
- 前端检测 chainId，不是 `31337` 就触发 `wallet_switchEthereumChain`。
- 若未添加网络，需用 `wallet_addEthereumChain`（本地 RPC 通常 `http://127.0.0.1:8545`）。

合规性：✅（题面要求自动网络切换）

最佳实践：✅（补充：对 `wallet_switchEthereumChain` 的 4902 错误码做 add chain 兼容）

### 坑 3：本地 Hardhat 的“测试账户”与 MetaMask 的账户不是一个
题面要求 seed 测试账户初始代币，但你前端连接的账户如果不是被 seed 的账户，UI 显示余额 0、approve/supply 都失败。

**严格做法**：
- 部署脚本 seed：对一组明确的地址发币。
- README 写清楚：
  - 方案 A：把 hardhat 账户私钥导入 MetaMask，然后用该地址操作。
  - 方案 B：用部署脚本给任意指定地址（例如通过 env/参数传入）发币。

合规性：✅（题面要求 seed 测试账户；并未限制 seed 的方式）

最佳实践：✅（方案 A 更简单更符合“本地链”场景；方案 B 更通用，但要注意不要引入复杂的“钱包系统”概念）

### 坑 4：ethers v6 与 v5 写法不同导致“能编译但运行错”
常见错误：使用 `ethers.providers.Web3Provider`（v5）或 `utils.parseUnits`（v5）的旧用法。

**严格做法**：
- 使用 `new ethers.BrowserProvider(window.ethereum)`。
- 单位换算用 `ethers.parseUnits` / `ethers.formatUnits`。
- 数值使用 `bigint`（v6 默认返回 bigint）。

合规性：✅（题面硬性要求 ethers.js v6）

最佳实践：✅（尤其是 bigint + formatUnits，符合 rubric 里的 safe number handling）

### 坑 5：Approve/Allowance 的“授权状态展示”容易做错
题面要求：Supply 前必须 approve，并展示对 lending 合约授权状态。

**严格做法**：
- 读取 `allowance(owner, lendingAddress)`。
- UI 显示：
  - `allowance >= amountToSupply` → 已满足
  - 否则 → 需要 approve
- 交易顺序：先 `approve`（等待 confirmed）再 `supply`。

合规性：✅（题面明确要求 approve flow + 展示授权状态）

最佳实践：✅（补充：approve “精确额度”更安全；approve MaxUint256 更省事但风险更高。测试题中两者都可接受，建议在 README 写明选择理由）

### 坑 6：交易状态（pending/confirmed/failed）不规范
很多实现只弹 toast，不保留状态，或不区分 confirmed/failed。

**严格做法**：
- pending：发送交易拿到 `tx.hash` 后
- confirmed：`await tx.wait()` 成功
- failed：捕获异常（含 user rejected / revert）

合规性：✅（题面明确要求展示交易状态）

最佳实践：✅（补充：将 user rejected（常见 code 4001）单独标记为 failed，并给出可读提示）

### 坑 7：事件监听（Supplied/Withdrawn/Borrowed/Repaid）做了但不更新 / 或泄漏监听器
题面要求：监听合约事件并更新 UI。

**严格做法**：
- `contract.on(eventName, handler)` 注册，组件卸载时 `contract.off(...)`。
- handler 中触发一次“刷新链上数据”的函数（重新读余额 + pool + user position）。
- 保底：交易 confirmed 后也刷新一次（避免事件丢失）。

合规性：✅（题面明确要求事件监听并更新 UI）

最佳实践：✅（必须清理监听器；同时避免重复注册导致多次刷新）

### 坑 8：健康因子/最大可借可提 数据来源不一致
题面要求展示：health factor（颜色编码）、max withdrawable、max borrowable。

**严格做法**：
- 优先用合约提供的 view 函数（例如 `getUserPosition`、`calculateMaxWithdraw`、`calculateMaxBorrow`）。
- 如果合约没有直接给某字段，只能在前端按合约同样公式计算；但这属于“实现细节”，不算越界。

合规性：✅（题面只要求“展示”，不限制数据来自 view 还是前端计算）

最佳实践：✅（优先链上 view 可避免与合约逻辑偏差；前端计算需与合约保持一致并用 bigint）

### 坑 9：Withdraw / Borrow 的“检查”在 UI 层做了但没处理失败提示
题面允许“检查 / 或失败提示”。

**严格做法**：
- UI 可以在调用前做一次轻量检查（例如 maxBorrow/maxWithdraw）。
- 即使做了检查，也必须能正确展示合约 revert 的错误信息（failed 状态）。

合规性：✅（题面写明“检查 / 或失败提示”，两种都可）

最佳实践：✅（预检查改善体验，但不能替代链上校验；失败提示必须清晰）

### 坑 10：实时更新只做“交易后更新”，没做到“事件触发更新”
题面是两条：交易后更新 + 事件监听更新。

**严格做法**：
- 交易 confirmed 后 refresh
- 事件触发也 refresh

合规性：✅（题面要求两者）

最佳实践：✅（双触发能显著降低“演示时 UI 不更新”的风险）

### 坑 11：导出 ABI/地址的格式混乱导致前端对不上
题面要求导出 ABIs 和 addresses。

**严格做法（强烈建议写死）**：
- 输出一个文件（例如 `frontend/src/contracts/deployments.json`）包含：
  - chainId
  - usd8Address
  - wethAddress
  - simpleLendingAddress
- ABI 文件放 `frontend/src/abis/*.json`，并在 README 说明生成方式。

合规性：✅（题面要求导出 ABI 与地址供前端使用）

最佳实践：✅（对齐链 id、把地址与 ABI 的生成过程自动化，有利于复现）

### 坑 12：README 缺关键复现步骤导致“交付不合格”
题面明确要求 README 包含运行本地节点、部署合约、启动前端等。

**严格做法**：
- README 里提供从零到跑起来的命令序列。
- 明确 MetaMask 网络配置与使用哪个账户（对应“坑 3”）。

合规性：✅（题面明确要求 README 包含这些信息）

最佳实践：✅（可复现性是工程交付的核心）

---

## 2.1) 6 个中等概率坑点（不一定致命，但很容易丢分）

### 坑 13：Hardhat 重启导致地址变化，前端缓存了旧地址
本地 `hardhat node` 重启后合约地址会变化，如果前端把地址写死/缓存到 localStorage，容易读到旧地址导致“全页面报错”。

建议做法（不越界）：
- 地址来源以 `deployments.json` 为准；不要把地址持久化为“权威来源”。
- 若做了连接状态持久化，只持久化“是否已连接/上次账户”，不要持久化合约地址。

合规性：✅（不改变题面功能）

最佳实践：✅（避免本地演示翻车）

### 坑 14：没有处理 `accountsChanged` / `chainChanged`
用户切换账户或网络后，UI 仍显示旧账户数据，approve/交易容易发到错误账户。

建议做法（不越界）：
- 监听 `window.ethereum` 的 `accountsChanged` 与 `chainChanged`，触发刷新或重建 provider/contract 实例。

合规性：✅（题面要求连接状态与网络信息展示，监听变化可保证正确）

最佳实践：✅（这是 DApp 前端的基础工程化处理）

### 坑 15：输入金额处理不安全（小数/空值/科学计数法/超大数）
题面 rubric 明确提到 safe number handling。很多人用 `Number()` 解析输入导致精度丢失。

建议做法（不越界）：
- 输入字符串校验（空、负数、超过小数位等），再用 `parseUnits` 转 bigint。
- UI 展示用 `formatUnits`。

合规性：✅

最佳实践：✅（直接命中 rubric 的 Security Awareness）

### 坑 16：错误信息不可读（只显示“execution reverted”）
面试官看演示时会认为你“没有错误处理”。

建议做法（不越界）：
- 将错误归类：余额不足、allowance 不足、健康因子违规、网络/RPC 错误（与题面 Bonus 对齐）。
- 提示语保持简短且可行动（例如“请先 Approve”/“请切换到 31337”）。

合规性：✅

最佳实践：✅

### 坑 17：并发点击导致重复发交易
用户连续点击按钮会发出多笔 approve/supply，造成混乱。

建议做法（不越界）：
- 每个交易按钮在 pending 时禁用，并显示 loading。

合规性：✅（题面 Bonus 提到 loading 状态）

最佳实践：✅

### 坑 18：事件监听只监听“全局事件”，没有按用户过滤，导致数据刷新过于频繁
本地多人或测试脚本触发事件时，你的 UI 可能频繁 refresh 影响体验。

建议做法（不越界）：
- 事件回调里判断 `user` 是否为当前 connected account（或对 relevant event 才 refresh）。
- 或用节流（throttle）保护 refresh。

合规性：✅

最佳实践：✅（属于性能与稳定性细节，能加分但不必过度复杂）

---

## 3) 严格边界（写死写清楚）

### 3.1 必须做（题面硬性）
- React + TypeScript + ethers.js v6
- 合约部署到本地 Hardhat（或你选择的 EVM testnet），前端可切换网络
- 展示：USD8/WETH 余额、pool 数据、user position 数据（含 health factor 颜色编码、max withdraw/borrow）
- 交易：Supply/Withdraw/Borrow/Repay
- 实时更新：交易后刷新 + 事件监听刷新
- 交易状态：pending/confirmed/failed
- 交付：完整 repo + README（含运行/部署/启动/地址/假设）

### 3.2 明确不做（为了不跑偏）
以下属于题面未要求的范围，**不作为交付目标**（可以不做）：
- 钱包产品化能力（助记词/私钥管理/账户体系/创建钱包）
- 后端服务、数据库、登录注册
- 合约功能扩展（清算、预言机、多资产抵押、跨链）

> 注意：这里“写明不做”是为了控制范围与风险，不影响你完成题面必做项。

### 3.3 允许做的优化（不越界且加分）
这些优化不改变题目范围，只提升质量/得分：
- **类型安全**：为合约读写封装 typed 函数（至少集中在 `src/contracts/`）
- **状态管理清晰**：用 React context 或轻量 store（例如 Zustand）组织“钱包/合约数据/交易状态”
- **统一错误处理**：将错误归类为：余额不足、allowance 不足、健康因子违规、网络/RPC 错误（对应题面 Bonus）
- **Loading 状态**：所有异步操作（connect、read、tx）都有 loading
- **性能细节**：减少无意义 re-render（memoization），避免频繁链上读（事件+confirm 驱动刷新）
- **更可复现**：一键脚本（`npm run deploy` + 生成 deployments.json），README 写清楚

---

## 4) 推荐实现策略（严格对题面，最稳交付路径）

1. 先做 Part 1：Hardhat 部署脚本
   - 一键部署 USD8/WETH/SimpleLending
   - seed 账户
   - 导出 ABI + deployments.json
2. 再做 Part 2：前端
   - Wallet connect + network switch + connection persist
   - 合约读取：balances + pool + user position + maxBorrow/maxWithdraw
   - 交易：approve→supply、withdraw、borrow、repay
   - tx 状态机 + 统一错误处理
   - 事件监听 + confirmed 后刷新
3. 最后补 README
   - 从零复现步骤、账户导入说明、地址列表、假设/决策

---

## 5) 你可以直接复制到 README 的“假设/决策”模板（可选）

- 假设：SimpleLending 仅支持单一借贷 token，因此选择 USD8 作为借贷 token；**WETH 仅展示余额，不参与借贷/抵押计算**。
- 决策：交易状态统一按 pending/confirmed/failed 管理；confirmed 以 `tx.wait()` 为准。
- 决策：数据刷新由“confirmed + 合约事件”双触发，避免漏更新。

（以上模板不增加题面范围，只解释实现选择。）

---

## 6) 更“死”的边界：一套固定的最佳实现（最优方案）

这一节把实现路径**写死**：你按此执行即可满足题面 Mandatory，并贴合 rubric 的最佳实践；除“加分项”外不额外加范围。

### 6.1 唯一技术选型（写死）
- 前端：React + TypeScript
- Web3：ethers.js v6（使用 BrowserProvider + bigint）
- 合约：Hardhat 本地链（chainId 31337）作为默认交付；testnet 部署仅作为可选演示项

### 6.2 唯一产品边界（写死）
- 只做题面要求的 DApp 前端与部署脚本：连接钱包、读数据、发交易、事件监听更新、交易状态展示。
- 不做钱包系统（助记词/私钥/账户创建）、不做后端、不扩展合约功能。

### 6.3 唯一链上部署方案（写死）
1. 启动本地节点：hardhat node
2. 部署脚本一次性完成：
   - 部署 USD8（ERC20）
   - 部署 WETH（ERC20）
   - 部署 SimpleLending（绑定 USD8 作为借贷 token）
   - seed：给 hardhat 默认账户（以及你明确列出的若干地址）分发 USD8/WETH
3. 导出产物（格式写死）：
   - ABI：frontend/src/abis/*.json
   - 地址：frontend/src/contracts/deployments.json
     - 字段固定：chainId、usd8Address、wethAddress、simpleLendingAddress

合规说明：题面要求“部署 USD8/WETH、部署 SimpleLending、seed 账户、导出 ABI/地址”。以上严格覆盖且不扩展合约逻辑。

### 6.4 唯一网络切换策略（写死）
- 进入页面后，如果检测到 MetaMask 存在：
  - 读取当前 chainId
  - 若不是 31337：先调用 wallet_switchEthereumChain
  - 如果返回 4902（未添加网络）：调用 wallet_addEthereumChain 添加本地链，然后再 switch

UI 展示（写死）：始终显示 connected account 与 chainId（或网络名 + chainId）。

### 6.5 唯一“连接状态持久化”策略（写死）
- 只持久化：上次是否已连接（boolean）
- 不持久化：合约地址、余额、仓位、provider 实例
- 页面刷新后：如果检测到已连接且 MetaMask 仍授权，自动恢复显示账号与网络

原因：hardhat 重启地址会变；把地址缓存为权威来源会直接翻车。

### 6.6 唯一数据读取与刷新策略（写死）
页面数据来源（写死）：
- 余额：USD8.balanceOf(user)、WETH.balanceOf(user)
- Pool：SimpleLending.getPoolInfo（或等价字段）
- User：SimpleLending.getUserPosition
- Max：SimpleLending.calculateMaxWithdraw / calculateMaxBorrow

刷新触发（写死）：
- 交易 confirmed 后刷新一次（强制刷新）
- 监听 Supplied/Withdrawn/Borrowed/Repaid 事件触发刷新（第二触发，保证实时）
- accountsChanged / chainChanged 触发重建合约实例 + 全量刷新

性能边界（写死）：事件触发刷新只做“当前账户相关”的事件；其余忽略。

### 6.7 唯一金额输入与数值安全策略（写死）
- 输入只接受十进制字符串（允许小数点），禁止科学计数法
- 转换：parseUnits(input, 18) 得到 bigint
- 展示：formatUnits(bigint, 18)
- 所有比较使用 bigint，禁止 Number() 参与链上数值计算

### 6.8 唯一 approve 策略（写死）
- allowance 展示规则（写死）：
  - 当 allowance >= 本次 supply 输入金额：显示“已授权/可直接 Supply”
  - 否则：显示“未授权/需 Approve”
- approve 额度（写死）：按“本次输入金额”精确授权（不是 MaxUint）

理由：精确授权更符合安全最佳实践；不会增加题面范围。

### 6.9 唯一交易流程与状态机（写死）
每个操作按钮（Supply/Withdraw/Borrow/Repay）都遵循同一状态机：
- idle → pending(txHash) → confirmed(receipt) 或 failed(error)

交互写死：
- pending 时禁用按钮 + 显示 loading
- confirmed 后清空输入框（可选）+ 刷新数据
- failed 显示可读错误（见下一节）

### 6.10 唯一错误处理策略（写死，既合规又“最优”）
错误分四类（与题面 Bonus 对齐），并在 UI 用固定文案提示：
- 余额不足：Insufficient balance
- 授权不足：Insufficient allowance / Need approve
- 健康因子违规：Withdrawal would make position unhealthy / Exceeds borrowing limit
- 网络/RPC：Network error / RPC error / Wrong network

补充写死：MetaMask 用户拒绝（常见 4001）单独提示“用户取消签名/交易”。

### 6.11 唯一事件监听实践（写死）
- 注册监听器后，组件卸载必须 off 掉（避免重复注册）
- 监听器内部只做“触发刷新函数”，不在回调里堆业务逻辑

### 6.12 唯一目录结构建议（写死但不强制）
为了可读性与可复现，建议按题面示例组织：
- contracts/（Solidity）
- scripts/（deploy）
- frontend/src/abis/（ABI）
- frontend/src/contracts/（合约交互封装 + deployments.json）
- frontend/src/hooks/（useProvider/useContracts/useBalances 等）
- frontend/src/components/（UI）

### 6.13 加分项（仍然不越界）的最优做法（可选）
- 至少 2 个 Hardhat 集成测试（建议覆盖：approve+supply、borrow+repay 或 withdraw）
- 所有异步操作加 loading
- 更细粒度的错误提示（按 revert reason 映射）

---

## 7) 一句话总结（交付时写在 README 顶部）

本项目严格按题面要求实现 React+TS+ethers v6 的借贷协议前端，默认对接本地 Hardhat(31337)；合约通过脚本部署并导出 ABI/地址供前端使用；UI 支持自动切网、授权流程、Supply/Withdraw/Borrow/Repay 交易、事件驱动的实时刷新与交易状态展示。
