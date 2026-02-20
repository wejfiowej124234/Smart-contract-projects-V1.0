#!/usr/bin/env node
/**
 * Finalize v1.0.0 Release Record: read gate output, extract EVIDENCE-PACK-MANIFEST-SHA256,
 * write sign-off time, embed full output, compute RECORD-SHA256 for tamper-evidence.
 * Usage: node scripts/ci/finalize-release-record.mjs [path-to-gate-output.txt]
 * Default: evidence/p10-gate-release-v1.0.0-output.txt
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_GATE_OUTPUT = path.join(ROOT, "evidence", "p10-gate-release-v1.0.0-output.txt");
const RECORD_PATH = path.join(ROOT, "docs", "RELEASE-RECORD-V1.0.0.md");
const MANIFEST_PATH = path.join(ROOT, "evidence-pack", "manifest.json");

function sha256Hex(content) {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
}

function extractManifestSha256(text) {
  const m = text.match(/EVIDENCE-PACK-MANIFEST-SHA256:\s*([a-f0-9]{64})/i);
  return m ? m[1] : null;
}

function main() {
  const gateOutputPath = process.argv[2] || DEFAULT_GATE_OUTPUT;
  if (!fs.existsSync(gateOutputPath)) {
    console.error("Gate output file not found:", gateOutputPath);
    console.error("Run: npm run p10:gate > evidence/p10-gate-release-v1.0.0-output.txt 2>&1");
    process.exit(1);
  }

  let gateOutputRaw = fs.readFileSync(gateOutputPath, "utf-8");
  if (gateOutputRaw.charCodeAt(0) === 0xfeff) gateOutputRaw = gateOutputRaw.slice(1);
  const gateOutput = gateOutputRaw.replace(/\r\n/g, "\n").trim();

  const manifestSha256 = extractManifestSha256(gateOutput);
  const signOffTime = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  let gateRunId = "";
  let generatedAt = "";
  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    gateRunId = manifest.gateRunId || "";
    generatedAt = manifest.generatedAt || "";
  }

  const gateOutputSha256 = sha256Hex(gateOutputRaw);
  const gateOutputPathRel = path.relative(ROOT, gateOutputPath).replace(/\\/g, "/");

  const fullOutputBlock = "```\n" + gateOutput + "\n```";

  const recordBody = `# v1.0.0 Local-Only Release — 最终不可篡改发布记录

**Protocol Security Council · 零信任发布**  
**版本**：1.0.0（package.json）  
**唯一验收入口**：\`npm run p10:gate\`

---

## 1. 签字与锚点

| 项 | 值 |
|----|-----|
| **签字时间** | ${signOffTime} |
| **EVIDENCE-PACK-MANIFEST-SHA256** | ${manifestSha256 || "(未从输出中解析到)"} |
| **Gate Run ID** | ${gateRunId} |
| **Evidence Pack 生成时间** | ${generatedAt} |

---

## 2. 本机执行 p10:gate 完整输出

${fullOutputBlock}

---

## 3. 证据链

### 3.1 门禁完整输出文件

| 文件 | SHA256 |
|------|--------|
| ${gateOutputPathRel} | ${gateOutputSha256} |

### 3.2 evidence-pack manifest 锚点

- **manifest.json** 含 \`gateRunId\`、\`gateManifestSha256\`、\`files\` 及各文件 sha256。
- 校验：\`evidence-pack/manifest.json\` 整文件 SHA256 应与上述 **EVIDENCE-PACK-MANIFEST-SHA256** 一致（门禁成功结束时 stdout 输出值）。

---

## 4. 发布宣言（摘要）

本仓库为 **v1.0.0 Enterprise-Grade (Local-Only) Release**。交付物满足 P0–P10 Engineering-Complete 本地离线交付标准；验收方式：在端口 8545 空闲环境下执行 \`npm run p10:gate\` 至 exit 0。本版本不依赖 GitHub tag/release 即可交付；主网/测试网部署为后续扩展。

完整宣言见 [RELEASE-V1.0-DECLARATION.md](RELEASE-V1.0-DECLARATION.md)。

---

## 5. 不可篡改校验

以下为本文档（自文首至「RECORD-SHA256」前一行）的 SHA256。任何对上述内容的修改将导致校验不通过。

**RECORD-SHA256**：`;

  const recordSha256 = sha256Hex(recordBody);
  const fullRecord = recordBody + recordSha256 + "\n";

  fs.mkdirSync(path.dirname(RECORD_PATH), { recursive: true });
  fs.writeFileSync(RECORD_PATH, fullRecord, "utf-8");

  console.log("RELEASE-RECORD-V1.0.0.md written.");
  console.log("Sign-off time:", signOffTime);
  console.log("EVIDENCE-PACK-MANIFEST-SHA256:", manifestSha256 || "(not found in output)");
  console.log("Gate output file SHA256:", gateOutputSha256);
  console.log("RECORD-SHA256:", recordSha256);
}

main();
