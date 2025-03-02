import * as vscode from 'vscode';
import { CopySettings } from './types';

export class ConfigManager {
    private static readonly CONFIG_NAME = 'copytabs';
    private static readonly MAX_FILE_SIZE = 5242880; // 5MB

    public static getSettings(): CopySettings {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        return {
            includeFileTree: config.get('includeFileTree', true),
            treePosition: config.get('structuredTreePosition', 'start'),
            includeFileTypes: config.get('includeFileTypes', []),
            excludeFileTypes: config.get('excludeFileTypes', []),
            separatorLine: config.get('separatorLine', '------------------------'),
            includeComments: config.get('includeComments', true),
            includeLineNumbers: config.get('includeLineNumbers', false),
            maxFileSize: config.get('maxFileSize', this.MAX_FILE_SIZE)
        };
    }

    public static isClipboardMode(): boolean {
        return this.getConfig('copyToClipboard', false);
    }

    public static async toggleClipboardMode(): Promise<void> {
        const currentMode = this.isClipboardMode();
        await this.updateConfig('copyToClipboard', !currentMode);
    }

    public static getConfig<T>(key: string, defaultValue: T): T {
        return vscode.workspace.getConfiguration(this.CONFIG_NAME).get(key, defaultValue);
    }

    private static updateConfig(key: string, value: any): Thenable<void> {
        return vscode.workspace.getConfiguration(this.CONFIG_NAME).update(key, value, vscode.ConfigurationTarget.Global);
    }
}

// Add a default export to ensure the module is properly recognized
export default ConfigManager;
