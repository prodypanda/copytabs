import * as vscode from "vscode";

/**
 * Logger utility class for extension-wide logging
 * Uses VS Code's output channel to display logs to users
 */
export class Logger {
  private static output: vscode.OutputChannel | null = null;

  /**
   * Get or create the output channel
   */
  private static getOutput(): vscode.OutputChannel {
    if (!this.output) {
      this.output = vscode.window.createOutputChannel("copytabs", {
        log: true,
      });
    }
    return this.output;
  }

  /**
   * Log an info-level message
   */
  static info(message: string): void {
    this.getOutput().info(`[INFO] ${message}`);
  }

  /**
   * Log a warning-level message
   */
  static warn(message: string, error?: Error): void {
    const errorDetails = error ? ` - ${error.message}` : "";
    this.getOutput().warn(`[WARN] ${message}${errorDetails}`);
  }

  /**
   * Log an error-level message
   */
  static error(message: string, error?: Error): void {
    const errorDetails = error ? ` - ${error.message}` : "";
    this.getOutput().error(`[ERROR] ${message}${errorDetails}`);
    if (error?.stack) {
      this.getOutput().error(`Stack: ${error.stack}`);
    }
  }

  /**
   * Show the output channel to the user
   */
  static show(): void {
    this.getOutput().show();
  }

  /**
   * Dispose the logger and clean up
   */
  static dispose(): void {
    this.output?.dispose();
    this.output = null;
  }
}
