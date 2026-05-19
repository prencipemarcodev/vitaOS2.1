### 🚀 Funzionalità che aggiungerei

#### 1. Sistema di Task/Todo integrato al calendario

Manca completamente un sistema di attività. Non un app to-do separata, ma task agganciati al calendario: task del giorno visibili nella DayDrawer, completamento con swipe, priorità, e collegamento a progetti di lavoro per il timetracking automatico.

#### 2. Gestore abbonamenti dedicato

Attualmente gli abbonamenti sono solo categorie di spesa. Manca una vista dedicata: lista di tutti gli abbonamenti attivi (Netflix, Spotify, palestra, cloud…), data di rinnovo, metodo di pagamento, totale mensile/annuale, alert 3 giorni prima del rinnovo. È una delle cose più utili nella vita quotidiana e quasi nessuna app lo fa bene.

#### 3. Tracker veicoli (da valutare e approfondire, bozza)

Costi carburante, revisioni, bollo, assicurazione, tagliandi. Con alert alle scadenze e calcolo costo/km. Integrazione con il calendario per le scadenze burocratiche.

#### 4. Pomodoro timer integrato nelle Firme

Un timer Pomodoro visibile durante la sessione di lavoro, con statistiche sui cicli completati per sessione. Aiuta enormemente la produttività e si integra naturalmente con il timetracking già presente.

#### 5. Documento vault

Archiviazione di documenti importanti (PDF, immagini di ricevute, contratti, documenti identità) con categorizzazione, scadenza e notifica. Usando Supabase Storage che è già disponibile nel tier gratuito. Soprattutto per ricevute spese: scattare foto e collegarle alla transazione corrispondente.

#### 6. Mood/energia tracker

Un check-in giornaliero da 10 secondi (scala 1-5 per umore, energia, stress). Con correlazione automatica rispetto alle finanze, agli allenamenti, alle ore di sonno. Rivela pattern interessanti nel tempo.

### 📐 Miglioramenti architetturali

**Offline-first con service worker:** essendo una PWA, dovrebbe funzionare offline con sincronizzazione al ritorno della connessione. Attualmente senza connessione mostra dati vuoti. Usando Workbox + IndexedDB si potrebbe fare in modo che ogni dato inserito offline si sincronizzi non appena torna internet.

**Zustand persist per i dati critici:** oltre al tema e al mese selezionato, almeno il `useWorkSessionStore` dovrebbe essere persistito in localStorage, così un refresh accidentale durante una sessione di lavoro non la fa sparire.

**Lazy loading più aggressivo:** attualmente le pagine sono già lazy-loaded, ma i componenti pesanti dentro ogni pagina (Recharts, Leaflet, React-Leaflet) vengono caricati tutti al primo render. Separare `RunTrackingScreen` e le mappe in chunk separati ridurrebbe significativamente il bundle iniziale.

### ⚡ Automazioni mancanti

#### Generazione automatica transazioni ricorrenti

Il codice le gestisce lato Finanze ma non esiste nessun meccanismo che le crei effettivamente. Servirebbe un hook al mount di Finanze che controlla se le transazioni periodiche del mese corrente esistono già, e le crea se no. Senza questo, il flag `is_periodic` è inutile.

#### Report mensile automatico

Il primo giorno del mese: generare e inviare per email un PDF riassuntivo con ore lavorate, entrate/uscite, progressi nei piani risparmio, obiettivi salute. Supabase Edge Functions + Resend sono la combinazione giusta e sono entrambi gratuiti nei tier bassi ovviamente l'indirizzo email è quello usato per la registrazione ma in impostazioni creiamo comunque una sezione dove magari si può indicare un indirizzo differente dove farsi arrivare i riepiloghi.

#### Alert budget in tempo reale

Quando viene inserita una transazione che porta una categoria all'80% del budget, triggerare una notifica push del browser (le Web Push API sono già supportate come PWA). Attualmente c'è solo un toast ma scompare dopo pochi secondi.

### 💡 Piccole cose ad alto impatto

Infine, alcune funzionalità piccole che nella vita quotidiana fanno grande differenza:

- **Widget home screen** (PWA Shortcuts) con link diretto a "Timbra entrata", "Nuova spesa", "Inizia corsa"
- **Export ore lavorate in PDF** — formattato come foglio presenze professionale, già pronto per essere allegato a fatture o mandato al commercialista
- **Contatore "giorni di ferie rimaste"** sempre visibile nell'header del Calendario, non solo nei dettagli
- **Grafico patrimonio netto** nel tempo — somma di conto + contanti + risparmi, visualizzata mese per mese. Vedere il proprio net worth crescere è la cosa più motivante che esiste per continuare a usare un'app di questo tipo

### Problemi logici:

- **useWorkSessionStore** non è persistito — un refresh della pagina durante una sessione attiva la perde silenziosamente
- **Le transazioni periodiche (is_periodic)** vengono lette da Finanze ma non c'è nessun worker/hook che le genera automaticamente ogni mese
- **Il SmartAdvicePanel** calcola il saldo sommando initial_bank_balance + income - expense del mese selezionato, non del saldo reale cumulativo — se il mese cambia, il saldo diventa errato
- **In TransactionModal.jsx** le categorie vengono deduplate client-side, ma il problema originale (duplicati nel DB) non è risolto alla radice

Valuta se necessario creare sezioni indipendenti per ogni tipo di funzionalità che stiamo per aggiungere, o se possibile integrarle in quelle già esistenti.
