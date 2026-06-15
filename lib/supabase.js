import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = 
    process.env.NEXT_PUBLIC_SUPABASE_URL || 
    process.env.SUPABASE_URL || "";

  const key = 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || "";

  if (!url || !key) {
    throw new Error("Supabase no configurado: faltan SUPABASE_URL o SUPABASE_ANON_KEY");
  }

  return createClient(url, key);
}

let _client = null;

export function getClient() {
  if (!_client) _client = getSupabase();
  return _client;
}

// Compatibilidad con el código existente que usa "supabase" directamente
export const supabase = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop];
  }
});
