# AT3 Stack Kit

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.11-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)

</div>

<div align="center">

![AT3 Logo](docs/media/at3-logo-text1.png)

**The AI-native evolution of the T3 stack, built for edge deployment and serverless infrastructure**

AT3 Stack (AIT3E: /eɪ aɪ tiː θriː iː/ AY-eye-TEE-three-EE, /eɪt θriː iː/ AYT-three-EE) revolutionizes full-stack development by combining the proven T3 stack with cutting-edge AI integration, edge-first architecture, and modern development tools.

</div>

Build production-ready applications with seamless AI provider integration, real-time streaming, and global edge deployment. The AT3 Stack ecosystem includes comprehensive tooling for scaffolding, migrating, and optimizing modern web applications.

## Features

<table>
<tr>
<td align="center" width="50%">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="#6366F1"/>
</svg>

**AI-First Integration**  
Multi-provider AI support with OpenAI, Anthropic, and Google AI, featuring streaming responses and React hooks

</td>
<td align="center" width="50%">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" fill="#10B981"/>
</svg>

**Edge-First Architecture**  
Built for Vercel Edge Functions and Cloudflare Workers with automatic global scaling and zero server management

</td>
</tr>
<tr>
<td align="center">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#8B5CF6"/>
<path d="M14 2v6h6" fill="none" stroke="white" stroke-width="2"/>
</svg>

**Type-Safe Foundation**  
Full TypeScript integration with Zod validation, comprehensive type generation, and strict configuration

</td>
<td align="center">

<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="12" cy="12" r="3" fill="#F59E0B"/>
<path d="M12 1v6m0 6v6m11-7h-6m-6 0H1" stroke="#F59E0B" stroke-width="2"/>
</svg>

**Production Ready**  
Comprehensive testing with Vitest and Playwright, PWA support, i18n, and deployment-ready configurations

</td>
</tr>
</table>

## Quick Start

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" fill="#059669"/>
</svg>

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd at3-stack-kit

# Install dependencies with pnpm
pnpm install

# Set up environment variables
cp env.example .env.local
```

### Basic Usage

```bash
# Initialize Supabase
npx supabase init
npx supabase start
npx supabase db push

# Start development server
pnpm dev

# Run with Turbopack (faster)
pnpm dev:turbo
```

That's it! Your AT3 application is ready at [http://localhost:3000](http://localhost:3000).

## How It Works

1. **T3 Foundation**: Built on the proven Next.js + TypeScript + Tailwind foundation with App Router and React 19
2. **AI Integration**: Multi-provider AI client with streaming responses, React hooks, and comprehensive error handling
3. **Edge Deployment**: Optimized for Vercel Edge Functions and Cloudflare Workers with global CDN distribution
4. **Type Safety**: Full TypeScript integration with Zod validation and automatic type generation from Supabase

## Supported Technologies

<div align="center">

<table>
<tr>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#61DAFB">
<path d="M12 10.11c1.03 0 1.87.84 1.87 1.89s-.84 1.85-1.87 1.85-1.87-.82-1.87-1.85.84-1.89 1.87-1.89M7.37 20c.63.38 2.01-.2 3.6-1.7-.52-.59-1.03-1.23-1.51-1.9a22.7 22.7 0 0 1-2.4-.36c-.51 2.14-.32 3.61.31 3.96m.71-5.74l-.29-.51c-.11.29-.22.58-.29.86.27.06.57.11.88.16l-.3-.51m6.54-.76l.81-1.5-.81-1.5c-.3-.53-.62-1-.91-1.47C13.17 9 12.6 9 12 9s-1.17 0-1.71.03c-.29.47-.61.94-.91 1.47L8.57 12l.81 1.5c.3.53.62 1 .91 1.47.54.03 1.11.03 1.71.03s1.17 0 1.71-.03c.29-.47.61-.94.91-1.47M12 6.78c-.19.22-.39.45-.59.72h1.18c-.2-.27-.4-.5-.59-.72m0 10.44c.19-.22.39-.45.59-.72h-1.18c.2.27.4.5.59.72M16.62 4c-.62-.38-2 .2-3.59 1.7.52.59 1.03 1.23 1.51 1.9.82.08 1.63.2 2.4.36.51-2.14.32-3.61-.32-3.96m-.7 5.74l.29.51c.11-.29.22-.58.29-.86-.27-.06-.57-.11-.88-.16l.3.51m1.45-7.05c1.47.84 1.63 3.05 1.01 5.63 2.54.75 4.37 1.99 4.37 3.68s-1.83 2.93-4.37 3.68c.62 2.58.46 4.79-1.01 5.63-1.46.84-3.45-.12-5.37-1.95-1.92 1.83-3.91 2.79-5.37 1.95-1.47-.84-1.63-3.05-1.01-5.63-2.54-.75-4.37-1.99-4.37-3.68s1.83-2.93 4.37-3.68c-.62-2.58-.46-4.79 1.01-5.63 1.46-.84 3.45.12 5.37 1.95 1.92-1.83 3.91-2.79 5.37-1.95"/>
</svg>

**Frontend**  
Next.js 15, React 19  
TypeScript, Tailwind CSS 4

</td>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#339933">
<path d="M12 1.85c-.27 0-.55.07-.78.2l-7.44 4.3c-.48.28-.78.8-.78 1.36v8.58c0 .56.3 1.08.78 1.36l7.44 4.3c.46.26 1.04.26 1.5 0l7.44-4.3c.48-.28.78-.8-.78-1.36V7.71c0-.56-.3-1.08-.78-1.36l-7.44-4.3c-.23-.13-.51-.2-.78-.2z"/>
</svg>

**Backend**  
Supabase PostgreSQL  
Edge Functions, Row Level Security

</td>
</tr>
<tr>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#3178C6">
<path d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0z"/>
<path d="M18.488 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086z" fill="white"/>
</svg>

**AI & Tools**  
OpenAI, Anthropic, Google AI  
Biome, Vitest, Playwright

</td>
<td align="center">

<svg width="32" height="32" viewBox="0 0 24 24" fill="#06B6D4">
<path d="M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8z"/>
</svg>

**Deployment**  
Vercel, Cloudflare Workers  
Docker, PWA Support

</td>
</tr>
</table>

</div>

## Core Commands

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM4 6h16v2H4V6zm0 4h4v2H4v-2zm6 0h10v2H10v-2zm-6 4h4v2H4v-2zm6 0h10v2H10v-2z" fill="#374151"/>
</svg>

```bash
# Development
pnpm dev                         # Start development server
pnpm dev:turbo                   # Start with Turbopack (faster)
pnpm build                       # Build for production

# Code Quality
pnpm lint                        # Run Biome linter
pnpm lint:fix                    # Fix linting issues
pnpm format                      # Format code
pnpm type-check                  # TypeScript checking

# Testing
pnpm test                        # Run unit tests
pnpm test:e2e                    # Run E2E tests
pnpm test:coverage               # Run tests with coverage

# Database
pnpm db:generate                 # Generate types from Supabase
pnpm db:push                     # Push migrations
pnpm db:reset                    # Reset database

# Utilities
pnpm analyze                     # Analyze bundle size
pnpm clean                       # Clean build artifacts
```

## Configuration

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_VERCEL_ANALYTICS=true
```

### Key Features

- **🤖 AI Integration**: Multi-provider support with streaming responses
- **🏗️ T3 Foundation**: Next.js + TypeScript + Tailwind CSS
- **🗃️ Supabase Backend**: PostgreSQL with auth and real-time features  
- **🌍 Edge-First**: Optimized for global deployment and scaling
- **🎨 Modern UI**: Shadcn/ui components with Tailwind CSS v4
- **🔒 Authentication**: Complete auth flow with social providers
- **🌐 Internationalization**: Built-in i18n support with next-intl
- **📱 PWA Ready**: Service worker and offline functionality
- **🧪 Testing**: Comprehensive testing with Vitest and Playwright
- **📈 Performance**: Bundle analysis and Core Web Vitals optimization

## Examples

### AI Chat Integration

```tsx
import { useAICompletion } from '@/lib/ai/hooks';

export function ChatComponent() {
  const { completion, isLoading, generate } = useAICompletion({
    provider: 'openai',
    model: 'gpt-4-turbo',
  });

  return (
    <div>
      <button onClick={() => generate('Hello AI!')}>
        Send Message
      </button>
      {isLoading && <p>Thinking...</p>}
      {completion && <p>{completion}</p>}
    </div>
  );
}
```

### Protected Route

```tsx
import { requireAuth } from '@/lib/auth/auth-helpers';

export default async function DashboardPage() {
  const user = await requireAuth();

  return <div>Welcome {user.email}!</div>;
}
```

### Database Integration

```tsx
import { createServerClient } from '@/lib/supabase/server';

export async function getData() {
  const supabase = await createServerClient();
  
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  return data;
}
```

## Documentation

- **[Getting Started Guide](./docs/getting-started.md)** - Complete setup instructions
- **[AT3 Stack Guide](./AIT3E-STACK.md)** - Architecture and patterns
- **[API Reference](./docs/api-reference.md)** - All commands and options
- **[Deployment Guide](./docs/deployment.md)** - Production deployment
- **[AI Integration](./docs/ai-integration.md)** - AI features and usage

## Contributing

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="#7C3AED"/>
</svg>

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Commit Convention
We use [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `style:` - Code formatting
- `refactor:` - Code refactoring
- `test:` - Add tests
- `chore:` - Update dependencies

## Roadmap

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" fill="#0891B2"/>
</svg>

- [ ] **Enhanced AI Models** - Support for Claude 3 Opus and GPT-4 Vision
- [ ] **Vector Database** - Native vector embeddings with Supabase
- [ ] **AI Agents Framework** - Built-in agent orchestration patterns
- [ ] **Advanced Analytics** - Real-time usage metrics and AI cost tracking

## Requirements

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 18c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2H0c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2h-4z" fill="#6B7280"/>
</svg>

- **Node.js**: >= 22.0.0
- **pnpm**: >= 10.0.0 (recommended over npm/yarn)
- **Git**: Latest version
- **Operating System**: Windows, macOS, Linux

## License

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#9CA3AF"/>
<path d="M14 2v6h6" fill="none" stroke="white" stroke-width="2"/>
</svg>

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#059669"/>
</svg>

- **Issues**: [GitHub Issues](https://github.com/your-org/at3-stack-kit/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/at3-stack-kit/discussions)  
- **Email**: <support@entro314-labs.com>
- **Documentation**: [AT3 Stack Docs](https://at3-stack.dev)

---

<div align="center">

**Made with ❤️ by [entro314-labs](https://entro314-labs.com)**

[Website](https://at3-stack.dev) • [Documentation](https://docs.at3-stack.dev) • [Community](https://discord.gg/at3-stack) • [Twitter](https://twitter.com/at3stack)

</div>