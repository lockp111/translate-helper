import * as vscode from 'vscode';
import { getProvider, getProviderName, getProviderSettingsKey } from '../providers/providerFactory';
import { showNamingDialog } from '../ui/quickDialog';
import { ILLMProvider } from '../providers/types';

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

    // 获取当前配置的 Provider
    const provider: ILLMProvider = getProvider();
    const providerName = getProviderName();

    if (!provider.isConfigured()) {
        const action = await vscode.window.showErrorMessage(
            `请先配置 ${providerName} 的 API Key`,
            '打开设置',
            '取消'
        );

        if (action === '打开设置') {
            vscode.commands.executeCommand(
                'workbench.action.openSettings',
                getProviderSettingsKey()
            );
        }
        return;
    }

    // 显示进度
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `正在使用 ${providerName} 生成命名建议...`,
        cancellable: true
    }, async (progress, token) => {
        // 监听取消
        token.onCancellationRequested(() => {
            vscode.window.showInformationMessage('已取消生成');
        });

        try {
            const suggestions = await provider.generateNamingSuggestions(text, extension);

            if (suggestions && suggestions.length > 0) {
                // 使用弹窗显示命名建议
                await showNamingDialog(text, suggestions);
            } else {
                vscode.window.showWarningMessage('无法生成命名建议');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            vscode.window.showErrorMessage(`生成命名建议出错: ${errorMessage}`);
        }
    });
}
