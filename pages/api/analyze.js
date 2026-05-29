export default async function handler(
  req,
  res
) {
  const matches = req.body;

  const analyzed =
    matches.map((match) => {
      const homeGoals =
        Math.random() * 2 + 1;

      const awayGoals =
        Math.random() * 2 + 0.5;

      const totalGoals =
        homeGoals + awayGoals;

      let mercado =
        "Más de 1.5 goles";

      let confianza = 70;

      // IA básica realista
      if (totalGoals >= 3) {
        mercado =
          "Más de 2.5 goles";

        confianza = 88;
      }

      if (
        homeGoals > 1 &&
        awayGoals > 1
      ) {
        mercado =
          "Ambos equipos marcan";

        confianza = 90;
      }

      if (totalGoals < 2) {
        mercado =
          "Menos de 2.5 goles";

        confianza = 82;
      }

      return {
        ...match,
        mercado,
        confianza
      };
    });

  res.status(200).json(
    analyzed
  );
}
