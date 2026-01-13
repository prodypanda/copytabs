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
exports.handleError = handleError;
exports.addPathToStructure = addPathToStructure;
exports.formatFileTree = formatFileTree;
const vscode = __importStar(require("vscode"));
function handleError(context, error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`${context}:`, error);
    vscode.window.showErrorMessage(`${context}: ${message}`);
}
function addPathToStructure(structure, parts) {
    let current = structure;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            current[part] = null;
        }
        else {
            current[part] = current[part] || {};
            current = current[part];
        }
    }
}
function formatFileTree(structure, rootName) {
    const renderTree = (struct, prefix = '') => {
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
//# sourceMappingURL=utils.js.map