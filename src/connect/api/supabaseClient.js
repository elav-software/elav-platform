import { createBrowserClient } from '@supabase/ssr';

// Browser client — session stored in cookies so proxy.ts can verify server-side
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
