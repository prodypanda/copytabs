import * as vscode from "vscode";
import { FolderScanner, FolderItem } from "./folderScanner";
import { Logger } from "./logger";

export class FolderSelectView {
  static async showFolderSelection(
    folderPath: string
  ): Promise<{ selectedFiles: string[] }> {
    Logger.info(`Starting folder scan for: ${folderPath}`);

    try {
      const result = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: vscode.l10n.t("Scanning folder..."),
          cancellable: false,
        },
        async () => {
          return await FolderScanner.scanFolder(folderPath);
        }
      );

      if (!result.items || result.items.length === 0) {
        Logger.warn("Scanner returned 0 items.");
        vscode.window.showWarningMessage(
          vscode.l10n.t("No files found in the selected folder.")
        );
        return { selectedFiles: [] };
      }

      Logger.info(`Found ${result.items.length} root items. Flattening...`);

      // Flatten the tree for QuickPick
      const allFiles: { label: string; description: string; uri: string }[] =
        [];
      this.flattenItems(result.items, allFiles);

      Logger.info(`Flattened to ${allFiles.length} selectable files.`);

      // Sort by path
      allFiles.sort((a, b) => a.label.localeCompare(b.label));

      if (allFiles.length === 0) {
        Logger.warn("No files remaining after flattening (check exclusions).");
        vscode.window.showWarningMessage(
          vscode.l10n.t("No valid files found.")
        );
        return { selectedFiles: [] };
      }

      // Show QuickPick
      const selected = await vscode.window.showQuickPick(allFiles, {
        canPickMany: true,
        placeHolder: vscode.l10n.t("Select files to copy from folder"),
        matchOnDescription: true,
      });

      if (!selected) {
        Logger.info("User cancelled QuickPick selection.");
        return { selectedFiles: [] };
      }

      Logger.info(`User selected ${selected.length} files.`);
      return { selectedFiles: selected.map((i) => i.uri) };
    } catch (error) {
      Logger.error(
        "Error in showFolderSelection",
        error instanceof Error ? error : undefined
      );
      return { selectedFiles: [] };
    }
  }

  private static flattenItems(
    items: FolderItem[],
    result: { label: string; description: string; uri: string }[]
  ) {
    for (const item of items) {
      if (item.isFile) {
        result.push({
          label: item.name,
          description: vscode.workspace.asRelativePath(item.path),
          uri: item.path,
        });
      }
      if (item.children) {
        this.flattenItems(item.children, result);
      }
    }
  }
}
