# P9 Governance Scripts

Run on **localhost** after P0–P8 is deployed (`deployments/<chainId>.json` exists and `npx hardhat node` is running).

**Order:**

1. `npm run deploy:p9` — Deploy GovernanceToken, TimelockController, GovernorP9, EmergencyModule; grant roles; write P9 addresses to deployments.
2. `npm run governance:transfer-admin` — Transfer PoolConfigurator.admin, ProxyAdmin.owner, Pool.owner to Timelock.
3. `npm run governance:first-proposal` — Propose setLTV(asset, 76) → vote → queue → wait delay → execute.
4. `npm run governance:verify-p9` — Run V1–V8 checks; exit 0 only if P9-Execution Complete.

**One-shot (node + P0–P8 deploy already done):**

```bash
npm run p9:full
```

Requires: `npx hardhat node` in another terminal, and `deployments/31337.json` from a prior `npm run deploy:localhost`.

**P9 清单补齐（Guardian E2E + 12 流程留证）：**

5. `npm run governance:verify-guardian` — Guardian/EmergencyModule E2E: emergencyPause(pool) → supply revert → unpause → supply 成功；输出 tx/block 与 pool.paused 读值。
6. `npm run governance:second-proposal-setlt` — 《12-升级流程》§5.1 参数变更留证：Governor 提案 setLiquidationThreshold(81) → vote → queue → execute；输出 tx/block 与 liquidationThreshold 读值。
7. `npm run governance:proxy-upgrade-drill` — 《12-升级流程》§3 实现升级演练：部署新 LendingPoolImpl，Governor 执行 ProxyAdmin.upgrade(proxy, newImpl)；输出 tx/block 与 getProxyImplementation 读值。

**发布门禁（治理全周期证据包）：**

8. `npm run governance:full-lifecycle-evidence` — 跑通 propose → snapshot → vote → quorum met → queue → timelock → execute，收集每步 txHash、snapshot/quorum/votes 与执行后链上状态，写入 `evidence-pack/governance-full-lifecycle.json` 及 `.sha256`，控制台输出 GOVERNANCE-FULL-LIFECYCLE-EVIDENCE-PACK-SHA256。详见 **docs/15-governance-create-proposal-example.md** §六。
