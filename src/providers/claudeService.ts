import Anthropic from '@anthropic-ai/sdk';
import * as vscode from 'vscode';
import {
    ILLMProvider,
    NamingSuggestion,
    StreamCallbacks,
    NAMING_STYLE_MAP,
    getTranslationSystemPrompt,
    getTranslationUserPrompt,
    getNamingSystemPrompt,
    getNamingUserPrompt
} from './types';

/**
 * Claude (Anthropic) Provider
 * 官方文档: https://docs.anthropic.com/
 */
export class ClaudeService implements ILLMProvider {
    private client: Anthropic | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): boolean {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('claudeApiKey', '');
        const baseURL = config.get<string>('claudeBaseUrl', '');

        if (!apiKey) {
            this.client = null;
            return false;
        }

        try {
            this.client = new Anthropic({
                apiKey: apiKey,
                ...(baseURL && { baseURL })
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Claude client:', error);
            this.client = null;
            return false;
        }
    }

    async translateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Claude API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const targetLang = config.get<string>('targetLanguage', 'zh');
        const model = config.get<string>('claudeModel')!;

        try {
            const response = await this.client!.messages.create({
                model: model,
                max_tokens: 8192,
                system: getTranslationSystemPrompt(),
                messages: [
                    { role: 'user', content: getTranslationUserPrompt(text, targetLang) }
                ],
                stream: false
            });

            const content = response.content[0];
            if (content.type === 'text' && content.text) {
                callbacks.onChunk(content.text);
            }

            callbacks.onComplete();
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error('翻译失败'));
        }
    }

    async generateNamingSuggestions(text: string, fileExtension: string): Promise<NamingSuggestion[]> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Claude API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const count = config.get<number>('namingCount', 3);
        const model = config.get<string>('claudeModel')!;
        const namingStyle = NAMING_STYLE_MAP[fileExtension] || 'camelCase (如: userList, getData)';

        try {
            const response = await this.client!.messages.create({
                model: model,
                max_tokens: 4096,
                system: getNamingSystemPrompt(),
                messages: [
                    { role: 'user', content: getNamingUserPrompt(text, count, namingStyle) }
                ]
            });

            const content = response.content[0];
            if (content.type !== 'text' || !content.text) {
                throw new Error('生成命名建议失败：模型返回空内容');
            }

            const parsed = JSON.parse(content.text);
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

    isConfigured(): boolean {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('claudeApiKey', '');
        return !!apiKey;
    }
}
