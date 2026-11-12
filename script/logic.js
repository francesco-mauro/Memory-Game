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

if (typeof module !== 'undefined') {
    module.exports = { createDeck, shuffle, isBetterRecord };
}
