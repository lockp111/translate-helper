import * as vscode from 'vscode';
import { ILLMProvider, ProviderType } from './types';
import { OpenAIService } from './openAIService';
import { ClaudeService } from './claudeService';
import { ZhipuService } from './zhipuService';
import { DeepSeekService } from './deepseekService';
import { SiliconFlowService } from './siliconflowService';
import { GeminiService } from './geminiService';
import { KimiService } from './kimiService';

/**
 * Provider 缓存
 */
const providerCache: Map<ProviderType, ILLMProvider> = new Map();

/**
 * 获取当前配置的 Provider 类型
 */
export function getProviderType(): ProviderType {
    const config = vscode.workspace.getConfiguration('translateHelper');
    return config.get<ProviderType>('provider', 'openai');
}

/**
 * 根据类型创建 Provider 实例
 */
function createProvider(type: ProviderType): ILLMProvider {
    switch (type) {
        case 'openai':
            return new OpenAIService();
        case 'claude':
            return new ClaudeService();
        case 'zhipu':
            return new ZhipuService();
        case 'deepseek':
            return new DeepSeekService();
        case 'siliconflow':
            return new SiliconFlowService();
        case 'gemini':
            return new GeminiService();
        case 'kimi':
            return new KimiService();
        default:
            return new OpenAIService();
    }
}

/**
 * 获取当前配置的 Provider 实例
 * 使用缓存避免重复创建
 */
export function getProvider(): ILLMProvider {
    const type = getProviderType();

    // 检查缓存
    let provider = providerCache.get(type);
    if (provider) {
        return provider;
    }

    // 创建新实例并缓存
    provider = createProvider(type);
    providerCache.set(type, provider);

    return provider;
}

/**
 * 清除 Provider 缓存
 * 当配置变更时调用
 */
export function clearProviderCache(): void {
    providerCache.clear();
}

/**
 * Provider 显示名称
 */
export const PROVIDER_NAMES: { [key in ProviderType]: string } = {
    'openai': 'OpenAI',
    'claude': 'Claude (Anthropic)',
    'zhipu': '智谱 GLM',
    'deepseek': 'DeepSeek',
    'siliconflow': '硅基流动',
    'gemini': 'Google Gemini',
    'kimi': 'Kimi (月之暗面)'
};

/**
 * 获取当前 Provider 的显示名称
 */
export function getProviderName(): string {
    return PROVIDER_NAMES[getProviderType()];
}

/**
 * 获取当前 Provider 的配置设置键
 */
export function getProviderSettingsKey(): string {
    const type = getProviderType();
    switch (type) {
        case 'openai':
            return 'translateHelper.openaiApiKey';
        case 'claude':
            return 'translateHelper.claudeApiKey';
        case 'zhipu':
            return 'translateHelper.zhipuApiKey';
        case 'deepseek':
            return 'translateHelper.deepseekApiKey';
        case 'siliconflow':
            return 'translateHelper.siliconflowApiKey';
        case 'gemini':
            return 'translateHelper.geminiApiKey';
        case 'kimi':
            return 'translateHelper.kimiApiKey';
        default:
            return 'translateHelper.provider';
    }
}
