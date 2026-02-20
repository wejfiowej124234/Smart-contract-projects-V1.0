# 运维与应急脚本（06 结构）

用于日常运维与应急操作，与 project-upgrade《06-升级后目录结构》scripts/ops 对应。

- **pause**：调用 Pool.pause()（需 PAUSER 权限）。
- **unpause**：调用 Pool.unpause()。
- **setReservePause**：按资产暂停（通过 PoolConfigurator.setReservePause）。
- **参数下调**：LTV/LT/closeFactor 等通过 PoolConfigurator（通常经 Timelock）。

脚本实现时可读取 deployments/ 与私钥/KMS，执行前请确认 docs/03-08-deployment-runbook.md 与 project-upgrade/12-升级流程。
