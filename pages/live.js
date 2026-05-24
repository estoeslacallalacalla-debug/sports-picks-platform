export default function Live() {
  return (
    <div
      style={{
        backgroundColor: "#eaf2ff",
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "Arial"
      }}
    >
      <h1 style={{ color: "#2563eb" }}>
        🔴 Partidos En Vivo
      </h1>

      <div
        style={{
          background: "white",
          padding: "15px",
          borderRadius: "12px",
          marginTop: "20px"
        }}
      >
        <h2>Simba vs Azam</h2>
        <p>Minuto: 63</p>
        <p>Resultado: 1 - 0</p>
        <p>Corners: 7</p>
        <p>Tarjetas: 3</p>
      </div>
    </div>
  );
}
