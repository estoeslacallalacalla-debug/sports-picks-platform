export default async function handler(
  req,
  res
) {
  const matches = req.body;

  const analyzed =
    matches.map((match) => {
      const league =
        match.league.name.toLowerCase();

      const isFemale =
        league.includes("women") ||
        league.includes("femin") ||
        league.includes("liga f");

      // DATOS REALES DEL PARTIDO
      const homeGoals =
        parseFloat(
          match.goals?.home ?? 0
        );

      const awayGoals =
        parseFloat(
          match.goals?.away ?? 0
        );

      const totalGoals =
        homeGoals + awayGoals;

      let mercado =
        "Más de 1.5 goles";

      let confianza = 75;

      // IA REAL BASADA EN GOLES
      if (totalGoals >= 3) {
        mercado =
          "Más de 2.5 goles";

        confianza = 90;
      }

      if (
        homeGoals >= 1 &&
        awayGoals >= 1
      ) {
        mercado =
          "Ambos equipos marcan";

        confianza = 92;
      }

      if (totalGoals <= 1) {
        mercado =
          "Menos de 2.5 goles";

        confianza = 85;
      }

      // BONUS ligas femeninas
      if (isFemale) {
        confianza += 2;
      }

      // Límite máximo
      if (confianza > 99) {
        confianza = 99;
      }

      return {
        ...match,
        mercado,
        confianza,
        isFemale
      };
    });

  res.status(200).json(
    analyzed
  );
}
