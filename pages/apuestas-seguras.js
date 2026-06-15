import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Surebets() {
  const [surebets, setSurebets] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase
      .from("apuestas_seguras")
      .select("*")
      .eq("estado", "activa")
      .order("fecha", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setSurebets(data || []);
        setCargando(false);
      });
  }, []);

  return (
    <div style={{
      background: "#0a1628",
      minHeight: "100vh",
      padding: "16px",
      fontFamily: "Arial",
      color: "#e2e8f0"
    }}>

      {/* NAV */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
        {[["⚽","Inicio","/"],["🔴","En Vivo","/live"],["📅","Prematch","/prematch"],
          ["🔥","Picks","/selecciones"],["💎","Surebets","/apuesta-segura"],["🤖","Telegram","/telegram"]
        ].map(([ico, label, href]) => (
          <a key={href} href={href} style={{ textDecoration: "none" }}>
            <button style={{
              background: href === "/apuesta-segura" ? "#3b82f6" : "#1e3a5f",
              color: "#e2e8f0", border: "none", borderRadius: "8px",
              padding: "7px 12px", fontSize: "12px",
              fontWeight: "600", cursor: "pointer"
            }}>{ico} {label}</button>
          </a>
        ))}
      </div>

      <h1 style={{ color: "#3b82f6", fontSize: "20px", marginBottom: "4px" }}>
        💎 Surebets detectadas
      </h1>
      <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "16px" }}>
        Arbitraje entre casas de apuestas · Actualizado automáticamente
      </p>

      {cargando ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: "40px" }}>
          ⏳ Cargando surebets...
        </div>
      ) : surebets.length === 0 ? (
        <div style={{
          background: "#1e293b", borderRadius: "12px",
          padding: "24px", textAlign: "center"
        }}>
          <p style={{ color: "#64748b", fontSize: "14px" }}>
            Sin surebets activas ahora mismo.
          </p>
          <p style={{ color: "#64748b", fontSize: "12px" }}>
            Se buscan automáticamente a las 11:00h y 17:00h (hora España).
          </p>
        </div>
      ) : (
        surebets.map((s, i) => (
          <div key={i} style={{
            background: "#1e293b",
            borderRadius: "12px",
            padding: "14px",
            marginBottom: "12px",
            borderLeft: "4px solid #3b82f6"
          }}>
            {/* Cabecera */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontWeight: "700", fontSize: "14px" }}>
                ⚡ {s.partido}
              </span>
              <span style={{
                background: "#22c55e", color: "#000",
                borderRadius: "6px", padding: "3px 10px",
                fontSize: "13px", fontWeight: "700"
              }}>
                +{s.beneficio}
              </span>
            </div>

            {/* Apuestas */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>🏠 Local</div>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>
                  {s.casa_local} · cuota {s.cuota_local}
                </div>
                <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "700" }}>
                  💰 Apostar: {s.apuesta_local}
                </div>
              </div>

              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>🤝 Empate</div>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>
                  {s.casa_empate} · cuota {s.cuota_empate}
                </div>
                <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "700" }}>
                  💰 Apostar: {s.apuesta_empate}
                </div>
              </div>

              <div style={{ background: "#0f172a", borderRadius: "8px", padding: "10px" }}>
                <div style={{ fontSize: "12px", color: "#94a3b8" }}>✈️ Visitante</div>
                <div style={{ fontSize: "13px", fontWeight: "600" }}>
                  {s.casa_visitante} · cuota {s.cuota_visitante}
                </div>
                <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: "700" }}>
                  💰 Apostar: {s.apuesta_visitante}
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: "8px", padding: "10px",
              display: "flex", justifyContent: "space-between"
            }}>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                💵 Ganancia sobre 100€:
              </span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#22c55e" }}>
                {s.ganancia}
              </span>
            </div>

            <p style={{ fontSize: "10px", color: "#64748b", margin: "8px 0 0 0" }}>
              ⚠️ Verifica las cuotas antes de apostar. Pueden cambiar rápido.
            </p>
          </div>
        ))
      )}
    </div>
  );
          }
