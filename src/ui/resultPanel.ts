import * as vscode from 'vscode';

interface NamingSuggestion {
    name: string;
    style: string;
    description: string;
}

export class ResultPanel {
    private static panel: vscode.WebviewPanel | undefined;
    private static _currentResult: string = '';
    private static isStreaming: boolean = false;

    static get currentResult(): string {
        return ResultPanel._currentResult;
    }

    static showStreaming(originalText: string, type: 'translation' | 'naming') {
        // 创建或显示面板 - 在右侧半屏显示
        if (!ResultPanel.panel) {
            ResultPanel.panel = vscode.window.createWebviewPanel(
                'translateHelper',
                '翻译助手',
                {
                    viewColumn: vscode.ViewColumn.Two  // 右侧分栏，转移焦点
                },
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            // 监听面板关闭
            ResultPanel.panel.onDidDispose(
                () => {
                    ResultPanel.panel = undefined;
                    ResultPanel._currentResult = '';
                    ResultPanel.isStreaming = false;
                },
                null,
                []
            );
        } else {
            ResultPanel.panel.reveal(vscode.ViewColumn.Two);
        }

        ResultPanel._currentResult = '';
        ResultPanel.isStreaming = true;
        
        if (ResultPanel.panel) {
            ResultPanel.panel.webview.html = ResultPanel.getStreamingHtml(originalText, type);
            
            // 监听来自 webview 的消息
            ResultPanel.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'copy':
                            vscode.env.clipboard.writeText(message.text);
                            vscode.window.showInformationMessage('已复制到剪贴板');
                            break;
                        case 'replace':
                            ResultPanel.replaceInEditor(message.text);
                            break;
                        case 'close':
                            ResultPanel.panel?.dispose();
                            break;
                    }
                },
                undefined,
                []
            );
        }
    }

    static appendChunk(chunk: string) {
        ResultPanel._currentResult += chunk;
        if (ResultPanel.panel) {
            ResultPanel.panel.webview.postMessage({
                command: 'appendChunk',
                chunk: chunk
            });
        }
    }

    static completeStream() {
        ResultPanel.isStreaming = false;
        if (ResultPanel.panel) {
            ResultPanel.panel.webview.postMessage({
                command: 'complete'
            });
        }
    }

    static showNamingResult(originalText: string, suggestions: NamingSuggestion[]) {
        // 创建或显示面板
        if (!ResultPanel.panel) {
            ResultPanel.panel = vscode.window.createWebviewPanel(
                'translateHelper',
                '翻译助手',
                {
                    viewColumn: vscode.ViewColumn.Two  // 右侧分栏，转移焦点
                },
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            ResultPanel.panel.onDidDispose(
                () => {
                    ResultPanel.panel = undefined;
                },
                null,
                []
            );
        } else {
            ResultPanel.panel.reveal(vscode.ViewColumn.Two);
        }

        if (ResultPanel.panel) {
            ResultPanel.panel.webview.html = ResultPanel.getNamingHtml(originalText, suggestions);
            
            ResultPanel.panel.webview.onDidReceiveMessage(
                message => {
                    switch (message.command) {
                        case 'copy':
                            vscode.env.clipboard.writeText(message.text);
                            vscode.window.showInformationMessage('已复制到剪贴板');
                            break;
                        case 'replace':
                            ResultPanel.replaceInEditor(message.text);
                            break;
                        case 'close':
                            ResultPanel.panel?.dispose();
                            break;
                    }
                },
                undefined,
                []
            );
        }
    }

    private static replaceInEditor(text: string) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const selection = editor.selection;
        editor.edit(editBuilder => {
            editBuilder.replace(selection, text);
        });

        vscode.window.showInformationMessage('已替换为编辑器中的文本');
    }

    private static getStreamingHtml(originalText: string, type: 'translation' | 'naming'): string {
        const config = vscode.workspace.getConfiguration('translateHelper');
        const targetLang = config.get<string>('targetLanguage', 'zh');
        
        const langNames: { [key: string]: string } = {
            'zh': '中文',
            'en': '英文',
            'ja': '日文',
            'ko': '韩文',
            'fr': '法文',
            'de': '德文',
            'es': '西班牙文',
            'ru': '俄文'
        };

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>翻译助手</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    :root {
                        --bg-primary: var(--vscode-editor-background);
                        --bg-secondary: var(--vscode-editor-background);
                        --text-primary: var(--vscode-editor-foreground);
                        --text-secondary: var(--vscode-descriptionForeground);
                        --border-primary: var(--vscode-panel-border);
                        --border-accent: var(--vscode-focusBorder);
                        --radius: 4px;
                        --transition: 0.2s ease;
                    }
                    
                    body {
                        font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 28px 24px;
                        background: var(--bg-primary);
                        color: var(--text-primary);
                        line-height: 1.6;
                        max-width: 100%;
                        overflow-x: hidden;
                        min-height: 100vh;
                    }

                    /* Header Styles */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 32px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid var(--border-primary);
                        animation: fadeIn 0.3s ease forwards;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .header-icon {
                        font-size: 18px;
                        opacity: 0.8;
                    }

                    .header h2 {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 500;
                        color: var(--text-primary);
                        letter-spacing: 0.2px;
                    }

                    .header-actions {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .status {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 12px;
                        color: var(--text-secondary);
                        font-family: var(--vscode-editor-font-family), monospace;
                    }

                    .status.complete {
                        color: var(--vscode-testing-iconPassed);
                    }

                    .spinner {
                        width: 12px;
                        height: 12px;
                        border: 1.5px solid var(--text-secondary);
                        border-top-color: transparent;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }

                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }

                    .close-btn {
                        background: transparent;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        color: var(--text-secondary);
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: color var(--transition);
                        line-height: 1;
                    }

                    .close-btn:hover {
                        color: var(--text-primary);
                    }

                    /* Section Styles */
                    .section {
                        margin-bottom: 24px;
                        animation: fadeIn 0.3s ease forwards;
                        opacity: 0;
                    }

                    .section:nth-child(2) { animation-delay: 0.05s; }
                    .section:nth-child(3) { animation-delay: 0.1s; }

                    .section-label {
                        font-size: 11px;
                        color: var(--text-secondary);
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 500;
                        font-family: var(--vscode-editor-font-family), monospace;
                    }

                    .section-content {
                        font-size: 14px;
                        word-break: break-word;
                        line-height: 1.7;
                        color: var(--text-primary);
                        padding: 12px 0;
                        border-bottom: 1px solid var(--border-primary);
                    }

                    /* Source Section */
                    .source-section .section-content {
                        color: var(--text-secondary);
                        font-family: var(--vscode-editor-font-family), monospace;
                        font-size: 13px;
                        border-bottom: 1px solid var(--border-primary);
                    }

                    /* Result Section */
                    .result-section .section-content {
                        font-size: 15px;
                        line-height: 1.8;
                        border-bottom: none;
                        padding: 12px 0 16px;
                    }

                    .result-text.streaming::after {
                        content: '|';
                        animation: blink 1s infinite;
                        color: var(--text-secondary);
                        margin-left: 1px;
                    }

                    @keyframes blink {
                        0%, 50% { opacity: 1; }
                        51%, 100% { opacity: 0; }
                    }

                    /* Button Styles */
                    .button-group {
                        display: flex;
                        gap: 8px;
                        opacity: 0;
                        transform: translateY(4px);
                        transition: all 0.3s ease;
                    }

                    .button-group.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }

                    .btn {
                        flex: 1;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-size: 12px;
                        font-weight: 500;
                        transition: opacity var(--transition);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        font-family: var(--vscode-font-family), sans-serif;
                    }

                    .btn:hover {
                        opacity: 0.9;
                    }

                    .btn-secondary {
                        background: transparent;
                        color: var(--vscode-button-foreground);
                        border: 1px solid var(--border-primary);
                    }

                    .btn-secondary:hover {
                        border-color: var(--border-accent);
                    }

                    /* Empty State */
                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 60px 20px;
                        text-align: center;
                        opacity: 0.6;
                    }

                    .empty-icon {
                        font-size: 40px;
                        margin-bottom: 16px;
                        opacity: 0.5;
                    }

                    .empty-title {
                        font-size: 14px;
                        font-weight: 500;
                        margin-bottom: 6px;
                    }

                    .empty-subtitle {
                        font-size: 12px;
                        color: var(--text-secondary);
                    }

                    .shortcut {
                        font-family: var(--vscode-editor-font-family), monospace;
                        background: var(--vscode-textBlockQuote-background);
                        padding: 2px 6px;
                        border-radius: 3px;
                        font-size: 11px;
                        margin: 0 2px;
                        font-weight: 500;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-title">
                        <span class="header-icon">${type === 'translation' ? '🌐' : '💡'}</span>
                        <h2>${type === 'translation' ? '翻译结果' : '命名建议'}</h2>
                    </div>
                    <div class="header-actions">
                        <div class="status" id="status">
                            <div class="spinner"></div>
                            <span>生成中...</span>
                        </div>
                        <button class="close-btn" onclick="closePanel()">&times;</button>
                    </div>
                </div>

                <div class="section source-section">
                    <div class="section-label">原文</div>
                    <div class="section-content">${ResultPanel.escapeHtml(originalText)}</div>
                </div>

                <div class="section result-section">
                    <div class="section-label">${type === 'translation' ? (langNames[targetLang] || targetLang) : '建议'}</div>
                    <div class="section-content">
                        <span class="result-text streaming" id="resultText"></span>
                    </div>
                </div>

                <div class="button-group" id="buttonGroup">
                    <button class="btn" onclick="copyResult()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        复制
                    </button>
                    <button class="btn btn-secondary" onclick="replaceResult()">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        替换
                    </button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let resultText = '';
                    let isComplete = false;

                    window.addEventListener('message', event => {
                        const message = event.data;
                        
                        switch (message.command) {
                            case 'appendChunk':
                                resultText += message.chunk;
                                document.getElementById('resultText').textContent = resultText;
                                break;
                            case 'complete':
                                isComplete = true;
                                const statusEl = document.getElementById('status');
                                statusEl.innerHTML = '<span>✓ 完成</span>';
                                statusEl.classList.add('complete');
                                document.getElementById('resultText').classList.remove('streaming');
                                document.getElementById('buttonGroup').classList.add('visible');
                                break;
                        }
                    });

                    function copyResult() {
                        vscode.postMessage({
                            command: 'copy',
                            text: resultText
                        });
                    }

                    function replaceResult() {
                        vscode.postMessage({
                            command: 'replace',
                            text: resultText
                        });
                    }

                    function closePanel() {
                        vscode.postMessage({ command: 'close' });
                    }
                </script>
            </body>
            </html>
        `;
    }

    private static getNamingHtml(originalText: string, suggestions: NamingSuggestion[]): string {
        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>翻译助手</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    :root {
                        --bg-primary: var(--vscode-editor-background);
                        --bg-secondary: var(--vscode-editor-background);
                        --text-primary: var(--vscode-editor-foreground);
                        --text-secondary: var(--vscode-descriptionForeground);
                        --border-primary: var(--vscode-panel-border);
                        --border-accent: var(--vscode-focusBorder);
                        --radius: 4px;
                        --transition: 0.2s ease;
                    }
                    
                    body {
                        font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, sans-serif;
                        padding: 28px 24px;
                        background: var(--bg-primary);
                        color: var(--text-primary);
                        line-height: 1.6;
                        max-width: 100%;
                        overflow-x: hidden;
                        min-height: 100vh;
                    }

                    /* Header Styles */
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 32px;
                        padding-bottom: 16px;
                        border-bottom: 1px solid var(--border-primary);
                        animation: fadeIn 0.3s ease forwards;
                    }

                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }

                    .header-title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .header-icon {
                        font-size: 18px;
                        opacity: 0.8;
                    }

                    .header h2 {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 500;
                        color: var(--text-primary);
                        letter-spacing: 0.2px;
                    }

                    .close-btn {
                        background: transparent;
                        border: none;
                        font-size: 20px;
                        cursor: pointer;
                        padding: 4px;
                        color: var(--text-secondary);
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: color var(--transition);
                        line-height: 1;
                    }

                    .close-btn:hover {
                        color: var(--text-primary);
                    }

                    /* Section Styles */
                    .section {
                        margin-bottom: 24px;
                        animation: fadeIn 0.3s ease forwards;
                        opacity: 0;
                    }

                    .section:nth-child(2) { animation-delay: 0.05s; }

                    .section-label {
                        font-size: 11px;
                        color: var(--text-secondary);
                        margin-bottom: 8px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        font-weight: 500;
                        font-family: var(--vscode-editor-font-family), monospace;
                    }

                    .section-content {
                        font-size: 14px;
                        word-break: break-word;
                        line-height: 1.7;
                        color: var(--text-secondary);
                        font-family: var(--vscode-editor-font-family), monospace;
                        font-size: 13px;
                        padding: 12px 0;
                        border-bottom: 1px solid var(--border-primary);
                    }

                    /* Naming List */
                    .naming-list {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    /* Naming Item */
                    .naming-item {
                        padding: 16px 0;
                        border-bottom: 1px solid var(--border-primary);
                        animation: fadeIn 0.3s ease forwards;
                        opacity: 0;
                    }

                    ${suggestions.map((_, i) => `.naming-item:nth-child(${i + 1}) { animation-delay: ${0.1 + i * 0.05}s; }`).join('\n')}

                    .naming-item:last-child {
                        border-bottom: none;
                    }

                    .naming-item.recommended {
                        border-left: 2px solid var(--vscode-testing-iconPassed);
                        padding-left: 12px;
                        margin-left: -14px;
                    }

                    .naming-header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 8px;
                        flex-wrap: wrap;
                    }

                    .naming-name {
                        font-family: var(--vscode-editor-font-family), monospace;
                        font-size: 14px;
                        font-weight: 500;
                        color: var(--text-primary);
                        background: var(--vscode-textCodeBlock-background);
                        padding: 4px 10px;
                        border-radius: var(--radius);
                    }

                    .naming-style {
                        font-size: 10px;
                        color: var(--text-secondary);
                        font-family: var(--vscode-editor-font-family), monospace;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .badge {
                        font-size: 10px;
                        color: var(--vscode-testing-iconPassed);
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }

                    .badge::before {
                        content: '✓';
                        font-size: 10px;
                    }

                    .naming-desc {
                        font-size: 13px;
                        color: var(--text-secondary);
                        margin-bottom: 12px;
                        line-height: 1.6;
                    }

                    /* Button Styles */
                    .button-group {
                        display: flex;
                        gap: 8px;
                    }

                    .btn {
                        flex: 1;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 6px 12px;
                        border-radius: var(--radius);
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: 500;
                        transition: opacity var(--transition);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        font-family: var(--vscode-font-family), sans-serif;
                    }

                    .btn:hover {
                        opacity: 0.9;
                    }

                    .btn-secondary {
                        background: transparent;
                        color: var(--vscode-button-foreground);
                        border: 1px solid var(--border-primary);
                    }

                    .btn-secondary:hover {
                        border-color: var(--border-accent);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-title">
                        <span class="header-icon">💡</span>
                        <h2>命名建议</h2>
                    </div>
                    <button class="close-btn" onclick="closePanel()">&times;</button>
                </div>

                <div class="section">
                    <div class="section-label">原文</div>
                    <div class="section-content">${ResultPanel.escapeHtml(originalText)}</div>
                </div>

                <div class="naming-list">
                    ${suggestions.map((s, index) => `
                        <div class="naming-item ${index === 0 ? 'recommended' : ''}">
                            <div class="naming-header">
                                <span class="naming-name">${ResultPanel.escapeHtml(s.name)}</span>
                                <span class="naming-style">${ResultPanel.escapeHtml(s.style)}</span>
                                ${index === 0 ? '<span class="badge">推荐</span>' : ''}
                            </div>
                            <div class="naming-desc">${ResultPanel.escapeHtml(s.description)}</div>
                            <div class="button-group">
                                <button class="btn" onclick="copyText('${ResultPanel.escapeHtml(s.name)}')">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    复制
                                </button>
                                <button class="btn btn-secondary" onclick="replaceText('${ResultPanel.escapeHtml(s.name)}')">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                    替换
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function copyText(text) {
                        vscode.postMessage({
                            command: 'copy',
                            text: text
                        });
                    }

                    function replaceText(text) {
                        vscode.postMessage({
                            command: 'replace',
                            text: text
                        });
                    }

                    function closePanel() {
                        vscode.postMessage({ command: 'close' });
                    }
                </script>
            </body>
            </html>
        `;
    }

    private static escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}
