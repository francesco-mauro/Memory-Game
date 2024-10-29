const gameBoard = document.getElementById('game-board');

const numbers = [1,2,3,4,5,6,7,8,9,10];
let cardValues = numbers.concat(numbers);
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let moves = 0;
let seconds = 0;
let timerInterval;

shuffle(cardValues);
createCards();

function createCards() {
    cardValues.forEach(num => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.value = num;

        const cardInner = document.createElement('div');
        cardInner.classList.add('card-inner');

        const cardFront = document.createElement('div');
        cardFront.classList.add('card-front');

        const cardBack = document.createElement('div');
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
        document.getElementById('timer').textContent = seconds;
    }, 1000);
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    if (seconds === 0 && !timerInterval) {
        startTimer();
    }

    this.classList.add('flip');

    if (!hasFlippedCard) {
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    secondCard = this;
    moves++;
    document.getElementById('move-counter').textContent = moves;

    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.value === secondCard.dataset.value;

    isMatch ? disableCards() : unflipCards();
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);

    if (document.querySelectorAll('.card:not(.flip)').length === 0) {
        endGame();
    }

    resetBoard();
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');

        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard, firstCard, secondCard] = [false, false, null, null];
}

function shuffle(array) {
    array.sort(() => 0.5 - Math.random());
}

function endGame() {
    clearInterval(timerInterval);
    document.getElementById('final-time').textContent = seconds;
    document.getElementById('final-moves').textContent = moves;
    document.getElementById('win-message').style.display = 'block';
}

function restartGame() {
    seconds = 0;
    moves = 0;
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    timerInterval = null;
    document.getElementById('timer').textContent = seconds;
    document.getElementById('move-counter').textContent = moves;
    document.getElementById('win-message').style.display = 'none';

    while (gameBoard.firstChild) {
        gameBoard.removeChild(gameBoard.firstChild);
    }

    shuffle(cardValues);
    createCards();
}
