import fs from "fs";
import path from "path";

export default async function handler(
  req,
  res
) {

  try {

    const telegramToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const telegramChat =
      "@sportspicksia2026";

    const historialPath =
      path.join(
        process.cwd(),
        "data",
        "historial.json"
      );

    if (
      !fs.existsSync(
        historialPath
      )
    ) {

      return res
        .status(200)
        .json({
          ok: false
        });
    }

    const historial =
      JSON.parse(
        fs.readFileSync(
          historialPath,
          "utf8"
        )
      );

    const acertados =
      historial.filter(
        h =>
          h.resultado ===
          "acierto"
      ).length;

    const fallados =
      historial.filter(
        h =>
          h.resultado ===
          "fallo"
      ).length;

    const winrate =
      acertados + fallados > 0

        ? (
            (
              acertados /
              (
                acertados +
                fallados
              )
            ) * 100
          ).toFixed(1)

        : 0;

    const mensaje =
`
📊 RESUMEN IA DEL DÍA

✅ Aciertos:
${acertados}

❌ Fallos:
${fallados}

🚀 Winrate:
${winrate}%

🔥 Sports Picks IA PRO
`;

    await fetch(
      `https://api.telegram.org/bot${telegramToken}/sendMessage`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          chat_id:
            telegramChat,

          text:
            mensaje
        })
      }
    );

    res.status(200).json({
      ok: true
    });

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
