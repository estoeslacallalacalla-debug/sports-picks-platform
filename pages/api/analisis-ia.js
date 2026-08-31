import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const fdKey   = process.env.FOOTBALL_DATA_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!fdKey)   return res.status(500).json({ error: "FOOTBALL_DATA_KEY no configurada" });
    if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY no configurada" });

    const hoy     = new Date().toISOString().split("T")[0];
    const en4dias = new Date(Date.now() + 4*24*60*60*1000).toISOString().split("T")[0];

    // Competiciones disponibles GRATIS en football-data.org
    const competiciones = [
      // Amistosos internacionales (activos en verano)
      { code: "CLI",  nombre: "🌐 Amistosos Internacionales" },
      // Ligas sudamericanas
      { code: "BSA",  nombre: "🇧🇷 Brasileirao (Brasil)" },
      { code: "ASL",  nombre: "🇦🇷 Liga Profesional (Argentina)" },
      // Ligas europeas que arrancan en verano
      { code: "PL",   nombre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
      { code: "BL1",  nombre: "🇩🇪 Bundesliga" },
      { code: "PD",   nombre: "🇪🇸 La Liga" },
      { code: "SA",   nombre: "🇮🇹 Serie A" },
      { code: "FL1",  nombre: "🇫🇷 Ligue 1" },
      { code: "DED",  nombre: "🇳🇱 Eredivisie" },
      { code: "PPL",  nombre: "🇵🇹 Primeira Liga" },
      { code: "ELC",  nombre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Championship" },
      { code: "CL",   nombre: "🏆 Champions League" },
    ];

    let llamadasUsadas = 0;
    const MAX_LLAMADAS = 9;

    function puedeLlamar() {
      if (llamadasUsadas >= MAX_LLAMADAS) return false;
      llamadasUsadas++;
      return true;
    }

    // 1. Buscar partidos próximos en cada competición
    const partidosEncontrados = [];

    for (const comp of competiciones) {
      if (!puedeLlamar()) break;
      try {
        const r = await fetch(
          `https://api.football-data.org/v4/competitions/${comp.code}/matches?dateFrom=${hoy}&dateTo=${en4dias}`,
          { headers: { "X-Auth-Token": fdKey } }
        );

        if (!r.ok) {
          console.log(`Competición ${comp.code} no disponible (${r.status})`);
          await sleep(6500);
          continue;
        }

        const data = await r.json();
        const partidos = (data.matches || []).filter(p =>
          ["TIMED", "SCHEDULED"].includes(p.status)
        );

        for (const p of partidos) {
          partidosEncontrados.push({ comp, partido: p });
        }

        await sleep(6500);
      } catch (err) {
        console.error(`Error ${comp.code}:`, err.message);
      }
    }

    if (partidosEncontrados.length === 0) {
      return res.status(200).json({
        ok: true, totalPicks: 0, picks: [],
        mensaje: "Sin partidos próximos en estas competiciones",
        llamadasUsadas
      });
    }

    // Ordenar por fecha (más próximos primero)
    partidosEncontrados.sort((a, b) =>
      new Date(a.partido.utcDate) - new Date(b.partido.utcDate)
    );

    // 2. Analizar los primeros 6 con Groq
    const LIMITE_PARTIDOS = 6;
    const partidosAAnalizar = partidosEncontrados.slice(0, LIMITE_PARTIDOS);
    const todosLosPicks = [];
    let primerErrorGroq = null;

    for (const { comp, partido } of partidosAAnalizar) {
      const homeName = partido.homeTeam?.name || "Local";
      const awayName = partido.awayTeam?.name || "Visitante";
      const homeId   = partido.homeTeam?.id;
      const awayId   = partido.awayTeam?.id;
      const hora     = partido.utcDate?.substring(11, 16) || "??:??";

      // Obtener últimos partidos de cada equipo
      let formaLocal = "Sin datos";
      let formaVisit = "Sin datos";

      if (puedeLlamar() && homeId) {
        formaLocal = await fetchUltimosPartidos(fdKey, homeId);
        await sleep(6500);
      }
      if (puedeLlamar() && awayId) {
        formaVisit = await fetchUltimosPartidos(fdKey, awayId);
        await sleep(6500);
      }

      const resumenDatos = `PARTIDO: ${homeName} vs ${awayName}
COMPETICION: ${comp.nombre} | HORA UTC: ${hora}

LOCAL (${homeName}): ${formaLocal}
VISITANTE (${awayName}): ${formaVisit}

NOTA: si no hay estadísticas disponibles (amistoso o liga nueva temporada),
usa tu conocimiento general del nivel del equipo para el análisis.`;

      await sleep(8000); // pausa para no superar el límite de tokens/minuto de Groq
      const resultadoGroq = await analizarConGroq(groqKey, resumenDatos);

      if (resultadoGroq?.error) {
        if (!primerErrorGroq) primerErrorGroq = `${homeName} vs ${awayName}: ${resultadoGroq.error}`;
        continue;
      }

      const analisisIA = resultadoGroq?.mercados;
      if (!analisisIA) continue;

      const mercadosBuenos = analisisIA.filter(m => m.confianza >= 70);

      for (const m of mercadosBuenos) {
        todosLosPicks.push({
          partido:   `${homeName} vs ${awayName}`,
          liga:      comp.nombre,
          mercado:   m.mercado,
          confianza: m.confianza,
          fecha:     partido.utcDate?.split("T")[0] || hoy,
          resultado: "pendiente",
        });
      }
    }

    // 3. Top 10 por confianza
    const topPicks = todosLosPicks
      .filter(p => p.partido && p.partido.trim() !== "")
      .sort((a, b) => b.confianza - a.confianza)
      .slice(0, 10);

    // 4. Guardar en Supabase
    if (topPicks.length > 0) {
      await supabase.from("picks").delete().eq("fecha", hoy).eq("resultado", "pendiente");
      await supabase.from("picks").insert(topPicks);
    }

    // 5. Enviar a Telegram
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChat  = process.env.TELEGRAM_CHAT_ID || "@sportspicksia2026";

    for (const pick of topPicks) {
      const estrellas = pick.confianza >= 85 ? "⭐⭐⭐" : pick.confianza >= 75 ? "⭐⭐" : "⭐";
      const mensaje =
`⚽ *PICK DEL DÍA* ${estrellas}

🏆 *${pick.liga}*
🆚 *${pick.partido}*

🎯 *${pick.mercado}*
📊 Confianza: *${pick.confianza}%*

🤖 _Análisis con IA (Groq Llama 3)_
🔗 Sports Picks IA`;

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: telegramChat, text: mensaje, parse_mode: "Markdown" })
      });
      await sleep(400);
    }

    return res.status(200).json({
      ok: true,
      totalPicks: topPicks.length,
      picks: topPicks,
      llamadasUsadas,
      debug: {
        partidosEncontrados: partidosEncontrados.length,
        partidosAnalizados: partidosAAnalizar.length,
        totalMercadosAntesDelFiltro: todosLosPicks.length,
        primerErrorGroq
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function fetchUltimosPartidos(fdKey, teamId) {
  try {
    const r = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=5`,
      { headers: { "X-Auth-Token": fdKey } }
    );
    const data = await r.json();
    const partidos = data.matches || [];
    if (partidos.length === 0) return "Sin partidos previos registrados";
    return "Últimos: " + partidos.map(p => {
      const gH = p.score?.fullTime?.home ?? "?";
      const gA = p.score?.fullTime?.away ?? "?";
      return `${p.homeTeam.name} ${gH}-${gA} ${p.awayTeam.name}`;
    }).join("; ");
  } catch {
    return "Sin datos disponibles";
  }
}

async function analizarConGroq(groqKey, resumenDatos) {
  const plantilla = '[{"mercado":"Victoria local","confianza":0},{"mercado":"Empate","confianza":0},{"mercado":"Victoria visitante","confianza":0},{"mercado":"Doble oportunidad 1X","confianza":0},{"mercado":"Doble oportunidad X2","confianza":0},{"mercado":"Mas de 1.5 goles","confianza":0},{"mercado":"Mas de 2.5 goles","confianza":0},{"mercado":"Menos de 2.5 goles","confianza":0},{"mercado":"Ambos equipos marcan","confianza":0},{"mercado":"Mas de 3.5 tarjetas","confianza":0},{"mercado":"Mas de 8.5 corners","confianza":0}]';

  const prompt = `Analiza este partido de futbol. Responde SOLO con JSON valido, sin texto antes ni despues, sin backticks, sin explicaciones.

${resumenDatos}

Devuelve exactamente este array JSON con los 11 mercados:
${plantilla}

Sustituye cada 0 por la probabilidad real (0-98). Solo JSON, nada mas.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: "Eres un analista experto en futbol. Respondes SOLO con JSON valido, sin explicaciones ni backticks."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await r.json();

    if (!r.ok) {
      return { error: `HTTP ${r.status}: ${data?.error?.message || JSON.stringify(data)}` };
    }

    const texto = data?.choices?.[0]?.message?.content?.trim() || "";

    // Eliminar bloques <think>...</think> que usan los modelos de razonamiento
    const sinThink = texto.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const limpio = sinThink.replace(/```json|```/g, "").trim();

    if (!limpio) return { error: "Groq devolvio texto vacio" };

    try {
      return { mercados: JSON.parse(limpio) };
    } catch {
      return { error: `JSON invalido: ${limpio.substring(0, 100)}` };
    }
  } catch (err) {
    return { error: `Catch: ${err.message}` };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
