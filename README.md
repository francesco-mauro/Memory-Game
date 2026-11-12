# Gioco del Memory

**Prova la demo:** https://francesco-mauro.github.io/Memory-Game/

Il classico Memory in JavaScript, senza librerie. L'obiettivo è trovare tutte le coppie di carte uguali nel minor tempo e con meno mosse possibile. Fatto a ottobre 2024, ripreso a novembre 2026.

## Cosa fa

- **Tabellone dinamico:** le carte vengono mescolate e create da JavaScript a ogni partita.
- **Timer:** parte al primo clic e conta i secondi.
- **Contatore delle mosse.**
- **Messaggio di vittoria** con tempo impiegato e mosse fatte.
- **Record:** la partita migliore (meno mosse, a parità di mosse meno tempo) resta salvata nel browser.
- **Ricomincia:** sempre a portata di mano, anche a metà partita.
- **Si gioca anche con la tastiera:** Tab e frecce per spostarsi tra le carte, Invio o spazio per girarle.

## Migliorie del 2026

- Il mescolamento ora è quello di Fisher-Yates. Prima usavo `sort(() => 0.5 - Math.random())`, che non è uniforme: in una prova su 200.000 mescolamenti la prima carta restava al primo posto circa l'11,7% delle volte invece del 5%.
- La pagina si adatta al telefono: quattro carte per riga fino a 480 pixel di larghezza.
- Le carte sono pulsanti, quindi si raggiungono con la tastiera, e un lettore di schermo annuncia le carte girate, le coppie trovate e la vittoria.
- Ricomincia a metà partita annulla anche il timer e le carte che stanno per rigirarsi.
- Chi ha chiesto meno animazioni al sistema vede le carte girarsi senza la rotazione.

## La grafica del 2026

Lo stile si chiama Notturno: tela scura, carte avorio che si sollevano quando le giri, dieci figure disegnate a tratto al posto dei numeri. Una coppia trovata passa in negativo, con un bordo lime che si disegna attorno alla carta e un bollino con la spunta. Una coppia sbagliata si riconosce dal contorno corallo e da una piccola scossa, poi le carte si richiudono; se clicchi un'altra carta nel frattempo, si chiudono subito. A fine partita un'onda attraversa il tabellone e i numeri contano fino al risultato.

- I colori sono variabili CSS: il tema scuro è quello predefinito, chi usa il tema chiaro ne ha una versione propria.
- Le animazioni muovono solo `transform` e `opacity`, più il colore della faccia. Con il movimento ridotto restano solo dissolvenze brevi.
- Una carta girata e una carta trovata si distinguono anche in bianco e nero, non solo dal colore.

## Strumenti

HTML, CSS, JavaScript. Test con il test runner di Node. Caratteri Unbounded e Manrope da Google Fonts, licenza SIL Open Font License.

Claude Design per la grafica, Claude Code come assistente per le migliorie del 2026 e per questo README.

## Come provarlo

Scarica il repository e apri `index.html` nel browser.

```bash
git clone https://github.com/francesco-mauro/Memory-Game.git
```

I test della logica (serve Node 20 o più recente):

```bash
node --test
```

## Com'è fatto

- `index.html`: la pagina, con contatori, record e messaggio di vittoria.
- `script/logic.js`: la logica pura, cioè mazzo, mescolamento, record e le dieci figure. La usano sia la pagina sia i test.
- `script/script.js`: gestione dei clic e della tastiera, confronto delle coppie, animazioni di fine partita, timer, record e riavvio.
- `style/style.css`: lo stile Notturno, con il tema chiaro, la griglia per il telefono e il movimento ridotto.
- `tests/logic.test.js`: i test di `logic.js`.
