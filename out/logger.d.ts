export declare class Logger {
    private static outputChannel;
    private static getOutputChannel;
    static info(message: string): void;
    static error(message: string, error?: Error): void;
    static warn(message: string, error?: Error): void;
    static show(): void;
    static dispose(): void;
}
