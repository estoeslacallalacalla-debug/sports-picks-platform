import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    // Test 1: consulta simple sin filtros
    const { data, error } = await supabase
      .from("picks")
      .select("id, partido, resultado")
      .limit(3);

    if (error) {
      return res.status(200).json({
        test: "FALLIDO",
        error_code: error.code,
        error_message: error.message,
        error_details: error.details,
        error_hint: error.hint
      });
    }

    return res.status(200).json({
      test: "OK",
      filas_encontradas: data?.length || 0,
      muestra: data
    });

  } catch (err) {
    return res.status(500).json({
      test: "EXCEPCION",
      mensaje: err.message
    });
  }
}
