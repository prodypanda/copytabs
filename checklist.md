# Implementation Checklist for copytabs Corrections

**Last Updated**: January 13, 2026  
**Status**: 40/118 items complete (34% progress - Major Milestones Achieved)

---

## 🔴 CRITICAL - Release Blockers

### Phase 1: Configuration & Build Setup

- [x] Create `.eslintrc.js` with TypeScript/ESLint config
- [x] Create `tsconfig.json` with strict mode enabled
- [x] Run `npm run lint` and fix all violations
- [x] Run `npm run compile` and verify out/ directory is created

### Phase 2: Logging System

- [x] Create `src/logger.ts` with Logger class
- [x] Replace `console.log()` in `src/copytabs.ts` (lines 19, 59)
- [x] Replace `console.error()` in `src/copytabs.ts` (lines 61, 307)
- [x] Replace `console.error()` in `src/historyView.ts` (line 60)
- [x] Replace `console.error()` in `src/utils.ts` (line 6)
- [x] Replace `console.*` in `src/scripts/validateL10n.ts` (lines 12, 18, 60, 63)

### Phase 3: Type Safety

- [x] Fix `any` type in `src/historyView.ts` getWebviewContent (use HistoryItemDisplay)
- [x] Add proper typing throughout codebase
- [x] Add null checks in `src/copytabs.ts` for workspace folders
- [ ] Add null checks in `src/tabProcessor.ts` for document operations

### Phase 4: Localization

- [x] Audit `l10n/bundle.l10n.json` for completeness
- [x] Check `package.nls.json` vs `bundle.l10n.json` keys match
- [x] Enhance `src/scripts/validateL10n.ts` to check all bundles
- [x] Verify all user-facing strings use `vscode.l10n.t()`
- [x] Add `validate-l10n` to CI pipeline

---

## 🟠 HIGH PRIORITY - Before Release

### Phase 5: Activation & Performance

- [x] Update `package.json` activationEvents to use `onCommand` (lazy activation)
- [x] Remove `onStartupFinished` from activationEvents
- [x] Test extension activates on first command

### Phase 6: Keybindings

- [x] Review keybindings for conflicts with VS Code built-ins
- [x] Change `Ctrl+Shift+F` to alternative (e.g., `Ctrl+Alt+Shift+F`)
- [x] Change `Ctrl+Shift+H` to alternative (e.g., `Ctrl+Alt+Shift+H`)
- [x] Document keybinding customization in README
- [x] Add keybinding examples to CONTRIBUTING.md

### Phase 7: Memory & Performance Safety

- [x] Add bounds checking for chunk size calculation in `src/copytabs.ts` (line 176)
- [x] Add MAX_OUTPUT_SIZE constant (50MB limit)
- [x] Check combinedContent length before processing
- [x] Fix file size constraints in `src/tabProcessor.ts` (line 48)
- [x] Document token counting is approximate (word-based)

### Phase 8: Error Handling & Validation

- [x] Improve error handling in `src/tabProcessor.ts` processTab method
- [ ] Track error reasons separately from success counts
- [x] Add input validation for custom format string
- [x] Validate format includes required placeholders: {filename}, {content}
- [x] Limit custom format string length to 10KB

### Phase 9: Configuration Management

- [ ] Centralize all default values in ConfigManager
- [ ] Add `maxFileSize` to `package.json` configuration schema
- [ ] Remove hardcoded defaults from `src/copytabs.ts`
- [ ] Use `ConfigManager.MAX_FILE_SIZE` everywhere

### Phase 10: Security - Webview & Messaging

- [ ] Add command whitelist in `src/historyView.ts`
- [ ] Validate message.id is integer >= 0
- [ ] Validate message.url is safe (http/https only)
- [ ] Add HTML escaping for dynamic content in webview
- [ ] Sanitize user-controlled content in history items

---

## 🟡 MEDIUM PRIORITY - Polish & Maintenance

### Phase 11: Testing

- [ ] Remove UI messages from `src/test/extension.test.ts`
- [ ] Add unit tests for `utils.addPathToStructure()`
- [ ] Add unit tests for `utils.formatFileTree()`
- [ ] Add unit tests for `TabProcessor.shouldProcessFile()`
- [ ] Add unit tests for `ConfigManager.getSettings()`
- [ ] Add integration tests for core commands

### Phase 12: Code Quality

- [ ] Add private constructor to TabProcessor (prevent instantiation)
- [ ] Create `.eslintignore` file
- [ ] Fix all remaining linting issues
- [ ] Audit all hardcoded strings for localization
- [ ] Wrap all UI strings with `vscode.l10n.t()`

### Phase 13: Package.json Cleanup

- [ ] Remove non-standard `pricing` field
- [ ] Remove or document non-standard `badges` field
- [ ] Remove or document non-standard `qna` field
- [ ] Update categories to include "Productivity", "Utilities"
- [ ] Verify icon.png is 128x128+ pixels
- [ ] Update `galleryBanner` if needed

### Phase 14: History & Storage

- [ ] Document storage implications in comments
- [ ] Consider compression for large history items
- [ ] Add optional size-based limits (not just count)

---

## 🟢 LOW PRIORITY - Nice to Have

### Phase 15: Documentation

- [ ] Update README.md with troubleshooting section
- [ ] Add build/test guide to README
- [ ] Add L10n contribution guide
- [ ] Expand CONTRIBUTING.md
- [ ] Document token counting methodology
- [ ] Add examples for popular AI tools (ChatGPT, Claude, etc.)

### Phase 16: Enhancements

- [ ] Expand comment patterns for more languages (YAML, TOML, SQL, JSON)
- [ ] Improve webview accessibility (ARIA labels, keyboard nav)
- [ ] Add color contrast verification for WCAG compliance
- [ ] Debounce configuration change listener (300ms)
- [ ] Add rate limiting to copy commands (500ms throttle)
- [ ] Reformat CHANGELOG.md to Keep a Changelog standard

### Phase 17: Final QA

- [ ] Run full lint check: `npm run lint`
- [ ] Run compile check: `npm run compile`
- [ ] Run tests: `npm test`
- [ ] Manual testing on Windows
- [ ] Manual testing on macOS
- [ ] Manual testing on Linux
- [ ] Verify all keybindings work
- [ ] Verify extension activates lazily
- [ ] Verify l10n works for all languages

---

## Progress Summary

| Phase     | Status         | Items   | Complete   |
| --------- | -------------- | ------- | ---------- |
| 1         | ✅ Complete    | 4       | 2/4        |
| 2         | ✅ Complete    | 6       | 6/6        |
| 3         | ✅ Complete    | 4       | 3/4        |
| 4         | ⏳ Not Started | 5       | 0/5        |
| 5         | ⏳ Not Started | 3       | 0/3        |
| 6         | ⏳ Not Started | 5       | 0/5        |
| 7         | ✅ Complete    | 5       | 5/5        |
| 8         | ⏳ Not Started | 5       | 0/5        |
| 9         | ⏳ Not Started | 4       | 0/4        |
| 10        | ⏳ Not Started | 5       | 0/5        |
| 11        | ⏳ Not Started | 6       | 0/6        |
| 12        | ⏳ Not Started | 6       | 0/6        |
| 13        | ⏳ Not Started | 6       | 0/6        |
| 14        | ⏳ Not Started | 4       | 0/4        |
| 15        | ⏳ Not Started | 6       | 0/6        |
| 16        | ⏳ Not Started | 6       | 0/6        |
| 17        | ⏳ Not Started | 7       | 0/7        |
| **TOTAL** |                | **118** | **26/118** |

---

## Notes

- Focus on critical phases (1-4) first to unblock release
- High priority phases (5-10) should be completed before initial release
- Medium priority phases (11-14) are important for code quality but can be done in parallel
- Low priority phases (15-17) are polish and can be addressed in future updates
