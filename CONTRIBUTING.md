# Contributing / 参与规范

企业级约定：在改代码或文档前请遵守以下入口与规范，保证仓库干净、可复现。

## 文档入口

- **全部文档索引入口**：[docs/README.md](docs/README.md)
- **设计与实现总览（P0～P6）**：[docs/P0_P6_全阶段总结_从零到当前.md](docs/P0_P6_全阶段总结_从零到当前.md)
- **题目与验收**：根目录 [README_CODING_TEST_CHECKLIST.md](README_CODING_TEST_CHECKLIST.md)、[docs/ASSESSMENT_MAPPING.md](docs/ASSESSMENT_MAPPING.md)

## 代码规范

- **前端**：遵守 [frontend/FRONTEND_STYLE_GUIDE.md](frontend/FRONTEND_STYLE_GUIDE.md)（命名、导出、ethers bigint、错误归一化、交易状态机、事件监听）
- **合约**：Solidity 0.8.x，Hardhat 编译与测试
- **提交前**：`npm run ci:local` 通过；无新增硬编码（文案/色值/链 ID 来自 config 与 design-tokens）

## 文档维护

- 新增文档请在 [docs/README.md](docs/README.md) 对应章节补充一行
- 废弃文档移入 **docs/archive/**，并在 doc 索引中注明「已归档」
- 清理建议与归档说明见 [docs/DOCS_清理建议_保留与可删.md](docs/DOCS_清理建议_保留与可删.md)

## 安全与发布

- 安全策略见 [SECURITY.md](SECURITY.md)
- 公开发布前按 [PUBLIC_RELEASE_CHECKLIST.md](PUBLIC_RELEASE_CHECKLIST.md) 自检
