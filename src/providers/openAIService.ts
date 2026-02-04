import { OpenAI } from 'openai';
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
 * OpenAI 兼容 Provider
 * 支持 OpenAI API 及其兼容服务（如 Azure OpenAI、各种代理等）
 */
export class OpenAIService implements ILLMProvider {
    private client: OpenAI | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): boolean {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('openaiApiKey', '');
        const baseURL = config.get<string>('openaiBaseUrl', '');

        if (!apiKey) {
            this.client = null;
            return false;
        }

        try {
            this.client = new OpenAI({
                apiKey: apiKey,
                ...(baseURL && { baseURL })
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize OpenAI client:', error);
            this.client = null;
            return false;
        }
    }

    async translateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 OpenAI API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const targetLang = config.get<string>('targetLanguage', 'zh');
        const model = config.get<string>('openaiModel')!;

        try {
            const stream = await this.client!.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: getTranslationSystemPrompt() },
                    { role: 'user', content: getTranslationUserPrompt(text, targetLang) }
                ],
                stream: true
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

    async generateNamingSuggestions(text: string, fileExtension: string): Promise<NamingSuggestion[]> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 OpenAI API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const count = config.get<number>('namingCount', 3);
        const model = config.get<string>('openaiModel')!;
        const namingStyle = NAMING_STYLE_MAP[fileExtension] || 'camelCase (如: userList, getData)';

        try {
            const response = await this.client!.chat.completions.create({
                model: model,
                messages: [
                    { role: 'system', content: getNamingSystemPrompt() },
                    { role: 'user', content: getNamingUserPrompt(text, count, namingStyle) }
                ],
                response_format: { type: 'json_object' }
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('生成命名建议失败：模型返回空内容');
            }

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

    isConfigured(): boolean {
        return this.initializeClient();
    }
}
