/**
 * 语言检测工具
 */
export class LanguageDetector {
    /**
     * 检测文本的主要语言
     */
    static detect(text: string): string {
        // 检测中文字符
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        
        // 检测英文字符
        const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
        
        // 检测日文字符（平假名和片假名）
        const japaneseChars = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
        
        // 检测韩文字符
        const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;

        const total = text.length;
        
        if (chineseChars / total > 0.5) {
            return 'zh';
        } else if (englishChars / total > 0.5) {
            return 'en';
        } else if (japaneseChars / total > 0.3) {
            return 'ja';
        } else if (koreanChars / total > 0.3) {
            return 'ko';
        }

        return 'auto';
    }

    /**
     * 判断是否为编程相关的关键词
     */
    static isCodeKeyword(text: string): boolean {
        const codePatterns = [
            /^[a-zA-Z_][a-zA-Z0-9_]*$/,  // 变量名
            /^[A-Z_][A-Z0-9_]*$/,         // 常量名
            /^[a-z]+([A-Z][a-z]+)*$/,     // camelCase
            /^[a-z]+(_[a-z]+)*$/,         // snake_case
            /^[a-z]+(-[a-z]+)*$/,         // kebab-case
            /^[A-Z][a-z]+([A-Z][a-z]+)*$/ // PascalCase
        ];

        return codePatterns.some(pattern => pattern.test(text));
    }

    /**
     * 清理文本中的特殊字符
     */
    static sanitize(text: string): string {
        return text
            .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f]/g, '')  // 控制字符
            .replace(/\s+/g, ' ')  // 多个空格合并
            .trim();
    }

    /**
     * 截断文本到指定长度
     */
    static truncate(text: string, maxLength: number = 128000): string {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }
}
