# Change Log

All notable changes to the "translate-helper" extension will be documented in this file.

## [1.2.0] - 2026-02-04

### Changed
- 重构项目，迁移至使用 npm 和 tsc 进行包管理和编译
- 移除 pnpm 和 esbuild 依赖，简化构建流程

---

## [1.0.3] - 2026-02-02

### Added
- 实现模块化 LLM 提供商系统，支持多种 AI 服务
  - OpenAI
  - Claude (Anthropic)
  - 智谱 GLM
  - DeepSeek
  - 硅基流动
  - Google Gemini
  - Kimi (月之暗面)

### Changed
- 优化 API 调用，禁用流式传输和思考模式以提升响应速度
- 重构服务配置检查逻辑
- 重构命令模块以使用新的提供商系统

---

## [1.0.0] - 2026-02-02

### Added
- 初始版本发布
- 支持 Azure OpenAI 大模型 API（GPT-5-mini）
- 支持基于大模型的智能翻译（理解上下文，翻译更准确自然）
- 支持 AI 生成变量命名建议（使用大模型智能分析）
- 支持浮动按钮交互
- 支持快捷键（Alt+T 翻译，Alt+N 命名）
- 支持右键菜单操作
- 支持多种编程语言的命名风格（camelCase, snake_case, kebab-case, PascalCase）
- 支持 8 种目标语言（中、英、日、韩、法、德、西、俄）
- 支持大模型温度参数调节（控制创意程度）
- 美观的结果展示面板，支持一键复制和替换
- 完整的配置选项支持

## Features

### Translation
- Azure Translator API integration
- Auto language detection
- Multiple target languages support
- Keyboard shortcuts (Alt+T)
- Context menu support
- Floating button interface

### Variable Naming
- Smart naming style detection based on file extension
- Multiple naming strategies
- AI-powered suggestions
- One-click copy and replace
- Support for all major programming languages

### UI/UX
- Floating buttons near cursor
- Beautiful result panel
- Progress notifications
- Error handling with helpful messages
- Configuration panel integration
