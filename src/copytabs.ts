import * as vscode from 'vscode';
import * as path from 'path';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('copytabs:Activating extension');
    console.log('copytabs:Congratulations, your extension "copytabs" is now active!');
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(files) Copy All Tabs";
    statusBarItem.tooltip = "Copy all opened tabs to a new tab";
    statusBarItem.command = 'copytabs.copyAllTabs';
    statusBarItem.show();
    console.log('copytabs:Status bar item created');

    let disposable = vscode.commands.registerCommand('copytabs.copyAllTabs', async () => {
        console.log('copytabs:Command executed');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }


        const openedTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        let combinedContent = '';

        for (const tab of openedTabs) {
            if (tab.input instanceof vscode.TabInputText) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri);
                const filePath = document.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const content = document.getText();
                
                combinedContent += `// File: ${relativePath}\n\n${content}\n\n------------------------\n\n`;
            }
        }

        if (combinedContent) {
            const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent });
            await vscode.window.showTextDocument(newDoc, { preview: false });
        } else {
            vscode.window.showInformationMessage('No open text tabs found.');
        }


    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBarItem);
    console.log('copytabs:Extension activated');
}

export function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}