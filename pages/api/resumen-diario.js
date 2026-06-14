import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN; // ← unificado
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";

    // Solo picks de hoy
    const hoy = new Date().toISOString().split("T")[0];

    const { data: historial, error } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hoy);

    if (error) return res.status(500).json({ error });

    const acertados  = historial.filter(h => h.resultado === "acierto").length;
    const fallados   = historial.filter(h => h.resultado === "fallo").length;
    const pendientes = historial.filter(h => h.resultado === "pendiente").length;
    const total      = acertados + fallados;

    const winrate = total > 0
      ? ((acertados / total) * 100).toFixed(1)
      : "—";

    // Listar los picks del día con su estado
    const listapicks = historial
      .slice(0, 15) // máximo 15 en el mensaje
      .map(h => {
        const icono =
          h.resultado === "acierto"   ? "✅" :
          h.resultado === "fallo"     ? "❌" : "⏳";
        return `${icono} ${h.partido} — ${h.mercado} (${h.confianza || "?"}%)`;
      })
      .join("\n");

    const mensaje =
`📊 *RESUMEN DEL DÍA — Sports Picks IA*

📅 ${hoy}

✅ Aciertos:  *${acertados}*
❌ Fallos:    *${fallados}*
⏳ Pendientes: *${pendientes}*
📈 Winrate:   *${winrate}%*

━━━━━━━━━━━━━━━━
📋 *PICKS DE HOY:*
${listapicks || "Sin picks hoy"}

🔥 Sports Picks IA PRO`;

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

    return res.status(200).json({ ok: true, acertados, fallados, pendientes, winrate });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
