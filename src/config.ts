import * as vscode from "vscode";
import { CopySettings } from "./types";

export class ConfigManager {
  private static readonly CONFIG_NAME = "copytabs";
  // Public constants for global usage
  public static readonly MAX_FILE_SIZE = 5242880; // 5MB default
  public static readonly MAX_CHUNK_SIZE = 5242880; // 5MB chunking baseline
  public static readonly MAX_OUTPUT_SIZE = 50 * 1024 * 1024; // 50MB hard limit

  public static getSettings(): CopySettings {
    const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
    return {
      includeFileTree: config.get("includeFileTree", true),
      treePosition: config.get("structuredTreePosition", "start"),
      includeFileTypes: config.get("includeFileTypes", []),
      excludeFileTypes: config.get("excludeFileTypes", []),
      separatorLine: config.get("separatorLine", "------------------------"),
      includeComments: config.get("includeComments", true),
      includeLineNumbers: config.get("includeLineNumbers", false),
      maxFileSize: config.get("maxFileSize", this.MAX_FILE_SIZE),
    };
  }

  public static isClipboardMode(): boolean {
    const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
    return config.get("copyToClipboard", false);
  }

  public static async toggleClipboardMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
    const currentMode = this.isClipboardMode();
    await config.update(
      "copyToClipboard",
      !currentMode,
      vscode.ConfigurationTarget.Global
    );
  }

  public static getConfig<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
    return config.get(key, defaultValue) ?? defaultValue;
  }

  public static async updateConfig(key: string, value: any): Promise<void> {
    const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }
}

export default ConfigManager;
