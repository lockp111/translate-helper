import * as vscode from 'vscode';
import { AzureOpenAIService } from '../providers/azureOpenAIService';
import { ResultPanel } from '../ui/resultPanel';

let openAIService: AzureOpenAIService | null = null;

export async function namingCommand() {
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

    const fileName = editor.document.fileName;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

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

    // 显示进度
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: '正在使用 AI 生成命名建议...',
        cancellable: true
    }, async (progress, token) => {
        // 监听取消
        token.onCancellationRequested(() => {
            vscode.window.showInformationMessage('已取消生成');
        });

        try {
            const suggestions = await openAIService!.generateNamingSuggestions(text, extension);
            
            if (suggestions && suggestions.length > 0) {
                ResultPanel.showNamingResult(text, suggestions);
            } else {
                vscode.window.showWarningMessage('无法生成命名建议');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            vscode.window.showErrorMessage(`生成命名建议出错: ${errorMessage}`);
        }
    });
}
