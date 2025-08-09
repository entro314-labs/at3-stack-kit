# create-at3-app

<div align="center">

![AT3 Logo](../../docs/media/at3-logo-text1.png)

**Scaffold new AT3 Stack projects with AI, edge, and modern tooling**

[![npm version](https://badge.fury.io/js/@entro314-labs%2Fcreate-at3-app.svg)](https://badge.fury.io/js/@entro314-labs%2Fcreate-at3-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)

</div>

**create-at3-app** is the fastest way to get started with the AT3 Stack. Scaffold production-ready applications with AI integration, edge deployment, and modern development tools in seconds.

## About AT3 Stack

**AT3** (AIT3E) combines the proven T3 foundation with first-class AI integration and edge-first architecture:

- **🤖 AI** - First-class artificial intelligence integration with multiple providers
- **📚 T3** - The beloved Next.js + TypeScript + Tailwind foundation  
- **⚡ E** - Edge computing and serverless deployment

## Quick Start

```bash
# Create a new AT3 app
npx create-at3-app@latest my-app

# Or with pnpm (recommended)
pnpm create @entro314-labs/at3-app my-app

# Or with yarn
yarn create @entro314-labs/at3-app my-app
```

## Templates

Choose from carefully crafted templates to match your project needs:

### **T3 Base**
Classic T3 stack foundation - perfect for traditional web apps
- ✅ Next.js 15 with App Router
- ✅ TypeScript with strict configuration
- ✅ Tailwind CSS 4.x
- ✅ tRPC for type-safe APIs

### **T3 + Edge** 
T3 stack enhanced with edge-first deployment
- ✅ Everything in T3 Base
- ✅ Supabase for database and auth
- ✅ Edge Runtime optimization
- ✅ Serverless deployment ready

### **T3 + AI (Custom)**
T3 + flexible AI integration with multiple providers
- ✅ Everything in T3 Base
- ✅ OpenAI, Anthropic, Google AI support
- ✅ Custom AI provider configuration
- ✅ Streaming AI responses

### **T3 + AI (Vercel SDK)**
T3 + Vercel AI SDK for streamlined AI features
- ✅ Everything in T3 Base
- ✅ Vercel AI SDK integration
- ✅ Built-in streaming support
- ✅ UI components for AI

### **T3 + AI (Both)**
T3 + comprehensive AI integration
- ✅ Everything in T3 Base
- ✅ Custom AI providers + Vercel SDK
- ✅ Maximum AI flexibility
- ✅ Production-ready streaming

### **AT3 Suggested** 🌟
Complete AT3 stack with all features
- ✅ Everything above
- ✅ PWA support
- ✅ Internationalization (i18n)
- ✅ Comprehensive testing setup
- ✅ Production optimizations

### **83 Flavor** ⭐
Signature entro314-labs stack configuration
- ✅ T3 foundation
- ✅ Supabase + Vercel Edge
- ✅ Vercel AI SDK
- ✅ Optimized for rapid deployment

## Interactive Mode

Run without arguments for the full interactive experience:

```bash
npx create-at3-app@latest
```

The CLI will guide you through:
- 📝 Project name validation
- 🎯 Template selection with descriptions
- 📦 Package manager detection
- ⚙️ Feature configuration
- 🚀 Automatic setup

## Non-Interactive Mode

For automation and scripts:

```bash
# Create with specific options
npx create-at3-app@latest my-app \
  --template 83-flavor \
  --pm pnpm \
  --no-git \
  --no-supabase
```

### Options

- `--template, -t <template>` - Template to use (default: t3)
- `--pm <manager>` - Package manager: pnpm, npm, yarn (default: pnpm)
- `--no-install` - Skip dependency installation
- `--no-git` - Skip Git repository initialization
- `--no-supabase` - Skip Supabase project setup

## What's Created

Your new AT3 app includes:

```
my-app/
├── src/
│   ├── app/              # Next.js 15 App Router
│   ├── components/       # Reusable UI components
│   ├── lib/             # Utilities and configurations
│   ├── server/          # Server-side code (tRPC, auth)
│   └── styles/          # Global styles and Tailwind
├── public/              # Static assets
├── .env.example         # Environment variables template
├── next.config.js       # Next.js configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies and scripts
```

## Next Steps

After creating your app:

1. **📁 Navigate to your project**
   ```bash
   cd my-app
   ```

2. **⚙️ Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Add your API keys and database URLs
   ```

3. **🚀 Start developing**
   ```bash
   pnpm dev
   ```

4. **📖 Explore the documentation**
   - [AT3 Stack Guide](https://at3-stack.dev/docs)
   - [AI Integration](https://at3-stack.dev/docs/ai)
   - [Edge Deployment](https://at3-stack.dev/docs/edge)

## AT3 Ecosystem

**create-at3-app** works seamlessly with other AT3 tools:

- **[at3-stack-kit](../at3-stack-kit)** - Upgrade existing projects to AT3 Stack
- **[@entro314-labs/at3-toolkit](../at3-toolkit)** - Advanced development tools and migration

## Examples

Check out example AT3 applications:

- [Basic AT3 App](../../examples/basic-at3)
- [AI Chat App](../../examples/ai-chat)
- [E-commerce Platform](../../examples/ecommerce)
- [SaaS Starter](../../examples/saas)

## Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md).

## Support

- 📖 [Documentation](https://at3-stack.dev)
- 🐛 [Issues](https://github.com/entro314-labs/at3-stack-kit/issues)
- 💬 [Discord](https://discord.gg/at3-stack)
- 🐦 [Twitter](https://twitter.com/at3stack)

## License

MIT © [entro314-labs](https://github.com/entro314-labs)