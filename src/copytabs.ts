import * as vscode from 'vscode';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;
// New status bar item for copySelectedTabs
let statusBarItemSelected: vscode.StatusBarItem;
// New status bar item for copyTabsCustomFormat
let statusBarItemCustom: vscode.StatusBarItem;
export function activate(context: vscode.ExtensionContext) {
    console.log('copytabs: Activating extension');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(files) Copy All";
    statusBarItem.tooltip = "Copy all opened tabs to a new tab, `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)";
    statusBarItem.command = 'copytabs.copyAllTabs';
    statusBarItem.show();

    statusBarItemSelected = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    statusBarItemSelected.text = "$(list-selection) Copy Selected";
    statusBarItemSelected.tooltip = "Copy selected tabs to a new tab, `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS)";
    statusBarItemSelected.command = 'copytabs.copySelectedTabs';
    statusBarItemSelected.show();

    statusBarItemCustom = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
    statusBarItemCustom.text = "$(settings-gear) Copy Custom";
    statusBarItemCustom.tooltip = "Copy tabs with custom format, `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (macOS)";
    statusBarItemCustom.command = 'copytabs.copyTabsCustomFormat';
    statusBarItemCustom.show();

    

    let disposable = vscode.commands.registerCommand('copytabs.copyAllTabs', async () => {
        try {
            await copyAllTabs();
        } catch (error) {
            if (error instanceof Error) {
                vscode.window.showErrorMessage(`Error copying tabs: ${error.message}`);
            } else {
                vscode.window.showErrorMessage('An unknown error occurred while copying tabs');
            }
        }
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBarItem, statusBarItemSelected, statusBarItemCustom);

    // New command to copy selected tabs
    context.subscriptions.push(vscode.commands.registerCommand('copytabs.copySelectedTabs', async () => {
        try {
            await copySelectedTabs();
        } catch (error) {
            vscode.window.showErrorMessage(`Error copying selected tabs: ${error}`);
        }
    }));

    // New command to copy tabs with custom format
    context.subscriptions.push(vscode.commands.registerCommand('copytabs.copyTabsCustomFormat', async () => {
        try {
            await copyTabsCustomFormat();
        } catch (error) {
            vscode.window.showErrorMessage(`Error copying tabs with custom format: ${error}`);
        }
    }));

    console.log('copytabs: Extension activated');
}

async function copyAllTabs() {
    const config = vscode.workspace.getConfiguration('copytabs');
    const includeFileTree = config.get<boolean>('includeFileTree', true);
    const treePosition = config.get<string>('structuredTreePosition', 'start');
    const includeFileTypes = config.get<string[]>('includeFileTypes', []);
    const excludeFileTypes = config.get<string[]>('excludeFileTypes', []);
    const separatorLine = config.get<string>('separatorLine', '------------------------');
    const includeComments = config.get<boolean>('includeComments', true);
    const includeLineNumbers = config.get<boolean>('includeLineNumbers', false);

    const openedTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
   
    let combinedContent = '';


    const progress = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Copying tabs",
        cancellable: false
    }, async (progress) => {
        const totalTabs = openedTabs.length;
        let processedTabs = 0;

        const fileContents = await Promise.all(openedTabs.map(async (tab) => {
            if (tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri);
                const filePath = document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const fileExtension = path.extname(filePath).slice(1);

                if ((includeFileTypes.length === 0 || includeFileTypes.includes(fileExtension)) &&
                    !excludeFileTypes.includes(fileExtension)) {
                    let content = document.getText();
                    if (!includeComments) {
                        content = removeComments(content, fileExtension);
                    }
                    if (includeLineNumbers) {
                        content = addLineNumbers(content);
                    }

                    processedTabs++;
                    progress.report({ 
                        message: `Processing file ${processedTabs} of ${totalTabs}`, 
                        increment: (1 / totalTabs) * 100 
                    });

                    return `// File: ${relativePath}\n\n${content}`;
                }
            }
            return null;
        }));

        combinedContent = fileContents.filter(Boolean).join(`\n\n${separatorLine}\n\n`);
    });

    if (includeFileTree) {
        const structuredFileTree = generateStructuredFileTree(openedTabs);
        if (treePosition === 'start') {
            combinedContent = structuredFileTree + '\n\n' + combinedContent;
        } else {
            combinedContent = combinedContent + '\n\n' + structuredFileTree;
        }
    }

    if (combinedContent) {
        const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
        vscode.window.showInformationMessage('All tabs copied successfully with file tree!');
    } else {
        vscode.window.showInformationMessage('No matching tabs found to copy.');
    }


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
        const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
        vscode.window.showInformationMessage('Selected tabs copied successfully!');
    }
}

async function copyTabsCustomFormat() {
    const format = await vscode.window.showInputBox({
        prompt: 'Enter custom format (use {filename}, {content}, {separator}, and [NL] for new lines)',
        value: '// {filename}[NL][NL]{content}[NL][NL]{separator}[NL][NL]'
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

        const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
        vscode.window.showInformationMessage('Tabs copied with custom format successfully!');
    }
}


function removeComments(content: string, fileExtension: string): string {
    // This is a simple implementation and might not cover all cases
    // You may want to use a more robust solution for removing comments
    switch (fileExtension) {
        case 'js':
        case 'ts':
        case 'java':
        case 'c':
        case 'cpp':
            return content.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
        case 'py':
            return content.replace(/#.*|'''[\s\S]*?'''|"""[\s\S]*?"""/g, '');
        case 'html':
        case 'xml':
            return content.replace(/<!--[\s\S]*?-->/g, '');
        default:
            return content;
    }
}



function addLineNumbers(content: string): string {
    return content.split('\n').map((line, index) => `${index + 1}: ${line}`).join('\n');
}



function generateStructuredFileTree(tabs: vscode.Tab[]): string {
    const fileStructure: { [key: string]: any } = {};
    let rootFolderName = '';

    tabs.forEach(tab => {
        if (tab.input instanceof vscode.TabInputText) {
            const fullPath = vscode.workspace.asRelativePath(tab.input.uri);
            const path = fullPath.split('/');
            
            if (!rootFolderName && vscode.workspace.workspaceFolders) {
                rootFolderName = vscode.workspace.workspaceFolders[0].name;
            }

            let current = fileStructure;
            path.forEach((part, index) => {
                if (index === path.length - 1) {
                    current[part] = null;
                } else {
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        }
    });

    function renderTree(structure: any, prefix = ''): string {
        let result = '';
        const keys = Object.keys(structure).sort();
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
            result += `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
            if (structure[key]) {
                result += renderTree(structure[key], prefix + (isLast ? '    ' : '│   '));
            }
        });
        return result;
    }

    return `File Tree:\n${rootFolderName}/\n${renderTree(fileStructure, '')}`;
}



export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}











///
