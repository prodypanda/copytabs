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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const utils_1 = require("./utils");
const tabProcessor_1 = require("./tabProcessor");
const statusBar_1 = require("./statusBar");
const config_1 = __importDefault(require("./config"));
const historyView_1 = require("./historyView");
const historyManager_1 = require("./historyManager");
let statusBarManager;
let historyManager;
async function activate(context) {
    console.log(vscode.l10n.t('copytabs: Activating extension'));
    // vscode.window.showInformationMessage('Current VSC language:', vscode.env.language);
    try {
        historyManager = new historyManager_1.HistoryManager(context);
        statusBarManager = new statusBar_1.StatusBarManager();
        // Register History View
        const historyViewProvider = new historyView_1.HistoryViewProvider(context.extensionUri, historyManager);
        context.subscriptions.push(vscode.window.registerWebviewViewProvider(historyView_1.HistoryViewProvider.viewType, historyViewProvider));
        // Add this new configuration change listener
        const configListener = vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('copytabs.copyToClipboard')) {
                const isClipboardMode = config_1.default.isClipboardMode();
                const mode = isClipboardMode ? 'Clipboard Mode' : 'Tab Mode';
                vscode.window.showInformationMessage(`Switched to ${mode}`);
                statusBarManager.updateModeDisplay();
            }
            else if (e.affectsConfiguration('copytabs')) {
                statusBarManager.recreateItems();
            }
        });
        context.subscriptions.push(configListener);
        context.subscriptions.push(vscode.commands.registerCommand('copytabs.copyAllTabs', copyAllTabs), vscode.commands.registerCommand('copytabs.copySelectedTabs', copySelectedTabs), vscode.commands.registerCommand('copytabs.copyTabsCustomFormat', copyTabsCustomFormat), vscode.commands.registerCommand('copytabs.toggleClipboardMode', toggleClipboardMode), vscode.commands.registerCommand('copytabs.showHistory', () => {
            vscode.commands.executeCommand('workbench.view.extension.copytabs-history');
        }), vscode.commands.registerCommand('copytabs.clearHistory', () => {
            historyManager.clearHistory();
        }));
        console.log(vscode.l10n.t('copytabs: Extension started'));
    }
    catch (error) {
        console.error(vscode.l10n.t('copytabs: Failed to start extension'), error);
        vscode.window.showErrorMessage(vscode.l10n.t('copytabs: Failed to start extension'));
    }
}
// Rest of the file remains unchanged
// Simplify the toggleClipboardMode function
async function toggleClipboardMode() {
    await config_1.default.toggleClipboardMode();
    // Remove the manual update and notification here since it will be handled by the configuration change event
}
async function handleContent(content, description = vscode.l10n.t('Copied content'), stats) {
    const copyToClipboard = config_1.default.isClipboardMode();
    const mode = copyToClipboard ? 'clipboard' : 'new tab';
    let message = `📋 Tabs copied to ${mode}!\n`;
    if (stats) {
        message = `${stats.successCount} Tabs copied to ${mode}!\n`;
        message += `-✅ Success: ${stats.successCount} \n`;
        if (stats.failedCount > 0) {
            message += `-❌ Failed: ${stats.failedCount} \n`;
            if (stats.failedFiles.length > 0) {
                message += `-❌ files: ${stats.failedFiles.join(', ')}\n`;
            }
        }
        message += `-📊 Tokens: ${stats.totalTokens.toLocaleString()}`;
    }
    if (copyToClipboard) {
        await vscode.env.clipboard.writeText(content);
    }
    else {
        const newDoc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
    }
    vscode.window.showInformationMessage(message, { modal: false });
    historyManager.addToHistory(content, description);
}
async function copyAllTabs() {
    try {
        const config = vscode.workspace.getConfiguration('copytabs');
        const settings = {
            includeFileTree: config.get('includeFileTree', true),
            treePosition: config.get('structuredTreePosition', 'start'),
            includeFileTypes: config.get('includeFileTypes', []),
            excludeFileTypes: config.get('excludeFileTypes', []),
            separatorLine: config.get('separatorLine', '------------------------'),
            includeComments: config.get('includeComments', true),
            includeLineNumbers: config.get('includeLineNumbers', false),
            maxFileSize: config.get('maxFileSize', 5242880) // 5MB default
        };
        const openedTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        if (!openedTabs.length) {
            vscode.window.showInformationMessage(vscode.l10n.t('No tabs are currently open.'));
            return;
        }
        let combinedContent = '';
        let copyStats = {
            successCount: 0,
            failedCount: 0,
            totalTokens: 0,
            processedFiles: [],
            failedFiles: []
        };
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: vscode.l10n.t('Copying tabs...'),
            cancellable: true
        }, async (progress, token) => {
            const [chunks, stats] = await processTabsWithProgress(openedTabs, settings, progress, token);
            copyStats = stats;
            if (chunks.length) {
                combinedContent = chunks.join(`\n\n${settings.separatorLine}\n\n`);
            }
        });
        if (settings.includeFileTree) {
            const structuredFileTree = generateStructuredFileTree(openedTabs);
            if (settings.treePosition === 'start') {
                combinedContent = structuredFileTree + '\n\n' + combinedContent;
            }
            else {
                combinedContent = combinedContent + '\n\n' + structuredFileTree;
            }
        }
        if (combinedContent) {
            await handleContent(combinedContent, `${openedTabs.length} tabs copied`, copyStats);
        }
        else {
            vscode.window.showInformationMessage(vscode.l10n.t('No matching tabs found to copy.'));
        }
    }
    catch (error) {
        (0, utils_1.handleError)('Error in copyAllTabs', error);
        vscode.window.showErrorMessage('An error occurred while copying tabs.');
    }
}
async function processTabsWithProgress(tabs, settings, progress, token) {
    const chunkSize = Math.max(1, Math.floor(5242880 / settings.maxFileSize));
    const results = [];
    const totalStats = {
        successCount: 0,
        failedCount: 0,
        totalTokens: 0,
        processedFiles: [],
        failedFiles: []
    };
    const totalChunks = Math.ceil(tabs.length / chunkSize);
    for (let i = 0; i < tabs.length; i += chunkSize) {
        if (token.isCancellationRequested)
            break;
        const chunk = tabs.slice(i, i + chunkSize);
        const [processed, chunkStats] = await tabProcessor_1.TabProcessor.processChunk(chunk, settings, token);
        results.push(...processed);
        totalStats.successCount += chunkStats.successCount;
        totalStats.failedCount += chunkStats.failedCount;
        totalStats.totalTokens += chunkStats.totalTokens;
        totalStats.processedFiles.push(...chunkStats.processedFiles);
        totalStats.failedFiles.push(...chunkStats.failedFiles);
        const currentEnd = Math.min(tabs.length, i + chunkSize);
        progress.report({
            increment: (100 / totalChunks),
            message: `Processing files ${i + 1} to ${currentEnd} of ${tabs.length}`
        });
    }
    return [results, totalStats];
}
async function copySelectedTabs() {
    const selectedTabs = await vscode.window.showQuickPick(vscode.window.tabGroups.all.flatMap(group => group.tabs).map(tab => ({
        label: tab.label,
        description: (tab.input instanceof vscode.TabInputText)
            ? vscode.workspace.asRelativePath(tab.input.uri)
            : '',
        tab: tab
    })), { canPickMany: true, placeHolder: vscode.l10n.t('Select tabs to copy') });
    if (selectedTabs && selectedTabs.length > 0) {
        const content = await Promise.all(selectedTabs.map(async (item) => {
            if (item.tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(item.tab.input.uri);
                return `// File: ${item.description}\n\n${document.getText()}`;
            }
            return null;
        }));
        const combinedContent = content.filter(Boolean).join('\n\n------------------------\n\n');
        await handleContent(combinedContent, vscode.l10n.t('{0} selected tabs copied', selectedTabs.length));
    }
}
async function copyTabsCustomFormat() {
    const format = await vscode.window.showInputBox({
        prompt: vscode.l10n.t('Enter custom format (use {filename}, {content}, {separator}, and [NL] for new lines)'),
        value: '// {filename}[NL][NL]{content}[NL][NL]{separator}[NL][NL]',
        validateInput: (value) => {
            if (!value.includes('{filename}') || !value.includes('{content}')) {
                return vscode.l10n.t('Format must include both {filename} and {content}');
            }
            return null;
        }
    });
    if (format) {
        const includeTree = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: vscode.l10n.t('Include structured file tree?')
        });
        let treePosition = 'start';
        if (includeTree === 'Yes') {
            treePosition = await vscode.window.showQuickPick(['Start', 'End'], {
                placeHolder: vscode.l10n.t('Where to place the file tree?')
            }) || 'start';
        }
        const openedTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        let combinedContent = '';
        for (const tab of openedTabs) {
            if (tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri);
                const filename = vscode.workspace.asRelativePath(document.uri);
                const content = document.getText();
                const formattedContent = format
                    .replace('{filename}', filename)
                    .replace('{content}', content)
                    .replace('{separator}', '------------------------')
                    .replace(/\[NL\]/g, '\n');
                combinedContent += formattedContent;
            }
        }
        if (includeTree === 'Yes') {
            const fileTree = generateStructuredFileTree(openedTabs);
            if (treePosition.toLowerCase() === 'start') {
                combinedContent = fileTree + '\n\n' + combinedContent;
            }
            else {
                combinedContent = combinedContent + '\n\n' + fileTree;
            }
        }
        await handleContent(combinedContent, vscode.l10n.t('Copied tabs with custom format'));
    }
}
function generateStructuredFileTree(tabs) {
    try {
        const fileStructure = {};
        const rootFolder = vscode.workspace.workspaceFolders?.[0]?.name ?? 'Workspace';
        tabs.forEach(tab => {
            if (tab.input instanceof vscode.TabInputText) {
                try {
                    const fullPath = vscode.workspace.asRelativePath(tab.input.uri);
                    const pathParts = fullPath.split(/[/\\]/);
                    (0, utils_1.addPathToStructure)(fileStructure, pathParts);
                }
                catch (error) {
                    console.warn(`Skipping tab in tree: ${tab.label}`, error);
                }
            }
        });
        return (0, utils_1.formatFileTree)(fileStructure, rootFolder);
    }
    catch (error) {
        (0, utils_1.handleError)('Error generating file tree', error);
        return 'Error generating file tree';
    }
}
function deactivate() {
    statusBarManager?.dispose();
}
//# sourceMappingURL=copytabs.js.map