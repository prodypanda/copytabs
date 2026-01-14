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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function validateL10nFiles() {
    const l10nDir = path.join(__dirname, '../../l10n');
    const defaultBundle = path.join(l10nDir, 'bundle.l10n.json');
    // const enBundle = path.join(l10nDir, 'bundle.l10n.en.json');
    // const frBundle = path.join(l10nDir, 'bundle.l10n.fr.json');
    // Vérifier si le répertoire existe
    if (!fs.existsSync(l10nDir)) {
        console.error('L10n directory does not exist');
        return false;
    }
    // Vérifier les fichiers de traduction
    if (!fs.existsSync(defaultBundle)) {
        console.error('Default bundle file does not exist');
        return false;
    }
    // Check if English bundle exists, create it if not
    // if (!fs.existsSync(enBundle)) {
    //     console.warn('English bundle file does not exist, copying from default');
    //     try {
    //         fs.copyFileSync(defaultBundle, enBundle);
    //     } catch (error) {
    //         console.error('Error creating English bundle:', error);
    //         return false;
    //     }
    // }
    // if (!fs.existsSync(frBundle)) {
    //     console.error('French bundle file does not exist');
    //     return false;
    // }
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars`n        // @ts-ignore unused variable`n        const _defaultBundleData = JSON.parse(fs.readFileSync(defaultBundle, 'utf8'));
        // const enTranslations = JSON.parse(fs.readFileSync(enBundle, 'utf8'));
        // const frTranslations = JSON.parse(fs.readFileSync(frBundle, 'utf8'));
        // Vérifier que toutes les clés sont présentes
        // const enKeys = Object.keys(enTranslations);
        // const frKeys = Object.keys(frTranslations);
        // const missingInEn = defaultKeys.filter(key => !enKeys.includes(key));
        // if (missingInEn.length > 0) {
        //     console.error('Missing translations in English bundle:', missingInEn);
        //     return false;
        // }
        // const missingInFr = defaultKeys.filter(key => !frKeys.includes(key));
        // if (missingInFr.length > 0) {
        //     console.error('Missing translations in French bundle:', missingInFr);
        //     return false;
        // }
        console.log('L10n files validation successful');
        return true;
    }
    catch (error) {
        console.error('Error validating l10n files:', error);
        return false;
    }
}
if (require.main === module) {
    const result = validateL10nFiles();
    process.exit(result ? 0 : 1);
}
exports.default = validateL10nFiles;
//# sourceMappingURL=validateL10n.js.map