import * as vscode from "vscode";

export class FolderSelectView {
  static async showFolderSelection(
    folderPath: string
  ): Promise<{ selectedFiles: string[] }> {
    // Use VS Code API to find all files under the folder
    const folderUri = vscode.Uri.file(folderPath);
    // Find all files recursively under the folder
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folderUri, "**/*"),
      "**/node_modules/**"
    );
    if (files.length === 0) {
      vscode.window.showWarningMessage(
        vscode.l10n.t("No files found in the selected folder.")
      );
      return { selectedFiles: [] };
    }
    // Show QuickPick for file selection
    const items = files.map((f) => ({
      label: vscode.workspace.asRelativePath(f),
      description: f.fsPath,
      uri: f,
    }));
    const selected = await vscode.window.showQuickPick(items, {
      canPickMany: true,
      placeHolder: vscode.l10n.t("Select files to copy from folder"),
    });
    return { selectedFiles: selected ? selected.map((i) => i.uri.fsPath) : [] };
  }
}
