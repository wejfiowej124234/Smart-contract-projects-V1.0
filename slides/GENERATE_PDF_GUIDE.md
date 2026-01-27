# 生成中文版和英文版PDF指南

## ✅ 当前状态
- ✅ 中文版HTML已生成：`slides/dist/INTERVIEW_DECK.zh-cn.html`
- ✅ 英文版HTML已生成：`slides/dist/INTERVIEW_DECK.en.html`

---

## 方法1：使用VS Code Marp插件（最推荐）⭐

### 步骤1：安装插件
1. 打开VS Code
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索：`Marp for VS Code`
4. 安装（Publisher: `marp-team.marp-vscode`）

### 步骤2：生成中文PDF
1. 在VS Code中打开：`slides/INTERVIEW_DECK.zh-cn.md`
2. 点击右上角的 **"Export slide deck"** 按钮
   - 或按 `Ctrl+Shift+P`，输入 `Marp: Export slide deck`
3. 选择 **"PDF"** 格式
4. 保存到：`slides/dist/INTERVIEW_DECK.zh-cn.pdf`

### 步骤3：生成英文PDF
1. 打开：`slides/INTERVIEW_DECK.en.md`
2. 同样操作，保存到：`slides/dist/INTERVIEW_DECK.en.pdf`

**优点**：✅ 最简单、最可靠、可直接生成PDF

---

## 方法2：从HTML打印为PDF（备选方案）

### 生成中文PDF

1. **打开HTML文件**：
   - 在文件管理器中打开：`slides\dist\INTERVIEW_DECK.zh-cn.html`
   - 或在浏览器中打开该文件

2. **打印为PDF**：
   - 按 `Ctrl+P`（或右键 → 打印）
   - 选择打印机：**"Microsoft Print to PDF"** 或 **"另存为PDF"**
   - 保存到：`slides\dist\INTERVIEW_DECK.zh-cn.pdf`

3. **打印设置**（重要）：
   - **布局**：横向（Landscape）
   - **纸张大小**：A4 或自定义（16:9比例）
   - **边距**：无
   - **背景图形**：✅ 开启（保留背景色和样式）
   - **缩放**：100%

### 生成英文PDF

重复上述步骤，但打开 `INTERVIEW_DECK.en.html`，保存为 `INTERVIEW_DECK.en.pdf`

---

## 方法3：使用Chrome浏览器打印（推荐用于HTML方式）

### Chrome打印设置（最佳效果）

1. **打开HTML文件**：
   - 右键点击 `INTERVIEW_DECK.zh-cn.html`
   - 选择"打开方式" → Chrome/Edge

2. **打印设置**：
   - 按 `Ctrl+P`
   - **目标**：另存为PDF
   - **更多设置**：
     - ✅ 背景图形
     - ✅ 页眉和页脚（可选）
     - 边距：无
     - 缩放：100%

3. **保存**：
   - 点击"保存"
   - 文件名：`INTERVIEW_DECK.zh-cn.pdf`
   - 位置：`slides\dist\`

---

## 验证生成结果

生成后检查：

- [ ] `slides/dist/INTERVIEW_DECK.zh-cn.pdf` 存在
- [ ] `slides/dist/INTERVIEW_DECK.en.pdf` 存在
- [ ] 文件大小合理（每个5-15MB）
- [ ] 第一页布局正确
- [ ] 字体清晰可读
- [ ] 所有图片正常显示
- [ ] PDF目录（outlines）正常（如果使用VS Code插件）

---

## 推荐工作流

**最佳实践**：
1. ✅ 使用VS Code Marp插件直接生成PDF（最简单）
2. ✅ 如果插件不可用，使用Chrome从HTML打印

**快速命令**：
```powershell
# 如果使用VS Code插件，只需：
# 1. 打开 .md 文件
# 2. 点击导出按钮
# 3. 选择PDF格式
```

---

## 文件位置

生成后的PDF文件应该在：
- `slides/dist/INTERVIEW_DECK.zh-cn.pdf` ✅
- `slides/dist/INTERVIEW_DECK.en.pdf` ✅

---

**推荐使用方法1（VS Code插件），最简单可靠！**
