import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const fdKey  = process.env.FOOTBALL_DATA_KEY; // football-data.org
    const groqKey = process.env.GROQ_API_KEY;

    if (!fdKey)   return res.status(500).json({ error: "FOOTBALL_DATA_KEY no configurada" });
    if (!groqKey) return res.status(500).json({ error: "GROQ_API_KEY no configurada" });

    const hoy = new Date().toISOString().split("T")[0];
    const en4dias = new Date(Date.now() + 4*24*60*60*1000).toISOString().split("T")[0];

    // Competiciones disponibles GRATIS en football-data.org
    // Codigos oficiales: WC=Mundial, CL=Champions, PL=Premier, PD=LaLiga, etc.
    const competiciones = [
      { code: "WC",  nombre: "🌍 Mundial 2026" },
      { code: "CL",  nombre: "🏆 Champions League" },
      { code: "EC",  nombre: "🏆 Eurocopa" },
      { code: "PL",  nombre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
      { code: "PD",  nombre: "🇪🇸 La Liga" },
      { code: "BL1", nombre: "🇩🇪 Bundesliga" },
      { code: "SA",  nombre: "🇮🇹 Serie A" },
      { code: "FL1", nombre: "🇫🇷 Ligue 1" },
      { code: "DED", nombre: "🇳🇱 Eredivisie" },
      { code: "PPL", nombre: "🇵🇹 Primeira Liga" },
      { code: "BSA", nombre: "🇧🇷 Brasileirao" },
      { code: "ELC", nombre: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Championship" },
    ];

    // LIMITE: football-data.org permite 10 llamadas/minuto en plan free
    let llamadasUsadas = 0;
    const MAX_LLAMADAS = 9; // margen de seguridad sobre las 10/minuto

    function puedeLlamar() {
      if (llamadasUsadas >= MAX_LLAMADAS) return false;
      llamadasUsadas++;
      return true;
    }

    // 1. Buscar partidos de hoy en cada competicion (1 llamada por competicion)
    const partidosEncontrados = [];

    for (const comp of competiciones) {
      if (!puedeLlamar()) break;
      try {
        const r = await fetch(
          `https://api.football-data.org/v4/competitions/${comp.code}/matches?dateFrom=${hoy}&dateTo=${en4dias}`,
          { headers: { "X-Auth-Token": fdKey } }
        );
        const data = await r.json();
        const partidos = (data.matches || []).filter(p => {
          const noJugado = ["TIMED", "SCHEDULED"].includes(p.status);
          return noJugado;
        });

        for (const p of partidos) {
          partidosEncontrados.push({ comp, partido: p });
        }

        await sleep(6500); // 10 llamadas/min = 1 cada 6 segundos minimo, dejamos margen
      } catch (err) {
        console.error(`Competicion ${comp.code}:`, err.message);
      }
    }

    if (partidosEncontrados.length === 0) {
      return res.status(200).json({ ok: true, totalPicks: 0, picks: [], mensaje: "Sin partidos hoy", llamadasUsadas });
    }

    // 2. Ordenar todos los partidos encontrados por fecha (los mas proximos primero)
    partidosEncontrados.sort((a, b) =>
      new Date(a.partido.utcDate) - new Date(b.partido.utcDate)
    );

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

      // Estadisticas del equipo si quedan llamadas (opcional, football-data da menos detalle gratis)
      let formaLocal = "Sin datos previos";
      let formaVisit = "Sin datos previos";

      if (puedeLlamar() && homeId) {
        formaLocal = await fetchUltimosPartidos(fdKey, homeId);
        await sleep(6500);
      }
      if (puedeLlamar() && awayId) {
        formaVisit = await fetchUltimosPartidos(fdKey, awayId);
        await sleep(6500);
      }

      const resumenDatos = `PARTIDO: ${homeName} vs ${awayName}
COMPETICION: ${comp.nombre} | HORA: ${hora}

LOCAL (${homeName}): ${formaLocal}
VISITANTE (${awayName}): ${formaVisit}

NOTA: si es un partido de seleccion nacional (Mundial, Eurocopa) basa el analisis
en el nivel general de la seleccion y su historial en este tipo de torneos.`;

      const resultadoGroq = await analizarConGroq(groqKey, resumenDatos);
      if (resultadoGroq?.error) {
        if (!primerErrorGroq) primerErrorGroq = `${homeName} vs ${awayName}: ${resultadoGroq.error}`;
        continue;
      }
      const analisisIA = resultadoGroq?.mercados;
      if (!analisisIA) {
        if (!primerErrorGroq) primerErrorGroq = `Sin mercados: ${homeName} vs ${awayName}`;
        continue;
      }

      const mercadosBuenos = analisisIA.filter(m => m.confianza >= 70);

      for (const m of mercadosBuenos) {
        todosLosPicks.push({
          partido:   `${homeName} vs ${awayName}`,
          liga:      comp.nombre,
          mercado:   m.mercado,
          confianza: m.confianza,
          fecha:     hoy,
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
        primerErrorGroq,
        primerPartidoAnalizado: partidosAAnalizar[0] ?
          `${partidosAAnalizar[0].partido.homeTeam?.name} vs ${partidosAAnalizar[0].partido.awayTeam?.name}` : null
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

// ─── ULTIMOS PARTIDOS DE UN EQUIPO ────────────────────────────────────────────

async function fetchUltimosPartidos(fdKey, teamId) {
  try {
    const r = await fetch(
      `https://api.football-data.org/v4/teams/${teamId}/matches?status=FINISHED&limit=5`,
      { headers: { "X-Auth-Token": fdKey } }
    );
    const data = await r.json();
    const partidos = data.matches || [];

    if (partidos.length === 0) return "Sin partidos previos registrados";

    const resumen = partidos.map(p => {
      const gH = p.score?.fullTime?.home ?? "?";
      const gA = p.score?.fullTime?.away ?? "?";
      return `${p.homeTeam.name} ${gH}-${gA} ${p.awayTeam.name}`;
    }).join("; ");

    return `Últimos resultados: ${resumen}`;
  } catch {
    return "Sin datos disponibles";
  }
}

// ─── ANALISIS CON GROQ ────────────────────────────────────────────────────────

async function analizarConGroq(groqKey, resumenDatos) {
  const prompt = `Analiza este partido de futbol con los datos proporcionados.
Evalua TODOS estos mercados y da un porcentaje de probabilidad realista a cada uno.

${resumenDatos}

Responde SOLO con un array JSON valido, sin texto antes ni despues, sin backticks.
Formato exacto:
[
  {"mercado": "Victoria local", "confianza": <0-98>},
  {"mercado": "Empate", "confianza": <0-98>},
  {"mercado": "Victoria visitante", "confianza": <0-98>},
  {"mercado": "Doble oportunidad 1X", "confianza": <0-98>},
  {"mercado": "Doble oportunidad X2", "confianza": <0-98>},
  {"mercado": "Mas de 1.5 goles", "confianza": <0-98>},
  {"mercado": "Mas de 2.5 goles", "confianza": <0-98>},
  {"mercado": "Menos de 2.5 goles", "confianza": <0-98>},
  {"mercado": "Ambos equipos marcan", "confianza": <0-98>},
  {"mercado": "Mas de 3.5 tarjetas", "confianza": <0-98>},
  {"mercado": "Mas de 8.5 corners", "confianza": <0-98>}
]

IMPORTANTE: basa los porcentajes en los datos reales proporcionados, no inventes datos.
Si hay poca informacion (selecciones nacionales), usa tu conocimiento general del nivel del equipo.`;

  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        max_tokens: 600,
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
      const errMsg = `HTTP ${r.status}: ${data?.error?.message || JSON.stringify(data)}`;
      console.error("Groq HTTP error:", errMsg);
      return { error: errMsg };
    }

    const texto = data?.choices?.[0]?.message?.content?.trim() || "";
    const limpio = texto.replace(/```json|```/g, "").trim();

    if (!limpio) {
      return { error: "Groq devolvio texto vacio" };
    }

    try {
      const parsed = JSON.parse(limpio);
      return { mercados: parsed };
    } catch (parseErr) {
      return { error: `JSON invalido: ${limpio.substring(0, 150)}` };
    }

  } catch (err) {
    return { error: `Catch: ${err.message}` };
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
