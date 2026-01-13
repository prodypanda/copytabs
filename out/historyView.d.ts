import * as vscode from 'vscode';
import { HistoryManager } from './historyManager';
export declare class HistoryViewProvider implements vscode.WebviewViewProvider {
    private readonly extensionUri;
    private readonly historyManager;
    static readonly viewType = "copytabs.historyView";
    constructor(extensionUri: vscode.Uri, historyManager: HistoryManager);
    resolveWebviewView(webviewView: vscode.WebviewView, _context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken): void;
    private updateView;
    private getErrorContent;
    private getWebviewContent;
}
