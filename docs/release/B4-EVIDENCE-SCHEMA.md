# B4 L2 证据文件格式与校验（可验证、防伪、不可绕过）

## 1. 文件位置与命名

- 路径：`docs/release/B4-L2-evidence-<chainId>.json`
- L2 主网 chainId：10（Optimism）、42161（Arbitrum One）、8453（Base）、534352（Scroll）

## 2. 证据字段（必填）

| 字段 | 类型 | 说明 |
|------|------|------|
| `chainId` | number | 必须与当前 Gate 运行的链一致 |
| `commitSha` | string | 生成证据时的 git commit SHA（与当前构建一致 Gate 才通过） |
| `deploymentsHash` | string | 当前 `deployments/<chainId>.json` 内容的 SHA256 十六进制 |
| `timestamp` | string | ISO 8601 时间戳 |
| `signature` | string | 对**规范 payload** 的 EIP-191 personal_sign 签名（0x 开头 hex） |

## 3. 规范 payload 与签名

- **规范 payload**：`JSON.stringify` 且 key 顺序固定为 `chainId, commitSha, deploymentsHash, timestamp`（与 `scripts/security-gate/b4-evidence.ts` 中 `canonicalPayload` 一致）。
- **签名**：对上述 JSON 字符串使用 `ethers.signMessage(payload)`（即 EIP-191 `personal_sign`）。
- **校验**：Gate 用 `ethers.verifyMessage(payload, signature)` 恢复 signer，并检查 signer 在 `b4EvidenceSigners` 或 `B4_EVIDENCE_SIGNERS` 中。

## 4. Gate 校验逻辑（L2 主网）

1. 若链上 Oracle 路径已有 `isSequencerUp()` 且返回 true → B4 **Pass**（无需证据文件）。
2. 否则读取 `docs/release/B4-L2-evidence-<chainId>.json`：
   - 文件不存在或非合法 JSON / 缺字段 → B4 **Fail**。
   - `b4EvidenceSigners` 未配置（且无 `B4_EVIDENCE_SIGNERS`）→ B4 **Fail**（无法验签）。
   - 校验 `evidence.chainId === 当前 chainId`、`evidence.commitSha === 当前 BUILD_SHA/GITHUB_SHA/git HEAD`、`evidence.deploymentsHash === 当前 deployments 文件 SHA256`；
   - 校验 `verifyMessage(payload, evidence.signature)` 恢复的地址在允许列表中。
   - 任一项不通过 → B4 **Fail**；全部通过 → B4 **Pass**。

## 5. 生成签名证据

```bash
# 部署完成后，在对应 commit 与 deployments 下执行（signer 私钥需在 b4EvidenceSigners 中）
CHAIN_ID=42161 B4_SIGNER_PRIVATE_KEY=0x... npx hardhat run scripts/release/sign-b4-evidence.ts
# 或
npx hardhat run scripts/release/sign-b4-evidence.ts -- --chain-id 42161
```

输出文件：`docs/release/B4-L2-evidence-42161.json`。  
将签名者地址加入 `scripts/config/security-gate-42161.json` 的 `b4EvidenceSigners` 数组。

## 6. 示例证据文件（占位）

见 `docs/release/B4-L2-evidence-42161.example.json`。实际使用需用 `sign-b4-evidence.ts` 生成带有效签名的文件。

## 7. 本地与 L2 主网

- **本地 (chainId 31337)**：B4 为 [Skip]，不读证据文件。
- **L2 主网**：无链上 SequencerUptimeGuard 时，**必须**提供可验证通过的证据文件，否则 B4 [Fail] 且 exit code=1，不可绕过。
