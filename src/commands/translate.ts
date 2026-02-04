import * as vscode from 'vscode';
import { getProvider, getProviderName, getProviderSettingsKey } from '../providers/providerFactory';
import { showTranslationDialog } from '../ui/quickDialog';
import { ILLMProvider } from '../providers/types';

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

    // 使用进度通知显示翻译过程
    let translationResult = '';

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `正在使用 ${providerName} 翻译...`,
        cancellable: true
    }, async (progress, token) => {
        return new Promise<void>((resolve, reject) => {
            let cancelled = false;

            token.onCancellationRequested(() => {
                cancelled = true;
                vscode.window.showInformationMessage('已取消翻译');
                resolve();
            });

            provider.translateStream(text, {
                onChunk: (chunk) => {
                    if (cancelled) return;
                    translationResult += chunk;
                    // 显示翻译进度预览
                    const preview = translationResult.length > 60
                        ? translationResult.substring(0, 60) + '...'
                        : translationResult;
                    progress.report({ message: preview });
                },
                onComplete: () => {
                    if (cancelled) return;
                    lastTranslationResult = translationResult;
                    resolve();
                },
                onError: (error) => {
                    if (cancelled) return;
                    vscode.window.showErrorMessage(`翻译出错: ${error.message}`);
                    resolve();
                }
            }).catch((error) => {
                if (!cancelled) {
                    const errorMessage = error instanceof Error ? error.message : '未知错误';
                    vscode.window.showErrorMessage(`翻译出错: ${errorMessage}`);
                }
                resolve();
            });
        });
    });

    // 翻译完成后显示结果弹窗
    if (translationResult) {
        await showTranslationDialog(text, translationResult);
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
