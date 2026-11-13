// Il gioco nella pagina. La logica pura (mazzo, mescolamento, record, figure) sta in logic.js.
// Contenuti: stato e avvio, creazione delle carte, giro di una carta, coppia trovata e sbagliata,
// fine partita (onda, messaggio, numeri che contano), riavvio, livelli, frecce della tastiera, record nel browser.
const LEVEL_KEY = 'memory-game-level';
const SVG_NS = 'http://www.w3.org/2000/svg';

const gameBoard = document.getElementById('game-board');
const topbar = document.querySelector('.topbar');
const moveCounter = document.getElementById('move-counter');
const timerDisplay = document.getElementById('timer');
const recordDisplay = document.getElementById('record');
const recordUnit = document.getElementById('record-unit');
const announcer = document.getElementById('announcer');
const winMessage = document.getElementById('win-message');
const playAgain = document.getElementById('play-again');
const levelButtons = document.querySelectorAll('.level');

let level = parseLevel(readStored(LEVEL_KEY));
let cardValues = createDeck(LEVELS[level].pairs);
let firstCard = null;
let secondCard = null;
let wrongPair = null;
let wrongTimers = [];
let moves = 0;
let seconds = 0;
let timerInterval = null;
let startMs = 0;
let countFrame = null;
const timers = new Set();

document.getElementById('restart').addEventListener('click', restartGame);
playAgain.addEventListener('click', restartGame);
gameBoard.addEventListener('keydown', moveFocusWithArrows);
levelButtons.forEach(button => button.addEventListener('click', () => changeLevel(button.dataset.level)));

showLevel();
showRecord();
shuffle(cardValues);
createCards();

// Chi ha chiesto meno animazioni al sistema: tempi più brevi, niente attese per le rotazioni.
function reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// setTimeout che si ricorda di sé, così Ricomincia può fermare tutto quello che è in sospeso.
function schedule(fn, ms) {
    const id = setTimeout(() => {
        timers.delete(id);
        fn();
    }, ms);
    timers.add(id);
    return id;
}

function figureOf(card) {
    return FIGURES[Number(card.dataset.value) - 1];
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function createFigure(figure) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 48 48');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('figure', `tone-${figure.tone}`);
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', figure.path);
    path.setAttribute('stroke-width', figure.stroke);
    if (figure.rotate) path.setAttribute('transform', `rotate(${figure.rotate} 24 24)`);
    svg.appendChild(path);
    return svg;
}

function createBadge(kind) {
    const badge = document.createElement('span');
    badge.classList.add('badge', `badge-${kind}`);
    const d = kind === 'ok' ? 'M2 6.2 4.8 9 10 3' : 'M3 3l6 6M9 3 3 9';
    badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    return badge;
}

function createCards() {
    cardValues.forEach((num, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.classList.add('card');
        card.dataset.value = num;
        card.dataset.index = index;
        setCardLabel(card, 'coperta');

        const cardInner = document.createElement('span');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('span');
        cardFront.classList.add('card-front');
        const dot = document.createElement('span');
        dot.classList.add('card-dot');
        cardFront.appendChild(dot);

        const cardBack = document.createElement('span');
        cardBack.classList.add('card-back');
        cardBack.appendChild(createFigure(FIGURES[num - 1]));
        const ring = document.createElementNS(SVG_NS, 'svg');
        ring.classList.add('card-ring');
        ring.setAttribute('aria-hidden', 'true');
        // Il bordo della carta trovata: un rettangolo sul filo della carta che si disegna da solo.
        const rect = document.createElementNS(SVG_NS, 'rect');
        [['x', 0], ['y', 0], ['width', '100%'], ['height', '100%'], ['rx', 14], ['pathLength', 1]]
            .forEach(([name, value]) => rect.setAttribute(name, value));
        ring.appendChild(rect);
        cardBack.append(ring, createBadge('ok'), createBadge('wrong'));

        cardInner.append(cardFront, cardBack);
        card.appendChild(cardInner);
        card.addEventListener('click', flipCard);

        gameBoard.appendChild(card);
    });
}

function setCardLabel(card, state) {
    card.setAttribute('aria-label', `Carta ${Number(card.dataset.index) + 1}, ${state}`);
}

// Il timer legge l'orologio a ogni battito: se i battiti rallentano, il tempo resta giusto.
function startTimer() {
    startMs = Date.now();
    timerInterval = setInterval(updateSeconds, 250);
}

function updateSeconds() {
    seconds = elapsedSeconds(startMs, Date.now());
    timerDisplay.textContent = seconds;
}

function flipCard() {
    // Un clic durante l'attesa della coppia sbagliata la chiude subito: chi gioca veloce non aspetta.
    if (wrongPair) {
        const clickedThePair = wrongPair.includes(this);
        closeWrongPair();
        if (clickedThePair) return;
    }
    if (this === firstCard) return;
    if (this.dataset.matched) return;

    if (timerInterval === null) {
        startTimer();
    }

    this.classList.add('flip');
    setCardLabel(this, figureOf(this).name);

    if (!firstCard) {
        firstCard = this;
        announce(`Hai girato: ${figureOf(this).name}`);
        return;
    }

    secondCard = this;
    moves++;
    moveCounter.textContent = moves;

    firstCard.dataset.value === secondCard.dataset.value ? pairFound() : pairWrong();
}

function pairFound() {
    const pair = [firstCard, secondCard];
    const name = figureOf(firstCard).name;
    pair.forEach(card => {
        card.dataset.matched = 'true';
        card.setAttribute('aria-disabled', 'true');
        setCardLabel(card, `${name}, coppia trovata`);
    });
    announce(`Coppia trovata: ${name}`);
    resetBoard();

    // Il negativo parte quando la seconda carta ha finito di girarsi; la seconda segue di 60 ms.
    schedule(() => {
        pair[1].style.setProperty('--match-delay', '60ms');
        pair.forEach(card => card.classList.add('matched'));
    }, reducedMotion() ? 0 : 440);

    if (gameBoard.querySelectorAll('.card:not([data-matched])').length === 0) {
        updateSeconds();
        clearInterval(timerInterval);
        schedule(endGame, reducedMotion() ? 120 : 1060);
    }
}

function pairWrong() {
    const pair = [firstCard, secondCard];
    wrongPair = pair;
    pair[0].style.setProperty('--tilt', '-1');
    pair[1].style.setProperty('--tilt', '1');
    announce(`${capitalize(figureOf(pair[0]).name)} e ${figureOf(pair[1]).name}, non sono una coppia`);

    const reduce = reducedMotion();
    // Prima si vede la figura, poi il segnale e la scossa, poi le carte si richiudono.
    wrongTimers = [
        schedule(() => pair.forEach(card => card.classList.add('wrong')), reduce ? 120 : 440),
        schedule(closeWrongPair, reduce ? 1020 : 1140),
    ];
}

function closeWrongPair() {
    if (!wrongPair) return;
    // Solo i tempi di questa coppia: quelli di una coppia trovata poco prima devono arrivare.
    wrongTimers.forEach(id => {
        clearTimeout(id);
        timers.delete(id);
    });
    wrongTimers = [];
    wrongPair.forEach(card => {
        card.classList.remove('flip', 'wrong');
        setCardLabel(card, 'coperta');
    });
    wrongPair = null;
    resetBoard();
}

function resetBoard() {
    firstCard = null;
    secondCard = null;
}

function endGame() {
    const result = { moves, seconds };
    const previous = readRecord();
    const isRecord = isBetterRecord(result, previous);
    if (isRecord) saveRecord(result);
    showRecord();

    const reduce = reducedMotion();
    const finalTime = document.getElementById('final-time');
    const finalMoves = document.getElementById('final-moves');
    const tag = document.getElementById('new-record');
    document.getElementById('win-title').textContent = LEVELS[level].title;
    document.getElementById('moves-box').classList.toggle('is-record', isRecord);
    document.getElementById('record-note').textContent = recordNote(result, previous);
    tag.hidden = true;
    tag.classList.remove('pop');

    if (!reduce) startWave();

    schedule(() => {
        finalTime.textContent = reduce ? seconds : 0;
        finalMoves.textContent = reduce ? moves : 0;
        topbar.inert = true;
        gameBoard.inert = true;
        winMessage.hidden = false;
        if (reduce) {
            tag.hidden = !isRecord;
            playAgain.focus();
        }
    }, reduce ? 0 : 500);

    if (!reduce) {
        schedule(() => playAgain.focus(), 880);
        schedule(() => countUp([[finalTime, seconds], [finalMoves, moves]], 600), 760);
        if (isRecord) schedule(() => {
            tag.hidden = false;
            tag.classList.add('pop');
        }, 1360);
    }

    announce(`Partita finita in ${moves} mosse e ${seconds} secondi${isRecord ? ', nuovo record del livello ' + level : ''}`);
}

// L'onda: ogni carta si gonfia un attimo, con un ritardo che cresce lungo la diagonale.
function startWave() {
    const columns = getComputedStyle(gameBoard).gridTemplateColumns.split(' ').length;
    gameBoard.querySelectorAll('.card').forEach((card, i) => {
        card.style.setProperty('--d', Math.floor(i / columns) + (i % columns));
    });
    gameBoard.classList.remove('wave');
    void gameBoard.offsetWidth;
    gameBoard.classList.add('wave');
}

// Tempo e mosse contano da 0 al valore finale.
function countUp(pairs, duration) {
    const start = performance.now();
    const step = now => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        pairs.forEach(([el, target]) => {
            el.textContent = Math.round(target * eased);
        });
        countFrame = t < 1 ? requestAnimationFrame(step) : null;
    };
    countFrame = requestAnimationFrame(step);
}

function restartGame(message = 'Nuova partita') {
    // Da «Gioca ancora» il focus finirebbe nel vuoto: lo portiamo sulla prima carta.
    const focusWasInWinMessage = winMessage.contains(document.activeElement);
    clearInterval(timerInterval);
    timers.forEach(id => clearTimeout(id));
    timers.clear();
    cancelAnimationFrame(countFrame);
    timerInterval = null;
    wrongPair = null;
    wrongTimers = [];
    seconds = 0;
    moves = 0;
    resetBoard();
    timerDisplay.textContent = seconds;
    moveCounter.textContent = moves;
    winMessage.hidden = true;
    topbar.inert = false;
    gameBoard.inert = false;
    gameBoard.classList.remove('wave');

    gameBoard.replaceChildren();

    cardValues = createDeck(LEVELS[level].pairs);
    shuffle(cardValues);
    createCards();
    if (focusWasInWinMessage) gameBoard.querySelector('.card').focus();
    announce(typeof message === 'string' ? message : 'Nuova partita');
}

// Cambiare livello fa ripartire la partita, con il record di quel livello.
function changeLevel(name) {
    const next = parseLevel(name);
    if (next === level) return;
    level = next;
    writeStored(LEVEL_KEY, level);
    showLevel();
    showRecord();
    restartGame(`Livello ${level}, ${LEVELS[level].pairs * 2} carte`);
}

function showLevel() {
    levelButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.level === level)));
    gameBoard.dataset.level = level;
    gameBoard.setAttribute('aria-label', `Tabellone, ${LEVELS[level].pairs * 2} carte`);
}

// Frecce della tastiera: spostano il focus tra le carte, riga per riga.
function moveFocusWithArrows(event) {
    const cards = [...gameBoard.querySelectorAll('.card')];
    const current = cards.indexOf(document.activeElement);
    if (current === -1) return;

    const columns = getComputedStyle(gameBoard).gridTemplateColumns.split(' ').length;
    const steps = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    const step = steps[event.key];
    if (step === undefined) return;

    const next = current + step;
    if (next >= 0 && next < cards.length) {
        cards[next].focus();
        event.preventDefault();
    }
}

function announce(text) {
    announcer.textContent = text;
}

// Record e livello restano nel browser di chi gioca. Se il browser non lo permette, il gioco va lo stesso.
function readStored(key) {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStored(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch {
        // niente salvataggio, la partita resta valida
    }
}

function readRecord() {
    return parseRecord(readStored(LEVELS[level].recordKey));
}

function saveRecord(record) {
    writeStored(LEVELS[level].recordKey, JSON.stringify(record));
}

function showRecord() {
    const record = readRecord();
    recordDisplay.textContent = record ? record.moves : '–';
    recordUnit.textContent = record ? 'mosse' : '';
    recordDisplay.parentElement.title = record ? `${record.moves} mosse in ${record.seconds} secondi` : 'Nessun record';
}
