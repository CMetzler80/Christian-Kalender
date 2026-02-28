



let chrisDataArray = [];

const monatsNamen = ["Januar", "Februar", 'März', 'April', 'Mai', 'Juni', 'Juli',
     'August', 'September', 'Oktober', 'November', 'Dezember'];


//aktuelles Datum 
const aktuellesDatum = new Date();
let aktuellerMonat = aktuellesDatum.getMonth();
let aktuellesJahr = aktuellesDatum.getFullYear();

function ausgabeKalenderChris() {

     //Aufruf vom localStorage
     const chrisDataString = localStorage.getItem('Daten')

     //Umwandlung als Objekt
     const chrisDataObjekt = JSON.parse(chrisDataString)
     console.log('daten aus local Storage als Objekt: ', chrisDataObjekt);

     //Speicherung der benötigten Daten aus dem local Storage in ein Array
     chrisDataArray = chrisDataObjekt.map(event => ({
          startMS: new Date(event.start).getTime(),
          endMS: new Date(event.end).getTime(),
          start: event.start,
          end: event.end,
          title: event.title,
     }));

     console.log('erforderliche Daten im Array: ', chrisDataArray);

}

ausgabeKalenderChris()




function ausgabeMonat() {

     //aktuelles Jahr und Monat schreiben
     let jahrAkt = document.getElementById('jahrAktuell')
     jahrAkt.innerHTML = aktuellesJahr;
    
     let monatAkt = document.getElementById('monatAktuell');
     monatAkt.innerHTML = monatsNamen[aktuellerMonat];

     let letzterTagMonat = new Date(aktuellesJahr, aktuellerMonat + 1, 0).getDate();
    
     //Start Wochentag (0=Montag)
     let ersterTag = new Date(aktuellesJahr, aktuellerMonat, 1).getDay();
     ersterTag = ersterTag === 0 ? 6 : ersterTag - 1;
     
     //Calender Reset
     let calenderBody = document.getElementById('calenderBody');
     calenderBody.innerHTML = '';

     //leere Felder erstellen vor dem ersten
     for (let i = 0; i < ersterTag; i++) {
          const divLeer = document.createElement('div');
          divLeer.className = 'calenderDayDivLeer';
          calenderBody.appendChild(divLeer);
          
     }

     //restliche Felder erstellen
     for (let i = 1; i <= letzterTagMonat; i++) {

          let dayDiv = document.createElement('div');
          dayDiv.className = 'calendarDayDiv';
          calenderBody.appendChild(dayDiv);
         
          //Click event für Tagesansicht
          dayDiv.addEventListener('click', () => {dayDiv.classList.toggle('expanded')
               });
          



          let dayNumber = document.createElement('div');
          dayNumber.textContent = i;
          dayNumber.className = 'dayNumber';
          dayDiv.appendChild(dayNumber);

          //filtern der Events für diesen Tag
          const todayEvents = chrisDataArray
               .filter(event => {
                    const eventDate = new Date(event.startMS);

                    return (
                         eventDate.getFullYear() === aktuellesJahr &&
                         eventDate.getMonth() === aktuellerMonat &&
                         eventDate.getDate() === i
                    );
               })
               .sort((a, b) => a.startMS - b.startMS);


          //Events anzeigen     
          todayEvents.forEach(event => {
               const eventDateStart = new Date(event.startMS);
               const eventDateEnd = new Date(event.endMS);
               let datenDiv = document.createElement('div');
               datenDiv.className = 'eventDiv';

               datenDiv.innerHTML = `
                    <strong>${event.title}</strong><br>
                    ${eventDateStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}-<br>
                    ${eventDateEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
               `;

               dayDiv.appendChild(datenDiv);
          })
     }
}

ausgabeMonat();


//Next Month Button
const nextMonthButton = document.getElementById('nextMonth');
nextMonthButton.addEventListener('click', () => {
     aktuellerMonat++

     if (aktuellerMonat > 11) {
          aktuellerMonat = 0
          aktuellesJahr++;
     }
     ausgabeMonat();
})

//prev Month Button
const prevMonthButton = document.getElementById('prevMonth');
prevMonthButton.addEventListener('click', () => {
     aktuellerMonat--

     if (aktuellerMonat < 0) {
          aktuellerMonat = 11
          aktuellesJahr--;
     }
     ausgabeMonat();
})


 








