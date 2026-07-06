# Specifiche Funzionali - VitaOS 2.1

Benvenuto nel documento di specifiche funzionali di **VitaOS 2.1**, un'applicazione web concepita come un "sistema operativo personale" per la gestione, la pianificazione e il monitoraggio di vari aspetti della vita quotidiana: dalle finanze al lavoro, dal benessere fisico alle manutenzioni dei propri veicoli, fino alle note personali e alla gestione degli impegni.

Il presente documento descrive esclusivamente le funzionalità dell'applicazione dal punto di vista dell'utente finale (UX e flussi funzionali), senza alcun riferimento a tecnologie, linguaggi di programmazione, database o dettagli di implementazione software.

---

## 1. Configurazione Iniziale (Onboarding)

Al primo accesso, l'utente viene guidato attraverso una procedura assistita a passi per configurare il proprio profilo e personalizzare l'esperienza d'uso. La configurazione comprende:

*   **Identità:** Inserimento delle informazioni di base dell'utente (nome e cognome).
*   **Reddito:** Configurazione dello stipendio mensile netto, delle mensilità aggiuntive (presenza e mese di erogazione di tredicesima e quattordicesima) e impostazione di una percentuale obiettivo di risparmio mensile (da un minimo del 5% a un massimo del 50%).
*   **Orari di Lavoro:** Definizione dei giorni lavorativi settimanali e dei relativi blocchi orari (ora di inizio e ora di fine turno).
*   **Studio & Palestra:** Pianificazione dei giorni e degli orari dedicati alle attività di studio e di allenamento fisico.
*   **Calendario & Ferie:** Inserimento del numero di ferie annuali spettanti e della data della festività del santo patrono (che viene registrata automaticamente come festività sul calendario).
*   **Saldo Iniziale:** Configurazione dei saldi di partenza per il conto bancario principale e per il portafoglio contanti.
*   **Primo Risparmio (Opzionale):** Creazione guidata del primo piano o salvadanaio di risparmio.
*   **Garage (Opzionale):** Inserimento del veicolo principale specificando marca, modello, anno, targa, colore della carrozzeria, chilometraggio iniziale e consumo medio stimato.
*   **Promemoria:** Attivazione dei promemoria automatici (sonno, idratazione, scadenze) e richiesta delle autorizzazioni per le notifiche.

---

## 2. Pannello di Controllo (Panoramica)

La schermata principale offre una visione d'insieme dello stato dell'utente tramite indicatori chiave (KPI) e anteprime grafiche interattive:

*   **Indicatori Chiave (KPI):**
    *   *Saldo Attuale:* Somma complessiva della liquidità disponibile.
    *   *Ore Lavorate:* Tempo totale registrato per il mese corrente.
    *   *Risparmio Attivo:* Stato di avanzamento del piano di risparmio impostato come principale.
    *   *Prossimo Evento:* Indicazione intelligente del primo impegno in agenda (sia eventi programmati a calendario che attività ricorrenti pianificate quali lavoro, studio o palestra).
*   **Azioni Rapide:** Pulsanti ad accesso rapido per registrare movimenti finanziari, timbrare l'inizio del lavoro, avviare una sessione di corsa, creare una nota veloce o aggiungere un evento a calendario.
*   **Anteprima Finanziaria:** Grafico dell'andamento del saldo netto mensile e del bilancio tra entrate ed uscite del mese.
*   **Anteprima Lavoro:** Riepilogo delle ore lavorate durante la settimana corrente rispetto all'orario lavorativo definito.
*   **Anteprime Benessere e Salute:** Indicatori rapidi sull'idratazione giornaliera, sulla durata del sonno e sul raggiungimento degli obiettivi di allenamento settimanali.

---

## 3. Gestione e Tracciamento del Lavoro (Firme / Timer)

Questa sezione consente all'utente di registrare le proprie sessioni di lavoro (clock-in / clock-out) e analizzare l'andamento del tempo impiegato:

*   **Modalità di Tracciamento:**
    *   *Timer Libero:* Avvio di un cronometro semplice che conta le ore lavorate.
    *   *Pomodoro:* Sessioni di lavoro focalizzato con intervalli predefiniti di attività (es. 25 minuti) alternati a pause brevi.
*   **Gestione delle Pause:** L'utente può mettere in pausa la sessione di lavoro o avviare una specifica "Pausa Pranzo", interrompendo temporaneamente il computo del tempo lavorativo.
*   **Sistema di Controllo Minimizzabile (Multitasking):**
    *   Se l'utente naviga in altre sezioni dell'applicazione mentre il lavoro è attivo, il timer si riduce a una *Linguetta Laterale Fluttuante* che mostra il tempo in corso con un indicatore di stato pulsante colorato.
    *   Cliccando sulla linguetta si apre la *Bolla di Controllo*: una mini-scheda che mostra il tempo preciso e tre pulsanti rapidi per mettere in pausa, avviare la pausa pranzo o terminare la sessione.
*   **Salvataggio e Note:** Alla conclusione di una sessione, l'utente può inserire note descrittive sul lavoro svolto prima di confermare il salvataggio.
*   **Statistiche e Storico:** Visualizzazione dei turni storici registrati, dei grafici delle ore giornaliere, del tempo totale accumulato, della media giornaliera e delle ore di straordinario maturate.

---

## 4. Gestione Finanziaria (Finanze)

Consente il monitoraggio completo dei flussi di denaro e la gestione dei budget di spesa:

*   **Registrazione Transazioni:** Inserimento di Entrate (stipendio, vendite, ecc.), Uscite (spese, bollette, ecc.) e Giroconti (trasferimento fondi tra i propri conti). Per ogni movimento è possibile specificare l'importo, la categoria, la descrizione, il metodo di pagamento/conto e la data.
*   **Gestione dei Conti di Pagamento:** Possibilità di visualizzare e filtrare le transazioni in base al conto associato (es. conto bancario principale, portafoglio contanti o conti personalizzati creati dall'utente).
*   **Monitoraggio dei Budget:** Impostazione di un limite massimo di spesa mensile per ciascuna categoria. Il sistema genera notifiche visive di avvertimento quando la spesa in una categoria raggiunge l'80% del budget ed emette un segnale di allerta bloccante al raggiungimento del 100% (sforamento).
*   **Distribuzione delle Spese:** Grafico a ciambella che illustra la ripartizione percentuale delle spese per categoria merceologica.
*   **Gestione degli Abbonamenti:** Registro delle spese ricorrenti (es. streaming, palestra, utenze). Per ciascun abbonamento si definisce il costo, la frequenza di pagamento (mensile, annuale, ecc.), la data del prossimo rinnovo e il metodo di pagamento. Gli abbonamenti in scadenza vengono evidenziati e integrati automaticamente nel calendario.

---

## 5. Piani di Risparmio ed Accumulo (Risparmi)

Aiuta l'utente a mettere da parte fondi per obiettivi specifici, integrando strumenti di consulenza finanziaria automatizzata:

*   **Tipologie di Piani:**
    *   *Salvadanaio Semplice (Piggy Bank):* Accumulo libero di denaro senza una scadenza o una cifra obiettivo definita.
    *   *Obiettivo di Risparmio (PAC - Piano di Accumulo Capitale):* Richiede l'indicazione di un importo obiettivo e di una data di scadenza. Calcola automaticamente la quota mensile ideale per raggiungere lo scopo.
*   **Tracciamento delle Performance:** Calcolo in tempo reale dell'andamento del risparmio rispetto alla traiettoria temporale lineare, indicando se il piano è "In linea", "Sotto Target" o ha una performance "Eccellente".
*   **Depositi e Prelievi:** Possibilità di spostare manualmente denaro all'interno del risparmio. Un deposito nel salvadanaio riduce automaticamente la liquidità del conto di origine e registra una transazione di spesa dedicata.
*   **Consigliere Finanziario (Smart Advice):**
    *   *Valutazione della Salute della Liquidità:* Analizza il saldo disponibile rispetto a una soglia di sicurezza calcolata in base al reddito mensile, classificando lo stato in "Sicura", "Attenzione" o "Critica".
    *   *Allocazione Consigliata:* Suggerisce all'utente come distribuire un'eventuale eccedenza di denaro sui vari piani di risparmio attivi, in base alla priorità e alla distanza dall'obiettivo.
    *   *Applicazione in un Clic:* L'utente può accettare il consiglio con un solo tocco; il sistema eseguirà automaticamente i depositi distribuiti su tutti i piani interessati e aggiornerà i relativi conti.

---

## 6. Salute e Benessere (Salute)

Un'area dedicata al tracciamento dell'attività fisica e del benessere biologico:

*   **Tracciamento Corsa GPS:**
    *   *Registrazione della Sessione:* Avvia la registrazione di una sessione di corsa utilizzando la localizzazione geografica del dispositivo.
    *   *Dati in Tempo Reale:* Calcola e mostra la durata, la distanza percorsa in chilometri, il passo attuale (min/km), la velocità (km/h), la stima delle calorie bruciate e il dislivello altimetrico (guadagno/perdita di quota).
    *   *Tabelle dei Tempi Intermedi (Splits):* Mostra il tempo impiegato per completare ciascun singolo chilometro della sessione.
    *   *Mappa del Percorso:* Disegna visivamente la traccia del percorso effettuato su una mappa stradale interattiva.
    *   *Modalità Focus:* Interfaccia semplificata ad altissima visibilità con caratteri giganti per una lettura agevole durante la corsa.
    *   *Resoconto Finale:* Riepilogo complessivo salvato nello storico con grafici dedicati all'andamento del passo e del profilo altimetrico.
*   **Registro del Benessere (Wellness Tracker):**
    *   *Sonno:* Registrazione giornaliera dell'orario in cui ci si corica e dell'orario della sveglia. Calcola le ore di sonno effettive e assegna un giudizio qualitativo (Ottimo, Buono, Sufficiente, Insufficiente) con un grafico a barre dello storico settimanale.
    *   *Idratazione:* Monitoraggio dei liquidi assunti durante il giorno con l'obiettivo preimpostato di 2 litri. L'utente registra l'acqua bevuta a incrementi rapidi di 250 ml (pari a un bicchiere) tramite un'interfaccia a griglia interattiva.
    *   *Peso Corporeo:* Tracciamento del peso in kg con calcolo del trend di incremento o decremento rispetto alle registrazioni precedenti e relativo grafico di andamento.
*   **Schede Palestra:** Visualizzazione e consultazione delle schede di allenamento programmate con i dettagli sulla frequenza settimanale.

---

## 7. Calendario Personale (Calendario)

Un'agenda visiva per coordinare impegni lavorativi, personali e scadenze finanziarie:

*   **Visualizzazione Mensile:** Griglia del mese corrente che mostra in modo integrato:
    *   Eventi personali e appuntamenti di vario genere (lavoro, studio, personale, medico, ecc.).
    *   Registrazioni di assenze pianificate (giorni di ferie o di malattia).
    *   Date di scadenza degli abbonamenti ricorrenti attivi.
*   **Dettaglio Giornaliero (Cassetto):** Cliccando su un giorno del calendario si apre un pannello laterale che elenca cronologicamente tutti gli elementi previsti per quella data.
*   **Gestione Ferie:** Mostra nel titolo del calendario il saldo delle ferie annuali residue calcolato sottraendo i giorni di ferie già utilizzati da quelli totali disponibili.
*   **Eventi Ricorrenti Annuali:** Sezione dedicata alla configurazione di ricorrenze quali compleanni, festività fisse o scadenze annuali, con opzione di impostare una notifica di avviso da 1 a più giorni prima dell'evento.

---

## 8. Note Personali (Note)

Una lavagna virtuale per appunti rapidi organizzata in stile post-it:

*   **Layout Adattivo:** Le note vengono disposte su una griglia multi-colonna fluida in cui l'altezza del cartoncino si adegua automaticamente alla lunghezza del testo inserito.
*   **Colori Personalizzati:** Ogni nota può avere una colorazione di sfondo specifica scelta dall'utente (giallo, azzurro, verde, rosa, ecc.) per facilitare la catalogazione visiva.
*   **In Evidenza (Pinning):** L'utente può "spillare" le note più importanti per posizionarle in una sezione privilegiata posta in cima alla schermata.
*   **Ricerca in Tempo Reale:** Campo di ricerca che filtra istantaneamente le note in base a corrispondenze del testo nel titolo o nel contenuto.

---

## 9. Garage e Gestione Veicoli (Veicolo)

Una sezione per la gestione completa dei costi e dello stato di manutenzione di uno o più veicoli:

*   **Cruscotto Interattivo:** Rappresentazione grafica tridimensionale stilizzata del tipo di veicolo (berlina, utilitaria, station wagon, SUV, fuoristrada, auto elettrica) nel colore configurato.
*   **Punti Caldi Informativi (Hotspot Pins):** Sul modello del veicolo sono posizionati dei pin interattivi pulsanti che, in base al colore (Verde/Giallo/Rosso), segnalano lo stato delle scadenze e delle manutenzioni:
    *   *Cofano motore:* Stato del cambio dell'olio e dei chilometri mancanti al prossimo tagliando.
    *   *Bocchetta serbatoio:* Dati sull'ultimo rifornimento eseguito e sul consumo medio.
    *   *Targa:* Stato di pagamento e validità di bollo e assicurazione.
    *   *Cruscotto:* Lettura del contachilometri totale aggiornato.
*   **Registro Spese e Interventi:** Possibilità di registrare eventi di tre tipi:
    *   *Rifornimento:* Inserimento di litri erogati, prezzo al litro, costo totale e chilometraggio attuale. Ricalcola automaticamente i consumi medi reali (l/100km) e i costi d'uso per chilometro.
    *   *Manutenzione:* Registrazione di interventi ordinari e straordinari (es. cambio pneumatici, pastiglie freni, filtri, candele) con impostazione dell'intervallo chilometrico di validità.
    *   *Scadenza:* Inserimento di scadenze temporali per documenti (patente, revisione) o tasse (bollo, assicurazione) con inserimento della data di scadenza.
*   **Manutenzione Preventiva:** Visualizzazione di barre di avanzamento grafiche che indicano la percentuale di usura o la vicinanza alla scadenza di ciascun componente monitorato (es. olio motore a metà ciclo, pneumatici da sostituire a breve, ecc.).

---

## 10. Impostazioni

Consente di calibrare e gestire tutte le preferenze di sistema dell'utente:

*   **Aspetto:** Selezione del tema dell'applicazione tra modalità Chiara (Light) e Scura (Dark).
*   **Lavoro:** Configurazione dell'orario lavorativo settimanale e attivazione dei controlli di sicurezza sulle sessioni prolungate (notifiche automatiche in caso di timer dimenticati attivi).
*   **Reddito:** Modifica dello stipendio mensile netto, delle mensilità aggiuntive (13a e 14a) e dell'obiettivo percentuale di risparmio.
*   **Finanze:** Creazione, modifica o eliminazione delle categorie di spesa (personalizzando nome, icona, colore e natura periodica con importo e giorno del mese) e gestione dei dettagli dei conti correnti e del denaro contante.
*   **Veicolo:** Gestione del garage, aggiunta di nuovi veicoli ed eliminazione di quelli esistenti.
*   **Calendario:** Modifica della festività patronale, impostazione dei giorni di ferie totali annuali e tracciamento manuale dei giorni di malattia. Gestione dell'archivio delle ricorrenze annuali.
*   **Salute:** Definizione degli obiettivi di allenamento (numero di sessioni settimanali) e di corsa (chilometri mensili), impostazione del peso attuale e configurazione della precisione del tracciamento GPS (Balanced, High, Maximum) con opzioni avanzate di risparmio energetico e sensibilità al rumore del segnale (jitter).
*   **Notifiche:** Regolazione fine dell'attivazione e degli orari dei promemoria quotidiani (per bere acqua, andare a dormire o ricordare eventi in calendario) e abilitazione del suono delle notifiche.
*   **Backup e Reset:**
    *   *Esportazione dati:* Consente di scaricare sul proprio dispositivo un file di backup contenente tutti i dati inseriti nell'applicazione, con la possibilità di selezionare quali categorie di informazioni includere nel file.
    *   *Reset onboarding:* Riavvia la procedura guidata iniziale mantenendo intatti tutti i dati storici inseriti.
    *   *Cancellazione account:* Rimuove in modo permanente tutte le informazioni dell'utente memorizzate nell'applicazione.

---

## 11. Pannello Amministratore (Admin Dashboard)

Schermata protetta riservata all'amministratore generale del sistema che consente di:

*   Visualizzare le statistiche generali dell'applicazione, come il numero di utenti attivi registrati e lo spazio di archiviazione utilizzato dal database.
*   Consultare il registro storico delle operazioni amministrative e degli eventi critici di sistema.
*   Cercare gli utenti iscritti al servizio per visualizzare la data di registrazione del profilo.
*   Eseguire interventi di ripristino o reset totale dei dati relativi a un singolo account utente in caso di necessità.
