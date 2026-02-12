/**
 * Move remaining "to-archive" docs from docs/ to docs/archive/.
 * Run from repo root: node scripts/move-docs-to-archive.cjs
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const docsDir = path.join(repoRoot, "docs");
const archiveDir = path.join(repoRoot, "docs", "archive");

const toMove = [
  "UI_DESIGN_P0_P1_P2_设计流程.md",
  "UI_DESIGN_P6_AAVE_UPGRADE_方案.md",
  "UI_DESIGN_设计流程_完成与下一步.md",
  "UI_DESIGN_截图对照与待优化.md",
  "UI_DESIGN_科技感Web3_设计说明.md",
  "P0_IMPLEMENTATION_AUDIT_设计文档对照.md",
  "ENTERPRISE_AUDIT_P0_P6_企业级审计全阶段.md",
];

let moved = 0;
for (const name of toMove) {
  const src = path.join(docsDir, name);
  const dest = path.join(archiveDir, name);
  try {
    if (fs.existsSync(src)) {
      fs.renameSync(src, dest);
      console.log("Moved:", name);
      moved++;
    } else {
      console.log("Skip (not found):", name);
    }
  } catch (err) {
    console.error("Error moving", name, err.message);
  }
}
console.log("Done. Moved", moved, "files to docs/archive/");
