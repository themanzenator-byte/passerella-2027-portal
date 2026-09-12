# PASSERELLA 2027 — Portale v4

Questa versione usa il Google Sheet `Piano_studio_portale` come sorgente dati dinamica.

Schede usate:
- `Piano`: programma giornaliero.
- `PORTALE_FILES`: indice dei documenti presenti su Google Drive.
- `PORTALE_LINKS`: video, NotebookLM, YouTube e altri link esterni.

## Aggiornamenti ordinari
Quando vengono aggiunti/rinominati/spostati materiali in Google Drive, non è necessario modificare il codice del sito. Basta aggiornare `PORTALE_FILES` (operazione che può essere fatta da ChatGPT tramite il connettore Google Drive).

Quando vengono aggiunti video/link, basta aggiungere una riga a `PORTALE_LINKS`.

Un nuovo deployment Vercel serve solo quando si modifica il codice, il layout o le funzioni del portale.

## Automazione deploy
Il repository è collegato a Vercel: i commit su `main` vengono usati per aggiornare automaticamente il portale.
