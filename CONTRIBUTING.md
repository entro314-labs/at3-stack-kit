# Contributing to AT3 Stack Kit

<div align="center">

![AT3 Triangle Icon](docs/media/at3triangle-icon.png)

</div>

Thank you for considering contributing to the AT3 Stack Kit! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue templates** when available
3. **Provide detailed information** including:
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, browser)
   - Screenshots or error logs when relevant

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check existing feature requests** first
2. **Describe the use case** and problem you're trying to solve
3. **Provide implementation ideas** if you have them
4. **Consider the project's scope** and target audience

### Pull Requests

#### Before You Start

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `pnpm install`
3. **Set up your environment** following the README instructions
4. **Run tests** to ensure everything works: `pnpm test`

#### Making Changes

1. **Create a feature branch**: `git checkout -b feature/your-feature-name`
2. **Make your changes** following our coding standards
3. **Write or update tests** for your changes
4. **Ensure all tests pass**: `pnpm test && pnpm test:e2e`
5. **Run linting and formatting**: `pnpm lint && pnpm format`
6. **Update documentation** if needed

#### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other maintenance tasks

**Examples:**
```bash
feat(auth): add OAuth provider support
fix(ui): resolve button hover state issue
docs: update installation instructions
test(auth): add sign-in form validation tests
```

#### Pull Request Process

1. **Update the README** if needed
2. **Ensure CI passes** (linting, tests, build)
3. **Request review** from maintainers
4. **Address feedback** promptly
5. **Keep PR focused** - one feature/fix per PR

## 🏗️ Development Setup

### Prerequisites

- Node.js 22+ (use `fnm` for version management)
- pnpm 10+ (faster than npm/yarn)
- Git
- Modern code editor (VS Code recommended)

### Local Development

1. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/AIT3E-stack-starter.git
   cd AIT3E-stack-starter
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Set up environment**:
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configurations
   ```

4. **Start development server**:
   ```bash
   pnpm dev
   ```

5. **Run tests**:
   ```bash
   pnpm test        # Unit tests
   pnpm test:e2e    # E2E tests
   pnpm test:browser # Browser tests
   ```

### VS Code Setup

1. **Install recommended extensions**:
   - The workspace includes extension recommendations in `.vscode/extensions.json`
   - VS Code will prompt you to install them

2. **Configure settings**:
   - Settings are pre-configured in `.vscode/settings.json`
   - Includes Biome integration, Tailwind IntelliSense, etc.

## 📋 Code Standards

### TypeScript

- **Use strict TypeScript** - no `any` types unless absolutely necessary
- **Prefer interfaces** over types for object shapes
- **Use proper generics** for reusable components
- **Export types** from dedicated files when shared

### React Components

- **Use function components** with hooks
- **Prefer const assertions** for component definitions
- **Use proper prop types** with TypeScript interfaces
- **Follow the single responsibility principle**
- **Use forwardRef** when exposing DOM elements

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({ variant = 'primary', size = 'md', ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size }))}
      {...props}
    />
  );
};
```

### Styling

- **Use Tailwind CSS** for styling
- **Follow mobile-first** responsive design
- **Use CSS variables** for custom properties
- **Prefer utility classes** over custom CSS
- **Use the `cn()` utility** for conditional classes

### File Organization

- **Use clear, descriptive names** for files and folders
- **Group related files** in appropriate directories
- **Export from index files** for clean imports
- **Follow the established folder structure**

### Testing

- **Write tests** for new functionality
- **Use descriptive test names** that explain the behavior
- **Test user interactions** rather than implementation details
- **Mock external dependencies** appropriately

```tsx
describe('SignInForm', () => {
  it('should show validation errors for empty fields', async () => {
    render(<SignInForm />);

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });
});
```

## 🔧 Tools and Scripts

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm dev:turbo        # Start with Turbopack
pnpm build            # Production build
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run Biome linter
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code
pnpm type-check       # TypeScript checking

# Testing
pnpm test             # Unit tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
pnpm test:e2e         # E2E tests
pnpm test:browser     # Browser tests

# Database
pnpm db:generate      # Generate types
pnpm db:push          # Push migrations
pnpm db:reset         # Reset database
```

### Git Hooks

The project uses Husky for git hooks:

- **pre-commit**: Runs lint-staged to check staged files
- **commit-msg**: Validates commit message format
- **pre-push**: Runs tests and type checking

### Biome Configuration

We use Biome instead of ESLint + Prettier for:
- **Faster linting** (5-20x faster than ESLint)
- **Unified tooling** (linting + formatting)
- **Better TypeScript support**
- **Consistent code style**

## 🧪 Testing Guidelines

### Unit Tests (Vitest)

- **Test pure functions** and component behavior
- **Mock external dependencies** (APIs, databases)
- **Focus on user-facing behavior** not implementation
- **Use descriptive test names**

### E2E Tests (Playwright)

- **Test complete user workflows**
- **Cover critical paths** (auth, payments, core features)
- **Test across browsers** when relevant
- **Keep tests maintainable** and readable

### Browser Tests (Vitest Browser)

- **Test DOM interactions** that need a real browser
- **Verify visual behavior** and layout
- **Test complex UI interactions**

## 📚 Documentation

### Code Documentation

- **Use JSDoc comments** for complex functions
- **Document component props** with TypeScript interfaces
- **Explain non-obvious code** with inline comments
- **Keep comments up-to-date** with code changes

### README Updates

- **Update installation steps** if you change dependencies
- **Document new features** and configuration options
- **Update examples** to reflect changes
- **Keep the feature list current**

## 🚀 Release Process

1. **Version bumping** follows semantic versioning
2. **Changelog** is automatically generated from commits
3. **Releases** are tagged and published to GitHub
4. **Demo deployment** is updated automatically

## 🎯 Project Goals

When contributing, keep these goals in mind:

- **Modern best practices** - Use the latest stable technologies
- **Developer experience** - Prioritize DX with great tooling
- **Performance** - Optimize for Core Web Vitals
- **Accessibility** - Ensure WCAG compliance
- **Type safety** - Leverage TypeScript fully
- **Maintainability** - Write clean, testable code

## 🤔 Questions?

- **GitHub Discussions** for general questions
- **GitHub Issues** for bug reports
- **Discord/Slack** if available
- **Email maintainers** for private concerns

## 📜 Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please read and follow these guidelines to ensure a welcoming environment for all contributors.

---

Thank you for contributing! 🙏