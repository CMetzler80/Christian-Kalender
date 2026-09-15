# Umbau: Vanilla JS Kalender → React

Dieses Dokument beschreibt Schritt für Schritt, wie der bestehende
Kalender (HTML + Vanilla JS) in eine React-App umgebaut wurde.

---

## Ausgangslage – die Original-Dateien

| Datei | Aufgabe |
|---|---|
| `index.html` | Struktur der Seite, Buttons, Kalender-Grid |
| `calenderJS.js` | Kalender-Logik, Monat berechnen, Events anzeigen |
| `datenAbrufAPI.js` | Google OAuth Login, API-Abfrage, localStorage |
| `styleCalender.css` | Styling des Kalenders |

---

## Ziel – die neue React-Struktur

| Datei | Aufgabe |
|---|---|
| `KalenderApp.jsx` | Haupt-Komponente – enthält die gesamte Logik |
| `main.jsx` | Einstiegspunkt – startet die React-App |
| `index.html` | Minimale HTML-Hülle für Vite |
| `.env` | Speichert die Google Client-ID sicher (nicht in GitHub!) |
| `.env.example` | Vorlage für andere Entwickler ohne echte Daten |

---

## Schritt 1 – Projektstruktur verstehen

Bevor Code umgebaut wird, wird geklärt:

- Was macht jede Datei?
- Was hängt von was ab?
- Was muss React-spezifisch neu gedacht werden?

**Wichtig:** In Vanilla JS wird die Seite per `innerHTML` und
`document.createElement` direkt verändert. In React passiert das
durch **JSX** – der Code beschreibt, wie die Seite aussehen soll,
und React kümmert sich um die Aktualisierung.

---

## Schritt 2 – Zustand (`state`) identifizieren

In Vanilla JS stehen Werte einfach in Variablen:

```javascript
// Vanilla JS
let aktuellerMonat = aktuellesDatum.getMonth();
let aktuellesJahr  = aktuellesDatum.getFullYear();
```

In React werden Werte, die sich ändern können, mit `useState` verwaltet.
Wenn sich der State ändert, rendert React automatisch neu:

```javascript
// React
const [monat, setMonat] = useState(heute.getMonth());
const [jahr,  setJahr]  = useState(heute.getFullYear());
const [events, setEvents] = useState([]);
const [status, setStatus] = useState("");
```

---

## Schritt 3 – Seiteneffekte mit `useEffect`

In Vanilla JS wurde `ausgabeKalenderChris()` direkt beim Laden aufgerufen:

```javascript
// Vanilla JS – wird sofort beim Laden ausgeführt
ausgabeKalenderChris();
```

In React erledigt das `useEffect`. Es läuft einmal nach dem ersten Rendern
(leeres Array `[]` als zweites Argument bedeutet: nur einmal):

```javascript
// React
useEffect(() => {
  const raw = localStorage.getItem("Daten");
  if (raw) {
    const parsed = JSON.parse(raw);
    setEvents(parsed.map(e => ({ ... })));
  }
}, []); // [] = nur einmal beim Start
```

---

## Schritt 4 – Funktionen umbauen

### Navigation (vorheriger / nächster Monat)

```javascript
// Vanilla JS
nextMonthButton.addEventListener("click", () => {
  aktuellerMonat++;
  if (aktuellerMonat > 11) { aktuellerMonat = 0; aktuellesJahr++; }
  ausgabeMonat();
});
```

```javascript
// React – State-Setter statt direkter Variable
function naechster() {
  if (monat === 11) { setMonat(0); setJahr(j => j + 1); }
  else setMonat(m => m + 1);
}
```

React rendert den Kalender automatisch neu, wenn `monat` oder `jahr`
sich durch `setMonat` / `setJahr` ändern. Kein manuelles `ausgabeMonat()`
mehr nötig.

### Google Login & API-Abfrage

Die Logik aus `datenAbrufAPI.js` bleibt fast identisch – sie wird
einfach als normale `async`-Funktion in die Komponente eingebaut.
Der einzige Unterschied: statt `alert()` und globalen Variablen
werden React-States gesetzt:

```javascript
// Vanilla JS
alert(`${allEvents.length} Termine erfolgreich geladen!`);

// React
setStatus(`${alleTermine.length} Termine erfolgreich geladen`);
setStatusTyp("ok");
```

---

## Schritt 5 – JSX statt innerHTML

In Vanilla JS wird die HTML-Struktur per JavaScript zusammengebaut:

```javascript
// Vanilla JS
let dayDiv = document.createElement("div");
dayDiv.className = "calendarDayDiv";
calenderBody.appendChild(dayDiv);
```

In React wird die Struktur direkt als JSX beschrieben.
React übersetzt das intern in echte HTML-Elemente:

```jsx
// React – JSX
return (
  <div className="kalender-grid">
    {Array.from({ length: letzterTag }, (_, i) => i + 1).map(tag => (
      <div key={tag} className="tag">
        <div className="tag-nummer">{tag}</div>
      </div>
    ))}
  </div>
);
```

**Wichtig:** JSX braucht immer ein `key`-Attribut bei Listen, damit
React die Elemente eindeutig erkennen kann.

---

## Schritt 6 – Client-ID sicher speichern

Die Google OAuth Client-ID darf **nicht direkt im Code** stehen,
da sie sonst in GitHub sichtbar wäre.

### Lösung: Umgebungsvariable (`.env`)

```
VITE_GOOGLE_CLIENT_ID=deine-client-id-hier.apps.googleusercontent.com
```

Im React-Code wird sie so gelesen:

```javascript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

### `.gitignore` prüfen

Die `.env`-Datei muss in `.gitignore` eingetragen sein:

```
.env
```

So wird die echte Client-ID **niemals** in das GitHub-Repository
hochgeladen. Die `.env.example`-Datei dient als Vorlage ohne
echte Daten.

---

## Schritt 7 – CSS → Inline-Styles

Das bisherige `styleCalender.css` wurde in Inline-Styles innerhalb
der Komponente überführt. Das hält alles in einer Datei und macht
die Komponente eigenständig:

```javascript
// Styles als JavaScript-Objekt
const styles = {
  tag: {
    minHeight: "90px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "6px",
  },
};

// Verwendung in JSX
<div style={styles.tag}>...</div>
```

**Hinweis:** In JSX heißt `class` immer `className`, und
CSS-Eigenschaften werden in camelCase geschrieben
(z.B. `backgroundColor` statt `background-color`).

---

## Zusammenfassung: Was hat sich verändert?

| Konzept | Vanilla JS | React |
|---|---|---|
| Werte speichern | `let variable = ...` | `useState(...)` |
| Seite aktualisieren | `innerHTML`, `appendChild` | JSX, automatisches Re-Render |
| Beim Start ausführen | Funktion direkt aufrufen | `useEffect(() => {}, [])` |
| Event-Listener | `addEventListener` | `onClick`, `onChange` in JSX |
| Status anzeigen | `alert()` | State + bedingtes JSX |
| Secrets | direkt im Code | `.env` Datei + `.gitignore` |

---

## Projektstart (Vite + React)

```bash
# 1. Neues Vite-Projekt erstellen
npm create vite@latest kalender-app -- --template react

# 2. In den Ordner wechseln
cd kalender-app

# 3. Abhängigkeiten installieren
npm install

# 4. .env Datei anlegen und Client-ID eintragen
cp .env.example .env

# 5. Entwicklungsserver starten
npm run dev
```

---

*Erstellt im Zuge des Umbaus von Vanilla JS auf React – Christian Kalender Projekt 2025*
