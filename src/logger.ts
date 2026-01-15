import * as vscode from "vscode";

/**
 * Logger utility class for extension-wide logging.
 * Creates a dedicated "copytabs" channel in the Output view.
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
    const timestamp = new Date().toLocaleTimeString();
    this.getOutput().appendLine(`[INFO ${timestamp}] ${message}`);
  }

  /**
   * Log a warning-level message
   */
  static warn(message: string, error?: Error): void {
    const timestamp = new Date().toLocaleTimeString();
    const errorDetails = error ? ` - ${error.message}` : "";
    this.getOutput().appendLine(
      `[WARN ${timestamp}] ${message}${errorDetails}`
    );
  }

  /**
   * Log an error-level message and optionally show the channel
   */
  static error(message: string, error?: Error | unknown): void {
    const timestamp = new Date().toLocaleTimeString();
    const errObj = error instanceof Error ? error : new Error(String(error));
    const errorDetails = ` - ${errObj.message}`;
    const stack = errObj.stack ? `\nStack: ${errObj.stack}` : "";

    this.getOutput().appendLine(
      `[ERROR ${timestamp}] ${message}${errorDetails}${stack}`
    );

    // Automatically show the logs on error so the user knows what happened
    this.show();
  }

  /**
   * Show the output channel to the user (Focus it)
   */
  static show(): void {
    this.getOutput().show(true);
  }

  /**
   * Dispose the logger and clean up
   */
  static dispose(): void {
    this.output?.dispose();
    this.output = null;
  }
}
