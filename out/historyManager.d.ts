import * as vscode from 'vscode';
interface HistoryItem {
    content: string;
    description: string;
    timestamp: number;
}
export declare class HistoryManager {
    private context;
    private history;
    private _onHistoryChanged;
    readonly onHistoryChanged: vscode.Event<void>;
    constructor(context: vscode.ExtensionContext);
    addToHistory(content: string, description: string): Promise<void>;
    copyHistoryItem(index: number): Promise<void>;
    deleteHistoryItem(index: number): void;
    clearHistory(): Promise<void>;
    getHistory(): HistoryItem[];
    isClipboardMode(): boolean;
    private loadHistory;
    private saveHistory;
    getFormattedTimestamp(timestamp: number): string;
    getRemainingSlots(): number;
}
export {};
