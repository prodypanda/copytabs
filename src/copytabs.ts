import * as vscode from 'vscode';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem | undefined;
let statusBarItemSelected: vscode.StatusBarItem | undefined;
let statusBarItemCustom: vscode.StatusBarItem | undefined;
export function activate(context: vscode.ExtensionContext) {
    console.log('copytabs: Activating extension');

    // Create status bar items
    createStatusBarItems();

    // Register configuration change listener
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('copytabs')) {
            updateStatusBarItems();
        }
    }));

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('copytabs.copyAllTabs', copyAllTabs),
        vscode.commands.registerCommand('copytabs.copySelectedTabs', copySelectedTabs),
        vscode.commands.registerCommand('copytabs.copyTabsCustomFormat', copyTabsCustomFormat)
    );

    console.log('copytabs: Extension activated');
}


function createStatusBarItems() {
    const config = vscode.workspace.getConfiguration('copytabs');

    if (config.get<boolean>('showCopyAllButton')) {
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.text = "$(files) Copy All";
        statusBarItem.tooltip = "Copy all opened tabs to a new tab";
        statusBarItem.command = 'copytabs.copyAllTabs';
        statusBarItem.show();
    }

    if (config.get<boolean>('showCopySelectedButton')) {
        statusBarItemSelected = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
        statusBarItemSelected.text = "$(list-selection) Copy Selected";
        statusBarItemSelected.tooltip = "Copy selected tabs to a new tab";
        statusBarItemSelected.command = 'copytabs.copySelectedTabs';
        statusBarItemSelected.show();
    }

    if (config.get<boolean>('showCopyCustomButton')) {
        statusBarItemCustom = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 98);
        statusBarItemCustom.text = "$(settings-gear) Copy Custom";
        statusBarItemCustom.tooltip = "Copy tabs with custom format";
        statusBarItemCustom.command = 'copytabs.copyTabsCustomFormat';
        statusBarItemCustom.show();
    }
}


function updateStatusBarItems() {
    const config = vscode.workspace.getConfiguration('copytabs');

    if (config.get<boolean>('showCopyAllButton')) {
        statusBarItem?.show();
    } else {
        statusBarItem?.hide();
    }

    if (config.get<boolean>('showCopySelectedButton')) {
        statusBarItemSelected?.show();
    } else {
        statusBarItemSelected?.hide();
    }

    if (config.get<boolean>('showCopyCustomButton')) {
        statusBarItemCustom?.show();
    } else {
        statusBarItemCustom?.hide();
    }
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
    const languageId = vscode.window.activeTextEditor?.document.languageId || '';
    
    const commentPatterns: { [key: string]: RegExp } = {
        'javascript': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'typescript': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'python': /#.*|'''[\s\S]*?'''|"""[\s\S]*?"""/g,
        'java': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'c': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'cpp': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'csharp': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'ruby': /#.*|=begin[\s\S]*?=end/g,
        'php': /\/\/.*|#.*|\/\*[\s\S]*?\*\//g,
        'swift': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'go': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'rust': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'html': /<!--[\s\S]*?-->/g,
        'xml': /<!--[\s\S]*?-->/g,
        'css': /\/\*[\s\S]*?\*\//g,
        'scss': /\/\/.*|\/\*[\s\S]*?\*\//g,
        'less': /\/\/.*|\/\*[\s\S]*?\*\//g,
    };

    // If we don't have a specific pattern for this language, return the original content
    if (!commentPatterns[languageId]) {
        return content;
    }

    // Remove comments based on the language-specific pattern
    return content.replace(commentPatterns[languageId], '');
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
    statusBarItem?.dispose();
    statusBarItemSelected?.dispose();
    statusBarItemCustom?.dispose();
}











///
