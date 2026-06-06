import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
try {
const apiKey = process.env.API_FOOTBALL_KEY;

const { data: historial, error } = await supabase
  .from("picks")
  .select("*")
  .eq("resultado", "pendiente");

if (error) {
  return res.status(500).json({ error });
}

let actualizados = 0;

for (const pick of historial) {
  const response = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${pick.fecha}`,
    {
      headers: {
        "x-apisports-key": apiKey,
      },
    }
  );

  const data = await response.json();

  const partidos = data.response || [];

  const partido = partidos.find(
    (p) =>
      `${p.teams.home.name} vs ${p.teams.away.name}` === pick.partido
  );

  if (!partido) continue;

  if (partido.fixture.status.short !== "FT") continue;

  const golesLocal = partido.goals.home;
  const golesVisitante = partido.goals.away;
  const total = golesLocal + golesVisitante;

  let acierto = false;

  if (pick.mercado === "Over 2.5 goles") {
    acierto = total >= 3;
  }

  else if (pick.mercado === "Over 3.5 goles") {
    acierto = total >= 4;
  }

  else if (pick.mercado === "Ambos marcan") {
    acierto =
      golesLocal > 0 &&
      golesVisitante > 0;
  }
  
if (
  pick.mercado ===
  `Ganador - ${partido.teams.home.name}`
) {

  acierto =
    golesLocal >
    golesVisitante;
}

if (
  pick.mercado ===
  `Ganador - ${partido.teams.away.name}`
) {

  acierto =
    golesVisitante >
    golesLocal;
}

if (
  pick.mercado ===
  "Ganador - Draw"
) {

  acierto =
    golesLocal ===
    golesVisitante;
}

if (
  pick.mercado ===
  "Over 1.5 goles"
) {

  acierto =
    total >= 2;
}

if (
  pick.mercado ===
  "Under 2.5 goles"
) {

  acierto =
    total <= 2;
}
  else if (
    pick.mercado.startsWith("Ganador - ")
  ) {
    const equipo = pick.mercado.replace(
      "Ganador - ",
      ""
    );

    if (
      golesLocal > golesVisitante &&
      equipo === partido.teams.home.name
    ) {
      acierto = true;
    }

    if (
      golesVisitante > golesLocal &&
      equipo === partido.teams.away.name
    ) {
      acierto = true;
    }
  }

  await supabase
    .from("picks")
    .update({
      resultado: acierto
        ? "acierto"
        : "fallo",
    })
    .eq("id", pick.id);

  actualizados++;
}

return res.status(200).json({
  ok: true,
  actualizados,
});

} catch (error) {
return res.status(500).json({
error: error.message,
});
}
}
