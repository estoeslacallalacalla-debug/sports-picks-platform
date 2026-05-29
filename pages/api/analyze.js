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

      let mercado =
        "Más de 1.5 goles";

      let confianza = 75;

      const random =
        match.fixture.id % 100;

      if (random > 80) {
        mercado =
          "Ambos equipos marcan";

        confianza = 90;
      } else if (random > 60) {
        mercado =
          "Más de 2.5 goles";

        confianza = 87;
      } else if (random > 40) {
        mercado =
          "Menos de 2.5 goles";

        confianza = 82;
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
