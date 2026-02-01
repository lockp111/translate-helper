import * as vscode from 'vscode';

export class TranslateCodeLensProvider implements vscode.CodeLensProvider {
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        // 监听选区变化事件
        vscode.window.onDidChangeTextEditorSelection(() => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    provideCodeLenses(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): vscode.CodeLens[] | undefined {
        // 检查配置
        const config = vscode.workspace.getConfiguration('translateHelper');
        const enabled = config.get<boolean>('enableQuickActions', true);
        if (!enabled) {
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // 获取选中的范围
        const selection = editor.selection;
        if (selection.isEmpty) {
            return;
        }

        const selectedText = document.getText(selection);
        if (!selectedText || selectedText.trim().length === 0) {
            return;
        }

        const codeLenses: vscode.CodeLens[] = [];

        // 创建翻译 CodeLens
        const translateLens = new vscode.CodeLens(
            new vscode.Range(selection.start, selection.end),
            {
                title: '$(globe) 翻译',
                tooltip: '翻译选中的文本',
                command: 'translateHelper.translate'
            }
        );
        codeLenses.push(translateLens);

        // 创建命名建议 CodeLens
        const namingLens = new vscode.CodeLens(
            new vscode.Range(selection.start, selection.end),
            {
                title: '$(lightbulb) 命名',
                tooltip: '获取变量命名建议',
                command: 'translateHelper.naming'
            }
        );
        codeLenses.push(namingLens);

        return codeLenses;
    }
}
