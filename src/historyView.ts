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
        const isAtLimit = history.length >= HISTORY_LIMIT;
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <link href="https://cdn.jsdelivr.net/npm/vscode-codicons/dist/codicon.css" rel="stylesheet" />
                <style>
                    :root {
                        --radius-sm: 0.3rem;
                        --radius-md: 0.5rem;
                        --ring-color: var(--vscode-focusBorder);
                    }
                    
                    body { 
                        padding: 12px; 
                        font-family: var(--vscode-font-family);
                        font-size: 13px;
                        background: var(--vscode-editor-background);
                    }

                    .toolbar {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        margin-bottom: 16px;
                        padding: 12px;
                        border-radius: var(--radius-md);
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-widget-border);
                        position: sticky;
                        top: 0;
                        z-index: 10;
                        backdrop-filter: blur(10px);
                    }

                    button {
                        all: unset;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: var(--radius-sm);
                        height: 28px;
                        padding: 0 12px;
                        font-size: 12px;
                        font-weight: 500;
                        line-height: 1;
                        transition: all 0.2s ease;
                        gap: 6px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        user-select: none;
                        white-space: nowrap;
                    }

                    button:focus-visible {
                        outline: 2px solid var(--ring-color);
                        outline-offset: 2px;
                    }

                    button:hover {
                        background: var(--vscode-button-hoverBackground);
                        transform: translateY(-1px);
                    }

                    button.secondary {
                        background: var(--vscode-button-secondaryBackground);
                        color: var(--vscode-button-secondaryForeground);
                    }

                    button.secondary:hover {
                        background: var(--vscode-button-secondaryHoverBackground);
                    }

                    button.danger {
                        background: var(--vscode-errorForeground);
                        color: white;
                        opacity: 0.9;
                    }

                    button.danger:hover {
                        opacity: 1;
                    }

                    .icon-button {
                        padding: 0;
                        width: 28px;
                    }

                    .history-item {
                        position: relative;
                        padding: 12px;
                        margin-bottom: 12px;
                        border-radius: var(--radius-md);
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-widget-border);
                        transition: all 0.2s ease;
                    }

                    .history-item:hover {
                        transform: translateX(2px);
                        border-color: var(--vscode-focusBorder);
                    }

                    .history-item::before {
                        content: '';
                        position: absolute;
                        left: -1px;
                        top: -1px;
                        height: calc(100% + 2px);
                        width: 3px;
                        background: var(--vscode-textLink-foreground);
                        border-radius: var(--radius-md) 0 0 var(--radius-md);
                        opacity: 0;
                        transition: opacity 0.2s;
                    }

                    .history-item:hover::before {
                        opacity: 1;
                    }

                    .history-header {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        margin-bottom: 16px;
                        padding: 8px 12px;
                        background: var(--vscode-sideBarSectionHeader-background);
                        border-radius: var(--radius-md);
                        border: 1px solid var(--vscode-widget-border);
                    }

                    .badge {
                        display: inline-flex;
                        align-items: center;
                        padding: 2px 8px;
                        border-radius: 10px;
                        font-size: 11px;
                        font-weight: 500;
                        background: var(--vscode-badge-background);
                        color: var(--vscode-badge-foreground);
                        gap: 4px;
                    }

                    .badge.latest {
                        background: var(--vscode-statusBarItem-prominentBackground);
                        color: var(--vscode-statusBarItem-prominentForeground);
                    }

                    .badge.warning {
                        background: var(--vscode-errorForeground);
                        color: white;
                        animation: pulse 2s infinite;
                    }

                    .timestamp {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-bottom: 8px;
                    }

                    .description {
                        margin: 8px 0;
                        color: var(--vscode-foreground);
                        line-height: 1.4;
                    }

                    .actions {
                        display: flex;
                        gap: 8px;
                        margin-top: 12px;
                    }

                    .content-preview {
                        display: none;
                        margin-top: 12px;
                        padding: 12px;
                        background: var(--vscode-editor-background);
                        border-radius: var(--radius-sm);
                        border: 1px solid var(--vscode-widget-border);
                        font-family: var(--vscode-editor-font-family);
                        font-size: 12px;
                        line-height: 1.4;
                        white-space: pre-wrap;
                        max-height: 200px;
                        overflow-y: auto;
                    }

                    .content-preview.show {
                        display: block;
                        animation: slideDown 0.2s ease;
                    }

                    @keyframes slideDown {
                        from { 
                            opacity: 0; 
                            transform: translateY(-8px); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateY(0); 
                        }
                    }
                    
                    .empty-state {
                        text-align: center;
                        padding: 32px 16px;
                        color: var(--vscode-descriptionForeground);
                        background: var(--vscode-sideBar-background);
                        border-radius: var(--radius-md);
                        border: 1px dashed var(--vscode-widget-border);
                    }

                    .empty-state i {
                        font-size: 24px;
                        margin-bottom: 8px;
                        opacity: 0.5;
                    }

                    .limit-warning {
                        margin-top: 8px;
                        margin-bottom: 6px;
                        padding: 8px 12px;
                        border-radius: var(--radius-sm);
                        background: var(--vscode-inputValidation-warningBackground);
                        border: 1px solid var(--vscode-inputValidation-warningBorder);
                        color: var(--vscode-inputValidation-warningForeground);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        font-size: 12px;
                    }

                    .upgrade-button {
                        background: #666 !important;
                        color: #ccc !important;
                        opacity: 0.7 !important;
                        cursor: not-allowed !important;
                        transform: none !important;
                    }

                    .upgrade-button:hover {
                        opacity: 0.7 !important;
                        transform: none !important;
                    }

                    .coming-soon-tooltip {
                        display: none;
                        position: absolute;
                        background: var(--vscode-notifications-background);
                        border: 1px solid var(--vscode-notifications-border);
                        color: var(--vscode-notifications-foreground);
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 12px;
                        width: 250px;
                        top: 100%;
                        left: 50%;
                        transform: translateX(-50%);
                        margin-top: 8px;
                        z-index: 1000;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    .upgrade-container {
                        position: relative;
                        display: inline-block;
                    }

                    .upgrade-container:hover .coming-soon-tooltip {
                        display: block;
                    }

                    @keyframes pulse {
                        0% { opacity: 1; }
                        50% { opacity: 0.6; }
                        100% { opacity: 1; }
                    }

                    /* Scrollbar Styles */
                    ::-webkit-scrollbar {
                        width: 8px;
                        height: 8px;
                    }

                    ::-webkit-scrollbar-track {
                        background: transparent;
                    }

                    ::-webkit-scrollbar-thumb {
                        background: var(--vscode-scrollbarSlider-background);
                        border-radius: 4px;
                    }

                    ::-webkit-scrollbar-thumb:hover {
                        background: var(--vscode-scrollbarSlider-hoverBackground);
                    }

                    .history-items {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 12px;
                        border-radius: var(--radius-md);
                        background: var(--vscode-sideBar-background);
                        border: 1px solid var(--vscode-widget-border);
                        max-height: calc(100vh - 200px);
                        overflow-y: auto;
                    }

                    button.clear-button, button.mini-button {
                        height: 24px;
                        width: 24px;
                        padding: 0;
                        font-size: 11px;
                    }

                    button.clear-button i, button.mini-button i {
                        font-size: 14px;
                    }
                </style>
            </head>
            <body>
                <div class="toolbar">
                    <button class="secondary icon-button" 
                            onclick="executeCommand('copytabs.toggleClipboardMode')"
                            title="${isClipboardMode ? vscode.l10n.t('Clipboard Mode') : vscode.l10n.t('Tab Mode')}">
                        <i class="codicon codicon-${isClipboardMode ? 'clippy' : 'window'}"></i>
                    </button>
                    <button class="secondary icon-button" 
                            onclick="executeCommand('copytabs.copyAllTabs')"
                            title="${vscode.l10n.t('Copy all opened tabs')}">
                        <i class="codicon codicon-files"></i>
                    </button>
                    <button class="secondary icon-button" 
                            onclick="executeCommand('copytabs.copySelectedTabs')"
                            title="${vscode.l10n.t('Copy selected tabs')}">
                        <i class="codicon codicon-checklist"></i>
                    </button>
                    <button class="secondary icon-button" 
                            onclick="executeCommand('copytabs.copyTabsCustomFormat')"
                            title="${vscode.l10n.t('Copy tabs with custom format')}">
                        <i class="codicon codicon-settings-gear"></i>
                    </button>
                    <button class="secondary"
                            onclick="executeCommand('workbench.action.openSettings', '@ext:Prodypanda.copytabs')"
                            title="${vscode.l10n.t('Extension Settings')}">
                        <i class="codicon codicon-tools"></i>
                        ${vscode.l10n.t('Settings')}
                    </button>
                    <button class="secondary" style="margin-left: auto; background: #b1361e;"
                            onclick="openExternal('https://www.buymeacoffee.com/prodypanda')"
                            title="${vscode.l10n.t('Support this extension by buying me a coffee ☕')}">
                        <i class="codicon codicon-heart"></i>
                    </button>
                </div>

                <div class="history-header">
                    <span>${vscode.l10n.t('History')}</span>
                    <span style="display: flex; gap: 4px; align-items: center;">
                        <button class="danger secondary icon-button clear-button"
                                onclick="vscode.postMessage({ command: 'clearAll' })"
                                title="${vscode.l10n.t('Clear History')}">
                            <i class="codicon codicon-trash"></i>
                        </button>
                        <span class="badge ${isAtLimit ? 'warning' : ''}">
                            <i class="codicon codicon-history"></i>
                            ${history.length}/${HISTORY_LIMIT}
                        </span>
                    </span>
                </div>

                ${isAtLimit ? `
                    <div class="limit-warning">
                        <i class="codicon codicon-warning"></i>
                        <div>
                            <strong>${vscode.l10n.t('History limit reached!')}</strong><br/>
                            ${vscode.l10n.t('New copies will remove the oldest entries.')}
                            <br/>
                            <div class="upgrade-container">
                                <button class="upgrade-button" disabled
                                        style="margin-left: 4px; font-size: 11px; margin-top: 6px;">
                                    <i class="codicon codicon-star-full"></i>
                                    ${vscode.l10n.t('Pro Features Coming Soon')}
                                </button>
                                <div class="coming-soon-tooltip">
                                    <strong>🚀 Coming in the Next Release:</strong><br/>
                                    • Unlimited history storage<br/>
                                    • Add AI-Shrink button<br/>
                                    • Advanced search and filtering<br/>
                                    • Cloud sync across devices<br/>
                                    • Import/Export copied tabs<br/>
                                    • Auto save on specific json file<br/>
                                    • And much more!
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${history.length > 0 ? `
                    <div class="history-items">
                        ${history.map((item, index) => `
                            <div class="history-item">
                                <div class="timestamp">
                                    <i class="codicon codicon-clock"></i>
                                    ${new Date(item.timestamp).toLocaleString()}
                                    ${index === history.length - 1 ? `<span class="badge">${vscode.l10n.t('Oldest')}</span>` : ''}
                                    ${index === 0 ? `<span class="badge latest">${vscode.l10n.t('Latest')}</span>` : ''}
                                </div>
                                <div class="description">${item.description}</div>
                                <div class="actions">
                                    <button class="secondary mini-button" onclick="togglePreview(${index})"
                                            title="${vscode.l10n.t('Preview')}">
                                        <i class="codicon codicon-eye"></i>
                                    </button>
                                    <button class="mini-button" onclick="copyItem(${index})"
                                            title="${vscode.l10n.t('Copy')}">
                                        <i class="codicon codicon-copy"></i>
                                    </button>
                                    <button class="danger mini-button" onclick="deleteItem(${index})"
                                            title="${vscode.l10n.t('Delete')}">
                                        <i class="codicon codicon-trash"></i>
                                    </button>
                                </div>
                                <div class="content-preview" id="preview-${index}">
                                    ${item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="codicon codicon-history"></i>
                        <div>${vscode.l10n.t('No history items yet')}</div>
                    </div>
                `}
                
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
