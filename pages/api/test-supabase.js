import { supabase } from "../../lib/supabase";

export default async function handler(
req,
res
) {
try {

const { data, error } =
  await supabase
    .from("picks")
    .insert([
      {
        partido:
          "Prueba Supabase",

        liga:
          "Test",

        mercado:
          "Test",

        confianza:
          99
      }
    ])
    .select();

if (error) {
  return res.status(500).json({
    ok: false,
    error
  });
}

return res.status(200).json({
  ok: true,
  data
});

} catch (err) {

return res.status(500).json({
  ok: false,
  error: err.message
});

}
}
