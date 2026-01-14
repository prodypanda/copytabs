import * as vscode from 'vscode';
import ConfigManager from './config';

const HISTORY_KEY = 'copytabs.history';
const HISTORY_LIMIT = 10;

interface HistoryItem {
    content: string;
    description: string;
    timestamp: number;
}

export class HistoryManager {
    private history: HistoryItem[] = [];
    private _onHistoryChanged: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    readonly onHistoryChanged = this._onHistoryChanged.event;

    constructor(private context: vscode.ExtensionContext) {
        this.history = this.context.globalState.get(HISTORY_KEY, []);
    }

    public async addToHistory(content: string, description: string) {
        const timestamp = new Date().getTime();
        this.history.unshift({ content, description, timestamp });
        
        // Limit history to 10 items
        if (this.history.length > HISTORY_LIMIT) {
            this.history = this.history.slice(0, HISTORY_LIMIT);
        }

        await this.saveHistory();
        this._onHistoryChanged.fire();
    }

    public async copyHistoryItem(index: number) {
        const item = this.history[index];
        if (item) {
            if (ConfigManager.isClipboardMode()) {
                await vscode.env.clipboard.writeText(item.content);
                vscode.window.showInformationMessage(vscode.l10n.t("Content copied to clipboard!"));
            } else {
                const doc = await vscode.workspace.openTextDocument({ content: item.content });
                await vscode.window.showTextDocument(doc);
            }
        }
    }

    public deleteHistoryItem(index: number) {
        this.history.splice(index, 1);
        this.saveHistory();
        this._onHistoryChanged.fire();
    }

    public async clearHistory() {
        this.history = [];
        await this.saveHistory();
        this._onHistoryChanged.fire();
        vscode.window.showInformationMessage(vscode.l10n.t("History cleared"));
    }

    public getHistory(): HistoryItem[] {
        return this.history;
    }

    public isClipboardMode(): boolean {
        return ConfigManager.isClipboardMode();
    }

    private async saveHistory() {
        await this.context.globalState.update(HISTORY_KEY, this.history);
    }

    public getFormattedTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    public getRemainingSlots(): number {
        return HISTORY_LIMIT - this.history.length;
    }
}
