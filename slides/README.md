# Slides（面试用 PPT/PDF）

这套幻灯片用 **Marp**（Markdown → Slides）维护，适合：
- 录制面试技术视频
- 面试现场共享屏幕
- 导出 PDF 当作“PPT”投递

## 推荐安装（VS Code 插件）

- 插件：`Marp for VS Code`（publisher：`marp-team.marp-vscode`）
  - 安装后打开 `slides/INTERVIEW_DECK.zh-cn.md`，右上角即可预览/导出。

## 命令行导出（PDF / HTML）

在仓库根目录：

- 导出 PDF：`npm run slides:pdf`
- 导出英文 PDF：`npm run slides:pdf:en`
- 导出中英双份 PDF：`npm run slides:pdf:all`
- 导出 HTML：`npm run slides:html`

导出产物默认在 `slides/dist/`。

## 建议工作流

1) 先跑一遍 Demo（确保你自己不卡）：
   - `npx hardhat node`
   - `npx hardhat run scripts/deploy.ts --network localhost`
   - `cd frontend && npm run dev`
2) 边演示边录屏，幻灯片只做“讲解提纲”，不要塞太多字。

## 小提示

- 如果你想把仓库里的 Mermaid 图放进 slides，最稳的方式是：
  - 先在 GitHub 渲染后截图 / 或导出为 PNG/SVG
  - 然后在 Marp 里用图片引用
