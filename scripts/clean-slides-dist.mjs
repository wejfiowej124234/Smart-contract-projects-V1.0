import fs from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, "..");
const distDir = path.join(projectRoot, "slides", "dist");

const keepNames = new Set([
  "INTERVIEW_DECK.zh-cn.pdf",
  "INTERVIEW_DECK.en.pdf",
  "INTERVIEW_DECK.zh-cn.html",
  "INTERVIEW_DECK.en.html",
  "SPEAKER_SCRIPT.zh-cn.pdf",
  "SPEAKER_SCRIPT.zh-cn.html",
]);

function rmRecursive(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.lstatSync(targetPath);

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(targetPath)) {
      rmRecursive(path.join(targetPath, entry));
    }
    fs.rmdirSync(targetPath);
    return;
  }

  fs.unlinkSync(targetPath);
}

function main() {
  if (!fs.existsSync(distDir)) {
    console.log(`slides/dist not found: ${distDir}`);
    return;
  }

  const entries = fs.readdirSync(distDir);
  let deletedCount = 0;

  for (const name of entries) {
    if (keepNames.has(name)) continue;
    const p = path.join(distDir, name);
    rmRecursive(p);
    deletedCount += 1;
  }

  console.log(`Cleaned slides/dist. Removed ${deletedCount} item(s).`);
  console.log(
    `Kept: ${Array.from(keepNames)
      .map((n) => path.join("slides", "dist", n))
      .join(", ")}`
  );
}

main();
