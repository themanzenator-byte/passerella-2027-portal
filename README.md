# PASSERELLA 2027 — Portale v5

Questa versione usa il Google Sheet `Piano_studio_portale` come sorgente dati dinamica.

Schede usate:
- `Piano`: programma giornaliero.
- `PORTALE_FILES`: indice dei documenti presenti su Google Drive.
- `PORTALE_LINKS`: video, NotebookLM, YouTube e altri link esterni.

## Layout v5
- colore dedicato per ciascuna materia;
- icona identificativa nella Home e nelle pagine materia;
- pagine materia con intestazione cromatica coordinata;
- materiali organizzati in tabella compatta per ridurre lo scrolling.

## Aggiornamenti ordinari
Quando vengono aggiunti o rinominati materiali in Google Drive, non è necessario modificare il codice del sito: basta mantenere aggiornato `PORTALE_FILES`.

Quando vengono aggiunti video o link, basta aggiornare `PORTALE_LINKS`.

## Automazione deploy
Il repository è collegato a Vercel: i commit su `main` aggiornano automaticamente il portale.
