# DAO 治理 — 设计清单（含治理币与核心 5 块之第 4 块）

> 行业顶级借贷协议**核心 5 块**之一：**DAO 治理系统**。本文补齐「治理币」、提案生命周期、角色与权限、验收清单，确保 DAO 设计完整可落地。

---

## 1) 在核心 5 块中的位置

| 核心模块 | 作用 | 本文覆盖 |
|----------|------|----------|
| ① 借贷与清算核心 | 存、借、还、清算，防坏账 | — |
| ② 预言机价格系统 | 安全价格，防价格攻击 | — |
| ③ 利率模型系统 | 调节供需，防挤兑，产生收益 | — |
| **④ DAO 治理系统** | **决定参数、升级与风险控制** | **✅ 全文** |
| ⑤ 可升级与安全体系 | 长期迭代，防被盗 | 与本文边界：治理「执行」升级，安全「承载」治理合约；可升级步骤见《12-升级流程》 |

---

## 2) 治理币（Governance Token）

### 2.1 作用

- **投票权**：谁持有/质押治理币，谁拥有提案权与投票权；投票权重通常与持币量或质押量挂钩（如 snapshot 或 block 高度锁定）。
- **激励与归属**：协议收入的一部分可分配给治理币质押者；或通过激励合约与「核心 5 块」的 Treasury/储备因子联动。

### 2.2 设计要点（清单）

- [ ] **代币标准**：ERC20；名称/符号/总供应量/分配（团队、社区、激励、国库等）文档化。
- [ ] **投票权来源**：按余额投票、按质押投票、或 snapshot（某 block 余额）；与 Governor 的 voting 接口一致（如 OpenZeppelin Governor 的 token 与 voting 逻辑）。
- [ ] **提案门槛**：提案所需最低持币/质押量（proposal threshold）；防止 spam。
- [ ] **法定人数 quorum**：通过提案所需的最小参与投票比例或票数。
- [ ] **投票期**：投票持续时间（如 3 天、7 天）；投票期内可 castVote。
- [ ] **执行延迟**：Timelock delay（如 2 天）；通过后需等待 delay 才能 execute，给监控与争议留窗口。
- [ ] **治理币与协议的关系**：治理币不参与借贷池的抵押/借出（除非单独列为储备资产）；仅用于治理投票与可选激励。

### 2.3 实现与存放

- **合约**：Governance Token 合约（ERC20）；可选 Staking 合约（质押后获得投票权）。
- **Governor 依赖**：Governor 合约依赖该 token 的 balanceOf 或 getVotes（含 delegation）；见 OpenZeppelin Governor + ERC20Votes 或 ERC20VotesTimestamp 等。
- **文档**：在《02-资产清单-抵押与借贷》中注明「治理币仅用于治理，不列入抵押/借贷资产」；本文即 DAO 与治理币的专门清单。

### 2.4 治理币部署时机

- **阶段**：治理币合约在 **P9（Governor + Timelock + EmergencyModule）** 与 Governor、Timelock **一并部署**。
- **顺序**：Governor 依赖治理币地址（voting token），故 **治理币须先于或与 Governor 同批部署**；推荐顺序：治理币 → Timelock → Governor（Governor 初始化时传入治理币与 Timelock 地址），再部署 EmergencyModule 并配置 AccessControl。
- **执行清单**：见《11-升级阶段清单-P0至P10》P9「升级内容」与「交付物」；P9 交付物中需含「治理币已部署并已与 Governor 绑定」。

---

## 3) 提案生命周期（完整流程）

| 步骤 | 负责方 | 说明 |
|------|--------|------|
| 1. 提案 | 任意满足 proposal threshold 的地址 | propose(targets, values, calldatas, description) |
| 2. 投票 | 治理币持有者 | castVote(proposalId, support)；投票期结束前可改票（视实现而定） |
| 3. 排队 | 任何人（通常 Keeper 或 proposer） | queue(proposalId)；通过后调用 Timelock.scheduleBatch 等 |
| 4. 等待 delay | Timelock | 等待 timelock delay 届满 |
| 5. 执行 | 任何人 | execute(proposalId) → Timelock.executeBatch；执行 PoolConfigurator 或 ProxyAdmin 等 |
| 取消/过期 | Governor / Timelock | 未通过、过期未 queue、过期未 execute 的提案按设计处理 |

---

## 4) 角色与权限（与核心 5 块一致）

| 角色 | 权限 | 合约/实现 |
|------|------|------------|
| **治理币持有者** | 提案、投票 | Governor 读 token 余额/投票权 |
| **Timelock** | 执行已通过的提案；调用 PoolConfigurator、ProxyAdmin | 唯一有权调用 Configurator/ProxyAdmin 的地址（或与多签组合） |
| **Guardian** | 紧急 Pause、单资产冻结、紧急下调 LTV；**不**执行合约升级 | EmergencyModule、Pausable |
| **Admin（可选）** | grant/revoke 角色；不直接改业务参数 | AccessControl |
| **多签（可选）** | 作为 Timelock 或 ProxyAdmin 所有者 | 多签钱包 |

---

## 5) DAO 决策范围（可治理项）

- **参数**：LTV、清算阈值 LT、清算奖励 bonus、储备因子、利率策略地址、单资产 cap 等（通过 PoolConfigurator）。
- **资产**：上线/下架储备、暂停单资产（setReservePause）。
- **升级**：实现合约升级（ProxyAdmin.upgrade）；若升级权委托给 Timelock，则通过提案执行 upgrade。
- **紧急**：仅 Guardian，不走提案；Pause、setAssetFrozen、setLTVEmergency 等。

---

## 6) 验收清单（DAO 是否「全」）

- [ ] **治理币**：已定义或已部署；名称、供应、分配、投票权来源（余额/质押/snapshot）文档化。
- [ ] **Governor**：已部署；proposal threshold、quorum、投票期、Timelock 地址可配置；与治理币合约集成。
- [ ] **Timelock**：已部署；delay 可配置；PoolConfigurator 与 ProxyAdmin 的调用方为 Timelock（或 Timelock+多签）。
- [ ] **EmergencyModule / Guardian**：已部署；仅 Guardian 可调；与 Pause、紧急参数分离于正常治理。
- [ ] **至少一次完整流程**：提案 → 投票 → queue → 等待 delay → execute；执行结果为参数变更或升级，链上可验证。
- [ ] **文档**：目标仓库 docs/12-PROTOCOL-DESIGN.md §07（升级与治理）包含治理币说明、提案生命周期、角色与权限、可治理项列表；与本文一致。

---

## 7) 与同目录文档关系

- **03-五大核心模块-技术设计**：第 4 块 DAO 治理系统；本文为其**扩展**，补治理币与完整清单。
- **12-升级流程**：参数变更、实现升级的执行步骤；DAO 负责「提议与投票」，Timelock 负责「执行」。
- **11-升级阶段清单-P0至P10** P9：Governor + Timelock + EmergencyModule 的交付与打勾测试；可与本文 6) 验收清单合并使用。
- **04-三大根基-架构设计**：治理演进层 = DAO + 参数控制 + 长期升级；本文即该层的详细设计清单。

---

**结论**：DAO 在本文中补齐**治理币**、提案生命周期、角色与可治理项；与核心 5 块之第 4 块一一对应，验收按第 6 节打勾即可判定「DAO 全」。
