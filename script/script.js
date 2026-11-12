// Il gioco nella pagina. La logica pura (mazzo, mescolamento, record) sta in logic.js.
const PAIRS = 10;
const RECORD_KEY = 'memory-game-record';

const gameBoard = document.getElementById('game-board');
const moveCounter = document.getElementById('move-counter');
const timerDisplay = document.getElementById('timer');
const recordDisplay = document.getElementById('record');
const announcer = document.getElementById('announcer');
const winMessage = document.getElementById('win-message');

let cardValues = createDeck(PAIRS);
let hasFlippedCard = false;
let lockBoard = false;
let firstCard = null;
let secondCard = null;
let moves = 0;
let seconds = 0;
let timerInterval = null;
let unflipTimeout = null;

document.getElementById('restart').addEventListener('click', restartGame);
document.getElementById('play-again').addEventListener('click', restartGame);
gameBoard.addEventListener('keydown', moveFocusWithArrows);

showRecord();
shuffle(cardValues);
createCards();

function createCards() {
    cardValues.forEach((num, index) => {
        const card = document.createElement('button');
        card.type = 'button';
        card.classList.add('card');
        card.dataset.value = num;
        card.dataset.index = index;
        card.setAttribute('aria-label', `Carta ${index + 1}, coperta`);

        const cardInner = document.createElement('span');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('span');
        cardFront.classList.add('card-front');

        const cardBack = document.createElement('span');
        cardBack.classList.add('card-back');
        cardBack.textContent = num;

        cardInner.appendChild(cardFront);
        cardInner.appendChild(cardBack);
        card.appendChild(cardInner);

        card.addEventListener('click', flipCard);

        gameBoard.appendChild(card);
    });
}

function startTimer() {
    timerInterval = setInterval(() => {
        seconds++;
        timerDisplay.textContent = seconds;
    }, 1000);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;
    if (this.classList.contains('matched')) return;

    if (timerInterval === null) {
        startTimer();
    }

    this.classList.add('flip');
    this.setAttribute('aria-label', `Carta ${Number(this.dataset.index) + 1}, ${this.dataset.value}`);

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        announce(`Hai girato un ${this.dataset.value}`);
        return;
    }

    secondCard = this;
    moves++;
    moveCounter.textContent = moves;

    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.value === secondCard.dataset.value;

    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    [firstCard, secondCard].forEach(card => {
        card.classList.add('matched');
        card.setAttribute('aria-disabled', 'true');
    });
    announce(`Coppia di ${firstCard.dataset.value} trovata`);

    resetBoard();

    if (document.querySelectorAll('.card:not(.matched)').length === 0) {
        endGame();
    }
}

function unflipCards() {
    lockBoard = true;
    announce(`${secondCard.dataset.value}: non è una coppia`);

    unflipTimeout = setTimeout(() => {
        [firstCard, secondCard].forEach(card => {
            card.classList.remove('flip');
            card.setAttribute('aria-label', `Carta ${Number(card.dataset.index) + 1}, coperta`);
        });

        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard, firstCard, secondCard] = [false, false, null, null];
    unflipTimeout = null;
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('final-time').textContent = seconds;
    document.getElementById('final-moves').textContent = moves;

    const result = { moves, seconds };
    const isRecord = isBetterRecord(result, readRecord());
    if (isRecord) saveRecord(result);
    document.getElementById('new-record').hidden = !isRecord;
    showRecord();

    winMessage.hidden = false;
    announce(`Hai vinto in ${moves} mosse e ${seconds} secondi${isRecord ? ', nuovo record' : ''}`);
    document.getElementById('play-again').focus();
}

function restartGame() {
    clearInterval(timerInterval);
    clearTimeout(unflipTimeout);
    timerInterval = null;
    seconds = 0;
    moves = 0;
    resetBoard();
    timerDisplay.textContent = seconds;
    moveCounter.textContent = moves;
    winMessage.hidden = true;

    gameBoard.replaceChildren();

    shuffle(cardValues);
    createCards();
    announce('Nuova partita');
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

// Il record resta nel browser di chi gioca. Se il browser non lo permette, il gioco va lo stesso.
function readRecord() {
    try {
        return JSON.parse(localStorage.getItem(RECORD_KEY));
    } catch {
        return null;
    }
}

function saveRecord(record) {
    try {
        localStorage.setItem(RECORD_KEY, JSON.stringify(record));
    } catch {
        // niente record, la partita resta valida
    }
}

function showRecord() {
    const record = readRecord();
    recordDisplay.textContent = record ? `${record.moves} mosse, ${record.seconds} secondi` : 'nessuno';
}
