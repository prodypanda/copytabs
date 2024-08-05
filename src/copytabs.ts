import * as vscode from 'vscode';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('copytabs: Activating extension');

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(files) Copy All Tabs";
    statusBarItem.tooltip = "Copy all opened tabs to a new tab";
    statusBarItem.command = 'copytabs.copyAllTabs';
    statusBarItem.show();

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
    context.subscriptions.push(statusBarItem);
    console.log('copytabs: Extension activated');
}

async function copyAllTabs() {
    const config = vscode.workspace.getConfiguration('copytabs');
    const includeFileTypes = config.get<string[]>('includeFileTypes', []);
    const excludeFileTypes = config.get<string[]>('excludeFileTypes', []);
    const separatorLine = config.get<string>('separatorLine', '------------------------');
    const includeComments = config.get<boolean>('includeComments', true);

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

    if (combinedContent) {
        const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent, language: 'plaintext' });
        await vscode.window.showTextDocument(newDoc, { preview: false });
        vscode.window.showInformationMessage('All tabs copied successfully!');
    } else {
        vscode.window.showInformationMessage('No matching tabs found to copy.');
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

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}