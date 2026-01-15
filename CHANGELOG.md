# Changelog

All notable changes to the "copytabs" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enhanced security with webview message validation and command whitelisting
- HTML escaping for user content in webview to prevent XSS attacks
- Comprehensive troubleshooting guide in README
- Configurable maximum file size setting (`copytabs.maxFileSize`)
- Enhanced localization validation script for language bundles
- Full TypeScript strict mode compilation with strict configuration
- ESLint configuration for code quality enforcement
- Logger utility for consistent extension-wide logging through Output panel

### Changed

- **BREAKING**: Keyboard shortcuts changed to Ctrl+Alt+Shift+\* pattern to avoid conflicts:
  - `Ctrl+Alt+Shift+C` - Copy All Tabs (was `Ctrl+Shift+C`)
  - `Ctrl+Alt+Shift+S` - Copy Selected Tabs (was `Ctrl+Shift+S`)
  - `Ctrl+Alt+Shift+F` - Copy Custom Format (was `Ctrl+Shift+F`)
  - `Ctrl+Alt+Shift+T` - Toggle Clipboard Mode (was `Ctrl+Shift+T`)
  - `Ctrl+Alt+Shift+H` - Show History (was `Ctrl+Shift+H`)
- Improved startup performance with lazy activation (no longer activates on startup)
- Enhanced configuration management with centralized defaults in ConfigManager
- Improved memory safety with 50MB output size limit
- Removed non-standard package.json fields (pricing, badges, qna)
- Updated categories to "Productivity" and "Utilities"

### Fixed

- Fixed potential memory leaks with proper file size bounds checking
- Fixed division by zero in chunk size calculation
- Fixed missing null checks for workspace folders
- Fixed type safety issues with proper TypeScript interfaces
- Fixed hardcoded strings - all UI messages now properly localized

### Security

- Added message validation for webview communication
- Implemented command whitelist for webview operations
- Added URL scheme validation (http/https only) for external links
- Added HTML escaping for all dynamic content

## [1.0.3] - 2025-03-06

### Added

- Restored file count in copy notifications
- Added token count statistics to notifications
- Added failed files list to notifications for better error tracking
- Added detailed copy statistics:
  - Success count
  - Failed count
  - Total tokens
  - Failed files list

### Changed

- Improved notification format for better readability
- Updated documentation with new notification features

## [1.0.0] - 2024-03-05

### Added

- New History Panel feature:
  - Dedicated activity bar view for copy history
  - Preview copied content
  - Re-copy previous items
  - Delete individual history items
  - Clear entire history
  - Beautiful, responsive UI
  - History limit indicator
  - Timestamps for all copies
- Full localization support:
  - Added French (fr) translation
  - Added German (de) translation
  - Localized all UI elements
- New keyboard shortcut:
  - `Ctrl/Cmd+Shift+H` to open history panel

### Changed

- Enhanced UI with improved styling and animations
- Better error handling with localized error messages
- Updated documentation to reflect new features

## [0.3.0] - 2024-03-02

### Added

- Major refactoring for better code organization and stability:
  - New ConfigManager for centralized settings management
  - New StatusBarManager for improved UI handling
  - Better error handling and recovery
- Improved file size handling with readable size formatting
- Better progress reporting during file processing
- Enhanced error messages with more details

### Changed

- Improved clipboard mode handling
- Better type safety throughout the codebase
- More efficient tab processing with chunking
- Updated documentation with new features

## [0.2.0] - 2024-03-19

### Added

- add **clipboard mode** for direct copying:
  - Add option to copy tabs content directly to clipboard
  - Add status bar toggle between clipboard and tab modes
  - Add new keyboard shortcut (Ctrl/Cmd+Shift+T) for mode switching
  - Add copyToClipboard configuration option
  - Update documentation to reflect new feature
    This feature streamlines the workflow by allowing users to copy
    tab content directly to clipboard without creating a new tab.

## [0.1.2] - 2024-08-07

### Added

- New configuration options to control the visibility of status bar buttons:
  - `copytabs.showCopyAllButton`
  - `copytabs.showCopySelectedButton`
  - `copytabs.showCopyCustomButton`
- Dynamic update of status bar items when configuration changes

### Changed

- Updated README with information about new configuration options
- Improved code structure to support customizable status bar items

## [0.1.1] - 2024-08-07

### Added

- Demonstration videos in the README for better feature visualization

### Fixed

- Various bug fixes and performance improvements

## [0.1.0] - 2024-08-06

### Added

- New feature: Copy Selected Tabs to New Tab
- New feature: Copy Tabs with Custom Format
- New feature: Include structured file tree in copied content
- New configuration option: `includeFileTree` to toggle file tree inclusion
- New configuration option: `structuredTreePosition` to set file tree position (start or end of document)
- Keyboard shortcuts for new features:
  - `Ctrl+Shift+S` (Windows/Linux) or `Cmd+Shift+S` (macOS) for Copy Selected Tabs
  - `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (macOS) for Copy Tabs with Custom Format
- Status bar items for quick access to all features

### Changed

- Updated README with information about new features and keyboard shortcuts
- Improved code structure to support new features

## [0.0.3-alpha] - 2024-08-05

### Changed

- Updated extension icon for better clarity

## [0.0.2-alpha] - 2024-08-05

### Added

- Configuration options for file type inclusion/exclusion
- Option to include/exclude comments
- Customizable separator between files
- Keyboard shortcut (Ctrl+Shift+C on Windows/Linux, Cmd+Shift+C on macOS)

### Improved

- Error handling and user feedback

## [0.0.1-alpha] - 2024-08-05

### Added

- Initial release of Copy All Tabs to New Tab
- Feature: Copy all opened tabs to a new tab
- Feature: Include file locations at the top of each file's content
- Feature: Status bar item for quick access

[1.0.3]: https://github.com/prodypanda/copytabs/compare/v1.0.0...v1.0.3
[1.0.0]: https://github.com/prodypanda/copytabs/compare/v0.3.0...v1.0.0
[0.3.0]: https://github.com/prodypanda/copytabs/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/prodypanda/copytabs/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/prodypanda/copytabs/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/prodypanda/copytabs/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/prodypanda/copytabs/compare/v0.0.3-alpha...v0.1.0
[0.0.3-alpha]: https://github.com/prodypanda/copytabs/compare/v0.0.2-alpha...v0.0.3-alpha
[0.0.2-alpha]: https://github.com/prodypanda/copytabs/compare/v0.0.1-alpha...v0.0.2-alpha
[0.0.1-alpha]: https://github.com/prodypanda/copytabs/releases/tag/v0.0.1-alpha
