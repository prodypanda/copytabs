export interface FileStructure {
    [key: string]: FileStructure | null;
}

export interface CopySettings {
    includeFileTree: boolean;
    treePosition: 'start' | 'end';
    includeFileTypes: string[];
    excludeFileTypes: string[];
    separatorLine: string;
    includeComments: boolean;
    includeLineNumbers: boolean;
    maxFileSize: number;
}

export interface ProcessedTab {
    content: string;
    error?: string;
}
