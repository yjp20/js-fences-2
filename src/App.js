import React from "react";
import HexagonalGrid from "./HexagonalGrid";

function App() {
  return (
    <div
      className="App"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f0f0",
      }}
    >
      <HexagonalGrid />
    </div>
  );
}

export default App;
