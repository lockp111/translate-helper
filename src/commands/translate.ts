import * as vscode from 'vscode';
import { AzureOpenAIService } from '../providers/openAIService';
import { ResultPanel } from '../ui/resultPanel';

let openAIService: AzureOpenAIService | null = null;
let lastTranslationResult: string = '';

export async function translateCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('请先打开一个文件');
        return;
    }

    const selection = editor.selection;
    const text = editor.document.getText(selection);

    if (!text || text.trim().length === 0) {
        vscode.window.showWarningMessage('请先选中文本');
        return;
    }

    // 初始化或复用服务实例
    if (!openAIService) {
        openAIService = new AzureOpenAIService();
    }

    if (!openAIService.isConfigured()) {
        const action = await vscode.window.showErrorMessage(
            '请先配置 Azure OpenAI API Key 和 Endpoint',
            '打开设置',
            '取消'
        );
        
        if (action === '打开设置') {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                'translateHelper.azureOpenAIKey'
            );
        }
        return;
    }

    // 显示流式结果面板（右侧半屏）
    ResultPanel.showStreaming(text, 'translation');

    try {
        await openAIService.translateStream(text, {
            onChunk: (chunk) => {
                ResultPanel.appendChunk(chunk);
            },
            onComplete: () => {
                lastTranslationResult = ResultPanel.currentResult || '';
                ResultPanel.completeStream();
            },
            onError: (error) => {
                vscode.window.showErrorMessage(`翻译出错: ${error.message}`);
            }
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        vscode.window.showErrorMessage(`翻译出错: ${errorMessage}`);
    }
}

export async function replaceWithTranslationCommand() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    if (!lastTranslationResult) {
        vscode.window.showWarningMessage('没有可用的翻译结果');
        return;
    }

    const selection = editor.selection;
    await editor.edit(editBuilder => {
        editBuilder.replace(selection, lastTranslationResult);
    });

    vscode.window.showInformationMessage('已替换为翻译结果');
}
