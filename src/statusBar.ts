import * as vscode from 'vscode';
import ConfigManager from './config';

export class StatusBarManager {
    private items: Map<string, vscode.StatusBarItem>;

    constructor() {
        this.items = new Map();
        this.createItems();
    }

    private createItems() {
        if (ConfigManager.getConfig('hideStatusBarButtons', false)) {
            this.hideAllButtons();
            return;
        }
        this.createModeToggle();
        this.createActionButtons();
    }

    private hideAllButtons() {
        this.items.forEach(item => {
            item.hide();
            item.dispose();
        });
        this.items.clear();
    }

    private createModeToggle() {
        const showClipboardMode = vscode.workspace.getConfiguration('copytabs').get('showClipboardModeButton', true);
        
        if (showClipboardMode) {
            const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 97);
            item.command = 'copytabs.toggleClipboardMode';
            this.items.set('mode', item);
            this.updateModeDisplay();
            item.show();
        }
    }

    private createActionButtons() {
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

    public updateModeDisplay() {
        const isClipboardMode = ConfigManager.isClipboardMode();
        const item = this.items.get('mode');
        if (item) {
            item.text = isClipboardMode ? "$(clippy) " + vscode.l10n.t("Clipboard Mode") : "$(window) " + vscode.l10n.t("Tab Mode");
            item.tooltip = `Click to switch to ${isClipboardMode ? 'Tab' : 'Clipboard'} Mode`;
        }
    }

    public dispose() {
        this.items.forEach(item => { item.dispose(); });
        this.items.clear();
    }

    public recreateItems() {
        this.dispose();
        this.items = new Map();
        this.createItems();
    }
}
