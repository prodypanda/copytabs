import * as vscode from 'vscode';
import { CopySettings, CopyStatistics } from './types';
export declare class TabProcessor {
    static processChunk(tabs: vscode.Tab[], settings: CopySettings, token: vscode.CancellationToken): Promise<[string[], CopyStatistics]>;
    private static processTab;
    private static shouldProcessFile;
    private static processContent;
    private static removeComments;
    private static addLineNumbers;
}
