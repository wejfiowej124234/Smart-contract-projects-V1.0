# ⚠️ 重要：PDF自动生成说明

## 当前情况

由于Windows系统权限限制，命令行无法直接启动浏览器生成PDF。

## ✅ 最简单的解决方案（只需1次点击）

### 使用VS Code Marp插件（推荐，最快）

1. **打开VS Code**
2. **打开文件**：`slides/INTERVIEW_DECK.zh-cn.md`
3. **点击右上角的"Export slide deck"按钮**（📤图标）
4. **选择PDF格式**
5. **保存**：`slides/dist/INTERVIEW_DECK.zh-cn.pdf`
6. **重复步骤2-5**，打开 `INTERVIEW_DECK.en.md` 生成英文PDF

**总时间**：约1分钟，只需点击2次按钮

---

## 📁 已准备好的文件

- ✅ `slides/dist/INTERVIEW_DECK.zh-cn.html` - 中文HTML（已生成）
- ✅ `slides/dist/INTERVIEW_DECK.en.html` - 英文HTML（已生成）
- ✅ `scripts/generate-pdf.ps1` - 自动化脚本（受权限限制）
- ✅ `scripts/generate-pdf.mjs` - Node.js脚本（受权限限制）
- ✅ `generate-pdf.bat` - 批处理文件（受权限限制）

---

## 🔧 如果必须使用命令行

由于系统权限限制，需要**以管理员身份运行**：

1. 右键点击PowerShell或命令提示符
2. 选择"以管理员身份运行"
3. 运行：`cd "c:\Users\plant\Desktop\Smart contract projects" && npm run slides:pdf:all`

---

## 💡 为什么推荐VS Code插件？

- ✅ **最简单**：只需点击按钮
- ✅ **最可靠**：不受权限限制
- ✅ **最快**：1分钟完成
- ✅ **可以预览**：生成前可以看到效果

---

**建议：使用VS Code Marp插件，这是最简单可靠的方法！**
