/**
 * One-time split of frontend/src/App.css into 4 partials under frontend/src/styles/.
 * Run from repo root: node scripts/split-app-css.cjs
 */
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const appCssPath = path.join(repoRoot, "frontend", "src", "App.css");
const stylesDir = path.join(repoRoot, "frontend", "src", "styles");

const content = fs.readFileSync(appCssPath, "utf8");
const lines = content.split("\n");

const ranges = [
  { name: "layout.css", start: 1, end: 351 },
  { name: "cards-dashboard.css", start: 352, end: 772 },
  { name: "tx-modal.css", start: 773, end: 1046 },
  { name: "forms-buttons.css", start: 1047, end: lines.length },
];

if (!fs.existsSync(stylesDir)) fs.mkdirSync(stylesDir, { recursive: true });

ranges.forEach(({ name, start, end }) => {
  const slice = lines.slice(start - 1, end).join("\n");
  const outPath = path.join(stylesDir, name);
  fs.writeFileSync(outPath, slice, "utf8");
  console.log("Written:", name, "lines", start, "-", end);
});

const newAppCss = `/* CSS variables are in index.css :root. Component styles are split for maintainability. */
@import "./styles/layout.css";
@import "./styles/cards-dashboard.css";
@import "./styles/tx-modal.css";
@import "./styles/forms-buttons.css";
`;
fs.writeFileSync(appCssPath, newAppCss, "utf8");
console.log("App.css replaced with @imports.");
console.log("Done.");