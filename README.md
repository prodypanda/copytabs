# 📋 Copy All Tabs to New Tab - VS Code Extension

This Visual Studio Code extension allows you to copy the content of all opened tabs into a new tab, including their file locations. It's a powerful tool for various use cases, especially when working with AI code assistants or needing to share your codebase context.

Effortlessly compile and share your entire project context with this powerful VS Code extension. Perfect for AI-assisted coding, code reviews, documentation, and teaching.

Streamline your workflow and enhance collaboration by quickly sharing your codebase context. Ideal for use with AI code assistants, team code reviews, and more!

## 🚀 Key Features

- Copies the content of all opened tabs into a single new tab
- Selectively copy chosen tabs
- Custom formatting option for copied content
- Includes a structured file tree for better context
- Includes the file location at the top of each file's content
- Preserves the order of the tabs as they appear in your editor
- Adds convenient status bar items for quick access
- Configurable file type inclusion/exclusion
- Option to include or exclude comments
- Customizable separator between files
- Keyboard shortcuts for quick access

## 💡 Use Cases

1. **AI Code Assistants**: Easily share your entire project context with web-based AI code assistants like ChatGPT or GitHub Copilot.
   Example: Copy all your project files and paste them into a ChatGPT conversation for in-depth code reviews or refactoring suggestions.

2. **Code Reviews**: Quickly compile all changed files for a comprehensive code review.
   Example: Before a pull request, copy all modified files to share with your team for feedback.

3. **Documentation**: Generate a single-file overview of your project structure and contents.
   Example: Create a quick project snapshot for documentation purposes or to share with new team members.

4. **Debugging**: Gather all relevant files when seeking help with a complex bug.
   Example: Copy all files related to a specific feature to share in a Stack Overflow question or with support.

5. **Teaching and Presentations**: Easily collect multiple code files for educational purposes.
   Example: Prepare a coding lesson by copying all relevant example files into a single document.

## 🛠️ Installation

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X on macOS)
3. Search for "Copy All Tabs to New Tab"
4. Click Install

## 🖱️ Usage

There are three main features, each accessible via the status bar, command palette, or keyboard shortcut:

### 1. Copy All Tabs:
- Status Bar: Click on the "$(files) Copy All" item
- Command Palette: "Copy All Tabs to New Tab"
- Keyboard Shortcut: `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (macOS)

![Copy All Tabs Demo](src/assets/copyallbtn.gif)

### 2. Copy Selected Tabs:
- Status Bar: Click on the "$(list-selection) Copy Selected" item
- Command Palette: "Copy Selected Tabs to New Tab"
- Keyboard Shortcut: `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS)

![Copy Selected Tabs Demo](src/assets/copyselected.gif)

### 3. Copy Tabs with Custom Format:
- Status Bar: Click on the "$(settings-gear) Copy Custom" item
- Command Palette: "Copy Tabs with Custom Format"
- Keyboard Shortcut: `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (macOS)

![Copy Custom with Tree Demo](src/assets/copycustomwithtree.gif)

### Using Commands:

You can also access all features through the Command Palette (F1 or Ctrl+Shift+P / Cmd+Shift+P):

![Using Commands Demo](src/assets/f1.gif)

### Extension Settings:

Customize the extension behavior through VS Code settings:

![Extension Settings Demo](src/assets/extensionsettings.gif)

## Structured File Tree

When enabled, a structured file tree is included at the top (or bottom) of the copied content, providing a clear overview of your project structure. This feature is especially useful when sharing your codebase with AI assistants or during code reviews.

## 🤖 Example Workflow with AI Code Assistant

1. Open all relevant files in your VS Code project.
2. Use the extension to copy all tabs (or selected tabs) to a new tab.
3. Copy the entire content of the new tab, including the structured file tree.
4. Open your preferred AI code assistant (e.g., ChatGPT).
5. Paste the copied content and ask for code review, optimization suggestions, or any other coding assistance.

This workflow allows you to quickly provide full context to the AI assistant, leading to more accurate and helpful responses.

## ⚙️ Configuration

This extension contributes the following settings:

- `copytabs.includeFileTypes`: File types to include in the copy process. Leave empty to include all files.
- `copytabs.excludeFileTypes`: File types to exclude from the copy process.
- `copytabs.separatorLine`: The separator line to use between files.
- `copytabs.includeComments`: Whether to include comments in the copied content.
- `copytabs.includeLineNumbers`: Include line numbers in the copied content.
- `copytabs.includeFileTree`: Include a structured file tree in the copied content.
- `copytabs.structuredTreePosition`: Position to include the structured file tree (start or end of the document).

You can modify these settings in your VS Code settings.json file.

## 📋 Requirements

This extension requires Visual Studio Code version 1.91.0 or higher.

## 🐛 Known Issues

There are no known issues at this time. If you encounter any problems, please file an issue on the GitHub repository.

## 📝 Release Notes

### 0.1.0

- Added "Copy Selected Tabs" feature
- Added "Copy Tabs with Custom Format" feature
- Added structured file tree feature
- Added keyboard shortcuts for new features
- Updated status bar items for quick access to all features

For a full list of changes, please see the [CHANGELOG.md](CHANGELOG.md) file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This extension is licensed under the [MIT License](LICENSE.md).

## 💪 Support

If you find this extension helpful, consider:

- Star the repository on GitHub
- Leave a review on the VS Code Marketplace
- Report any issues or suggest features on the GitHub repository

💡 Try it now and supercharge your coding experience!

Thank you for using Copy All Tabs to New Tab!