export default async function handler(
  req,
  res
) {
  try {
    const response =
      await fetch(
        "https://api.the-odds-api.com/v4/sports/soccer/odds/?regions=eu&markets=h2h&apiKey=TU_API_KEY"
      );

    const data =
      await response.json();

    const surebets = [];

    data.forEach((match) => {
      if (
        !match.bookmakers ||
        match.bookmakers.length < 2
      )
        return;

      let bestHome = 0;
      let bestAway = 0;

      match.bookmakers.forEach(
        (bookmaker) => {
          const market =
            bookmaker.markets?.[0];

          if (!market) return;

          market.outcomes.forEach(
            (outcome) => {
              if (
                outcome.name ===
                match.home_team
              ) {
                if (
                  outcome.price >
                  bestHome
                ) {
                  bestHome =
                    outcome.price;
                }
              }

              if (
                outcome.name ===
                match.away_team
              ) {
                if (
                  outcome.price >
                  bestAway
                ) {
                  bestAway =
                    outcome.price;
                }
              }
            }
          );
        }
      );

      if (
        bestHome > 0 &&
        bestAway > 0
      ) {
        const total =
          1 / bestHome +
          1 / bestAway;

        if (total < 1) {
          surebets.push({
            partido:
              `${match.home_team} vs ${match.away_team}`,
            cuotaLocal:
              bestHome,
            cuotaVisitante:
              bestAway,
            beneficio:
              (
                (1 - total) *
                100
              ).toFixed(2) + "%"
          });
        }
      }
    });

    res.status(200).json({
      total:
        surebets.length,
      surebets
    });
  } catch (error) {
    res.status(500).json({
      error:
        error.message
    });
  }
}
