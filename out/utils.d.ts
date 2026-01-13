import { FileStructure } from './types';
export declare function handleError(context: string, error: unknown): void;
export declare function addPathToStructure(structure: FileStructure, parts: string[]): void;
export declare function formatFileTree(structure: FileStructure, rootName: string): string;
