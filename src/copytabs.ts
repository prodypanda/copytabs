import * as vscode from 'vscode';
import * as path from 'path';
import { CopySettings, FileStructure } from './types';
import { handleError, addPathToStructure, formatFileTree } from './utils';
import { TabProcessor } from './tabProcessor';
import { StatusBarManager } from './statusBar';
import ConfigManager from './config';  // Update import statement

// Add type definitions
interface ProcessedTab {
    content: string;
    error?: string;
}

let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext) {
    console.log('copytabs: Activating extension');

    statusBarManager = new StatusBarManager();

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('copytabs')) {
                statusBarManager.recreateItems();
            }
        }),
        vscode.commands.registerCommand('copytabs.copyAllTabs', copyAllTabs),
        vscode.commands.registerCommand('copytabs.copySelectedTabs', copySelectedTabs),
        vscode.commands.registerCommand('copytabs.copyTabsCustomFormat', copyTabsCustomFormat),
        vscode.commands.registerCommand('copytabs.toggleClipboardMode', toggleClipboardMode)
    );

    console.log('copytabs: Extension activated');
}

async function toggleClipboardMode() {
    await ConfigManager.toggleClipboardMode();
    statusBarManager.updateModeDisplay();
    const mode = ConfigManager.isClipboardMode() ? 'Clipboard' : 'Tab';
    vscode.window.showInformationMessage(`Switched to ${mode} Mode`);
}

async function handleContent(content: string) {
    const copyToClipboard = ConfigManager.isClipboardMode();

    if (copyToClipboard) {
        await vscode.env.clipboard.writeText(content);
        vscode.window.showInformationMessage('Content copied to clipboard!');
    } else {
        const newDoc = await vscode.workspace.openTextDocument({ content, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
        vscode.window.showInformationMessage('Content copied to new tab!');
    }
}

async function copyAllTabs() {
    try {
        const config = vscode.workspace.getConfiguration('copytabs');
        const settings: CopySettings = {
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
            vscode.window.showInformationMessage('No tabs are currently open.');
            return;
        }

        let combinedContent = '';
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Copying tabs",
            cancellable: true
        }, async (progress, token) => {
            const chunks = await processTabsWithProgress(openedTabs, settings, progress, token);
            if (chunks.length) {
                combinedContent = chunks.join(`\n\n${settings.separatorLine}\n\n`);
            }
        });

        if (settings.includeFileTree) {
            const structuredFileTree = generateStructuredFileTree(openedTabs);
            if (settings.treePosition === 'start') {
                combinedContent = structuredFileTree + '\n\n' + combinedContent;
            } else {
                combinedContent = combinedContent + '\n\n' + structuredFileTree;
            }
        }

        if (combinedContent) {
            await handleContent(combinedContent);
        } else {
            vscode.window.showInformationMessage('No matching tabs found to copy.');
        }
    } catch (error) {
        handleError('Error in copyAllTabs', error);
        vscode.window.showErrorMessage('An error occurred while copying tabs.');
    }
}

async function processTabsWithProgress(
    tabs: vscode.Tab[],
    settings: CopySettings,
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
): Promise<string[]> {
    const chunkSize = Math.max(1, Math.floor(5242880 / settings.maxFileSize));
    const results: string[] = [];
    
    for (let i = 0; i < tabs.length; i += chunkSize) {
        if (token.isCancellationRequested) {
            break;
        }

        const chunk = tabs.slice(i, i + chunkSize);
        const processed = await TabProcessor.processChunk(chunk, settings, token);
        results.push(...processed);

        progress.report({
            increment: (chunkSize / tabs.length) * 100,
            message: `Processing files ${i + 1} to ${Math.min(i + chunkSize, tabs.length)}`
        });
    }

    return results;
}

async function copySelectedTabs() {
    const selectedTabs = await vscode.window.showQuickPick(
        vscode.window.tabGroups.all.flatMap(group => group.tabs).map(tab => ({
            label: tab.label,
            description: (tab.input instanceof vscode.TabInputText) ? vscode.workspace.asRelativePath(tab.input.uri) : '',
            tab: tab
        })),
        { canPickMany: true, placeHolder: 'Select tabs to copy' }
    );

    if (selectedTabs && selectedTabs.length > 0) {
        const content = await Promise.all(selectedTabs.map(async (item) => {
            if (item.tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(item.tab.input.uri);
                return `// File: ${item.description}\n\n${document.getText()}`;
            }
            return null;
        }));

        const combinedContent = content.filter(Boolean).join('\n\n------------------------\n\n');
        await handleContent(combinedContent);
    }
}

async function copyTabsCustomFormat() {
    const format = await vscode.window.showInputBox({
        prompt: 'Enter custom format (use {filename}, {content}, {separator}, and [NL] for new lines)',
        value: '// {filename}[NL][NL]{content}[NL][NL]{separator}[NL][NL]',
        validateInput: (value: string) => {
            if (!value.includes('{filename}') || !value.includes('{content}')) {
                return 'Format must include both {filename} and {content}';
            }
            return null;
        }
    });

    if (format) {
        const includeTree = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: 'Include structured file tree?'
        });

        let treePosition = 'start';
        if (includeTree === 'Yes') {
            treePosition = await vscode.window.showQuickPick(['Start', 'End'], {
                placeHolder: 'Where to place the file tree?'
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
                    .replace(/\[NL\]/g, '\n'); // Convert [NL] to actual line breaks
                combinedContent += formattedContent;
            }
        }

        if (includeTree === 'Yes') {
            const fileTree = generateStructuredFileTree(openedTabs);
            if (treePosition.toLowerCase() === 'start') {
                combinedContent = fileTree + '\n\n' + combinedContent;
            } else {
                combinedContent = combinedContent + '\n\n' + fileTree;
            }
        }

        await handleContent(combinedContent);
    }
}

function addLineNumbers(content: string): string {
    return content.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
}

// Update generateStructuredFileTree with proper typing
function generateStructuredFileTree(tabs: vscode.Tab[]): string {
    try {
        const fileStructure: FileStructure = {};
        const rootFolder = vscode.workspace.workspaceFolders?.[0]?.name ?? 'Workspace';

        tabs.forEach(tab => {
            if (tab.input instanceof vscode.TabInputText) {
                try {
                    const fullPath = vscode.workspace.asRelativePath(tab.input.uri);
                    const pathParts = fullPath.split(/[/\\]/);
                    addPathToStructure(fileStructure, pathParts);
                } catch (error) {
                    console.warn(`Skipping tab in tree: ${tab.label}`, error);
                }
            }
        });

        return formatFileTree(fileStructure, rootFolder);
    } catch (error) {
        handleError('Error generating file tree', error);
        return 'Error generating file tree';
    }
}

export function deactivate() {
    statusBarManager?.dispose();
}
