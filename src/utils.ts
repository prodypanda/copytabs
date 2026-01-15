import * as vscode from "vscode";
import { FileStructure } from "./types";
import { Logger } from "./logger";

export function handleError(context: string, error: unknown): void {
  const errorObj = error instanceof Error ? error : undefined;
  const message = errorObj?.message ?? "Unknown error occurred";
  Logger.error(`${context}`, errorObj);
  vscode.window.showErrorMessage(`${context}: ${message}`);
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param text - Text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export function addPathToStructure(
  structure: FileStructure,
  parts: string[]
): void {
  let current = structure;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i === parts.length - 1) {
      current[part] = null;
    } else {
      current[part] = current[part] || {};
      current = current[part] as FileStructure;
    }
  }
}

export function formatFileTree(
  structure: FileStructure,
  rootName: string
): string {
  const renderTree = (struct: FileStructure, prefix = ""): string => {
    return Object.entries(struct)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value], index, array) => {
        const isLast = index === array.length - 1;
        const line = `${prefix}${isLast ? "└── " : "├── "}${key}\n`;
        const newPrefix = prefix + (isLast ? "    " : "│   ");
        return value ? line + renderTree(value, newPrefix) : line;
      })
      .join("");
  };

  return `File Tree:\n${rootName}/\n${renderTree(structure)}`;
}
