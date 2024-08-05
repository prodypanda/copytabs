npm install -g yo generator-code
-----
yo code
--------
"contributes": {
  "commands": [
    {
      "command": "extension.copyAllTabs",
      "title": "Copy All Tabs to New Tab"
    }
  ]
}
-------







import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.copyAllTabs', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor');
            return;
        }

        const openedDocuments = vscode.workspace.textDocuments;
        let combinedContent = '';

        for (const doc of openedDocuments) {
            if (!doc.isClosed && !doc.isUntitled) {
                const filePath = doc.uri.fsPath;
                const relativePath = vscode.workspace.asRelativePath(filePath);
                const content = doc.getText();
                
                combinedContent += `// File: ${relativePath}\n\n${content}\n\n`;
            }
        }

        const newDoc = await vscode.workspace.openTextDocument({ content: combinedContent });
        await vscode.window.showTextDocument(newDoc, { preview: false });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}


--------
vsce package
