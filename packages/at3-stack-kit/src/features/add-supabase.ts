/**
 * Add Supabase integration to existing project
 */

import { ensureDir, pathExists, readFile, writeFile } from 'fs-extra'
import { join } from 'path'

export async function addSupabase(projectPath: string): Promise<void> {
  const srcPath = join(projectPath, 'src')
  await ensureDir(srcPath)

  // Create lib/supabase directory
  const supabasePath = join(srcPath, 'lib', 'supabase')
  await ensureDir(supabasePath)

  // Add Supabase clients
  await addSupabaseClients(supabasePath)

  // Add auth helpers
  await addAuthHelpers(join(srcPath, 'lib', 'auth'))

  // Update package.json
  await updatePackageJson(projectPath)

  // Add environment variables template
  await addEnvExample(projectPath)

  // Initialize Supabase config
  await initSupabaseConfig(projectPath)
}

async function addSupabaseClients(supabasePath: string): Promise<void> {
  // Client-side Supabase client
  const clientCode = `import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
`

  await writeFile(join(supabasePath, 'client.ts'), clientCode)

  // Server-side Supabase client
  const serverCode = `import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The 'setAll' method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
`

  await writeFile(join(supabasePath, 'server.ts'), serverCode)

  // Middleware helper
  const middlewareCode = `import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh session if expired - required for Server Components
  await supabase.auth.getUser();

  return supabaseResponse;
}
`

  await writeFile(join(supabasePath, 'middleware.ts'), middlewareCode)
}

async function addAuthHelpers(authPath: string): Promise<void> {
  await ensureDir(authPath)

  const authHelpersCode = `import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/sign-in');
  }

  return user;
}

export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/');
}
`

  await writeFile(join(authPath, 'auth-helpers.ts'), authHelpersCode)
}

async function updatePackageJson(projectPath: string): Promise<void> {
  const packageJsonPath = join(projectPath, 'package.json')

  if (!(await pathExists(packageJsonPath))) return

  const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'))

  if (!packageJson.dependencies) packageJson.dependencies = {}
  if (!packageJson.devDependencies) packageJson.devDependencies = {}

  // Add Supabase dependencies
  packageJson.dependencies['@supabase/supabase-js'] = '^2.46.0'
  packageJson.dependencies['@supabase/ssr'] = '^0.5.1'

  // Add Supabase CLI as dev dependency
  packageJson.devDependencies['supabase'] = '^1.207.9'

  await writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
}

async function addEnvExample(projectPath: string): Promise<void> {
  const envExamplePath = join(projectPath, '.env.example')

  let envContent = ''

  // Read existing .env.example if it exists
  if (await pathExists(envExamplePath)) {
    envContent = await readFile(envExamplePath, 'utf-8')
  }

  // Add Supabase variables if not present
  if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL')) {
    const supabaseVars = `
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
`

    envContent = envContent + supabaseVars
    await writeFile(envExamplePath, envContent)
  }
}

async function initSupabaseConfig(projectPath: string): Promise<void> {
  const supabaseConfigPath = join(projectPath, 'supabase', 'config.toml')

  if (await pathExists(supabaseConfigPath)) return // Already exists

  await ensureDir(join(projectPath, 'supabase'))

  const config = `# A string used to distinguish different Supabase projects on the same host.
project_id = "your-project-id"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[auth]
enabled = true
port = 9999
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
refresh_token_rotation_enabled = true
security_update_password_require_reauthentication = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
`

  await writeFile(supabaseConfigPath, config)
}
