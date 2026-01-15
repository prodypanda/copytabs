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

/**
 * Maximum output size limit (50MB) to prevent memory issues
 */
const MAX_OUTPUT_SIZE = 50 * 1024 * 1024;

let statusBarManager: StatusBarManager;
let historyManager: HistoryManager;

export async function activate(context: vscode.ExtensionContext) {
  Logger.info(vscode.l10n.t("copytabs: Activating extension"));

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
    Logger.error(
      vscode.l10n.t("copytabs: Failed to start extension"),
      error instanceof Error ? error : undefined
    );
    vscode.window.showErrorMessage(
      vscode.l10n.t("copytabs: Failed to start extension")
    );
  }
}

async function copyFolder(uri?: vscode.Uri) {
  Logger.info("copyFolder command triggered");
  try {
    if (!uri || !uri.fsPath) {
      vscode.window.showErrorMessage(vscode.l10n.t("Please select a folder."));
      return;
    }

    const { FolderSelectView } = await import("./folderSelectView");
    const result = await FolderSelectView.showFolderSelection(uri.fsPath);

    if (!result.selectedFiles || result.selectedFiles.length === 0) {
      vscode.window.showInformationMessage(vscode.l10n.t("No files selected."));
      return;
    }

    let combinedContent = "";
    let successCount = 0;
    let failedCount = 0;
    const failedFiles: string[] = [];
    const decoder = new TextDecoder("utf-8");
    const maxFileSize = ConfigManager.getConfig("maxFileSize", 5242880);

    for (const filePath of result.selectedFiles) {
      try {
        // Safety check for output size
        if (combinedContent.length >= MAX_OUTPUT_SIZE) {
          vscode.window.showWarningMessage(
            vscode.l10n.t("Output limit reached. Some files were skipped.")
          );
          break;
        }

        const fileUri = vscode.Uri.file(filePath);

        // Check file size before reading
        const stat = await vscode.workspace.fs.stat(fileUri);
        if (stat.size > maxFileSize) {
          failedCount++;
          failedFiles.push(`${path.basename(filePath)} (Too large)`);
          continue;
        }

        const fileData = await vscode.workspace.fs.readFile(fileUri);
        const content = decoder.decode(fileData);

        const relativePath = vscode.workspace.asRelativePath(filePath);
        combinedContent += `// File: ${relativePath}\n\n${content}\n\n------------------------\n\n`;
        successCount++;
      } catch (error) {
        failedCount++;
        failedFiles.push(path.basename(filePath));
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
    handleError(vscode.l10n.t("Failed to copy folder"), error);
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
        const displayFailed = stats.failedFiles.slice(0, 5);
        const remaining = stats.failedFiles.length - 5;
        message += `-❌ files: ${displayFailed.join(", ")}${
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
  // Don't add to history if content is massive to save memory/storage
  if (content.length < MAX_OUTPUT_SIZE) {
    historyManager.addToHistory(content, description);
  }
}

// Helper to get current settings
function getCurrentSettings(): CopySettings {
  const config = vscode.workspace.getConfiguration("copytabs");
  return {
    includeFileTree: config.get("includeFileTree", true),
    treePosition: config.get("structuredTreePosition", "start"),
    includeFileTypes: config.get("includeFileTypes", []),
    excludeFileTypes: config.get("excludeFileTypes", []),
    separatorLine: config.get("separatorLine", "------------------------"),
    includeComments: config.get("includeComments", true),
    includeLineNumbers: config.get("includeLineNumbers", false),
    maxFileSize: config.get("maxFileSize", 5242880),
  };
}

async function copyAllTabs() {
  try {
    const settings = getCurrentSettings();
    const openedTabs = vscode.window.tabGroups.all.flatMap(
      (group) => group.tabs
    );
    if (!openedTabs.length) {
      vscode.window.showInformationMessage(
        vscode.l10n.t("No tabs are currently open.")
      );
      return;
    }

    await performCopyOperation(
      openedTabs,
      settings,
      `${openedTabs.length} tabs copied`
    );
  } catch (error) {
    handleError("Error in copyAllTabs", error);
    vscode.window.showErrorMessage(
      vscode.l10n.t("An error occurred while copying tabs.")
    );
  }
}

async function performCopyOperation(
  tabs: vscode.Tab[],
  settings: CopySettings,
  description: string
) {
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

  if (combinedContent.length > MAX_OUTPUT_SIZE) {
    vscode.window.showWarningMessage(
      vscode.l10n.t(
        "Output size ({0}MB) exceeds 50MB limit. Some content may be truncated.",
        Math.round(combinedContent.length / 1024 / 1024)
      )
    );
    combinedContent = combinedContent.substring(0, MAX_OUTPUT_SIZE);
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
    // Fix: Use the standard processing pipeline to respect settings and concurrency
    const settings = getCurrentSettings();
    const selectedTabs = selectedItems.map((item) => item.tab);

    await performCopyOperation(
      selectedTabs,
      settings,
      vscode.l10n.t("{0} selected tabs copied", selectedTabs.length)
    );
  }
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

    const maxFileSize = ConfigManager.getConfig("maxFileSize", 5242880);
    const decoder = new TextDecoder("utf-8");

    // Sequential processing to avoid OOM with openTextDocument
    for (const tab of openedTabs) {
      if (combinedContent.length > MAX_OUTPUT_SIZE) break;

      if (tab.input instanceof vscode.TabInputText) {
        try {
          let content = "";
          const uri = tab.input.uri;

          // Optimized reading (Dirty vs Disk)
          if (tab.isDirty) {
            const doc = await vscode.workspace.openTextDocument(uri);
            content = doc.getText();
          } else {
            const stat = await vscode.workspace.fs.stat(uri);
            if (stat.size <= maxFileSize) {
              const bytes = await vscode.workspace.fs.readFile(uri);
              content = decoder.decode(bytes);
            } else {
              content = `[File too large: ${stat.size} bytes]`;
            }
          }

          const filename = vscode.workspace.asRelativePath(uri);
          const formattedContent = format
            .replace("{filename}", filename)
            .replace("{content}", content)
            .replace("{separator}", "------------------------")
            .replace(/\[NL\]/g, "\n");
          combinedContent += formattedContent;
        } catch (err) {
          Logger.error(
            `Failed to process tab for custom format: ${tab.label}`,
            err as Error
          );
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
