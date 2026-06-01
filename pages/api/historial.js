import fs from "fs";
import path from "path";

export default function handler(
  req,
  res
) {

  try {

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
        .json([]);
    }

    const historial =
      JSON.parse(
        fs.readFileSync(
          historialPath,
          "utf8"
        )
      );

    res.status(200).json(
      historial
    );

  } catch (error) {

    res.status(500).json({
      error:
        error.message
    });
  }
}
