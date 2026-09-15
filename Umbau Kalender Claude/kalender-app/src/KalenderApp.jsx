// KalenderApp.jsx
// Umgebaut von: index.html + calenderJS.js + datenAbrufAPI.js + styleCalender.css
// Technologie: React (JSX), Vanilla JS Fetch API, localStorage
//
// WICHTIG – Client ID:
// Die Google OAuth Client-ID wird NICHT in dieser Datei gespeichert.
// Sie muss als Umgebungsvariable gesetzt werden:
//   VITE_GOOGLE_CLIENT_ID=deine-client-id-hier
// Dann in dieser Datei lesen mit:
//   const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// So bleibt die ID aus dem Quellcode heraus und wird NICHT in GitHub hochgeladen.
// Trage die Variable in eine .env-Datei ein und füge .env zu .gitignore hinzu!

import { useState, useEffect } from "react";

// ─── Konstanten ───────────────────────────────────────────────────────────────
const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
const WOCHENTAGE = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];

// Client-ID aus Umgebungsvariable (NIEMALS direkt hier eintragen!)
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// ─── Haupt-Komponente ─────────────────────────────────────────────────────────
export default function KalenderApp() {
  const heute = new Date();

  // State: aktueller Monat und Jahr
  const [monat, setMonat] = useState(heute.getMonth());
  const [jahr, setJahr] = useState(heute.getFullYear());

  // State: alle geladenen Termine
  const [events, setEvents] = useState([]);

  // State: Statusmeldung für den Nutzer
  const [status, setStatus] = useState("");
  const [statusTyp, setStatusTyp] = useState(""); // "ok" | "fehler" | ""

  // Beim ersten Laden: Termine aus localStorage holen
  useEffect(() => {
    try {
      const raw = localStorage.getItem("Daten");
      if (raw) {
        const parsed = JSON.parse(raw);
        const mapped = parsed.map((e) => ({
          title: e.title,
          startMS: new Date(e.start).getTime(),
          endMS: new Date(e.end).getTime(),
        }));
        setEvents(mapped);
        setStatus(`${mapped.length} Termine aus Speicher geladen`);
        setStatusTyp("ok");
      }
    } catch (e) {
      // localStorage leer oder ungültig – kein Fehler nötig
    }
  }, []);

  // ─── Google Login starten ───────────────────────────────────────────────────
  function handleLogin() {
    if (!window.google) {
      setStatus("Google-Bibliothek nicht geladen. Seite neu laden.");
      setStatusTyp("fehler");
      return;
    }

    setStatus("Warte auf Google-Login...");
    setStatusTyp("");

    // Google OAuth Token-Client initialisieren
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          await ladeKalenderDaten(tokenResponse.access_token);
        }
      },
    });

    // Login-Popup öffnen
    tokenClient.requestAccessToken({ prompt: "consent" });
  }

  // ─── Alle Kalender-Termine von Google laden ─────────────────────────────────
  async function ladeKalenderDaten(accessToken) {
    setStatus("Lade Kalender-Daten von Google...");
    setStatusTyp("");

    let alleTermine = [];
    let nextPageToken = null;
    const baseUrl =
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true";

    try {
      // Schleife: Alle Seiten der API durchlaufen (Paginierung)
      do {
        const url = nextPageToken
          ? `${baseUrl}&pageToken=${nextPageToken}`
          : baseUrl;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`Fehler ${response.status}: ${errData.error.message}`);
        }

        const data = await response.json();

        if (data.items) {
          const neuTermine = data.items.map((ev) => ({
            title: ev.summary || "Kein Titel",
            startMS: new Date(ev.start.dateTime || ev.start.date).getTime(),
            endMS: new Date(ev.end.dateTime || ev.end.date).getTime(),
          }));
          alleTermine = [...alleTermine, ...neuTermine];
        }

        nextPageToken = data.nextPageToken;
      } while (nextPageToken);

      // localStorage aktualisieren (altes löschen, neues speichern)
      localStorage.removeItem("Daten");
      localStorage.setItem(
        "Daten",
        JSON.stringify(
          alleTermine.map((e) => ({
            title: e.title,
            start: new Date(e.startMS).toISOString(),
            end: new Date(e.endMS).toISOString(),
          }))
        )
      );

      setEvents(alleTermine);
      setStatus(`${alleTermine.length} Termine erfolgreich geladen`);
      setStatusTyp("ok");
    } catch (error) {
      console.error("Fehler beim Laden:", error);
      setStatus(`Fehler beim Laden: ${error.message}`);
      setStatusTyp("fehler");
    }
  }

  // ─── Navigation: Monat wechseln ─────────────────────────────────────────────
  function vorheriger() {
    if (monat === 0) {
      setMonat(11);
      setJahr((j) => j - 1);
    } else {
      setMonat((m) => m - 1);
    }
  }

  function naechster() {
    if (monat === 11) {
      setMonat(0);
      setJahr((j) => j + 1);
    } else {
      setMonat((m) => m + 1);
    }
  }

  // ─── Kalender-Berechnung ─────────────────────────────────────────────────────
  // Wochentag des 1. im Monat (0=Sonntag → umrechnen auf 0=Montag)
  const ersterTagWochentag = new Date(jahr, monat, 1).getDay();
  const versatz = ersterTagWochentag === 0 ? 6 : ersterTagWochentag - 1;

  // Letzter Tag des Monats
  const letzterTag = new Date(jahr, monat + 1, 0).getDate();

  // Events für einen bestimmten Tag filtern und sortieren
  function eventsDesMonats(tag) {
    return events
      .filter((ev) => {
        const d = new Date(ev.startMS);
        return (
          d.getFullYear() === jahr &&
          d.getMonth() === monat &&
          d.getDate() === tag
        );
      })
      .sort((a, b) => a.startMS - b.startMS);
  }

  // Ist dieser Tag heute?
  function istHeute(tag) {
    return (
      tag === heute.getDate() &&
      monat === heute.getMonth() &&
      jahr === heute.getFullYear()
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header: Buttons + Monatsanzeige */}
      <div style={styles.header}>
        <button style={styles.loginBtn} onClick={handleLogin}>
          Kalender laden
        </button>
        <button style={styles.navBtn} onClick={vorheriger}>
          ← Zurück
        </button>
        <span style={styles.monatJahr}>
          {MONATE[monat]} {jahr}
        </span>
        <button style={styles.navBtn} onClick={naechster}>
          Weiter →
        </button>
      </div>

      {/* Statusmeldung */}
      {status && (
        <div
          style={{
            ...styles.status,
            color:
              statusTyp === "ok"
                ? "#166534"
                : statusTyp === "fehler"
                ? "#991b1b"
                : "#5f5e5a",
          }}
        >
          {status}
        </div>
      )}

      {/* Wochentag-Kopfzeile */}
      <div style={styles.wochentageGrid}>
        {WOCHENTAGE.map((t) => (
          <div key={t} style={styles.wochentag}>
            {t}
          </div>
        ))}
      </div>

      {/* Kalender-Grid */}
      <div style={styles.kalenderGrid}>
        {/* Leere Felder vor dem 1. des Monats */}
        {Array.from({ length: versatz }).map((_, i) => (
          <div key={`leer-${i}`} style={styles.tagLeer} />
        ))}

        {/* Tage des Monats */}
        {Array.from({ length: letzterTag }, (_, i) => i + 1).map((tag) => {
          const tagEvents = eventsDesMonats(tag);
          const heute = istHeute(tag);

          return (
            <div
              key={tag}
              style={{
                ...styles.tag,
                border: heute ? "1.5px solid #3b82f6" : "0.5px solid #e0dfd8",
              }}
            >
              {/* Tageszahl */}
              <div
                style={{
                  ...styles.tagNummer,
                  backgroundColor: heute ? "#dbeafe" : "#f1efe8",
                  color: heute ? "#1d4ed8" : "#1a1a18",
                }}
              >
                {tag}
              </div>

              {/* Events anzeigen (max. 3) */}
              {tagEvents.slice(0, 3).map((ev, idx) => (
                <div key={idx} style={styles.event} title={ev.title}>
                  {new Date(ev.startMS).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  {ev.title}
                </div>
              ))}

              {/* Hinweis wenn mehr als 3 Events */}
              {tagEvents.length > 3 && (
                <div style={styles.mehrHinweis}>
                  +{tagEvents.length - 3} weitere
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Styles (inline, kein CSS-File nötig für diese Komponente) ───────────────
const styles = {
  container: {
    padding: "1rem",
    fontFamily: "sans-serif",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.5rem",
    flexWrap: "wrap",
  },
  monatJahr: {
    fontSize: "1.5rem",
    fontWeight: 500,
  },
  navBtn: {
    background: "#fff",
    border: "0.5px solid #ccc",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "14px",
  },
  loginBtn: {
    background: "#dbeafe",
    border: "0.5px solid #93c5fd",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#1d4ed8",
    fontWeight: 500,
  },
  status: {
    fontSize: "13px",
    marginBottom: "0.5rem",
  },
  wochentageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    marginBottom: "4px",
  },
  wochentag: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: 500,
    color: "#5f5e5a",
    padding: "4px 0",
    backgroundColor: "#e9e8e0",
    borderRadius: "6px",
  },
  kalenderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
  },
  tagLeer: {
    minHeight: "90px",
  },
  tag: {
    minHeight: "90px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "6px",
    overflow: "hidden",
  },
  tagNummer: {
    fontSize: "13px",
    fontWeight: 500,
    textAlign: "center",
    borderRadius: "4px",
    padding: "2px 0",
    marginBottom: "4px",
  },
  event: {
    fontSize: "10px",
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
    borderRadius: "4px",
    padding: "2px 4px",
    marginBottom: "2px",
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  mehrHinweis: {
    fontSize: "10px",
    color: "#888",
  },
};
