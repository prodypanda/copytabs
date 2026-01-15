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

    // Process tabs sequentially in the chunk to avoid FS contention
    const results: string[] = [];
    for (const tab of tabs) {
      if (token.isCancellationRequested) break;

      const result = await this.processTab(tab, settings, token);
      if (result.length > 0) {
        stats.successCount++;
        stats.processedFiles.push(tab.label);
        // Rough token count estimation (spaces + 1)
        stats.totalTokens += result.split(/\s+/).length;
        results.push(result);
      } else if (tab.input instanceof vscode.TabInputText) {
        // Only count as failure if it was a text tab that returned empty
        // (meaning it failed logic or was ignored, but we track actual errors in processTab)
        // If it was skipped due to file type settings, it's not a "failure" per se,
        // but if the user expected it, we might want to know.
        // For now, we only count explicit failures in reading.
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

      // Optimization: If file is not dirty, read directly from disk to avoid
      // overhead of creating a TextDocument model (language servers, etc.)
      if (isDirty) {
        const document = await vscode.workspace.openTextDocument(uri);
        content = document.getText();
      } else {
        // Check size before reading
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
          // Fallback to openTextDocument if fs fails (e.g. virtual filesystems)
          const document = await vscode.workspace.openTextDocument(uri);
          content = document.getText();
        }
      }

      if (content.length > settings.maxFileSize) {
        return `// File ${tab.label} exceeds size limit`;
      }

      const filePath = uri.fsPath;
      const relativePath = vscode.workspace.asRelativePath(uri);
      // Remove leading dot-slash if present
      const cleanRelativePath =
        relativePath.startsWith("./") || relativePath.startsWith(".\\")
          ? relativePath.slice(2)
          : relativePath;

      const fileExtension = path.extname(filePath).slice(1); // Remove dot

      if (this.shouldProcessFile(fileExtension, settings)) {
        content = this.processContent(content, fileExtension, settings);
        return `// File: ${cleanRelativePath}\n\n${content}`;
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

    // Check inclusions (if empty, include all)
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
