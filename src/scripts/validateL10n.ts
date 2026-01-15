import * as fs from "fs";
import * as path from "path";

function log(msg: string): void {
  console.log(`[L10n Validation] ${msg}`);
}

function logError(msg: string): void {
  console.error(`[L10n Validation Error] ${msg}`);
}

function validateL10nFiles() {
  const l10nDir = path.join(__dirname, "../../l10n");
  const defaultBundle = path.join(l10nDir, "bundle.l10n.json");
  const packageNls = path.join(__dirname, "../../package.nls.json");

  // Check if directory exists
  if (!fs.existsSync(l10nDir)) {
    logError("L10n directory does not exist");
    return false;
  }

  // Check if default bundle exists
  if (!fs.existsSync(defaultBundle)) {
    logError("Default bundle file does not exist");
    return false;
  }

  // Check if package.nls.json exists
  if (!fs.existsSync(packageNls)) {
    logError("package.nls.json does not exist");
    return false;
  }

  try {
    const defaultBundleData = JSON.parse(
      fs.readFileSync(defaultBundle, "utf8")
    );
    const packageNlsData = JSON.parse(fs.readFileSync(packageNls, "utf8"));

    // Validate all required keys exist in default bundle
    const defaultKeys = Object.keys(defaultBundleData);
    const packageKeys = Object.keys(packageNlsData);

    log(`Found ${defaultKeys.length} keys in bundle.l10n.json`);
    log(`Found ${packageKeys.length} keys in package.nls.json`);

    // Check language bundles
    const languageBundles = fs
      .readdirSync(l10nDir)
      .filter(
        (file) =>
          file.startsWith("bundle.l10n.") &&
          file.endsWith(".json") &&
          file !== "bundle.l10n.json"
      )
      .map((file) => ({
        name: file,
        path: path.join(l10nDir, file),
        lang: file.replace("bundle.l10n.", "").replace(".json", ""),
      }));

    let allValid = true;

    // Validate each language bundle
    languageBundles.forEach((bundle) => {
      try {
        const bundleData = JSON.parse(fs.readFileSync(bundle.path, "utf8"));
        const bundleKeys = Object.keys(bundleData);

        // Check for missing keys
        const missingKeys = defaultKeys.filter(
          (key) => !bundleKeys.includes(key)
        );
        const extraKeys = bundleKeys.filter(
          (key) => !defaultKeys.includes(key)
        );

        if (missingKeys.length > 0) {
          logError(`[${bundle.lang}] Missing keys: ${missingKeys.join(", ")}`);
          allValid = false;
        }

        if (extraKeys.length > 0) {
          log(`[${bundle.lang}] Extra keys: ${extraKeys.join(", ")}`);
        }

        if (missingKeys.length === 0 && extraKeys.length === 0) {
          log(`[${bundle.lang}] ✓ All keys match default bundle`);
        }
      } catch (error) {
        logError(
          `Error parsing ${bundle.name}: ${
            error instanceof Error ? error.message : "Unknown"
          }`
        );
        allValid = false;
      }
    });

    if (!allValid) {
      return false;
    }

    log("L10n files validation successful");
    return true;
  } catch (error) {
    logError(
      "Error validating l10n files:" +
        (error instanceof Error ? error.message : "Unknown error")
    );
    return false;
  }
}

if (require.main === module) {
  const result = validateL10nFiles();
  process.exit(result ? 0 : 1);
}

export default validateL10nFiles;
