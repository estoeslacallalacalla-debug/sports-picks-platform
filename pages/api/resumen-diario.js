import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";
    const apiKey        = process.env.FOOTBALL_DATA_KEY;

    // Buscar picks de las últimas 28h (cubre desfase España UTC+2)
    const hace28h = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString().split("T")[0];
    const hoy     = new Date().toISOString().split("T")[0];

    // Intentar actualizar pendientes antes del resumen
    const { data: pendientes } = await supabase
      .from("picks")
      .select("*")
      .eq("resultado", "pendiente")
      .gte("fecha", hace28h);

    if (pendientes && pendientes.length > 0) {
      const fechas = [...new Set(pendientes.map(p => p.fecha))];
      for (const fecha of fechas) {
        try {
          const r = await fetch(
            `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${fecha}&dateTo=${fecha}`,
            { headers: { "X-Auth-Token": apiKey } }
          );
          const data = await r.json();
          const terminados = (data.matches || []).filter(m => m.status === "FINISHED");

          for (const pick of pendientes.filter(p => p.fecha === fecha)) {
            const partido = encontrarPartido(terminados, pick.partido);
            if (!partido) continue;

            const gL    = partido.score?.fullTime?.home ?? 0;
            const gV    = partido.score?.fullTime?.away ?? 0;
            const total = gL + gV;
            const home  = partido.homeTeam?.name || "";
            const away  = partido.awayTeam?.name || "";

            const acierto = evaluarMercado(pick.mercado, gL, gV, total, home, away);
            if (acierto === null) continue;

            await supabase
              .from("picks")
              .update({ resultado: acierto ? "acierto" : "fallo" })
              .eq("id", pick.id);
          }
        } catch (err) {
          console.error("Error actualizando:", err.message);
        }
      }
    }

    // Leer picks actualizados
    const { data: picks, error } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hace28h)
      .order("confianza", { ascending: false });

    if (error) return res.status(500).json({ error });

    const aciertos   = picks.filter(p => p.resultado === "acierto").length;
    const fallos     = picks.filter(p => p.resultado === "fallo").length;
    const sinJugar   = picks.filter(p => p.resultado === "pendiente").length;
    const totalJug   = aciertos + fallos;
    const winrate    = totalJug > 0
      ? ((aciertos / totalJug) * 100).toFixed(0) + "%"
      : "—";

    const mensaje =
`📊 *RESUMEN DEL DÍA*
📅 ${hoy}

✅ Aciertos: *${aciertos}*
❌ Fallos: *${fallos}*
⏳ Pendientes: *${sinJugar}*
📈 Winrate: *${winrate}*

De ${picks.length} picks → ${aciertos} aciertos, ${fallos} fallos${sinJugar > 0 ? `, ${sinJugar} aún sin jugar` : ""}
🔥 Sports Picks IA`;

    await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChat,
          text: mensaje,
          parse_mode: "Markdown"
        })
      }
    );

    return res.status(200).json({ ok: true, aciertos, fallos, sinJugar, winrate });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

function limpiar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bfc\b|\bac\b|\bsc\b|\bcd\b|\bsv\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function encontrarPartido(partidos, nombrePick) {
  const pickL = limpiar(nombrePick);
  for (const p of partidos) {
    const api = limpiar(`${p.homeTeam?.name} vs ${p.awayTeam?.name}`);
    if (api === pickL) return p;
  }
  const palabras = pickL.split(" ").filter(w => w.length > 3);
  let mejor = null, mejorPts = 0;
  for (const p of partidos) {
    const api = limpiar(`${p.homeTeam?.name} vs ${p.awayTeam?.name}`).split(" ");
    const pts = palabras.filter(w => api.includes(w)).length / palabras.length;
    if (pts > mejorPts && pts >= 0.6) { mejorPts = pts; mejor = p; }
  }
  return mejor;
}

function evaluarMercado(mercado, gL, gV, total, home, away) {
  const m = (mercado || "").toLowerCase();
  if (m.includes("más de 0.5") || m.includes("over 0.5"))    return total >= 1;
  if (m.includes("más de 1.5") || m.includes("over 1.5"))    return total >= 2;
  if (m.includes("más de 2.5") || m.includes("over 2.5"))    return total >= 3;
  if (m.includes("más de 3.5") || m.includes("over 3.5"))    return total >= 4;
  if (m.includes("menos de 2.5") || m.includes("under 2.5")) return total <= 2;
  if (m.includes("menos de 3.5") || m.includes("under 3.5")) return total <= 3;
  if (m.includes("under"))                                    return total <= 2;
  if (m.includes("ambos"))                                    return gL > 0 && gV > 0;
  if (m.includes("empate") || m.includes("draw"))             return gL === gV;
  if (m.includes("1x"))                                       return gL >= gV;
  if (m.includes("x2"))                                       return gV >= gL;
  if (m.includes("victoria") && limpiar(m).includes(limpiar(home))) return gL > gV;
  if (m.includes("victoria") && limpiar(m).includes(limpiar(away))) return gV > gL;
  if (m.includes("ganador") && limpiar(m).includes(limpiar(home)))  return gL > gV;
  if (m.includes("ganador") && limpiar(m).includes(limpiar(away)))  return gV > gL;
  if (m.includes("ganador") && m.includes("draw"))                  return gL === gV;
  return null;
}
