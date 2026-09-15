// main.jsx – Einstiegspunkt der React-App (Vite)
// Diese Datei startet die gesamte App

import React from "react";
import ReactDOM from "react-dom/client";
import KalenderApp from "./KalenderApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <KalenderApp />
  </React.StrictMode>
);
