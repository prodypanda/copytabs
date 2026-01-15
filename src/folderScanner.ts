import * as vscode from "vscode";
import * as path from "path";
import { Logger } from "./logger";

export interface FolderItem {
  name: string;
  path: string;
  isFile: boolean;
  checked: boolean;
  children?: FolderItem[];
}

export interface FolderScanResult {
  rootPath: string;
  rootName: string;
  items: FolderItem[];
}

/**
 * Recursively scans a folder using non-blocking Async I/O
 */
export class FolderScanner {
  private static readonly IGNORED_PATTERNS = [
    "node_modules",
    ".git",
    ".vscode",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    "coverage",
    ".pytest_cache",
    "__pycache__",
    "venv",
    ".env",
    ".env.local",
  ];

  private static shouldIgnore(itemName: string): boolean {
    return this.IGNORED_PATTERNS.some(
      (pattern) =>
        itemName === pattern || itemName.startsWith(pattern + path.sep)
    );
  }

  static async scanFolder(
    folderPath: string,
    maxDepth: number = 10
  ): Promise<FolderScanResult> {
    try {
      const folderUri = vscode.Uri.file(folderPath);
      const stat = await vscode.workspace.fs.stat(folderUri);

      if ((stat.type & vscode.FileType.Directory) === 0) {
        throw new Error(`Path is not a directory: ${folderPath}`);
      }

      const rootName = path.basename(folderPath);
      const items = await this.scanDirectory(folderUri, maxDepth);

      return {
        rootPath: folderPath,
        rootName,
        items,
      };
    } catch (error) {
      Logger.error(
        "Error scanning folder",
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  private static async scanDirectory(
    dirUri: vscode.Uri,
    maxDepth: number,
    currentDepth: number = 0
  ): Promise<FolderItem[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    try {
      // Use VS Code FS API (Async)
      const entries = await vscode.workspace.fs.readDirectory(dirUri);
      const items: FolderItem[] = [];

      for (const [name, type] of entries) {
        if (this.shouldIgnore(name)) {
          continue;
        }

        const fullUri = vscode.Uri.joinPath(dirUri, name);
        const isFile = (type & vscode.FileType.File) !== 0;
        const isDirectory = (type & vscode.FileType.Directory) !== 0;

        const item: FolderItem = {
          name: name,
          path: fullUri.fsPath,
          isFile,
          checked: false,
          children: undefined,
        };

        if (isDirectory) {
          try {
            item.children = await this.scanDirectory(
              fullUri,
              maxDepth,
              currentDepth + 1
            );
          } catch (error) {
            Logger.warn(
              `Could not scan subdirectory: ${fullUri.fsPath}`,
              error instanceof Error ? error : undefined
            );
          }
        }

        items.push(item);
      }

      // Sort: folders first, then alphabetically
      return items.sort((a, b) => {
        if (a.isFile && !b.isFile) return 1;
        if (!a.isFile && b.isFile) return -1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      Logger.error(
        `Error reading directory: ${dirUri.fsPath}`,
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }
}
