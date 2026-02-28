
let tokenClient;
let accessToken;

//Diese Funktion wird durch 'onload' oben aufgerufen
function initClient() {
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: '765365530022-i3e8sifcnpht37gtb8imhmhur1j1tjsn.apps.googleusercontent.com',
            scope: 'https://www.googleapis.com/auth/calendar.readonly',
            callback: (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                    accessToken = tokenResponse.access_token;
                    console.log("Token erfolgreich generiert:", accessToken);
                    //fetch-Funktion aufrufen
                    getCalendarData();
                }
            },
        });
        console.log("Google Client initialisiert.");
    } catch (err) {
        console.error("Fehler bei der Initialisierung:", err);
    }
}

// Funktion zum Starten des Login-Popups

function handleAuthClick() {
    // Fordert den Access Token an
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

// Fetch-Abfrage
async function getCalendarData() {
    
    let allEvents = [];
    let nextPageToken = null;

    
    const calendarId = 'primary';
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?singleEvents=true`;
   
    try {
        do {
            // URL zusammenbauen
            const url = nextPageToken ? `${baseUrl}&pageToken=${nextPageToken}` : baseUrl;

            const response = await fetch(url, {
                method: 'GET', // Explizit GET (optional, aber sauber)
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Fehler ${response.status}: ${errorData.error.message}`);
            }

            const data = await response.json();

            if (data.items) {
               allEvents = allEvents.concat(data.items.map(event => ({
                    title: event.summary || "Kein Titel",
                    start: event.start.dateTime || event.start.date,
                    end: event.end.dateTime || event.end.date
                })));
            }

            nextPageToken = data.nextPageToken;

        } while (nextPageToken);

        console.log("Alle Kalender-Events geladen:", allEvents);

        //löchen vom alten localStorage
        localStorage.removeItem('Daten');
        localStorage.setItem('Daten', JSON.stringify(allEvents));
        alert(`${allEvents.length} Termine erfolgreich geladen!`);
        

    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        alert("Fehler beim Laden der Daten. Details in der Konsole.");
    }
}



