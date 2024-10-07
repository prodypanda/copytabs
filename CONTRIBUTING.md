# Contributing to Copy All Tabs Extension

First off, thank you for considering contributing to the Copy All Tabs Extension! It's people like you who make this extension such a great tool for the VS Code community.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
   - [Issues](#issues)
   - [Pull Requests](#pull-requests)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Testing](#testing)
6. [Style Guidelines](#style-guidelines)
7. [Commit Guidelines](#commit-guidelines)
8. [Documentation](#documentation)

## Code of Conduct

This project and everyone participating in it are governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [copytabsconduct@prodypanda.com].

## Getting Started

### Issues

#### Create a New Issue
If you spot a problem with the extension, [search if an issue already exists](https://github.com/prodypanda/copytabs/issues). If a related issue doesn't exist, you can open a new issue using a relevant [issue form](https://github.com/prodypanda/copytabs/issues/new/choose).

#### Solve an Issue
Scan through our [existing issues](https://github.com/prodypanda/copytabs/issues) to find one that interests you. You can narrow down the search using `labels` as filters. If you find an issue to work on, you are welcome to open a PR with a fix.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Fork and clone the repository
   ```bash
   git clone https://github.com/your-username/copytabs.git
   ```
3. Install dependencies
   ```bash
   cd copytabs
   npm install
   ```
4. Open the project in VS Code
   ```bash
   code .
   ```

### Running the Extension Locally

1. Press `F5` to open a new window with your extension loaded
2. Make changes
3. Reload (`Ctrl+R` or `Cmd+R` on Mac) the VS Code window to load your changes

## Project Structure

```
.
├── src/                    # Source code
│   ├── test/               # Tests
│   └── extension.ts        # Extension entry point
├── .vscode/                # VS Code integration
├── .github/                # GitHub specific files
├── package.json            # Extension manifest
└── README.md              # Extension README
```

## Testing

### Running Tests
```bash
npm run test
```

### Writing Tests
- Place your test files in the `src/test` directory
- Use descriptive names for test files, e.g., `extension.test.ts`
- Follow the existing test patterns

Example test:
```typescript
describe('Copy All Tabs', () => {
    it('should copy all open tabs', async () => {
        // Test implementation
    });
});
```

## Style Guidelines

### TypeScript

- Use TypeScript for all new code
- Follow the [TypeScript Style Guide](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- Key points:
  - Use 4 spaces for indentation
  - Use PascalCase for type names
  - Use camelCase for function names
  - Use camelCase for property names and local variables
  - Use whole words in names when possible

### VS Code Extension Guidelines

Follow the [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

Key points:
- Use commands for all actions
- Follow VS Code's naming conventions
- Respect VS Code's performance guidelines

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:
- feat: A new feature
- fix: A bug fix
- docs: Documentation only changes
- style: Changes that do not affect the meaning of the code
- refactor: A code change that neither fixes a bug nor adds a feature
- perf: A code change that improves performance
- test: Adding missing tests or correcting existing tests
- chore: Changes to the build process or auxiliary tools and libraries

Example:
```
feat(statusbar): add clipboard mode toggle button

Added a new status bar button that allows users to toggle between
clipboard mode and new tab mode. This makes it easier for users to
control where the copied content goes.

Closes #123
```

## Documentation

### API Documentation
- Use JSDoc comments for functions and classes
- Be clear and descriptive in your comments

Example:
```typescript
/**
 * Copies the content of all open tabs to a new tab or clipboard
 * @param mode - The mode to use for copying (clipboard or new tab)
 * @returns A promise that resolves when the copy is complete
 */
async function copyAllTabs(mode: CopyMode): Promise<void> {
    // Implementation
}
```

### README and Wiki
- Update the README.md if you change functionality
- Contribute to the wiki for more detailed documentation

## Release Process

1. Update the version in package.json according to [semver](http://semver.org/)
2. Create a pull request with the version update
3. Once approved and merged, create a new release on GitHub
4. The CI/CD pipeline will automatically publish to the VS Code Marketplace

## Recognition

Contributors who make significant improvements will be recognized in:
- The README.md file
- Release notes
- Our [contributors page](https://github.com/prodypanda/copytabs/graphs/contributors)

## Additional Notes

- If you have any questions, feel free to ask
- Join our [Discord community](https://discord.gg/copytabs) for discussions
- Check out our [roadmap](https://github.com/prodypanda/copytabs/projects/1) for planned features

## Need Help?

Feel free to reach out to the maintainers:
- GitHub: Open an issue
- Email: [copytabscontributors@prodypanda.com]
- Twitter: [@CopyAllTabs](https://twitter.com/copytabs)

Thank you for contributing to Copy All Tabs Extension!
