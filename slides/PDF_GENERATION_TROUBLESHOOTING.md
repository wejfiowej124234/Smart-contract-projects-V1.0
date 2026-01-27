# PDF生成问题排查指南

## 当前问题
`Error: spawn EPERM` - Puppeteer无法启动Chrome浏览器

## 解决方案

### 方案1：使用VS Code Marp插件（推荐）✅

1. **安装插件**：
   - 打开VS Code
   - 搜索并安装：`Marp for VS Code` (publisher: `marp-team.marp-vscode`)

2. **导出PDF**：
   - 打开 `slides/INTERVIEW_DECK.zh-cn.md`
   - 点击右上角的 **"Export slide deck"** 按钮
   - 选择 **"PDF"** 格式
   - 保存到 `slides/dist/INTERVIEW_DECK.zh-cn.pdf`

3. **优点**：
   - ✅ 不需要命令行
   - ✅ 可以实时预览
   - ✅ 不受权限问题影响

---

### 方案2：以管理员身份运行（如果方案1不可用）

1. **关闭当前终端/命令提示符**

2. **以管理员身份打开PowerShell**：
   - 右键点击"开始"菜单
   - 选择"Windows PowerShell (管理员)"或"终端 (管理员)"

3. **运行命令**：
   ```powershell
   cd "c:\Users\plant\Desktop\Smart contract projects"
   npm run slides:pdf:all
   ```

---

### 方案3：检查防病毒软件

某些防病毒软件可能阻止Puppeteer启动Chrome：

1. **临时禁用防病毒软件**（仅用于生成PDF）
2. **或将项目目录添加到白名单**

---

### 方案4：使用HTML导出后手动转换

如果PDF生成持续失败，可以：

1. **生成HTML**：
   ```powershell
   npm run slides:html
   ```

2. **在浏览器中打开HTML**：
   - 打开 `slides/dist/INTERVIEW_DECK.zh-cn.html`
   - 使用浏览器的"打印"功能（Ctrl+P）
   - 选择"另存为PDF"

---

## 推荐工作流

**最佳实践**：使用VS Code Marp插件
- ✅ 最简单
- ✅ 最可靠
- ✅ 可以实时预览效果

**步骤**：
1. 在VS Code中打开 `slides/INTERVIEW_DECK.zh-cn.md`
2. 点击右上角导出按钮
3. 选择PDF格式
4. 保存到 `slides/dist/` 目录

---

## 验证生成结果

生成后检查：
- [ ] PDF文件大小合理（通常5-15MB）
- [ ] 第一页布局比例正确
- [ ] 字体大小清晰可读
- [ ] 所有图片正常显示
- [ ] PDF目录（outlines）正常

---

**最后更新**：2026-01-28
