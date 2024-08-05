# 📋 Copy All Tabs to New Tab - VS Code Extension

This Visual Studio Code extension allows you to copy the content of all opened tabs into a new tab, including their file locations. It's a powerful tool for various use cases, especially when working with AI code assistants or needing to share your codebase context.

Effortlessly compile and share your entire project context with this powerful VS Code extension. Perfect for AI-assisted coding, code reviews, documentation, and teaching.

Streamline your workflow and enhance collaboration by quickly sharing your codebase context. Ideal for use with AI code assistants, team code reviews, and more!

## 🚀 Key Features

- Copies the content of all opened tabs into a single new tab
- Includes the file location at the top of each file's content
- Preserves the order of the tabs as they appear in your editor
- Adds a convenient status bar item for quick access
- Configurable file type inclusion/exclusion
- Option to include or exclude comments
- Customizable separator between files
- Keyboard shortcut for quick access

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

There are three ways to use this extension:

1. Status Bar:
   - Click on the "$(files) Copy All Tabs" item in the status bar

2. Command Palette:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS) to open the Command Palette
   - Type "Copy All Tabs to New Tab" and select the command

3. Keyboard Shortcut:
   - Use `Ctrl+Shift+C` (Windows/Linux) or `Cmd+Shift+C` (macOS)

A new tab will open containing the content of all your opened tabs, with each file's location at the top of its content.

## 🤖 Example Workflow with AI Code Assistant

1. Open all relevant files in your VS Code project.
2. Use the extension to copy all tabs to a new tab.
3. Copy the entire content of the new tab.
4. Open your preferred AI code assistant (e.g., ChatGPT).
5. Paste the copied content and ask for code review, optimization suggestions, or any other coding assistance.

This workflow allows you to quickly provide full context to the AI assistant, leading to more accurate and helpful responses.

## ⚙️ Configuration

This extension contributes the following settings:

- `copytabs.includeFileTypes`: File types to include in the copy process. Leave empty to include all files.
- `copytabs.excludeFileTypes`: File types to exclude from the copy process.
- `copytabs.separatorLine`: The separator line to use between files.
- `copytabs.includeComments`: Whether to include comments in the copied content.

You can modify these settings in your VS Code settings.json file.

## 📋 Requirements

This extension requires Visual Studio Code version 1.91.0 or higher.

## 🐛 Known Issues

There are no known issues at this time. If you encounter any problems, please file an issue on the GitHub repository.

## 📝 Release Notes

### 0.0.3-alpha

- Updated extension icon for better clarity
- Improved documentation and README

### 0.0.2-alpha

- Added configuration options for file type inclusion/exclusion
- Added option to include/exclude comments
- Added customizable separator between files
- Improved error handling and user feedback
- Added keyboard shortcut (Ctrl+Shift+C on Windows/Linux, Cmd+Shift+C on macOS)

### 0.0.1-alpha

Initial release of Copy All Tabs to New Tab

- Feature: Copy all opened tabs to a new tab
- Feature: Include file locations at the top of each file's content
- Feature: Status bar item for quick access

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