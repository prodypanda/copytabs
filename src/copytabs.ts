import * as vscode from "vscode";
import { CopySettings, FileStructure, CopyStatistics } from "./types";
import { handleError, addPathToStructure, formatFileTree } from "./utils";
import { TabProcessor } from "./tabProcessor";
import { StatusBarManager } from "./statusBar";
import ConfigManager from "./config";
import { HistoryViewProvider } from "./historyView";
import { HistoryManager } from "./historyManager";
import { Logger } from "./logger";
import { TextDecoder } from "util";
import { FolderSelectView } from "./folderSelectView";

// FALLBACK LOGGING: This shows up in "Help > Toggle Developer Tools"
console.log("CopyTabs: File loaded successfully.");

let statusBarManager: StatusBarManager;
let historyManager: HistoryManager;

export async function activate(context: vscode.ExtensionContext) {
  // FORCE SHOW LOGS IMMEDIATELY
  Logger.show();
  Logger.info("------------------------------------------------");
  Logger.info("copytabs: Activating extension version 1.0.5");

  try {
    historyManager = new HistoryManager(context);
    statusBarManager = new StatusBarManager();

    const historyViewProvider = new HistoryViewProvider(
      context.extensionUri,
      historyManager
    );
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        HistoryViewProvider.viewType,
        historyViewProvider
      )
    );

    const configListener = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("copytabs.copyToClipboard")) {
        const isClipboardMode = ConfigManager.isClipboardMode();
        const mode = isClipboardMode
          ? vscode.l10n.t("Clipboard Mode")
          : vscode.l10n.t("Tab Mode");
        vscode.window.showInformationMessage(
          vscode.l10n.t("Switched to ") + mode
        );
        statusBarManager.updateModeDisplay();
      } else if (e.affectsConfiguration("copytabs")) {
        statusBarManager.recreateItems();
      }
    });

    context.subscriptions.push(configListener);

    context.subscriptions.push(
      vscode.commands.registerCommand("copytabs.copyAllTabs", copyAllTabs),
      vscode.commands.registerCommand(
        "copytabs.copySelectedTabs",
        copySelectedTabs
      ),
      vscode.commands.registerCommand(
        "copytabs.copyTabsCustomFormat",
        copyTabsCustomFormat
      ),
      vscode.commands.registerCommand(
        "copytabs.toggleClipboardMode",
        toggleClipboardMode
      ),
      vscode.commands.registerCommand("copytabs.showHistory", () => {
        vscode.commands.executeCommand(
          "workbench.view.extension.copytabs-history"
        );
      }),
      vscode.commands.registerCommand("copytabs.clearHistory", () => {
        historyManager.clearHistory();
      }),
      vscode.commands.registerCommand("copytabs.copyFolder", copyFolder)
    );

    Logger.info(vscode.l10n.t("copytabs: Extension started"));
  } catch (error) {
    console.error("CopyTabs Activation Error:", error); // Fallback to DevTools
    Logger.error(
      vscode.l10n.t("copytabs: Failed to start extension"),
      error instanceof Error ? error : undefined
    );
    vscode.window.showErrorMessage(
      vscode.l10n.t("copytabs: Failed to start extension")
    );
  }
}

async function copyFolder(uri?: vscode.Uri, uris?: vscode.Uri[]) {
  Logger.show();
  Logger.info("copyFolder command triggered");

  try {
    let targetUri = uri;

    // 1. Handle multi-selection or direct command palette invocation
    if (!targetUri && uris && uris.length > 0) {
      targetUri = uris[0];
    }

    // 2. If still no URI (Command Palette), prompt user
    if (!targetUri) {
      const selection = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: vscode.l10n.t("Select Folder to Copy"),
      });

      if (selection && selection.length > 0) {
        targetUri = selection[0];
      } else {
        return; // User cancelled
      }
    }

    if (!targetUri) {
      Logger.warn("No target URI found.");
      return;
    }

    // 3. AUTO-FIX: If user right-clicked a FILE, switch to its PARENT FOLDER
    const stat = await vscode.workspace.fs.stat(targetUri);
    if ((stat.type & vscode.FileType.File) !== 0) {
      Logger.info("Selected item is a file, switching to parent folder");
      targetUri = vscode.Uri.joinPath(targetUri, "..");
    }

    Logger.info(`Scanning folder: ${targetUri.fsPath}`);

    // 4. Show the selection view
    const result = await FolderSelectView.showFolderSelection(targetUri.fsPath);

    if (!result.selectedFiles || result.selectedFiles.length === 0) {
      Logger.info("No files selected or operation cancelled");
      return;
    }

    let combinedContent = "";
    let successCount = 0;
    let failedCount = 0;
    const failedFiles: string[] = [];
    const decoder = new TextDecoder("utf-8");
    const settings = ConfigManager.getSettings();

    for (const filePath of result.selectedFiles) {
      if (combinedContent.length >= ConfigManager.MAX_OUTPUT_SIZE) {
        vscode.window.showWarningMessage(
          vscode.l10n.t("Output size limit reached. Some files were skipped.")
        );
        break;
      }

      try {
        const fileUri = vscode.Uri.file(filePath);
        const fileStat = await vscode.workspace.fs.stat(fileUri);

        if (fileStat.size > settings.maxFileSize) {
          failedCount++;
          failedFiles.push(
            `${vscode.workspace.asRelativePath(filePath)} (Too large)`
          );
          continue;
        }

        const fileData = await vscode.workspace.fs.readFile(fileUri);
        const content = decoder.decode(fileData);

        const relativePath = vscode.workspace.asRelativePath(filePath);
        combinedContent += `// File: ${relativePath}\n\n${content}\n\n${settings.separatorLine}\n\n`;
        successCount++;
      } catch (error) {
        failedCount++;
        failedFiles.push(vscode.workspace.asRelativePath(filePath));
        Logger.error(
          `Failed to read file: ${filePath}`,
          error instanceof Error ? error : undefined
        );
      }
    }

    const stats: CopyStatistics = {
      successCount,
      failedCount,
      totalTokens: combinedContent.length,
      processedFiles: result.selectedFiles,
      failedFiles,
    };

    await handleContent(
      combinedContent,
      vscode.l10n.t("Copied folder contents"),
      stats
    );
  } catch (error) {
    Logger.error(
      "Critical error in copyFolder",
      error instanceof Error ? error : undefined
    );
    Logger.show();
    vscode.window.showErrorMessage(
      `Copy Folder Failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function toggleClipboardMode() {
  await ConfigManager.toggleClipboardMode();
}

async function handleContent(
  content: string,
  description: string = vscode.l10n.t("Copied content"),
  stats?: CopyStatistics
) {
  const copyToClipboard = ConfigManager.isClipboardMode();
  const mode = copyToClipboard ? "clipboard" : "new tab";

  let message = `📋 Tabs copied to ${mode}!\n`;
  if (stats) {
    message = `${stats.successCount} Tabs copied to ${mode}!\n`;
    message += `-✅ Success: ${stats.successCount} \n`;
    if (stats.failedCount > 0) {
      message += `-❌ Failed: ${stats.failedCount} \n`;
      if (stats.failedFiles.length > 0) {
        const displayFailed = stats.failedFiles.slice(0, 3).join(", ");
        const remaining = stats.failedFiles.length - 3;
        message += `-❌ files: ${displayFailed}${
          remaining > 0 ? ` +${remaining} more` : ""
        }\n`;
      }
    }
    message += `-📊 Tokens: ${stats.totalTokens.toLocaleString()}`;
  }

  if (copyToClipboard) {
    await vscode.env.clipboard.writeText(content);
  } else {
    const newDoc = await vscode.workspace.openTextDocument({
      content,
      language: "plaintext",
    });
    await vscode.window.showTextDocument(newDoc, { preview: false });
  }

  vscode.window.showInformationMessage(message, { modal: false });

  if (content.length > 0 && content.length < ConfigManager.MAX_OUTPUT_SIZE) {
    historyManager.addToHistory(content, description);
  }
}

async function processTabsPipeline(tabs: vscode.Tab[], description: string) {
  const settings = ConfigManager.getSettings();
  let combinedContent = "";
  let copyStats: CopyStatistics = {
    successCount: 0,
    failedCount: 0,
    totalTokens: 0,
    processedFiles: [],
    failedFiles: [],
  };

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: vscode.l10n.t("Copying tabs..."),
      cancellable: true,
    },
    async (progress, token) => {
      const [chunks, stats] = await processTabsWithProgress(
        tabs,
        settings,
        progress,
        token
      );
      copyStats = stats;
      if (chunks.length) {
        combinedContent = chunks.join(`\n\n${settings.separatorLine}\n\n`);
      }
    }
  );

  if (combinedContent.length > ConfigManager.MAX_OUTPUT_SIZE) {
    vscode.window.showWarningMessage(
      vscode.l10n.t(
        "Output size ({0}MB) exceeds 50MB limit. Content truncated.",
        Math.round(combinedContent.length / 1024 / 1024)
      )
    );
    combinedContent = combinedContent.substring(
      0,
      ConfigManager.MAX_OUTPUT_SIZE
    );
  }

  if (settings.includeFileTree) {
    const structuredFileTree = generateStructuredFileTree(tabs);
    if (settings.treePosition === "start") {
      combinedContent = structuredFileTree + "\n\n" + combinedContent;
    } else {
      combinedContent = combinedContent + "\n\n" + structuredFileTree;
    }
  }

  if (combinedContent) {
    await handleContent(combinedContent, description, copyStats);
  } else {
    vscode.window.showInformationMessage(
      vscode.l10n.t("No matching tabs found to copy.")
    );
  }
}

async function copyAllTabs() {
  try {
    const openedTabs = vscode.window.tabGroups.all.flatMap(
      (group) => group.tabs
    );
    if (!openedTabs.length) {
      vscode.window.showInformationMessage(
        vscode.l10n.t("No tabs are currently open.")
      );
      return;
    }
    await processTabsPipeline(openedTabs, `${openedTabs.length} tabs copied`);
  } catch (error) {
    handleError("Error in copyAllTabs", error);
    vscode.window.showErrorMessage(
      vscode.l10n.t("An error occurred while copying tabs.")
    );
  }
}

async function copySelectedTabs() {
  const allTabs = vscode.window.tabGroups.all.flatMap((group) => group.tabs);

  const selectedItems = await vscode.window.showQuickPick(
    allTabs.map((tab) => ({
      label: tab.label,
      description:
        tab.input instanceof vscode.TabInputText
          ? vscode.workspace.asRelativePath(tab.input.uri)
          : "",
      tab: tab,
    })),
    { canPickMany: true, placeHolder: vscode.l10n.t("Select tabs to copy") }
  );

  if (selectedItems && selectedItems.length > 0) {
    const selectedTabs = selectedItems.map((item) => item.tab);
    await processTabsPipeline(
      selectedTabs,
      vscode.l10n.t("{0} selected tabs copied", selectedTabs.length)
    );
  }
}

async function processTabsWithProgress(
  tabs: vscode.Tab[],
  settings: CopySettings,
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  token: vscode.CancellationToken
): Promise<[string[], CopyStatistics]> {
  const maxFileSize = Math.max(1, settings.maxFileSize);
  const chunkSize = Math.max(
    1,
    Math.floor(ConfigManager.MAX_CHUNK_SIZE / maxFileSize)
  );
  const results: string[] = [];
  const totalStats: CopyStatistics = {
    successCount: 0,
    failedCount: 0,
    totalTokens: 0,
    processedFiles: [],
    failedFiles: [],
  };

  const totalChunks = Math.ceil(tabs.length / chunkSize);

  for (let i = 0; i < tabs.length; i += chunkSize) {
    if (token.isCancellationRequested) break;

    const chunk = tabs.slice(i, i + chunkSize);
    const [processed, chunkStats] = await TabProcessor.processChunk(
      chunk,
      settings,
      token
    );

    results.push(...processed);
    totalStats.successCount += chunkStats.successCount;
    totalStats.failedCount += chunkStats.failedCount;
    totalStats.totalTokens += chunkStats.totalTokens;
    totalStats.processedFiles.push(...chunkStats.processedFiles);
    totalStats.failedFiles.push(...chunkStats.failedFiles);

    const currentEnd = Math.min(tabs.length, i + chunkSize);
    progress.report({
      increment: 100 / totalChunks,
      message: `Processing files ${i + 1} to ${currentEnd} of ${tabs.length}`,
    });
  }

  return [results, totalStats];
}

async function copyTabsCustomFormat() {
  const validateCustomFormat = (format: string): string | null => {
    const required = ["{filename}", "{content}"];
    if (!required.every((r) => format.includes(r))) {
      return vscode.l10n.t("Format must include both {filename} and {content}");
    }
    if (format.length > 10000) {
      return vscode.l10n.t("Format string is too long (max 10KB)");
    }
    return null;
  };

  const format = await vscode.window.showInputBox({
    prompt: vscode.l10n.t(
      "Enter custom format (use {filename}, {content}, {separator}, and [NL] for new lines)"
    ),
    value: "// {filename}[NL][NL]{content}[NL][NL]{separator}[NL][NL]",
    validateInput: validateCustomFormat,
  });

  if (format) {
    const includeTree = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: vscode.l10n.t("Include structured file tree?"),
    });

    let treePosition = "start";
    if (includeTree === "Yes") {
      treePosition =
        (await vscode.window.showQuickPick(["Start", "End"], {
          placeHolder: vscode.l10n.t("Where to place the file tree?"),
        })) || "start";
    }

    const openedTabs = vscode.window.tabGroups.all.flatMap(
      (group) => group.tabs
    );
    let combinedContent = "";

    const settings = ConfigManager.getSettings();
    const decoder = new TextDecoder("utf-8");

    for (const tab of openedTabs) {
      if (combinedContent.length > ConfigManager.MAX_OUTPUT_SIZE) break;

      if (tab.input instanceof vscode.TabInputText) {
        try {
          const uri = tab.input.uri;
          let content = "";

          if (tab.isDirty) {
            const doc = await vscode.workspace.openTextDocument(uri);
            content = doc.getText();
          } else {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size <= settings.maxFileSize) {
              const bytes = await vscode.workspace.fs.readFile(uri);
              content = decoder.decode(bytes);
            } else {
              content = `[File skipped: Size ${stat.size} exceeds limit]`;
            }
          }

          const filename = vscode.workspace.asRelativePath(uri);
          const formattedContent = format
            .replace("{filename}", filename)
            .replace("{content}", content)
            .replace("{separator}", "------------------------")
            .replace(/\[NL\]/g, "\n");
          combinedContent += formattedContent;
        } catch (e) {
          Logger.warn(`Failed to process tab for custom format: ${tab.label}`);
        }
      }
    }

    if (includeTree === "Yes") {
      const fileTree = generateStructuredFileTree(openedTabs);
      if (treePosition.toLowerCase() === "start") {
        combinedContent = fileTree + "\n\n" + combinedContent;
      } else {
        combinedContent = combinedContent + "\n\n" + fileTree;
      }
    }

    await handleContent(
      combinedContent,
      vscode.l10n.t("Copied tabs with custom format")
    );
  }
}

function generateStructuredFileTree(tabs: vscode.Tab[]): string {
  try {
    const fileStructure: FileStructure = {};
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootFolder = workspaceFolders?.[0]?.name ?? "Workspace";

    tabs.forEach((tab) => {
      if (tab.input instanceof vscode.TabInputText) {
        try {
          const fullPath = vscode.workspace.asRelativePath(tab.input.uri);
          const pathParts = fullPath.split(/[/\\]/);
          addPathToStructure(fileStructure, pathParts);
        } catch (error) {
          Logger.warn(
            `Skipping tab in tree: ${tab.label}`,
            error instanceof Error ? error : undefined
          );
        }
      }
    });

    return formatFileTree(fileStructure, rootFolder);
  } catch (error) {
    handleError("Error generating file tree", error);
    return "Error generating file tree";
  }
}

export function deactivate() {
  statusBarManager?.dispose();
}
