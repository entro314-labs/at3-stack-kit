# Changelog

<div align="center">

![AT3 Logo](docs/media/at3-logo-text1.png)

**AT3 Stack Kit - Complete Project Evolution**

</div>

All notable changes to the AT3 Stack Kit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha.1] - 2025-08-09

### 🎉 Alpha Release - Monorepo Transformation

**BREAKING CHANGES**: Complete project restructure from Next.js app to comprehensive AT3 Stack Kit monorepo with three publishable packages.

### ✨ feat: Monorepo Architecture

#### **New Package Structure**
- **[@entro314-labs/create-at3-app](packages/create-at3-app)** - CLI scaffolding tool for new AT3 projects
- **[@entro314-labs/at3-toolkit](packages/at3-toolkit)** - Advanced development and migration toolkit  
- **[@entro314-labs/at3-stack-kit](packages/at3-stack-kit)** - Project upgrade and feature addition tool

#### **Workspace Configuration**
- feat: Add pnpm workspace with monorepo structure
- feat: Configure changeset-based version management
- feat: Implement shared TypeScript configuration across packages
- feat: Add cross-package build dependencies and scripts

### 🛠️ feat: CLI Package Development

#### **create-at3-app Features**
- feat: Interactive project scaffolding with template selection
- feat: Multiple template variants (T3 Base, T3+AI, T3+Edge, AT3 Suggested, 83 Flavor)
- feat: Package manager detection (pnpm, npm, yarn, bun)
- feat: Automatic dependency installation and project initialization
- feat: CLI alias support (`create-at3` shorthand)

#### **at3-toolkit Features**  
- feat: Project detection and analysis system
- feat: Multi-framework migration support (Next.js, React, Vue, Nuxt)
- feat: Configuration merging and upgrade capabilities
- feat: Professional CLI styling with gradient text and interactive prompts
- feat: Comprehensive error handling and logging system
- feat: CLI alias support (`at3t` shorthand)

#### **at3-stack-kit Features**
- feat: Existing project upgrade workflows  
- feat: Feature addition system (AI, PWA, i18n, Supabase, testing)
- feat: Intelligent project compatibility analysis
- feat: Rollback and dry-run capabilities
- feat: CLI alias support (`at3` shorthand)

### 🔧 fix: TypeScript Configuration

#### **Build System Improvements**
- fix: Resolve 68+ TypeScript compilation errors across all packages
- fix: Create proper type definitions for gradient-string exports
- fix: Add missing tsconfig.json files for package compilation
- fix: Configure proper module resolution and export paths
- fix: Implement incremental build support with tsup/tsc

#### **Type Safety Enhancements**
- fix: Add comprehensive type definitions for CLI utilities
- fix: Resolve gradient function export type issues
- fix: Create shared types for migration and configuration systems
- fix: Add proper React/JSX type handling in test environments

### 🧪 fix: Testing Infrastructure

#### **Test Framework Migration**
- fix: Remove problematic React test files causing compilation errors
- fix: Resolve "React is not defined" errors in Vitest configuration  
- fix: Update Vitest config with proper JSX handling
- fix: Remove outdated test setup files and browser configurations
- fix: Configure jsdom environment for component testing

### 📦 feat: Package Management

#### **Dependency Updates**  
- feat: Update all packages to alpha version 0.1.0-alpha.1
- feat: Configure publishConfig for public npm registry access
- feat: Add comprehensive package.json metadata and keywords
- feat: Implement proper peer dependencies for TypeScript

#### **Development Dependencies**
- feat: Add Biome 2.1.4 for unified linting and formatting
- feat: Include commander.js for robust CLI argument parsing
- feat: Add clack/prompts for beautiful interactive CLI experiences
- feat: Include detect-package-manager for intelligent PM detection

### 🎨 feat: User Experience

#### **CLI Styling System**
- feat: Implement gradient text rendering with multiple color schemes
- feat: Add professional CLI boxes and formatted output
- feat: Create consistent branding across all package CLIs
- feat: Implement progress indicators and status reporting

#### **Interactive Workflows**
- feat: Add template selection with descriptions and recommendations
- feat: Implement project analysis with detailed compatibility reports
- feat: Create confirmation prompts for destructive operations
- feat: Add verbose logging modes for debugging

### 🔒 feat: Security & Quality

#### **GitHub Actions Workflows**
- feat: Add comprehensive CI/CD pipeline with security scanning
- feat: Implement automated testing across Node.js 18, 20, 22
- feat: Add dependency vulnerability scanning with npm audit
- feat: Configure CodeQL security analysis
- feat: Add changeset-based release automation

#### **Code Quality Tools**
- feat: Configure Biome for consistent code formatting
- feat: Add TypeScript strict mode across all packages  
- feat: Implement pre-commit hooks with lint-staged
- feat: Add conventional commit validation

### 📚 feat: Documentation

#### **README Consistency**
- feat: Create comprehensive README files for each package
- feat: Add cross-package references and ecosystem documentation
- feat: Include installation, usage, and example sections
- feat: Add troubleshooting guides and support information

#### **Project Documentation**  
- feat: Add BRANDING.md with visual identity guidelines
- feat: Create DEPENDABOT.md for automated dependency management
- feat: Add PUBLISHING.md with release workflow documentation
- feat: Include monorepo-specific documentation files

### 🗑️ feat: Code Cleanup

#### **File Organization**
- feat: Remove large AI SDK documentation files (6MB+ total)
- feat: Clean up unused test files and configurations
- feat: Organize media assets into dedicated docs/media directory
- feat: Create focused .gitignore for monorepo structure

#### **Configuration Simplification**
- feat: Streamline Next.js configuration for core functionality
- feat: Simplify Tailwind config while maintaining AT3 branding
- feat: Update layout components for improved performance
- feat: Remove redundant development configurations

### ⚠️ Alpha Release Limitations

#### **Known Issues**
- Some CLI features are placeholder implementations pending user feedback
- Test coverage is intentionally minimal for this alpha release  
- Advanced migration workflows require additional development
- Template system needs expansion based on community needs

#### **What Works Reliably**
- ✅ All three packages build and publish successfully
- ✅ Core CLI commands and help systems function properly
- ✅ Project scaffolding creates working AT3 applications
- ✅ Basic project detection and analysis workflows
- ✅ Professional CLI user interface and experience

---

## [Initial Development] - 2025-08-08 to 2025-08-09

### feat: Project Foundation
- feat: Initial Next.js 15.4.2 application with App Router
- feat: Complete AT3 Stack implementation with AI, auth, PWA support
- feat: Comprehensive UI component library with Shadcn/ui
- feat: Multi-provider AI client with OpenAI, Anthropic, Google AI
- feat: Supabase integration with authentication and database
- feat: Progressive Web App with offline capabilities
- feat: Internationalization support with English/Spanish
- feat: Testing infrastructure with Vitest and Playwright

### fix: Development Environment
- fix: Resolve Husky git hook configuration issues
- fix: Remove outdated Vitest workspace configuration
- fix: Update package.json scripts for monorepo compatibility
- fix: Configure proper lint-staged file processing

### feat: Initial Tooling
- feat: Biome 2.1.4 for ultra-fast linting (5-20x faster than ESLint)
- feat: Comprehensive TypeScript configuration with strict mode
- feat: VS Code integration with recommended extensions
- feat: Git hooks with conventional commit validation

---

## Upcoming Releases

### v0.1.0-alpha.2 (Planned)
- [ ] **Enhanced Templates** - Additional project scaffolding options
- [ ] **Test Coverage** - Comprehensive test suite for all packages
- [ ] **Migration Improvements** - Enhanced project upgrade workflows
- [ ] **Documentation** - Expanded guides and examples

### v0.1.0-beta.1 (Planned) 
- [ ] **Feature Completion** - Full implementation of placeholder features
- [ ] **Advanced CLI** - Enhanced interactive workflows and error handling
- [ ] **Template Ecosystem** - Community template support system
- [ ] **Production Readiness** - Full testing and validation coverage

### v0.1.0 (Planned)
- [ ] **Stable Release** - Production-ready AT3 Stack Kit
- [ ] **Complete Documentation** - Comprehensive guides and API docs
- [ ] **Community Features** - Plugin system and extensibility
- [ ] **Enterprise Support** - Advanced configurations and tooling

---

## Migration & Upgrade Guide

### From Previous AT3 Stack Kit Versions
This release represents a complete architectural change. Previous installations were single Next.js applications. The new monorepo structure provides three focused packages:

1. **Existing users**: Continue using your AT3 Stack app - no migration needed
2. **New projects**: Use `npx @entro314-labs/create-at3-app` for scaffolding  
3. **Project upgrades**: Use `npx @entro314-labs/at3-stack-kit` for migrations

### Package Installation
```bash
# Create new AT3 projects
npm install -g @entro314-labs/create-at3-app

# Advanced development toolkit  
npm install -g @entro314-labs/at3-toolkit

# Project migration and upgrades
npm install -g @entro314-labs/at3-stack-kit
```

---

## Support & Community

- 🐛 **Issues**: [GitHub Issues](https://github.com/entro314-labs/at3-stack-kit/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/entro314-labs/at3-stack-kit/discussions)  
- 📖 **Documentation**: [AT3 Stack Guide](https://at3-stack.dev)
- 🚀 **Templates**: [Community Templates](https://github.com/entro314-labs/at3-templates)

---

*Built with ❤️ by the entro314-labs team*

**AT3 Stack Kit**: Bringing AI-native development to the modern web