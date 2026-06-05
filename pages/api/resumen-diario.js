import { supabase } from "../../lib/supabase";

export default async function handler(
  req,
  res
) {

  try {

    const telegramToken =
      process.env.TELEGRAM_BOT_TOKEN;

    const telegramChat =
      "@sportspicksia2026";

    const {
      data: historial,
      error
    } = await supabase
      .from("picks")
      .select("*");

    if (error) {

      return res.status(500).json({
        error
      });
    }

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

    const pendientes =
      historial.filter(
        h =>
          h.resultado ===
          "pendiente"
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

✅ Aciertos: ${acertados}

❌ Fallos: ${fallados}

⏳ Pendientes: ${pendientes}

🚀 Winrate: ${winrate}%

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

    return res.status(200).json({
      ok: true,
      acertados,
      fallados,
      pendientes,
      winrate
    });

  } catch (error) {

    return res.status(500).json({
      error:
        error.message
    });
  }
}
