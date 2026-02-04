import * as vscode from 'vscode';

interface NamingSuggestion {
    name: string;
    style: string;
    description: string;
}

// 保存装饰类型，用于清除
let translationDecorationType: vscode.TextEditorDecorationType | undefined;

/**
 * 使用编辑器内联装饰显示翻译结果（直接显示在选中文本旁边）
 */
export async function showTranslationDialog(
    originalText: string,
    translatedText: string
): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        // 如果没有编辑器，回退到简单弹窗
        vscode.window.showInformationMessage(`🌐 ${translatedText}`);
        return;
    }

    // 清除之前的装饰
    if (translationDecorationType) {
        translationDecorationType.dispose();
    }

    // 创建装饰类型 - 在选中文本后面显示翻译结果
    translationDecorationType = vscode.window.createTextEditorDecorationType({
        after: {
            contentText: ` 🌐 ${translatedText}`,
            color: new vscode.ThemeColor('editorInfo.foreground'),
            backgroundColor: new vscode.ThemeColor('editor.hoverHighlightBackground'),
            fontStyle: 'italic',
            margin: '0 0 0 10px',
            border: '1px solid',
            borderColor: new vscode.ThemeColor('editorInfo.foreground'),
        },
        rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
    });

    // 获取选中区域的最后一行
    const selection = editor.selection;
    const endPosition = selection.end;
    const range = new vscode.Range(endPosition, endPosition);

    // 应用装饰
    editor.setDecorations(translationDecorationType, [{ range }]);

    // 5秒后自动清除装饰
    setTimeout(() => {
        if (translationDecorationType) {
            translationDecorationType.dispose();
            translationDecorationType = undefined;
        }
    }, 5000);

    // 当用户点击其他地方或选择变化时清除装饰
    const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
        if (translationDecorationType) {
            translationDecorationType.dispose();
            translationDecorationType = undefined;
        }
        disposable.dispose();
    });
}

/**
 * 使用弹窗显示命名建议
 */
export async function showNamingDialog(
    originalText: string,
    suggestions: NamingSuggestion[]
): Promise<void> {
    if (!suggestions || suggestions.length === 0) {
        vscode.window.showWarningMessage('没有可用的命名建议');
        return;
    }

    interface NamingQuickPickItem extends vscode.QuickPickItem {
        name: string;
    }

    const items: NamingQuickPickItem[] = suggestions.map((s, index) => ({
        label: `${index === 0 ? '$(star-full) ' : '$(symbol-variable) '}${s.name}`,
        description: s.style,
        detail: s.description,
        name: s.name,
        alwaysShow: true
    }));

    const quickPick = vscode.window.createQuickPick<NamingQuickPickItem>();
    quickPick.title = `💡 命名建议 - "${originalText.length > 20 ? originalText.substring(0, 20) + '...' : originalText}"`;
    quickPick.placeholder = '选择一个命名建议（回车替换）';
    quickPick.items = items;
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;

    quickPick.onDidAccept(async () => {
        const selected = quickPick.selectedItems[0];
        if (!selected) {
            quickPick.hide();
            return;
        }

        // 替换选中的文本
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            await editor.edit(editBuilder => {
                editBuilder.replace(selection, selected.name);
            });
            vscode.window.showInformationMessage(`已替换为: ${selected.name}`);
        }
        quickPick.hide();
    });

    quickPick.onDidHide(() => quickPick.dispose());
    quickPick.show();
}
