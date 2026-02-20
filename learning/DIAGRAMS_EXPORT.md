# 把 Mermaid 图变成“截图/图片”的两种方法（上传 GitHub 也好用）

> 学习文档与路径以 [项目总览架构](项目总览架构.md) 为准。

你现在在每篇文档开头都有 `mermaid` 图块（并且设置了 `theme: dark`，看起来更像你截图那种风格）。

## 方法 A（最省事）：直接在 GitHub 网页上截图

1. 把仓库 push 到 GitHub。
2. 打开任意 `learning/*.md`。
3. GitHub 会自动把 Mermaid 渲染成图。
4. 你可以：
   - 直接截图（Windows：`Win + Shift + S`），就得到你想要的“截图图”。
   - 或在浏览器里右键图形（不同浏览器表现不同）尝试 “复制图像/另存为”。

适合：你只想要“截图效果”，不需要批量生成图片文件。

---

## 方法 B（可导出 PNG/SVG 文件）：用 Mermaid Live Editor

1. 打开 https://mermaid.live/
2. 从文档里复制 ` ```mermaid ... ``` ` 里的内容（包含第一行的 `%%{init: ...}%%`）。
3. 粘贴到 Mermaid Live Editor。
4. 右上角选择导出 `PNG` 或 `SVG`。

适合：你想把图导出成真正的图片文件（例如放到 PPT/简历/离线文档）。

---

## Mermaid 兼容性注意（避免 GitHub 渲染报错）

- Mermaid 的关键字必须用英文：`flowchart` / `sequenceDiagram` / `stateDiagram-v2`。
- 在节点文本里不要写 `\n`（反斜杠+n）当换行；GitHub Mermaid 可能会解析失败。
   - 推荐写法：用 `<br/>` 换行，例如 `A[第一行<br/>第二行]`。

---

## 小提示：怎么找到每篇的“主图”

每篇文档都新增了一个：

- `## 0) 一图读懂：...`

直接复制这个小节里的 Mermaid 代码去导出就行。
