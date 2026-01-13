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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabProcessor = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const commentPatterns_1 = require("./commentPatterns");
const utils_1 = require("./utils");
class TabProcessor {
    static async processChunk(tabs, settings, token) {
        const stats = {
            successCount: 0,
            failedCount: 0,
            totalTokens: 0,
            processedFiles: [],
            failedFiles: []
        };
        const results = await Promise.all(tabs.map(async (tab) => {
            const result = await this.processTab(tab, settings, token);
            if (result.length > 0) {
                stats.successCount++;
                stats.processedFiles.push(tab.label);
                stats.totalTokens += result.split(/\s+/).length;
            }
            else if (tab.input instanceof vscode.TabInputText) {
                stats.failedCount++;
                stats.failedFiles.push(tab.label);
            }
            return result;
        }));
        return [results.filter(content => content.length > 0), stats];
    }
    static async processTab(tab, settings, token) {
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
        }
        catch (error) {
            (0, utils_1.handleError)(`Error processing tab ${tab.label}`, error);
            return `// Error processing file: ${tab.label}`;
        }
        return '';
    }
    static shouldProcessFile(extension, settings) {
        return (settings.includeFileTypes.length === 0 ||
            settings.includeFileTypes.includes(extension)) &&
            !settings.excludeFileTypes.includes(extension);
    }
    static processContent(content, extension, settings) {
        if (!settings.includeComments) {
            content = this.removeComments(content, extension);
        }
        if (settings.includeLineNumbers) {
            content = this.addLineNumbers(content);
        }
        return content;
    }
    static removeComments(content, extension) {
        const languageId = commentPatterns_1.extensionToLanguage[extension.toLowerCase()] || '';
        return commentPatterns_1.commentPatterns[languageId] ?
            content.replace(commentPatterns_1.commentPatterns[languageId], '') :
            content;
    }
    static addLineNumbers(content) {
        return content.split('\n')
            .map((line, index) => `${index + 1}: ${line}`)
            .join('\n');
    }
}
exports.TabProcessor = TabProcessor;
//# sourceMappingURL=tabProcessor.js.map