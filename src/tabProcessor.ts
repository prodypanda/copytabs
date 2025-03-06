import * as vscode from 'vscode';
import * as path from 'path';
import { CopySettings, CopyStatistics } from './types';
import { commentPatterns, extensionToLanguage } from './commentPatterns';
import { handleError } from './utils';

export class TabProcessor {
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
            failedFiles: []
        };

        const results = await Promise.all(tabs.map(async tab => {
            const result = await this.processTab(tab, settings, token);
            if (result.length > 0) {
                stats.successCount++;
                stats.processedFiles.push(tab.label);
                stats.totalTokens += result.split(/\s+/).length;
            } else if (tab.input instanceof vscode.TabInputText) {
                stats.failedCount++;
                stats.failedFiles.push(tab.label);
            }
            return result;
        }));

        return [results.filter(content => content.length > 0), stats];
    }

    private static async processTab(
        tab: vscode.Tab,
        settings: CopySettings,
        token: vscode.CancellationToken
    ): Promise<string> {
        if (token.isCancellationRequested || !(tab.input instanceof vscode.TabInputText)) {
            return '';
        }

        try {
            const document = await vscode.workspace.openTextDocument(tab.input.uri);
            if (document.getText().length > settings.maxFileSize) {
                return `// File ${tab.label} exceeds size limit`;
            }

            const filePath = document.uri.fsPath;
            const relativePath = vscode.workspace.asRelativePath(filePath);
            const fileExtension = path.extname(filePath).slice(1);

            if (this.shouldProcessFile(fileExtension, settings)) {
                let content = document.getText();
                content = this.processContent(content, fileExtension, settings);
                return `// File: ${relativePath}\n\n${content}`;
            }
        } catch (error) {
            handleError(`Error processing tab ${tab.label}`, error);
            return `// Error processing file: ${tab.label}`;
        }
        return '';
    }

    private static shouldProcessFile(extension: string, settings: CopySettings): boolean {
        return (settings.includeFileTypes.length === 0 || 
                settings.includeFileTypes.includes(extension)) &&
               !settings.excludeFileTypes.includes(extension);
    }

    private static processContent(content: string, extension: string, settings: CopySettings): string {
        if (!settings.includeComments) {
            content = this.removeComments(content, extension);
        }
        if (settings.includeLineNumbers) {
            content = this.addLineNumbers(content);
        }
        return content;
    }

    private static removeComments(content: string, extension: string): string {
        const languageId = extensionToLanguage[extension.toLowerCase()] || '';
        return commentPatterns[languageId] ? 
            content.replace(commentPatterns[languageId], '') : 
            content;
    }

    private static addLineNumbers(content: string): string {
        return content.split('\n')
            .map((line, index) => `${index + 1}: ${line}`)
            .join('\n');
    }
}
