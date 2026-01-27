# 快速生成PDF指南

## 问题
命令行生成遇到权限错误（Puppeteer无法启动Chrome）

## ✅ 推荐方案：使用VS Code Marp插件

### 步骤1：安装插件
1. 打开VS Code
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索：`Marp for VS Code`
4. 安装（Publisher: `marp-team.marp-vscode`）

### 步骤2：生成中文PDF
1. 在VS Code中打开：`slides/INTERVIEW_DECK.zh-cn.md`
2. 点击右上角的 **"Export slide deck"** 按钮（或按 `Ctrl+Shift+P`，输入 `Marp: Export slide deck`）
3. 选择 **"PDF"** 格式
4. 保存到：`slides/dist/INTERVIEW_DECK.zh-cn.pdf`

### 步骤3：生成英文PDF
1. 打开：`slides/INTERVIEW_DECK.en.md`
2. 同样操作，保存到：`slides/dist/INTERVIEW_DECK.en.pdf`

---

## 替代方案：生成HTML后浏览器打印

如果插件不可用：

```powershell
cd "c:\Users\plant\Desktop\Smart contract projects"
npm run slides:html
```

然后：
1. 打开生成的 `slides/dist/INTERVIEW_DECK.zh-cn.html`
2. 按 `Ctrl+P` 打印
3. 选择"另存为PDF"
4. 保存到 `slides/dist/INTERVIEW_DECK.zh-cn.pdf`

---

## 验证生成结果

生成后检查：
- ✅ PDF文件存在
- ✅ 文件大小合理（5-15MB）
- ✅ 第一页布局正确
- ✅ 字体清晰可读

---

**推荐使用VS Code插件，最简单可靠！**
