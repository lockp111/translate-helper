import { GoogleGenAI } from '@google/genai';
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
 * Google Gemini Provider
 * 官方文档: https://ai.google.dev/
 */
export class GeminiService implements ILLMProvider {
    private client: GoogleGenAI | null = null;

    constructor() {
        this.initializeClient();
    }

    private initializeClient(): boolean {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('geminiApiKey', '');

        if (!apiKey) {
            this.client = null;
            return false;
        }

        try {
            this.client = new GoogleGenAI({
                apiKey: apiKey
            });
            return true;
        } catch (error) {
            console.error('Failed to initialize Gemini client:', error);
            this.client = null;
            return false;
        }
    }

    async translateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Gemini API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const targetLang = config.get<string>('targetLanguage', 'zh');
        const modelName = config.get<string>('geminiModel')!;

        try {
            const response = await this.client!.models.generateContent({
                model: modelName,
                contents: getTranslationUserPrompt(text, targetLang),
                config: {
                    systemInstruction: getTranslationSystemPrompt(),
                    // Disable thinking mode for faster response (thinkingBudget: 0)
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });

            const content = response.text;
            if (content) {
                callbacks.onChunk(content);
            }

            callbacks.onComplete();
        } catch (error) {
            callbacks.onError(error instanceof Error ? error : new Error('翻译失败'));
        }
    }

    async generateNamingSuggestions(text: string, fileExtension: string): Promise<NamingSuggestion[]> {
        if (!this.client) {
            if (!this.initializeClient()) {
                throw new Error('请配置 Gemini API Key');
            }
        }

        const config = vscode.workspace.getConfiguration('translateHelper');
        const count = config.get<number>('namingCount', 3);
        const modelName = config.get<string>('geminiModel')!;
        const namingStyle = NAMING_STYLE_MAP[fileExtension] || 'camelCase (如: userList, getData)';

        try {
            const response = await this.client!.models.generateContent({
                model: modelName,
                contents: getNamingUserPrompt(text, count, namingStyle),
                config: {
                    systemInstruction: getNamingSystemPrompt(),
                    responseMimeType: 'application/json',
                    // Disable thinking mode for faster response (thinkingBudget: 0)
                    thinkingConfig: { thinkingBudget: 0 }
                }
            });

            const content = response.text;
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
        const config = vscode.workspace.getConfiguration('translateHelper');
        const apiKey = config.get<string>('geminiApiKey', '');
        return !!apiKey;
    }
}
