// Logica pura del gioco, senza pagina: la usano script.js nel browser e i test in Node.

// Il mazzo: ogni numero da 1 a pairs compare due volte.
function createDeck(pairs) {
    const numbers = Array.from({ length: pairs }, (_, i) => i + 1);
    return numbers.concat(numbers);
}

// Mescolamento di Fisher-Yates: ogni ordine delle carte ha la stessa probabilità.
// Prima c'era array.sort(() => 0.5 - Math.random()), che lascia le carte vicino a dove erano.
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Il record migliore: meno mosse; a parità di mosse, meno secondi.
function isBetterRecord(result, record) {
    if (!record) return true;
    if (result.moves !== record.moves) return result.moves < record.moves;
    return result.seconds < record.seconds;
}

// Il record letto dal browser: vale solo se ha mosse e secondi numerici, altrimenti è come non averlo.
function parseRecord(text) {
    try {
        const record = JSON.parse(text);
        if (record && Number.isFinite(record.moves) && Number.isFinite(record.seconds)) {
            return { moves: record.moves, seconds: record.seconds };
        }
    } catch {
        // testo non valido
    }
    return null;
}

// La frase sotto il risultato di fine partita. Se le mosse sono pari, conta il tempo e lo diciamo.
function recordNote(result, previous) {
    if (!previous) return 'È la tua prima partita: questo è il record da battere.';
    const sameMoves = result.moves === previous.moves;
    const old = sameMoves ? `${previous.moves} mosse in ${previous.seconds} secondi` : `${previous.moves} mosse`;
    return isBetterRecord(result, previous) ? `Il record precedente era ${old}.` : `Il tuo record resta ${old}.`;
}

// I livelli: quante coppie, e come si chiama il risultato nel messaggio di fine partita.
// Normale tiene la chiave del record di prima, così chi aveva già un record non lo perde.
const LEVELS = {
    facile: { pairs: 6, title: 'Dodici carte, sei coppie. Fatto.', recordKey: 'memory-game-record-facile' },
    normale: { pairs: 10, title: 'Venti carte, dieci coppie. Fatto.', recordKey: 'memory-game-record' },
    difficile: { pairs: 15, title: 'Trenta carte, quindici coppie. Fatto.', recordKey: 'memory-game-record-difficile' },
};

// Il livello salvato vale solo se esiste; altrimenti si gioca a Normale.
function parseLevel(text) {
    return Object.prototype.hasOwnProperty.call(LEVELS, text) ? text : 'normale';
}

// I secondi di gioco contati dall'orologio, non dai battiti del timer:
// se la scheda resta nascosta il browser rallenta i timer, l'orologio no.
function elapsedSeconds(startMs, nowMs) {
    return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

// Le 15 figure delle carte: tracciati SVG su un riquadro 48×48, disegnati a tratto.
// tone 'a' = inchiostro, 'b' = corallo; stroke = spessore del tratto; rotate = gradi attorno al centro.
const FIGURES = [
    { name: 'cerchio', tone: 'b', stroke: 4, path: 'M9 24a15 15 0 1 0 30 0a15 15 0 1 0 -30 0' },
    { name: 'triangolo', tone: 'a', stroke: 4, path: 'M24 8 40 37H8Z' },
    { name: 'rombo', tone: 'b', stroke: 4, path: 'M24 6 42 24 24 42 6 24Z' },
    { name: 'croce', tone: 'a', stroke: 5, path: 'M24 8v32M8 24h32' },
    { name: 'arco', tone: 'b', stroke: 4, path: 'M6 33a18 18 0 0 1 36 0Z' },
    { name: 'stella', tone: 'a', stroke: 3.5, path: 'M24 5C25.5 17.5 30.5 22.5 43 24 30.5 25.5 25.5 30.5 24 43 22.5 30.5 17.5 25.5 5 24 17.5 22.5 22.5 17.5 24 5Z' },
    { name: 'onde', tone: 'b', stroke: 4, path: 'M6 18c4-6 8-6 12 0s8 6 12 0 8-6 12 0M6 31c4-6 8-6 12 0s8 6 12 0 8-6 12 0' },
    { name: 'tre punti', tone: 'a', stroke: 3.5, path: 'M7 36a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M19 24a5 5 0 1 0 10 0a5 5 0 1 0 -10 0M31 12a5 5 0 1 0 10 0a5 5 0 1 0 -10 0' },
    { name: 'zigzag', tone: 'b', stroke: 4, path: 'M5 31 14 17 24 31 34 17 43 31' },
    { name: 'foglia', tone: 'a', stroke: 4, rotate: 45, path: 'M24 6C35 15.5 35 32.5 24 42 13 32.5 13 15.5 24 6Z' },
    // le cinque del livello Difficile
    { name: 'quadrato', tone: 'b', stroke: 4, path: 'M11 11h26v26H11Z' },
    { name: 'luna', tone: 'a', stroke: 4, path: 'M30 7a17 17 0 1 0 11 29A14 14 0 0 1 30 7Z' },
    { name: 'esagono', tone: 'b', stroke: 4, path: 'M24 7 38.7 15.5V32.5L24 41 9.3 32.5V15.5Z' },
    { name: 'cuore', tone: 'a', stroke: 4, path: 'M24 40C10 30 6 22 6 16a9 9 0 0 1 18-2 9 9 0 0 1 18 2c0 6-4 14-18 24Z' },
    { name: 'freccia', tone: 'b', stroke: 4.5, path: 'M8 24h30M27 13l11 11-11 11' },
];

if (typeof module !== 'undefined') {
    module.exports = { createDeck, shuffle, isBetterRecord, parseRecord, recordNote, FIGURES, LEVELS, parseLevel, elapsedSeconds };
}
