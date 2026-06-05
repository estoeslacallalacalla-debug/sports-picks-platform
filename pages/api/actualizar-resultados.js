import { supabase } from "../../lib/supabase";
export default async function handler(
  req,
  res
) {

  try {

    const apiKey =
      process.env.API_FOOTBALL_KEY;

    const historialPath =
      path.join(
        process.cwd(),
        "data",
        "historial.json"
      );

    const {
  data: historial,
  error
} = await supabase
  .from("picks")
  .select("*")
  .eq(
    "resultado",
    "pendiente"
  );

if (error) {

  return res.status(500).json({
    error
  });
}

    for (
      const pick
      of historial
    ) {

      if (
        pick.resultado !==
        "pendiente"
      ) continue;

      const response =
        await fetch(
          `https://v3.football.api-sports.io/fixtures?date=${pick.fecha}`,
          {
            headers: {
              "x-apisports-key":
                apiKey
            }
          }
        );

      const data =
        await response.json();

      const partidos =
        data.response || [];

      const partido =
        partidos.find(
          p =>
            `${p.teams.home.name} vs ${p.teams.away.name}`
            === pick.partido
        );

      if (
        !partido
      ) continue;

      if (
        partido.fixture.status.short
        !== "FT"
      ) continue;

      const golesLocal =
        partido.goals.home;

      const golesVisitante =
        partido.goals.away;

      const total =
        golesLocal +
        golesVisitante;

      let acierto =
        false;

      if (
        pick.mercado ===
        "Over 2.5 goles"
      ) {

        acierto =
          total >= 3;
      }

      if (
        pick.mercado ===
        "Over 3.5 goles"
      ) {

        acierto =
          total >= 4;
      }

      if (
        pick.mercado ===
        "Ambos marcan"
      ) {

        acierto =
          golesLocal > 0 &&
          golesVisitante > 0;
      }

      pick.resultado =
        acierto

          ? "acierto"

          : "fallo";
    await supabase
  .from("picks")
  .update({
    resultado:
      acierto
        ? "acierto"
        : "fallo"
  })
  .eq(
    "id",
    pick.id
  );

    res.status(200).json({

      ok: true,

      actualizados:
        historial.length
    });

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
