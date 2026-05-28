export default function handler(req, res) {
  const matches = req.body || [];

  const analyzedMatches = matches.map(
    (match) => {
      const league =
        match.league.name.toLowerCase();

      let confianza = 70;

      // Ligas TOP
      if (
        league.includes(
          "champions"
        )
      ) {
        confianza += 12;
      }

      if (
        league.includes(
          "libertadores"
        )
      ) {
        confianza += 12;
      }

      if (
        league.includes(
          "premier"
        )
      ) {
        confianza += 10;
      }

      if (
        league.includes("liga")
      ) {
        confianza += 8;
      }

      // Femenino ofensivo
      if (
        league.includes("women") ||
        league.includes("fem") ||
        league.includes(
          "liga f"
        )
      ) {
        confianza += 7;
      }

      // Mundial
      if (
        league.includes(
          "world cup"
        ) ||
        league.includes(
          "mundial"
        )
      ) {
        confianza += 15;
      }

      // Variación
      confianza +=
        match.fixture.id % 10;

      if (confianza > 95) {
        confianza = 95;
      }

      // MERCADOS
      let mercado =
        "Más de 2.5 goles";

      if (
        league.includes("women")
      ) {
        const mercados = [
          "Más de 2.5 goles",
          "Ambos equipos marcan",
          "Gol en la primera parte"
        ];

        mercado =
          mercados[
            match.fixture.id %
              mercados.length
          ];
      } else if (
        league.includes(
          "libertadores"
        )
      ) {
        const mercados = [
          "Más de 4.5 tarjetas",
          "Más de 8.5 córners",
          "Ambos equipos marcan"
        ];

        mercado =
          mercados[
            match.fixture.id %
              mercados.length
          ];
      } else {
        const mercados = [
          "Más de 2.5 goles",
          "Ambos equipos marcan",
          "Más de 8.5 córners",
          "Menos de 3.5 goles",
          "Doble oportunidad local"
        ];

        mercado =
          mercados[
            match.fixture.id %
              mercados.length
          ];
      }

      return {
        ...match,
        confianza,
        mercado
      };
    }
  );

  res.status(200).json(
    analyzedMatches
  );
}
