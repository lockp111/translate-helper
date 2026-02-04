/**
 * 命名建议接口
 */
export interface NamingSuggestion {
    name: string;
    style: string;
    description: string;
}

/**
 * 流式响应回调接口
 */
export interface StreamCallbacks {
    onChunk: (chunk: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
}

/**
 * LLM Provider 统一接口
 */
export interface ILLMProvider {
    /**
     * 使用流式响应翻译文本
     */
    translateStream(text: string, callbacks: StreamCallbacks): Promise<void>;

    /**
     * 生成变量命名建议
     */
    generateNamingSuggestions(text: string, fileExtension: string): Promise<NamingSuggestion[]>;

    /**
     * 检查配置是否完整
     */
    isConfigured(): boolean;
}

/**
 * Provider 类型枚举
 */
export type ProviderType = 'openai' | 'claude' | 'zhipu' | 'deepseek' | 'siliconflow' | 'gemini' | 'kimi';

/**
 * 语言名称映射
 */
export const LANGUAGE_NAMES: { [key: string]: string } = {
    'zh': '中文',
    'en': '英文',
    'ja': '日文',
    'ko': '韩文',
    'fr': '法文',
    'de': '德文',
    'es': '西班牙文',
    'ru': '俄文'
};

/**
 * 文件扩展名到命名风格的映射
 */
export const NAMING_STYLE_MAP: { [key: string]: string } = {
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

/**
 * 获取翻译系统提示
 */
export function getTranslationSystemPrompt(): string {
    return '你是一个专业的翻译助手。请准确翻译用户提供的文本，只返回翻译结果，不要添加解释。';
}

/**
 * 获取翻译用户提示
 */
export function getTranslationUserPrompt(text: string, targetLang: string): string {
    return `请将以下文本翻译成${LANGUAGE_NAMES[targetLang] || '中文'}：\n\n${text}`;
}

/**
 * 获取命名系统提示
 */
export function getNamingSystemPrompt(): string {
    return '你是一个专业的编程命名助手。请根据中文描述生成规范的英文变量/函数/类命名。';
}

/**
 * 获取命名用户提示
 */
export function getNamingUserPrompt(text: string, count: number, namingStyle: string): string {
    return `请根据以下中文描述，生成 ${count} 个符合 ${namingStyle} 规范的变量/函数/类命名建议。

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
}`;
}
