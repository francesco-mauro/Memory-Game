// Test della logica del gioco. Si lanciano dalla cartella del progetto con: node --test
const test = require('node:test');
const assert = require('node:assert');
const { createDeck, shuffle, isBetterRecord, parseRecord, FIGURES, recordNote, LEVELS, parseLevel, elapsedSeconds } = require('../script/logic.js');

test('i livelli: 6, 10 e 15 coppie, ognuno con il suo record', () => {
    assert.deepStrictEqual(Object.keys(LEVELS), ['facile', 'normale', 'difficile']);
    assert.deepStrictEqual(Object.values(LEVELS).map(l => l.pairs), [6, 10, 15]);
    assert.strictEqual(new Set(Object.values(LEVELS).map(l => l.recordKey)).size, 3);
    // chi aveva già un record lo ritrova a Normale
    assert.strictEqual(LEVELS.normale.recordKey, 'memory-game-record');
});

test('ci sono abbastanza figure per il livello più grande', () => {
    const most = Math.max(...Object.values(LEVELS).map(l => l.pairs));
    assert.ok(FIGURES.length >= most);
});

test('un livello salvato sconosciuto vale Normale', () => {
    assert.strictEqual(parseLevel('facile'), 'facile');
    assert.strictEqual(parseLevel('difficile'), 'difficile');
    assert.strictEqual(parseLevel(null), 'normale');
    assert.strictEqual(parseLevel('toString'), 'normale');
    assert.strictEqual(parseLevel('impossibile'), 'normale');
});

test('i secondi vengono dall\'orologio: interi, mai negativi', () => {
    assert.strictEqual(elapsedSeconds(1000, 1000), 0);
    assert.strictEqual(elapsedSeconds(1000, 1999), 0);
    assert.strictEqual(elapsedSeconds(1000, 2000), 1);
    // una scheda rimasta nascosta per 5 minuti: il tempo è quello vero
    assert.strictEqual(elapsedSeconds(0, 300500), 300);
    assert.strictEqual(elapsedSeconds(2000, 1000), 0);
});

test('il mazzo ha ogni numero due volte', () => {
    const deck = createDeck(10);
    assert.strictEqual(deck.length, 20);
    for (let n = 1; n <= 10; n++) {
        assert.strictEqual(deck.filter(v => v === n).length, 2);
    }
});

test('mescolare non perde e non aggiunge carte', () => {
    const deck = createDeck(10);
    const shuffled = shuffle([...deck]);
    assert.deepStrictEqual([...shuffled].sort((a, b) => a - b), [...deck].sort((a, b) => a - b));
});

test('il mescolamento è uniforme: ogni carta finisce in prima posizione circa il 5% delle volte', () => {
    const runs = 100000;
    const size = 20;
    const firstPlace = new Array(size).fill(0);
    for (let i = 0; i < runs; i++) {
        const arr = Array.from({ length: size }, (_, k) => k);
        shuffle(arr);
        firstPlace[arr[0]]++;
    }
    // Con il vecchio sort(() => 0.5 - Math.random()) la carta 0 restava prima circa l'11,7% delle volte.
    for (const count of firstPlace) {
        const share = count / runs;
        assert.ok(share > 0.044 && share < 0.056, `quota fuori scala: ${(share * 100).toFixed(2)}%`);
    }
});

test('il record: vince chi fa meno mosse, a parità di mosse meno tempo', () => {
    assert.strictEqual(isBetterRecord({ moves: 12, seconds: 40 }, null), true);
    assert.strictEqual(isBetterRecord({ moves: 12, seconds: 40 }, { moves: 14, seconds: 20 }), true);
    assert.strictEqual(isBetterRecord({ moves: 14, seconds: 20 }, { moves: 12, seconds: 40 }), false);
    assert.strictEqual(isBetterRecord({ moves: 12, seconds: 30 }, { moves: 12, seconds: 40 }), true);
    assert.strictEqual(isBetterRecord({ moves: 12, seconds: 40 }, { moves: 12, seconds: 40 }), false);
});

test('un record salvato rotto non conta, uno valido sì', () => {
    assert.deepStrictEqual(parseRecord('{"moves":12,"seconds":40}'), { moves: 12, seconds: 40 });
    assert.strictEqual(parseRecord(null), null);
    assert.strictEqual(parseRecord('{}'), null);
    assert.strictEqual(parseRecord('5'), null);
    assert.strictEqual(parseRecord('{"moves":"12","seconds":40}'), null);
    assert.strictEqual(parseRecord('non è json'), null);
});

test('le figure sono 15, con nomi diversi e un disegno ciascuno', () => {
    assert.strictEqual(FIGURES.length, 15);
    assert.strictEqual(new Set(FIGURES.map(f => f.name)).size, 15);
    for (const f of FIGURES) {
        assert.match(f.path, /^M/);
        assert.ok(f.stroke >= 3 && f.stroke <= 5);
        assert.ok(f.tone === 'a' || f.tone === 'b');
    }
});

test('il messaggio sotto il risultato dice com\'è andata col record', () => {
    assert.strictEqual(recordNote({ moves: 21, seconds: 58 }, { moves: 24, seconds: 70 }), 'Il record precedente era 24 mosse.');
    assert.strictEqual(recordNote({ moves: 27, seconds: 64 }, { moves: 18, seconds: 50 }), 'Il tuo record resta 18 mosse.');
    assert.strictEqual(recordNote({ moves: 12, seconds: 40 }, null), 'È la tua prima partita: questo è il record da battere.');
    assert.strictEqual(recordNote({ moves: 18, seconds: 40 }, { moves: 18, seconds: 50 }), 'Il record precedente era 18 mosse in 50 secondi.');
});
