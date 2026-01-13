"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
class ConfigManager {
    static getSettings() {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        return {
            includeFileTree: config.get('includeFileTree', true),
            treePosition: config.get('structuredTreePosition', 'start'),
            includeFileTypes: config.get('includeFileTypes', []),
            excludeFileTypes: config.get('excludeFileTypes', []),
            separatorLine: config.get('separatorLine', '------------------------'),
            includeComments: config.get('includeComments', true),
            includeLineNumbers: config.get('includeLineNumbers', false),
            maxFileSize: config.get('maxFileSize', this.MAX_FILE_SIZE)
        };
    }
    static isClipboardMode() {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        return config.get('copyToClipboard', false);
    }
    static async toggleClipboardMode() {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        const currentMode = this.isClipboardMode();
        await config.update('copyToClipboard', !currentMode, vscode.ConfigurationTarget.Global);
        // The configuration change event will handle the UI updates
    }
    static getConfig(key, defaultValue) {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        return config.get(key, defaultValue);
    }
    static async updateConfig(key, value) {
        const config = vscode.workspace.getConfiguration(this.CONFIG_NAME);
        await config.update(key, value, vscode.ConfigurationTarget.Global);
    }
}
exports.ConfigManager = ConfigManager;
ConfigManager.CONFIG_NAME = 'copytabs';
ConfigManager.MAX_FILE_SIZE = 5242880; // 5MB
// Add a default export to ensure the module is properly recognized
exports.default = ConfigManager;
//# sourceMappingURL=config.js.map