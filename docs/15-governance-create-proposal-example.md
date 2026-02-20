# 治理「创建提案」输入说明与示例

用于在 **Governance → Create proposal** 弹窗中测试治理币：各字段含义、数据来源，以及一条可直接复制粘贴的示例（setLTV 参数变更）。

**发布级闭环声明**：治理联调已达到发布级闭环。阈值门禁基于链上 **quorum / proposalThreshold** 动态计算；delegate / votes 全链上实时验证并覆盖快照差异；提案创建回显 **quorum(snapshot)**、**votes(snapshot)**、txHash；证据带 **schemaVersion + 合约地址** 并写入 diagnostics bundle（含 **SHA256**），确保治理流程可复现、可回归、可审计。

---

## 治理币业务逻辑与行业标准

本仓治理实现与 **OpenZeppelin Governor + 行业常见实践** 一致，业务逻辑正常、符合主流标准。

### 本仓实现概览

| 模块 | 实现 | 说明 |
|------|------|------|
| **治理代币** | ERC20 + ERC20Permit + **ERC20Votes**（OZ） | 投票权按**历史区块快照**（`getVotes(account, blockNumber)`），非当前余额；必须 **delegate** 后才有投票权。 |
| **Governor** | GovernorP9 = Governor + GovernorSettings + **GovernorCountingSimple** + GovernorVotes + **GovernorVotesQuorumFraction** + **GovernorTimelockControl**（均为 OZ） | 提案门槛、投票延迟/周期、**For/Against/Abstain** 计票、按供应量比例 quorum、执行经 Timelock。 |
| **Timelock** | OZ TimelockController | 仅 Governor 为 PROPOSER/EXECUTOR；执行前固定延迟（mock 60s，real 24h），防止闪电通过。 |
| **流程** | propose → voting delay → castVote → voting period → quorum 达标 → queue → timelock 等待 → execute | 与 Compound/Aave/OZ 文档一致。 |

### 参数与行业对照

- **Proposal threshold**（创建提案最低持币）：当前 profile 为 0，即任意持币地址可发起提案；主网常见为 0.5%–1% 供应量，可按需在 profile 中调高。
- **Quorum**（通过所需最低投票）：mock 1%、real 4%（占**总供应量**比例），与常见 2%–10% 区间一致；由 `GovernorVotesQuorumFraction` 按 snapshot 块计算。
- **Voting delay / period**：按**区块数**配置（mock 1 + 100 block，real 1 + 45818 block ≈ 约 7 天）；与链上区块时间一致，符合行业习惯。
- **Timelock 延迟**：执行前强制等待（mock 60s，real 86400s），避免无等待期执行，符合安全实践。

### 结论

- **业务逻辑**：提案创建、快照、投票、quorum 判定、排队、timelock、执行均按 OZ 标准实现，无自定义“捷径”，逻辑正常。
- **行业标准**：与 OpenZeppelin Governor 文档、Compound Governor Bravo、Aave 等「代币投票 + Timelock」模式一致；ERC20Votes 快照 + delegate、For/Against/Abstain、quorum fraction、仅 Governor 可调用 Timelock 均为常见设计。
- **可调性**：阈值与周期均由 profile 驱动（`configs/profiles/*/profile.json` 或 `31337.json`），便于本地压测与主网分级参数。

---

## 测试治理币流程（按顺序执行）

按下面顺序做，即可在本地完整跑通治理：启用 → 创建提案（4 项）→ 投票 → 排队 → 执行。

| 顺序 | 步骤 | 做什么 |
|------|------|--------|
| **0** | 前置 | 本地链已起（`npx hardhat node`），已执行 `deploy:localhost`、`deploy:p9`、`governance:transfer-admin`。前端已连本地网络（31337）。 |
| **1** | 启用治理 | 转 GOV + Self-delegate（见下一节「本地治理启用流程」）。 |
| **2** | 取 4 项 | 在项目根执行：`node scripts/governance/print-proposal-inputs.mjs`，得到 Create proposal 弹窗要填的 4 段（或直接用本文「复制粘贴版」里的 4 项，若你未重新部署）。 |
| **3** | 创建提案 | 前端 **Governance → Create proposal**，从上到下粘贴 4 项，点 **Create proposal**。 |
| **4** | 投票 | 等 voting delay 后，在提案卡片上点 **Vote**，选 For，确认交易。 |
| **5** | 排队与执行 | 等 voting period 结束后点 **Queue**；再等 timelock 后点 **Execute**。执行成功后链上参数（如 LTV）会更新。 |

**不想在前端一步步点**：在项目根执行 `npm run governance:first-proposal` 会由脚本自动跑完 2→3→4→5（setLTV 76）。发布前证据包：`npm run governance:full-lifecycle-evidence`。

---

## 复制粘贴版（一键按顺序测试）

下面可直接复制到终端或弹窗使用。**若你重新部署过**，请先运行 `node scripts/governance/print-proposal-inputs.mjs` 用其输出的 4 项替换「Create proposal 的 4 项」。

**终端（在项目根执行，按顺序）：**

```bash
# 1) 给当前测试地址转 GOV 并（可选）deployer 自委托（<你的地址> 换成前端用的 0x...）
npx hardhat run scripts/governance/grant-and-delegate.ts --network localhost -- <你的地址>

# 2) 取 Create proposal 弹窗的 4 项（输出复制到弹窗从上到下）
node scripts/governance/print-proposal-inputs.mjs
```

**前端：**

1. 打开 **Governance** 页，用已收到 GOV 的地址连接钱包。
2. 若「投票权」为 0：点 **Delegate** → 委托给自己，等 1 个区块或刷新后再看。
3. 点 **Create proposal**，把下面 4 段**按顺序**粘贴到弹窗从上到下 4 个框，然后点 Create proposal。

**Create proposal 的 4 项（对应当前 `deployments/31337.json`，若你未重新部署可直接用）：**

```
1. Target contract (addresses, comma-sep)
0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d

2. Values (wei, comma-sep)
0

3. Function call data (hex, comma-sep)
0x1620f74b000000000000000000000000202cce504e04bed6fc0521238ddf04bc9e8e15ab000000000000000000000000000000000000000000000000000000000000004c

4. Description
First governance proposal: set LTV to 76
```

4. 提案创建成功后，等 voting delay 结束 → 点 **Vote**（For）→ 等 voting period 结束 → 点 **Queue** → 等 timelock → 点 **Execute**。

---

## 本地治理启用流程（投票权为 0 时必做）

前端与 Governor/Timelock 交互已完整；若「投票权 0、法定人数未达」，治理不可用的**唯一阻塞**是：当前地址未持有或未委托 GOV。

**校准**：Proposal threshold 若为 0.0 GOV，则**创建提案**不一定会因票数不足失败；真正卡死的是 **投票权 = 0 + Quorum = 10000 GOV** → 提案永远过不了。核心卡点 = 没 GOV + 没 delegate（投票权为 0）。

**最短可操作（约 30 秒让 DAO 真正可用）**：

| 步骤 | 操作 |
|------|------|
| **A. 转 GOV** | 用**有币的部署账号**给当前前端地址转 GOV（≥ Quorum，例如 20000 GOV）。一键脚本：`npx hardhat run scripts/governance/grant-and-delegate.ts --network localhost -- <你的地址>`（不传地址则用 `GRANT_GOV_TO` 或转给 deployer） |
| **B. Self-delegate** | 用**当前地址**在前端治理页点击「代表 / Delegate」→ **委托给自己**。不 delegate 则投票权仍为 0（Governor 体系常见坑） |
| **C. 再检查** | 确认「投票权」「委托给」有数，且投票权 ≥ Quorum（本地 Quorum 多为 10000 GOV；若需降低可改本地 profile/部署参数，如改为 100 便于 E2E） |

**防呆（delegate 生效时间点）**：OpenZeppelin Governor 的投票权按**区块快照**计算；转 GOV + self-delegate 之后，通常需**至少再挖 1 个 block**，`getVotes(address)` 才会体现。若你已转币并点了 Delegate 但投票权仍显示 0：**刷新页面并等待/挖 1 个区块（或触发一次链上交易）再看**。

完成后即可：创建提案 → 投票 → 提案通过 → 执行，形成闭环。

**还有哪些可注意的点**（非阻塞，按需排查）：
- **「此网络未配置调速器」**：仅当前端读不到 `governorAddress`（如 deployments 未同步或未重启前端）时出现。若已看到治理页且显示合约 0xDC11...2aDD，说明已配置，可忽略该提示或检查 `frontend/src/contracts/deployments.json` 与 `deployments/31337.json` 一致。
- **Create proposal 的 Function call data 输入框**：前端未设 `maxLength`，不会强制截断；若界面“看起来短”多为视觉折叠，实际以链上交易 input 为准。
- **grant-and-delegate 传地址**：若 `-- <地址>` 在你本地不生效，可用环境变量：`GRANT_GOV_TO=0x你的地址 npx hardhat run scripts/governance/grant-and-delegate.ts --network localhost`。
- **本地降低 Quorum**：需改 P9 部署参数（如 `scripts/deploy/deploy-p9.ts` 或 profile 中的 quorum）并重新部署 P9，才生效。
- **P1 演示模式（Quorum/投票期更短）**：为减少 E2E/视频演示的等待，可在本地 profile 为 31337 单独设「演示参数」：如 `configs/profiles/mock/31337.json` 覆盖 `governance.quorumNumerator`、`votingDelayBlocks: 1`、`votingPeriodBlocks: 50` 等（需重跑 deploy:p9）；主网仍用真实值。
- **P1 提案创建后回显**：创建成功后以链上为准。前端在 propose 成功后会回显 `proposalId`、snapshot、deadline、**quorum(snapshot)**、**你的 votes at snapshot** 与 txHash；并写入 session 证据（含 **schemaVersion**、**governorAddress**、**govTokenAddress**，便于链重置后对证据归属哪次部署）。Copy debug bundle（/diagnostics）会包含 `lastProposalCreated`（超长则截断并标 [truncated]）及 `lastProposalCreatedSha256`，便于截图+bundle 复现与校验。
- **getVotes 的 block 参数**：投票权按**历史快照块**计算，不是“当前最新块”。脚本门禁会读取 `quorum(latest)` 与 `proposalThreshold()`，以 **requiredVotes = max(quorum, proposalThreshold)** 为阈值（不写死 20000），任一组 `getVotes(addr, block-1/latest)` ≥ requiredVotes 即 VOTES_VISIBLE=true，profile 漂移不误判。
- **Self-delegate 判定**：前端「请先 self-delegate」/「wait 1 block」的判定来自**链上实时读** `token.delegates(account)`（治理 overview 每次 fetch 都调合约），不是本地缓存；Delegate 交易确认后需刷新或触发 refetch，提示才会更新，避免“交易刚发出 UI 先变、链上未确认”的误导。
- **votesAtSnapshot 与 Governor 版本**：本仓使用 GovernorP9 + ERC20Votes，投票权为 `governor.getVotes(addr, blockNumber)`，snapshot 为 `proposalSnapshot(proposalId)` 返回的块高。若回显的 votesAtSnapshot 与 `getVotes(addr, latest)` 不一致属正常（快照块与当前块不同）；**以 proposalSnapshot/proposalDeadline + 当前 Governor 接口语义为准**。若换用其他 OZ 版本（如 getPastVotes 或 snapshot-1），需按该实现对齐。
- **Quorum 可能漂移**：OZ Governor 的 Quorum 多为 `quorumNumerator * totalSupply / denominator`，改 demo profile 或 totalSupply 后可能不是固定 10000。创建提案成功回显里的 **quorum(snapshot)** 与 **votes at snapshot** 即实际值，参数漂移可一眼发现。
- **退出钱包 / 断开连接**：前端不会“自动连默认账户”；余额来自当前 MetaMask 授权给本站的账户。要彻底退出并让 Balances 不再显示：在页头点击 **Disconnect**（余额会立即清空），或在 MetaMask → 已连接网站 → 断开本站。仅锁住 MetaMask 或换账户时，若未在 MetaMask 里断开本站，本站刷新后仍可能显示原账户余额；Dashboard 未连接时会提示「To disconnect: click Disconnect in the header, or disconnect this site in MetaMask」。

---

## 弹窗里要填的 4 项（与界面从上到下一致）

Create proposal 弹窗里从上到下共有 **4 个输入框**，和下面一一对应：

| 序号 | 界面上的标签 | 本文档说明位置 |
|------|----------------|----------------|
| **1** | **Target contract (addresses, comma-sep)** | 填要调用的合约地址（如 Configurator）。地址从哪来 → **§一**；含义与格式 → **§二** 表格第 1 行；示例填什么 → **§三** |
| **2** | **Values (wei, comma-sep)** | 填 wei 数量，一般不转币就写 `0`。含义与格式 → **§二** 表格第 2 行；示例 → **§三** 里为 `0` |
| **3** | **Function call data (hex, comma-sep)** | 填函数调用的十六进制 calldata。含义与格式 → **§二** 表格第 3 行；如何生成、示例 → **§三** |
| **4** | **Description** | 填提案说明（人类可读）。含义与格式 → **§二** 表格第 4 行；示例 → **§三** |

填完这 4 项后点 **Create proposal** 即可。若需要每条的含义与可粘贴示例，请看下面 **§一**（地址从哪来）、**§二**（各字段含义）、**§三**（setLTV 完整示例）。

---

## 直接复制粘贴（4 项）

与上文 **「复制粘贴版」** 中 Create proposal 的 4 项一致；此处再列一份便于单独复制。

**1. Target contract (addresses, comma-sep)**  
```
0xfbC22278A96299D91d41C453234d97b4F5Eb9B2d
```

**2. Values (wei, comma-sep)**  
```
0
```

**3. Function call data (hex, comma-sep)**  
```
0x1620f74b000000000000000000000000202cce504e04bed6fc0521238ddf04bc9e8e15ab000000000000000000000000000000000000000000000000000000000000004c
```

**4. Description**  
```
First governance proposal: set LTV to 76
```

> **若你重新部署过**，上述地址和 calldata 会变。在项目根目录执行：  
> `node scripts/governance/print-proposal-inputs.mjs`  
> 会输出你当前部署对应的 4 项，再复制到弹窗即可。
>
> **Calldata 是否被截断**：UI 输入框「看起来短」可能是视觉截断（实际提交完整）或真的少了尾巴。最快验证方式是用链上结果——提案创建后看该笔交易的 input / revert reason，或用 `/diagnostics` 等 debug 输出；不要仅凭肉眼判断。

---

## 一、合约地址从哪里来？

**唯一事实源**：本机 `deployments/31337.json`（与 [09-本地链标准与地址.md](09-本地链标准与地址.md) 一致）。  
重新部署后地址会变，请以你当前文件为准。

| 键名 | 用途（创建提案时常用） |
|------|------------------------|
| `configuratorAddress` | 调参数（LTV、清算阈值等）时填在 **Target contract** |
| `usd8Address` | 储备资产地址，作为 setLTV / setLiquidationThreshold 的第一个参数 |
| `governorAddress` | 提案由 Governor 合约发起（前端会连该合约） |

前端使用的地址来自 `frontend/src/contracts/deployments.json`（由部署脚本从 `deployments/31337.json` 同步）。若刚部署过，请**重启前端 dev** 再操作。

---

## 二、弹窗各字段含义（4 个输入框逐一说明）

下面表格的 **4 行** 对应弹窗里**从上到下**的 4 个输入框。

| 字段 | 含义 | 格式 |
|------|------|------|
| **Target contract (addresses, comma-sep)** | 提案要调用的合约地址；多个动作用逗号分隔多个地址 | 一个或多个 `0x...`，例如 `0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00` |
| **Values (wei, comma-sep)** | 随调用一起发送的原生币数量（wei）；通常不转币就填 `0` | 如 `0`；多目标时与 target 一一对应，逗号分隔 |
| **Function call data (hex, comma-sep)** | 要调用的函数及参数的 ABI 编码（十六进制）；多目标时与 target 一一对应 | 如 `0x...`；需用合约 ABI 编码得到 |
| **Description** | 提案说明（人类可读），用于展示与链上描述哈希 | 任意文本，例如 "First governance proposal: set LTV to 76" |

**关于 Function call data**：  
即合约接口的 `encodeFunctionData("函数名", [参数1, 参数2, ...])`。  
脚本里已有示例：`scripts/governance/first-proposal-setltv.ts`（setLTV）、`scripts/governance/second-proposal-setlt.ts`（setLiquidationThreshold）。

---

## 三、示例：提案「将 USD8 的 LTV 设为 76」

下面是一组**可直接粘贴**的示例值，对应**当前** `deployments/31337.json` 中的地址（你本地若已重新部署，请用本机 `deployments/31337.json` 中的地址替换）。

### 1. 从本机部署文件取地址

打开 `deployments/31337.json`，确认并复制：

- **Target contract**：`configuratorAddress`（例如 `0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00`）
- 下面生成 calldata 时要用到 `usd8Address`（例如 `0x998abeb3E57409262aE5b751f60747921B33613E`）

### 2. 生成 Function call data（setLTV）

在项目根目录执行（需已 `npm install` 且 Hardhat 可用）：

```bash
npx hardhat console --network localhost
```

在 console 中执行（会使用当前 `deployments/31337.json` 里的 `usd8Address`）：

```js
const deployments = require("./deployments/31337.json");
const Configurator = await ethers.getContractFactory("PoolConfigurator");
const calldata = Configurator.interface.encodeFunctionData("setLTV", [
  deployments.usd8Address,
  76
]);
console.log(calldata);
```

复制输出的整段 `0x...`，粘贴到弹窗的 **Function call data**。

### 3. 表单填写示例（按你本机地址替换）

| 字段 | 示例值（请以你本机 deployments/31337.json 为准） |
|------|--------------------------------------------------|
| **Target contract** | `0x5eb3Bc0a489C5A8288765d2336659EbCA68FCd00`（即你本机的 `configuratorAddress`） |
| **Values** | `0` |
| **Function call data** | 上一步 console 输出的 `0x...`（setLTV(usd8Address, 76) 的编码） |
| **Description** | `First governance proposal: set LTV to 76` |

- 若只有一个 target、一次调用：**Target contract** 一个地址，**Values** 一个 `0`，**Function call data** 一段 hex。  
- 多 target 时：三者均为逗号分隔，且一一对应。

### 4. 提交前确认

- 已连接钱包，且网络为本地链（Chain ID 31337）。  
- 当前账户有足够的治理币（GOV）且已 delegate，满足 Governor 的 proposal threshold。  
- 若页面提示「此网络未配置调速器」，说明前端读不到 Governor 或未部署 P9，需先完成 `npm run deploy:p9` 并**重启前端**，再强刷。

---

## 四、其他常见提案类型（技术文档与脚本）

- **参数类**：`setLTV(asset, ltv)`、`setLiquidationThreshold(asset, lt)` 等，target 均为 **configuratorAddress**，calldata 用 PoolConfigurator 的 interface 编码。  
- **升级类**：调用 ProxyAdmin 的 `upgrade(proxy, newImpl)`，见 `scripts/governance/proxy-upgrade-drill.ts`。  
- 脚本与流程说明：见 **scripts/governance/README.md**（`governance:first-proposal`、`governance:second-proposal-setlt` 等）。  
- 治理设计总览：见 **project-upgrade/08-DAO治理-设计清单.md**。制度级→协议级→终局级治理理念与未解清单见 **docs [16-institutional-dao-governance](16-institutional-dao-governance.md)～[21-governance-ultimate-unresolved](21-governance-ultimate-unresolved.md)**（00-INDEX §〇 治理）。

---

## 五、一句话对照

| 想要 | 去哪里看 |
|------|----------|
| 合约地址 | `deployments/31337.json`（与 09 一致） |
| 各字段含义 | 本文「二、弹窗各字段含义」 |
| setLTV 示例 | 本文「三、示例」+ 本机 `configuratorAddress` / `usd8Address` |
| 如何编码 calldata | 本文「三、2. 生成 Function call data」或 `scripts/governance/first-proposal-setltv.ts` |
| 完整治理流程（提案→投票→排队→执行） | `scripts/governance/README.md`、`08-DAO治理-设计清单.md` |
| 不想手填表单、直接走完整流程 | 在项目根执行 `npm run governance:first-proposal`（会创建 setLTV(76) 提案并自动投票、排队、执行） |

---

## 六、治理全周期证据包（发布门禁）

按**发布级闭环声明**，进入发布阶段前需跑通 **propose → snapshot → vote → quorum met → queue → timelock → execute** 全治理生命周期，并生成带 **SHA256** 的 **Governance Full Lifecycle Evidence Pack**，确保流程可复现、可回归、可审计。

**一键生成证据包**（需已部署 P9、transfer-admin-to-timelock，且 deployer 有 GOV 并已 self-delegate）：

```bash
npx hardhat run scripts/governance/full-lifecycle-evidence-pack.ts --network localhost
```

**输出**：

- 写入 `evidence-pack/governance-full-lifecycle.json`：各阶段 txHash、snapshot/deadline、quorumAtSnapshot、votesAtSnapshot、proposalVotes(for/against/abstain)、queue.eta、执行后链上状态（如 reserveLtv）。
- 写入 `evidence-pack/governance-full-lifecycle.sha256`：上述 JSON 的 SHA256 校验和。
- 控制台打印 **GOVERNANCE-FULL-LIFECYCLE-EVIDENCE-PACK-SHA256**，便于与 manifest 锚定。

**发布前**：确认该证据包已生成；运行 `npm run p10:evidence-pack` 时会将 `governance-full-lifecycle.json` 与 `.sha256` 纳入 evidence-pack manifest，与 EVIDENCE-PACK-MANIFEST-SHA256 形成可审计闭环。
