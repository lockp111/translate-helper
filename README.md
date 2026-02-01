# Translate Helper - VSCode 翻译助手

一个基于 **Azure OpenAI 大模型** 的智能 VSCode 翻译助手插件，支持划词翻译和变量命名建议。

## 功能特性

### 🌐 智能翻译
- **Azure OpenAI 大模型** - 使用 GPT-4/GPT-3.5 等大模型进行智能翻译，理解上下文更准确
- **流式响应** - 打字机效果实时显示翻译结果，无需等待全部生成
- **自然语言翻译** - 不仅仅是单词替换，而是理解语义进行翻译
- **多种语言支持** - 支持中文、英文、日文、韩文、法文、德文、西班牙文、俄文
- **快捷键支持** - `Alt+T` 快速翻译选中文本
- **右键菜单** - 选中文字后右键点击"翻译选中文本"

### 💡 变量命名建议
- **AI 智能生成** - 使用大模型根据中文描述生成专业的英文命名
- **JSON Mode** - 强制大模型返回结构化 JSON 数据，确保命名建议格式稳定
- **智能风格判断** - 根据文件类型自动推荐合适的命名风格
  - JavaScript/TypeScript: camelCase
  - Python: snake_case
  - CSS/HTML: kebab-case
  - Java/C#: camelCase / PascalCase
- **多种命名策略** - 提供多个高质量建议，包含动词+名词、简洁版、数据导向等
- **快捷键支持** - `Alt+N` 快速获取命名建议
- **一键替换** - 直接替换编辑器中的文本

### 🎯 交互体验
- **浮动按钮** - 选中文字后在光标附近显示 🌐 翻译 和 💡 命名 按钮
- **结果面板** - 美观的翻译结果展示，支持复制和替换
- **配置灵活** - 可自定义 API Key、目标语言、建议数量等

## 安装

1. 克隆本仓库
```bash
git clone https://github.com/your-name/translate-helper.git
cd translate-helper
```

2. 安装依赖
```bash
npm install
```

3. 编译
```bash
npm run compile
```

4. 在 VSCode 中调试
- 按 `F5` 打开一个新的 Extension Development Host 窗口
- 在新窗口中测试插件功能

## 配置

在 VSCode 设置中搜索"翻译助手"，配置以下选项：

### 必需配置
- **Azure OpenAI API Key** - 从 [Azure Portal](https://portal.azure.com/) 获取
  1. 创建 Azure OpenAI 资源
  2. 部署一个模型（如 gpt-4 或 gpt-35-turbo）
  3. 在"密钥和终结点"中复制密钥和终结点 URL

- **Azure OpenAI Endpoint** - Azure OpenAI 服务的终结点 URL
  - 格式: `https://your-resource-name.openai.azure.com/`

- **Azure OpenAI Deployment Name** - 部署的模型名称
  - 默认: `gpt-4`
  - 也可以是 `gpt-35-turbo` 等你部署的模型名称

### 可选配置
- **Target Language** - 目标语言（默认: zh - 中文）
- **Naming Count** - 变量命名建议数量（默认: 3，范围: 1-5）
- **Enable Floating Buttons** - 启用浮动按钮（默认: true）
- **Temperature** - 大模型温度参数（默认: 0.3，越低越保守，越高越创意）

## 使用方法

### 翻译功能

**方式一：快捷键**
1. 选中要翻译的文本
2. 按 `Alt+T`
3. 在结果面板中查看翻译

**方式二：右键菜单**
1. 选中文本
2. 右键 → 翻译选中文本

**方式三：浮动按钮**
1. 选中文本
2. 点击光标附近出现的 🌐 按钮

### 变量命名功能

**方式一：快捷键**
1. 选中中文描述（如"获取用户列表"）
2. 按 `Alt+N`
3. 查看生成的命名建议

**方式二：右键菜单**
1. 选中文本
2. 右键 → 变量命名建议

**方式三：浮动按钮**
1. 选中文本
2. 点击光标附近出现的 💡 按钮

### 结果面板操作

在翻译/命名结果面板中，你可以：
- **复制** - 一键复制结果到剪贴板
- **替换** - 用结果替换编辑器中选中的原文
- **查看原文** - 对比原文和结果

## Azure OpenAI API 获取指南

1. 访问 [Azure Portal](https://portal.azure.com/)
2. 点击"创建资源"
3. 搜索"Azure OpenAI"并选择
4. 填写基本信息：
   - 订阅：选择你的订阅
   - 资源组：创建或选择现有资源组
   - 区域：选择支持 OpenAI 服务的区域
   - 名称：输入资源名称（将用于 endpoint URL）
   - 定价层：选择标准层
5. 点击"查看+创建"，然后"创建"
6. 等待部署完成
7. 进入资源页面 → "模型部署"
8. 点击"创建部署"，选择模型（推荐 GPT-4 或 GPT-3.5-Turbo）
9. 部署名称可以自定义（如 `gpt-4`）
10. 进入"密钥和终结点"页面：
    - 复制 **KEY 1** 的值 → 填入 `translateHelper.azureOpenAIKey`
    - 复制 **终结点** URL → 填入 `translateHelper.azureOpenAIEndpoint`
    - 填入部署名称 → `translateHelper.azureOpenAIDeploymentName`

## 快捷键

| 功能 | Windows/Linux | macOS |
|-----|--------------|-------|
| 翻译选中文本 | Alt+T | ⌥+T |
| 变量命名建议 | Alt+N | ⌥+N |

## 支持的文件类型

### 命名风格映射

| 文件扩展名 | 推荐命名风格 | 示例 |
|-----------|------------|------|
| .js, .ts, .jsx, .tsx | camelCase | `getUserList`, `fetchData` |
| .java, .cs, .go | camelCase | `userName`, `processRequest` |
| .py, .rb, .php, .sql | snake_case | `user_name`, `process_request` |
| .css, .scss, .less, .html | kebab-case | `user-name`, `process-request` |
| .vue | camelCase | `userList`, `componentName` |
| .rs | snake_case | `user_name`, `process_request` |

## 开发

### 项目结构

```
translate-helper/
├── src/
│   ├── extension.ts              # 扩展入口
│   ├── commands/
│   │   ├── translate.ts          # 翻译命令
│   │   └── naming.ts             # 命名命令
│   ├── providers/
│   │   ├── azureOpenAIService.ts # Azure OpenAI 服务（翻译+命名）
│   │   └── namingProvider.ts     # 命名建议服务（备用）
│   ├── ui/
│   │   ├── decorationManager.ts  # 浮动按钮管理
│   │   └── resultPanel.ts        # 结果面板
│   └── utils/
│       └── languageDetector.ts   # 语言检测工具
├── out/                          # 编译后的 JavaScript
├── package.json                  # 扩展配置
├── tsconfig.json                 # TypeScript 配置
├── README.md                     # 使用文档
├── CHANGELOG.md                  # 更新日志
├── LICENSE                       # MIT 许可证
└── .vscodeignore                 # 发布忽略文件
```

### 编译和调试

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 监听文件变化自动编译
npm run watch

# 打包发布
npm run vscode:prepublish
```

### 调试

1. 在 VSCode 中打开本项目
2. 按 `F5` 启动调试
3. 在新打开的 Extension Development Host 窗口中测试功能
4. 在原始窗口的调试控制台查看日志

## 问题反馈

如果你遇到任何问题或有功能建议，请：

1. 在 GitHub Issues 中提交问题
2. 提供详细的错误信息和复现步骤
3. 如果有错误日志，请一并提供

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 支持 Azure OpenAI 大模型 API
- 支持智能翻译（基于 GPT 理解上下文）
- 支持 AI 生成变量命名建议
- 支持浮动按钮交互
- 支持快捷键和右键菜单
- 支持多种编程语言的命名风格
