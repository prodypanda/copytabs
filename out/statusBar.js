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
exports.StatusBarManager = void 0;
const vscode = __importStar(require("vscode"));
const config_1 = __importDefault(require("./config"));
class StatusBarManager {
    constructor() {
        this.items = new Map();
        this.createItems();
    }
    createItems() {
        if (config_1.default.getConfig('hideStatusBarButtons', false)) {
            this.hideAllButtons();
            return;
        }
        this.createModeToggle();
        this.createActionButtons();
    }
    hideAllButtons() {
        this.items.forEach(item => {
            item.hide();
            item.dispose();
        });
        this.items.clear();
    }
    createModeToggle() {
        const showClipboardMode = vscode.workspace.getConfiguration('copytabs').get('showClipboardModeButton', true);
        if (showClipboardMode) {
            const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);
            item.command = 'copytabs.toggleClipboardMode';
            this.items.set('mode', item);
            this.updateModeDisplay();
            item.show();
        }
    }
    createActionButtons() {
        const buttons = [
            { id: 'copyAllTabs', configKey: 'showCopyAllButton', text: '$(files) ' + vscode.l10n.t("Copy All"), tooltip: vscode.l10n.t("Copy all opened tabs"), priority: 100 },
            { id: 'copySelectedTabs', configKey: 'showCopySelectedButton', text: '$(list-selection) ' + vscode.l10n.t("Copy Selected"), tooltip: vscode.l10n.t("Copy selected tabs"), priority: 99 },
            { id: 'copyTabsCustomFormat', configKey: 'showCopyCustomButton', text: '$(settings-gear) ' + vscode.l10n.t("Copy Custom"), tooltip: vscode.l10n.t("Copy tabs with custom format"), priority: 98 }
        ];
        buttons.forEach(({ id, configKey, text, tooltip, priority }) => {
            // Get config value directly from workspace configuration
            const isVisible = vscode.workspace.getConfiguration('copytabs').get(configKey, true);
            if (isVisible) {
                const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);
                item.text = text;
                item.tooltip = tooltip;
                item.command = `copytabs.${id}`;
                this.items.set(id, item);
                item.show();
            }
        });
    }
    updateModeDisplay() {
        const isClipboardMode = config_1.default.isClipboardMode();
        const item = this.items.get('mode');
        if (item) {
            item.text = isClipboardMode ? "$(clippy) " + vscode.l10n.t("Clipboard Mode") : "$(window) " + vscode.l10n.t("Tab Mode");
            item.tooltip = `Click to switch to ${isClipboardMode ? 'Tab' : 'Clipboard'} Mode`;
        }
    }
    dispose() {
        this.items.forEach(item => item.dispose());
        this.items.clear();
    }
    recreateItems() {
        this.dispose();
        this.items = new Map();
        this.createItems();
    }
}
exports.StatusBarManager = StatusBarManager;
//# sourceMappingURL=statusBar.js.map