import { CopySettings } from './types';
export declare class ConfigManager {
    private static readonly CONFIG_NAME;
    private static readonly MAX_FILE_SIZE;
    static getSettings(): CopySettings;
    static isClipboardMode(): boolean;
    static toggleClipboardMode(): Promise<void>;
    static getConfig<T>(key: string, defaultValue: T): T;
    static updateConfig(key: string, value: any): Promise<void>;
}
export default ConfigManager;
