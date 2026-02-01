import * as vscode from 'vscode';
import { translateCommand, replaceWithTranslationCommand } from './commands/translate';
import { namingCommand } from './commands/naming';
import { TranslateCodeLensProvider } from './providers/codeLensProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('翻译助手插件已激活');

    // 注册命令
    const translateDisposable = vscode.commands.registerCommand(
        'translateHelper.translate',
        translateCommand
    );

    const namingDisposable = vscode.commands.registerCommand(
        'translateHelper.naming',
        namingCommand
    );

    const replaceDisposable = vscode.commands.registerCommand(
        'translateHelper.replaceWithTranslation',
        replaceWithTranslationCommand
    );

    // 注册 CodeLensProvider
    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
        [{ scheme: 'file' }, { scheme: 'untitled' }],
        new TranslateCodeLensProvider()
    );

    // 注册所有 disposable
    context.subscriptions.push(
        translateDisposable,
        namingDisposable,
        replaceDisposable,
        codeLensProviderDisposable
    );
}

export function deactivate() {
    console.log('翻译助手插件已停用');
}
