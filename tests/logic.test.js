// Test della logica del gioco. Si lanciano dalla cartella del progetto con: node --test
const test = require('node:test');
const assert = require('node:assert');
const { createDeck, shuffle, isBetterRecord, parseRecord } = require('../script/logic.js');

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
