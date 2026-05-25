export default async function handler(req, res) {
  const apiKey = process.env.API_FOOTBALL_KEY;

  const fecha = new Date().toISOString().split("T")[0];

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${fecha}`,
      {
        headers: {
          "x-apisports-key": apiKey
        }
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: "Error obteniendo partidos"
    });
  }
}
