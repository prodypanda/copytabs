import * as vscode from "vscode";
import * as path from "path";
import { CopySettings, CopyStatistics } from "./types";
import { commentPatterns, extensionToLanguage } from "./commentPatterns";
import { handleError } from "./utils";
import { TextDecoder } from "util";

export class TabProcessor {
  /**
   * Prevent instantiation of this utility class
   */
  private constructor() {
    throw new Error(
      "TabProcessor is a static utility class and cannot be instantiated"
    );
  }

  static async processChunk(
    tabs: vscode.Tab[],
    settings: CopySettings,
    token: vscode.CancellationToken
  ): Promise<[string[], CopyStatistics]> {
    const stats: CopyStatistics = {
      successCount: 0,
      failedCount: 0,
      totalTokens: 0,
      processedFiles: [],
      failedFiles: [],
    };

    const results: string[] = [];
    // Sequential processing within chunk to avoid CPU spiking/File Handle limits
    for (const tab of tabs) {
      if (token.isCancellationRequested) break;
      const result = await this.processTab(tab, settings, token);

      if (result.length > 0) {
        stats.successCount++;
        stats.processedFiles.push(tab.label);
        stats.totalTokens += result.length; // Approximate char count as tokens for speed
        results.push(result);
      } else if (tab.input instanceof vscode.TabInputText) {
        // If a text tab returns empty, check if it was due to filter or error
        // We generally track errors in processTab
      }
    }

    return [results, stats];
  }

  private static async processTab(
    tab: vscode.Tab,
    settings: CopySettings,
    token: vscode.CancellationToken
  ): Promise<string> {
    if (
      token.isCancellationRequested ||
      !(tab.input instanceof vscode.TabInputText)
    ) {
      return "";
    }

    try {
      const uri = tab.input.uri;
      const isDirty = tab.isDirty;
      let content = "";

      // Performance: Read from disk if not dirty to avoid expensive TextDocument model creation
      if (isDirty) {
        const document = await vscode.workspace.openTextDocument(uri);
        content = document.getText();
      } else {
        try {
          const stat = await vscode.workspace.fs.stat(uri);
          if (stat.size > settings.maxFileSize) {
            return `// File ${tab.label} exceeds size limit of ${Math.round(
              settings.maxFileSize / 1024 / 1024
            )}MB`;
          }
          const fileData = await vscode.workspace.fs.readFile(uri);
          content = new TextDecoder("utf-8").decode(fileData);
        } catch (e) {
          // Fallback for virtual filesystems that might not support fs.stat/readFile directly
          const document = await vscode.workspace.openTextDocument(uri);
          content = document.getText();
        }
      }

      // Double check content length after read
      if (content.length > settings.maxFileSize) {
        return `// File ${tab.label} exceeds size limit`;
      }

      const filePath = uri.fsPath;
      const relativePath = vscode.workspace.asRelativePath(uri);
      const fileExtension = path.extname(filePath).slice(1);

      if (this.shouldProcessFile(fileExtension, settings)) {
        content = this.processContent(content, fileExtension, settings);
        return `// File: ${relativePath}\n\n${content}`;
      }
    } catch (error) {
      handleError(`Error processing tab ${tab.label}`, error);
      return `// Error processing file: ${tab.label}`;
    }
    return "";
  }

  private static shouldProcessFile(
    extension: string,
    settings: CopySettings
  ): boolean {
    const ext = extension.toLowerCase();

    // Check exclusions first
    if (settings.excludeFileTypes.some((e) => e.toLowerCase() === ext)) {
      return false;
    }

    // Check inclusions
    if (settings.includeFileTypes.length === 0) {
      return true;
    }
    return settings.includeFileTypes.some((e) => e.toLowerCase() === ext);
  }

  private static processContent(
    content: string,
    extension: string,
    settings: CopySettings
  ): string {
    let processed = content;
    if (!settings.includeComments) {
      processed = this.removeComments(processed, extension);
    }
    if (settings.includeLineNumbers) {
      processed = this.addLineNumbers(processed);
    }
    return processed;
  }

  private static removeComments(content: string, extension: string): string {
    const languageId = extensionToLanguage[extension.toLowerCase()] || "";
    const pattern = commentPatterns[languageId];
    return pattern ? content.replace(pattern, "") : content;
  }

  private static addLineNumbers(content: string): string {
    return content
      .split("\n")
      .map((line, index) => `${index + 1}: ${line}`)
      .join("\n");
  }
}
