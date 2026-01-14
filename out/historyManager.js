"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryManager = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = __importDefault(require("./config"));
const HISTORY_KEY = 'copytabs.history';
const HISTORY_LIMIT = 10;
class HistoryManager {
    constructor(context) {
        this.context = context;
        this.history = [];
        this._onHistoryChanged = new vscode.EventEmitter();
        this.onHistoryChanged = this._onHistoryChanged.event;
        this.history = this.context.globalState.get(HISTORY_KEY, []);
    }
    async addToHistory(content, description) {
        const timestamp = new Date().getTime();
        this.history.unshift({ content, description, timestamp });
        // Limit history to 10 items
        if (this.history.length > HISTORY_LIMIT) {
            this.history = this.history.slice(0, HISTORY_LIMIT);
        }
        await this.saveHistory();
        this._onHistoryChanged.fire();
    }
    async copyHistoryItem(index) {
        const item = this.history[index];
        if (item) {
            if (config_1.default.isClipboardMode()) {
                await vscode.env.clipboard.writeText(item.content);
                vscode.window.showInformationMessage(vscode.l10n.t("Content copied to clipboard!"));
            }
            else {
                const doc = await vscode.workspace.openTextDocument({ content: item.content });
                await vscode.window.showTextDocument(doc);
            }
        }
    }
    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        this.saveHistory();
        this._onHistoryChanged.fire();
    }
    async clearHistory() {
        this.history = [];
        await this.saveHistory();
        this._onHistoryChanged.fire();
        vscode.window.showInformationMessage(vscode.l10n.t("History cleared"));
    }
    getHistory() {
        return this.history;
    }
    isClipboardMode() {
        return config_1.default.isClipboardMode();
    }
    async saveHistory() {
        await this.context.globalState.update(HISTORY_KEY, this.history);
    }
    getFormattedTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }
    getRemainingSlots() {
        return HISTORY_LIMIT - this.history.length;
    }
}
exports.HistoryManager = HistoryManager;
//# sourceMappingURL=historyManager.js.map