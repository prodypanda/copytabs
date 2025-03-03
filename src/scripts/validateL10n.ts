import * as fs from 'fs';
import * as path from 'path';

function validateL10nFiles() {
    const l10nDir = path.join(__dirname, '../../l10n');
    const defaultBundle = path.join(l10nDir, 'bundle.l10n.json');
    const frBundle = path.join(l10nDir, 'bundle.l10n.fr.json');

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

    if (!fs.existsSync(frBundle)) {
        console.error('French bundle file does not exist');
        return false;
    }

    try {
        const defaultTranslations = JSON.parse(fs.readFileSync(defaultBundle, 'utf8'));
        const frTranslations = JSON.parse(fs.readFileSync(frBundle, 'utf8'));

        // Vérifier que toutes les clés sont présentes
        const defaultKeys = Object.keys(defaultTranslations);
        const frKeys = Object.keys(frTranslations);

        const missingInFr = defaultKeys.filter(key => !frKeys.includes(key));
        if (missingInFr.length > 0) {
            console.error('Missing translations in French bundle:', missingInFr);
            return false;
        }

        console.log('L10n files validation successful');
        return true;
    } catch (error) {
        console.error('Error validating l10n files:', error);
        return false;
    }
}

if (require.main === module) {
    validateL10nFiles();
}
