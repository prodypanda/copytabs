import * as vscode from 'vscode';
import ConfigManager from './config';

export class StatusBarManager {
    private items: Map<string, vscode.StatusBarItem>;

    constructor() {
        this.items = new Map();
        this.createItems();
    }

    private createItems() {
        this.createModeToggle();
        this.createActionButtons();
    }

    private createModeToggle() {
        const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);
        item.command = 'copytabs.toggleClipboardMode';
        this.items.set('mode', item);
        this.updateModeDisplay();
        item.show();
    }

    private createActionButtons() {
        const buttons = [
            { id: 'copyAllTabs', text: '$(files) ' + vscode.l10n.t("Copy All"), tooltip: vscode.l10n.t("Copy all opened tabs"), priority: 100 },
            { id: 'copySelectedTabs', text: '$(list-selection) ' + vscode.l10n.t("Copy Selected"), tooltip: vscode.l10n.t("Copy selected tabs"), priority: 99 },
            { id: 'copyTabsCustomFormat', text: '$(settings-gear) ' + vscode.l10n.t("Copy Custom"), tooltip: vscode.l10n.t("Copy tabs with custom format"), priority: 98 }
        ];

        buttons.forEach(({ id, text, tooltip, priority }) => {
            const buttonId = id.replace(/[A-Z]/g, letter => letter.toLowerCase());
            const configKey = `show${buttonId.charAt(0).toUpperCase() + buttonId.slice(1)}Button`;
            
            if (ConfigManager.getConfig(configKey, true)) {
                const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, priority);
                item.text = text;
                item.tooltip = tooltip;
                item.command = `copytabs.${id}`;
                this.items.set(buttonId, item);
                item.show();
            }
        });
    }

    public updateModeDisplay() {
        const isClipboardMode = ConfigManager.isClipboardMode();
        const item = this.items.get('mode');
        if (item) {
            item.text = isClipboardMode ? "$(clippy) " + vscode.l10n.t("Clipboard Mode") : "$(window) " + vscode.l10n.t("Tab Mode");
            item.tooltip = `Click to switch to ${isClipboardMode ? 'Tab' : 'Clipboard'} Mode`;
        }
    }

    public dispose() {
        this.items.forEach(item => item.dispose());
        this.items.clear();
    }

    public recreateItems() {
        this.dispose();
        this.items = new Map();
        this.createItems();
    }
}
