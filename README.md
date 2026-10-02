# Gioco del Memory

Il classico Memory in JavaScript, senza librerie. L'obiettivo è trovare tutte le coppie di carte uguali nel minor tempo e con meno mosse possibile. Fatto a ottobre 2024.

## Cosa fa

- **Tabellone dinamico:** le carte vengono mescolate e create da JavaScript a ogni partita.
- **Timer:** parte al primo clic e conta i secondi.
- **Contatore delle mosse.**
- **Messaggio di vittoria** con tempo impiegato e mosse fatte.
- **Ricomincia:** azzera tutto e rimescola le carte.

## Strumenti

HTML, CSS, JavaScript.

## Come provarlo

Scarica il repository e apri `index.html` nel browser.

```bash
git clone https://github.com/francesco-mauro/Memory-Game.git
```

## Com'è fatto

- `index.html`: la pagina, con contatori e messaggio di vittoria.
- `script/script.js`: mescolamento, gestione dei clic, confronto delle coppie, timer e riavvio.
- `style/style.css`: lo stile del tabellone e delle carte.
