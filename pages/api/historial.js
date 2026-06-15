import { supabase } from "../../lib/supabase";

export default async function handler(req, res) {
  try {
    const hoy = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .gte("fecha", hoy)
      .order("confianza", { ascending: false })
      .limit(10);

    if (error) return res.status(500).json({ picks: [], error: error.message });

    return res.status(200).json({ picks: data || [] });

  } catch (err) {
    return res.status(500).json({ picks: [], error: err.message });
  }
}
