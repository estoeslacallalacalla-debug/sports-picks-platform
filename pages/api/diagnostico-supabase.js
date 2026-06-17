export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL || "";
  const urlPublic = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  const keyPublic = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return res.status(200).json({
    SUPABASE_URL_existe: !!url,
    SUPABASE_URL_longitud: url.length,
    SUPABASE_URL_empiezaHttps: url.startsWith("https://"),
    SUPABASE_URL_primeros20: url.substring(0, 20),

    NEXT_PUBLIC_SUPABASE_URL_existe: !!urlPublic,
    NEXT_PUBLIC_SUPABASE_URL_longitud: urlPublic.length,
    NEXT_PUBLIC_SUPABASE_URL_empiezaHttps: urlPublic.startsWith("https://"),
    NEXT_PUBLIC_SUPABASE_URL_primeros20: urlPublic.substring(0, 20),

    SUPABASE_ANON_KEY_existe: !!key,
    SUPABASE_ANON_KEY_longitud: key.length,

    NEXT_PUBLIC_SUPABASE_ANON_KEY_existe: !!keyPublic,
    NEXT_PUBLIC_SUPABASE_ANON_KEY_longitud: keyPublic.length,
  });
}
