import { OpenAI } from 'openai';
import * as vscode from 'vscode';

export interface NamingSuggestion {
    name: string;
    style: string;
    description: string;
}

export interface StreamCallbacks {
    onChunk: (chunk: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
}

export class AzureOpenAIService {
    private client: OpenAI | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): boolean {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('azureOpenAIKey', '');
        const endpoint = config.get<string>('azureOpenAIEndpoint', '');
        
        if (!apiKey || !endpoint) {
            this.client = null;
            return false;
        }

        try {
            this.client = new OpenAI({
                apiKey: apiKey,
                baseURL: endpoint
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Azure OpenAI client:', error);
            this.client = null;
            return false;
        }
    }

    /**
     * 使用流式响应翻译文本
     */
    async translateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Azure OpenAI API Key 和 Endpoint');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const targetLang = config.get<string>('targetLanguage', 'zh');
        const deploymentName = config.get<string>('azureOpenAIDeploymentName', 'gpt-4');

        const langNames: { [key: string]: string } = {
            'zh': '中文',
            'en': '英文',
            'ja': '日文',
            'ko': '韩文',
            'fr': '法文',
            'de': '德文',
            'es': '西班牙文',
            'ru': '俄文'
        };

        try {
            const stream = await this.client!.chat.completions.create({
                model: deploymentName,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的翻译助手。请准确翻译用户提供的文本，只返回翻译结果，不要添加解释。'
                    },
                    {
                        role: 'user',
                        content: `请将以下文本翻译成${langNames[targetLang]}：\n\n${text}`
                    }
                ],
                stream: true,
                max_completion_tokens: 128000
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    callbacks.onChunk(content);
                }
            }

            callbacks.onComplete();
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error('翻译失败'));
        }
    }

    /**
     * 使用 JSON Mode 生成变量命名建议（非流式）
     */
    async generateNamingSuggestions(text: string, fileExtension: string): Promise<NamingSuggestion[]> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Azure OpenAI API Key 和 Endpoint');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const count = config.get<number>('namingCount', 3);
        const deploymentName = config.get<string>('azureOpenAIDeploymentName', 'gpt-4');

        // 根据文件扩展名确定命名风格
        const styleMap: { [key: string]: string } = {
            'js': 'camelCase (如: userList, getData)',
            'ts': 'camelCase (如: userList, getData)',
            'jsx': 'camelCase (如: userList, getData)',
            'tsx': 'camelCase (如: userList, getData)',
            'java': 'camelCase (如: userList, getData)',
            'cs': 'camelCase (如: userList, getData)',
            'go': 'camelCase (如: userList, getData)',
            'py': 'snake_case (如: user_list, get_data)',
            'rb': 'snake_case (如: user_list, get_data)',
            'php': 'snake_case (如: user_list, get_data)',
            'sql': 'snake_case (如: user_list, get_data)',
            'css': 'kebab-case (如: user-list, get-data)',
            'scss': 'kebab-case (如: user-list, get-data)',
            'less': 'kebab-case (如: user-list, get-data)',
            'html': 'kebab-case (如: user-list, get-data)',
            'vue': 'camelCase (如: userList, getData)',
            'rs': 'snake_case (如: user_list, get_data)'
        };

        const namingStyle = styleMap[fileExtension] || 'camelCase (如: userList, getData)';

        try {
            const response = await this.client!.chat.completions.create({
                model: deploymentName,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的编程命名助手。请根据中文描述生成规范的英文变量/函数/类命名。'
                    },
                    {
                        role: 'user',
                        content: `请根据以下中文描述，生成 ${count} 个符合 ${namingStyle} 规范的变量/函数/类命名建议。

描述：${text}

请严格按以下 JSON 格式返回（不要包含其他内容）：
{
  "suggestions": [
    {
      "name": "建议的命名",
      "style": "命名风格",
      "description": "简短说明"
    }
  ]
}`
                    }
                ],
                response_format: { type: 'json_object' },  // 强制 JSON Mode
                max_completion_tokens: 128000
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('生成命名建议失败：模型返回空内容');
            }

            // 解析 JSON
            const parsed = JSON.parse(content);
            if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
                throw new Error('生成命名建议失败：返回格式不正确');
            }

            return parsed.suggestions.slice(0, count) as NamingSuggestion[];
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('JSON')) {
                    throw new Error(`JSON 解析失败: ${error.message}`);
                }
                throw error;
            }
            throw new Error('生成命名建议时发生未知错误');
        }
    }

    /**
     * 检查配置是否完整
     */
    isConfigured(): boolean {
        return this.initializeClient();
    }
}
