import * as vscode from "vscode";

export class Logger {
  private static outputChannel: vscode.OutputChannel | undefined;

  private static getOutputChannel(): vscode.OutputChannel {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel("copytabs");
    }
    return this.outputChannel;
  }

  public static info(message: string): void {
    this.getOutputChannel().appendLine(`[INFO] ${message}`);
  }

  public static error(message: string, error?: Error): void {
    this.getOutputChannel().appendLine(`[ERROR] ${message}`);
    if (error) {
      this.getOutputChannel().appendLine(error.message);
      this.getOutputChannel().appendLine(`${error.stack}`);
    }
  }

  public static warn(message: string, error?: Error): void {
    this.getOutputChannel().appendLine(`[WARN] ${message}`);
    if (error) {
      this.getOutputChannel().appendLine(error.message);
    }
  }

  public static show(): void {
    this.getOutputChannel().show();
  }

  public static dispose(): void {
    if (this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = undefined;
    }
  }
}
