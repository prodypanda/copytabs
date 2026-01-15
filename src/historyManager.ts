import * as vscode from "vscode";
import ConfigManager from "./config";

const HISTORY_KEY = "copytabs.history";
const HISTORY_LIMIT = 10;
// CRITICAL: Limit individual item size for storage to prevent GlobalState bloat.
// VS Code GlobalState is not a database for massive files.
const MAX_STORAGE_SIZE = 200 * 1024; // 200KB

interface HistoryItem {
  content: string;
  description: string;
  timestamp: number;
  truncated?: boolean;
}

export class HistoryManager {
  private history: HistoryItem[] = [];
  private _onHistoryChanged: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onHistoryChanged = this._onHistoryChanged.event;

  constructor(private context: vscode.ExtensionContext) {
    this.history = this.context.globalState.get(HISTORY_KEY, []);
  }

  public async addToHistory(content: string, description: string) {
    const timestamp = new Date().getTime();

    let safeContent = content;
    let isTruncated = false;

    // Safety: Truncate large content before storing
    if (safeContent.length > MAX_STORAGE_SIZE) {
      safeContent =
        safeContent.substring(0, MAX_STORAGE_SIZE) +
        `\n\n[...Content truncated for history storage. Original size: ${(
          content.length / 1024
        ).toFixed(2)}KB...]`;
      isTruncated = true;
    }

    this.history.unshift({
      content: safeContent,
      description,
      timestamp,
      truncated: isTruncated,
    });

    // Enforce item limit
    if (this.history.length > HISTORY_LIMIT) {
      this.history = this.history.slice(0, HISTORY_LIMIT);
    }

    await this.saveHistory();
    this._onHistoryChanged.fire();
  }

  public async copyHistoryItem(index: number) {
    const item = this.history[index];
    if (item) {
      if (item.truncated) {
        vscode.window.showWarningMessage(
          vscode.l10n.t(
            "This item was truncated in history storage and is incomplete."
          )
        );
      }

      if (ConfigManager.isClipboardMode()) {
        await vscode.env.clipboard.writeText(item.content);
        vscode.window.showInformationMessage(
          vscode.l10n.t("Content copied to clipboard!")
        );
      } else {
        const doc = await vscode.workspace.openTextDocument({
          content: item.content,
          language: "plaintext",
        });
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

  public getRemainingSlots(): number {
    return HISTORY_LIMIT - this.history.length;
  }
}
