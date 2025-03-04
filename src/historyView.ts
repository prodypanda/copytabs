import * as vscode from 'vscode';
import { HistoryManager } from './historyManager';

const HISTORY_LIMIT = 10;

export class HistoryViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'copytabs.historyView';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly historyManager: HistoryManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        this.updateView(webviewView);

        webviewView.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'executeCommand':
                    await vscode.commands.executeCommand(message.commandId, ...(message.args || []));
                    if (message.commandId === 'copytabs.toggleClipboardMode') {
                        this.updateView(webviewView);
                    }
                    break;
                case 'openExternal':
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                    break;
                case 'copyItem':
                    await this.historyManager.copyHistoryItem(message.id);
                    break;
                case 'deleteItem':
                    await this.historyManager.deleteHistoryItem(message.id);
                    this.updateView(webviewView);
                    break;
                case 'clearAll':
                    await this.historyManager.clearHistory();
                    this.updateView(webviewView);
                    break;
            }
        });

        this.historyManager.onHistoryChanged(() => {
            this.updateView(webviewView);
        });
    }

    private updateView(webviewView: vscode.WebviewView) {
        try {
            webviewView.webview.html = this.getWebviewContent(this.historyManager.getHistory());
        } catch (error) {
            console.error('Failed to update history view:', error);
            webviewView.webview.html = this.getErrorContent();
        }
    }

    private getErrorContent() {
        return `
            <!DOCTYPE html>
            <html>
                <body>
                    <p>Failed to load history view. Please try reloading.</p>
                    <button onclick="vscode.postMessage({ command: 'executeCommand', commandId: 'workbench.action.webview.reloadWebviewAction' })">
                        Reload
                    </button>
                </body>
            </html>
        `;
    }

    private getWebviewContent(history: any[]) {
        const isClipboardMode = this.historyManager.isClipboardMode();
        const remainingSlots = this.historyManager.getRemainingSlots();
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/vscode-codicons/dist/codicon.css" rel="stylesheet" />
                <style>
                    body { 
                        padding: 8px; 
                        font-family: var(--vscode-font-family);
                        font-size: 13px;
                    }
                    .toolbar {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 6px;
                        margin-bottom: 12px;
                        background: var(--vscode-sideBar-background);
                        padding: 8px;
                        border-radius: 6px;
                    }
                    .toolbar button {
                        padding: 3px 8px;
                        font-size: 12px;
                        min-height: 24px;
                        min-width: 28px;
                        white-space: nowrap;
                        justify-content: center;
                    }
                    .toolbar button.icon-only {
                        width: 28px;
                        padding: 3px;
                    }
                    .toolbar button.icon-only i {
                        margin: 0;
                        font-size: 16px;
                    }
                    .divider {
                        height: 1px;
                        background-color: var(--vscode-widget-border);
                        margin: 8px 0;
                        opacity: 0.5;
                    }
                    .history-item {
                        border: 1px solid var(--vscode-widget-border);
                        margin-bottom: 8px;
                        padding: 8px;
                        border-radius: 6px;
                        background-color: var(--vscode-editor-background);
                        transition: all 0.2s ease;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    .history-item:hover {
                        background-color: var(--vscode-list-hoverBackground);
                        transform: translateX(2px);
                    }
                    .history-item::before {
                        content: '';
                        position: absolute;
                        left: 0;
                        top: 0;
                        height: 100%;
                        width: 3px;
                        background: var(--vscode-button-background);
                        opacity: 0;
                        transition: opacity 0.2s;
                    }
                    .history-item:hover::before {
                        opacity: 1;
                    }
                    .actions {
                        margin-top: 8px;
                        display: flex;
                        gap: 6px;
                        flex-wrap: wrap;
                    }
                    .actions button {
                        opacity: 0.8;
                        transition: opacity 0.2s, transform 0.2s;
                    }
                    .actions button:hover {
                        opacity: 1;
                    }
                    .actions button.delete-btn {
                        background-color: var(--vscode-errorForeground);
                        color: white;
                        opacity: 0.7;
                    }
                    .actions button.delete-btn:hover {
                        opacity: 1;
                    }
                    button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 3px 6px;
                        border-radius: 4px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        font-size: 11px;
                        min-height: 22px;
                        transition: background 0.2s ease;
                    }
                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateY(-1px);
                    }
                    .timestamp {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 4px;
                    }
                    .content-preview {
                        display: none;
                        margin-top: 8px;
                        padding: 8px;
                        background-color: var(--vscode-editor-background);
                        border-radius: 4px;
                        max-height: 200px;
                        overflow-y: auto;
                        white-space: pre-wrap;
                        font-family: var(--vscode-editor-font-family);
                        font-size: 12px;
                        border: 1px solid var(--vscode-widget-border);
                    }
                    .content-preview.show {
                        display: block;
                        animation: fadeIn 0.3s ease;
                    }
                    .mode-button {
                        background-color: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                        border: 1px solid var(--vscode-button-border);
                    }
                    .mode-button:hover {
                        background-color: var(--vscode-button-secondaryHoverBackground);
                    }
                    .codicon {
                        font-family: codicon !important;
                        font-size: 14px;
                        line-height: 14px;
                    }

                    .clear-all {
                        background-color: var(--vscode-errorForeground);
                        color: white;
                        opacity: 0.8;
                        margin-bottom: 8px;
                        transition: all 0.3s ease;
                    }
                    .clear-all:hover {
                        opacity: 1;
                        background-color: var(--vscode-errorForeground) !important;
                        transform: translateY(-1px);
                    }
                    .support-button {
                        background-color: #b1361e !important;
                        opacity: 0.8;
                        transition: all 0.3s ease !important;
                    }
                    .support-button:hover {
                        opacity: 1;
                        transform: scale(1.1) !important;
                        background-color: #d1461e !important;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(-5px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .description {
                        margin: 4px 0;
                        color: var(--vscode-foreground);
                    }
                    .empty-state {
                        text-align: center;
                        color: var(--vscode-descriptionForeground);
                        padding: 20px;
                        font-style: italic;
                    }
                    .history-counter {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 11px;
                        margin-left: auto;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .history-header {
                        display: flex;
                        align-items: center;
                        margin-bottom: 8px;
                        padding: 4px 8px;
                        background: var(--vscode-sideBarSectionHeader-background);
                        border-radius: 4px;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    }
                    .badge {
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        padding: 2px 6px;
                        border-radius: 10px;
                        font-size: 10px;
                        margin-left: 8px;
                    }
                    .badge.latest {
                        background: var(--vscode-statusBarItem-prominentBackground);
                        color: var(--vscode-statusBarItem-prominentForeground);
                    }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button class="mode-button icon-only" 
                            onclick="executeCommand('copytabs.toggleClipboardMode')"
                            title="${isClipboardMode ? vscode.l10n.t('Clipboard Mode') : vscode.l10n.t('Tab Mode')}">
                        <i class="codicon codicon-${isClipboardMode ? 'clippy' : 'window'}"></i>
                    </button>
                    <button class="icon-only" 
                            onclick="executeCommand('copytabs.copyAllTabs')"
                            title="${vscode.l10n.t('Copy all opened tabs')}">
                        <i class="codicon codicon-files"></i>
                    </button>
                    <button class="icon-only" 
                            onclick="executeCommand('copytabs.copySelectedTabs')"
                            title="${vscode.l10n.t('Copy selected tabs')}">
                        <i class="codicon codicon-checklist"></i>
                    </button>
                    <button class="icon-only" 
                            onclick="executeCommand('copytabs.copyTabsCustomFormat')"
                            title="${vscode.l10n.t('Copy tabs with custom format')}">
                        <i class="codicon codicon-settings-gear"></i>
                    </button>
                    <button onclick="executeCommand('workbench.action.openSettings', '@ext:Prodypanda.copytabs')">
                        <i class="codicon codicon-tools"></i>
                        ${vscode.l10n.t('Settings')}
                    </button>
                    <button class="support-button icon-only"
                            onclick="openExternal('https://www.buymeacoffee.com/prodypanda')"
                            title="${vscode.l10n.t('Support this extension by buying me a coffee ☕')}">
                        <i class="codicon codicon-heart"></i>
                    </button>
                </div>
                <div class="divider"></div>
                <div class="history-header">
                    <span>${vscode.l10n.t('History')}</span>
                    <div class="history-counter">
                        <i class="codicon codicon-history"></i>
                        ${history.length}/${HISTORY_LIMIT}
                    </div>
                </div>
                ${history.length > 0 ? `
                    <button class="clear-all" onclick="vscode.postMessage({ command: 'clearAll' })">
                        <i class="codicon codicon-trash"></i>
                        ${vscode.l10n.t('Clear History')}
                    </button>
                    ${history.map((item, index) => `
                        <div class="history-item">
                            <div class="timestamp">
                                <i class="codicon codicon-clock"></i>
                                ${vscode.l10n.t('Copied on')}: ${new Date(item.timestamp).toLocaleString()}
                                ${index === history.length - 1 ? '<span class="badge">Oldest</span>' : ''}
                                ${index === 0 ? '<span class="badge latest">Latest</span>' : ''}
                            </div>
                            <div class="description">${item.description}</div>
                            <div class="actions">
                                <button onclick="togglePreview(${index})" title="${vscode.l10n.t('View')}">
                                    <i class="codicon codicon-eye"></i>
                                </button>
                                <button onclick="copyItem(${index})" title="${vscode.l10n.t('Copy')}">
                                    <i class="codicon codicon-copy"></i>
                                </button>
                                <button class="delete-btn" onclick="deleteItem(${index})" title="${vscode.l10n.t('Delete')}">
                                    <i class="codicon codicon-trash"></i>
                                </button>
                            </div>
                            <div class="content-preview" id="preview-${index}">
                                ${item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                            </div>
                        </div>
                    `).join('')}
                ` : `<div class="empty-state">${vscode.l10n.t('History is empty')}</div>`}
                <script>
                    const vscode = acquireVsCodeApi();

                    function executeCommand(command, ...args) {
                        vscode.postMessage({ 
                            command: 'executeCommand', 
                            commandId: command,
                            args: args
                        });
                    }

                    function openExternal(url) {
                        vscode.postMessage({ command: 'openExternal', url });
                    }

                    function togglePreview(id) {
                        const preview = document.getElementById('preview-' + id);
                        preview.classList.toggle('show');
                    }

                    function copyItem(id) {
                        vscode.postMessage({ command: 'copyItem', id });
                    }

                    function deleteItem(id) {
                        vscode.postMessage({ command: 'deleteItem', id });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'openExternal':
                                window.open(message.url, '_blank');
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
