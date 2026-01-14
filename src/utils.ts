import * as vscode from 'vscode';
import { FileStructure } from './types';

export function handleError(context: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${context}:`, error);
    vscode.window.showErrorMessage(`${context}: ${message}`);
}

export function addPathToStructure(structure: FileStructure, parts: string[]): void {
    let current = structure;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            current[part] = null;
        } else {
            current[part] = current[part] || {};
            current = current[part];
        }
    }
}

export function formatFileTree(structure: FileStructure, rootName: string): string {
    const renderTree = (struct: FileStructure, prefix = ''): string => {
        return Object.entries(struct)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value], index, array) => {
                const isLast = index === array.length - 1;
                const line = `${prefix}${isLast ? '└── ' : '├── '}${key}\n`;
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                return value ? line + renderTree(value, newPrefix) : line;
            })
            .join('');
    };

    return `File Tree:\n${rootName}/\n${renderTree(structure)}`;
}
