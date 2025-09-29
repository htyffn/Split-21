const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const DECKS = 6; 
const SHUFFLE_POINT = 0.25; 

let deck, playerHand, dealerHand, bankroll = 100, bet = 10;
let gameOver = false;

function validateBet() {
  if (bet > bankroll) {
    bet = bankroll;
    document.getElementById('message').textContent = `Bet adjusted to $${bet} (maximum possible).`;
  }
  return bet > 0;
}

// SECRET
let typedSequence = '';
let sequenceTimeout;
let isAwesomeMode = false;
let colorInterval;
let originalBackgroundColor = '#064e3b';

function createDeck() {
  const d = [];
  for (let n = 0; n < DECKS; n++) {
    for (let s of suits) {
      for (let r of ranks) {
        d.push({rank:r, suit:s});
      }
    }
  }
  return d;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardValue(card) {
  if (['J','Q','K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

function handValue(hand) {
  let total = 0, aces = 0;
  for (let c of hand) {
    total += cardValue(c);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function handToHTML(hand) {
  return hand.map(c => {
    const redSuits = ['♥','♦'];
    const classes = redSuits.includes(c.suit) ? "card red" : "card";
    return `<div class="${classes}">${c.rank}${c.suit}</div>`;
  }).join('');
}

function getSecretModeCol() {
  const letters = '0123456789ABCDEF';
  let col = '#';
  for (let i = 0; i < 6; i++) {
    col += letters[Math.floor(Math.random() * 16)];
  }
  return col;
}

function startSecretMode() {
  isAwesomeMode = true;
  colorInterval = setInterval(() => {
    document.body.style.backgroundColor = getSecretModeCol();
  }, 100);
}

function stopSecretMode() {
  isAwesomeMode = false;
  clearInterval(colorInterval);
  document.body.style.backgroundColor = originalBackgroundColor;
}

function handleKeyPress(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;

  const key = event.key.toUpperCase();

  if (sequenceTimeout) {
    clearTimeout(sequenceTimeout);
  }

  typedSequence += key;

  if (typedSequence.length > 7) {
    typedSequence = typedSequence.slice(-7);
  }

  if (typedSequence.includes("AWESOME")) {
    if (!isAwesomeMode) {
      startSecretMode();
    } else {
      stopSecretMode();
    }
    typedSequence = '';
  }

  sequenceTimeout = setTimeout(() => {
    typedSequence = '';
  }, 2000);
}

document.addEventListener('keydown', handleKeyPress);

function startRound() {
  // Validate bet before starting
  if (!validateBet()) {
    document.getElementById('message').textContent = "Cannot start round - insufficient funds!";
    return;
  }
  
  // If deck doesn't exist yet or it's below the shuffle threshold → reshuffle
  if (!deck || deck.length < (DECKS * 52 * SHUFFLE_POINT)) {
    // Hide board and controls, show centered shuffle message
    document.querySelector('.board').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    document.getElementById('message').innerHTML = 
      '<div style="text-align: center; font-size: 24px; margin: 50px 0; animation: pulse 1s infinite;">' +
      '🔄 Shuffling new shoe...' +
      '</div>';
    
    setTimeout(() => {
      deck = shuffle(createDeck(DECKS));
      // Show board and controls again
      document.querySelector('.board').style.display = 'block';
      document.querySelector('.controls').style.display = 'block';
      disableControls(false);
      dealHands();
    }, 3000 + Math.random() * 2000); // 3–5 seconds delay

  } else {
    dealHands();
  }
}

function dealHands() {
  playerHand = [deck.pop(), deck.pop()];
  dealerHand = [deck.pop(), deck.pop()];
  gameOver = false;
  render();
  document.getElementById('message').textContent = "Your move...";
}

function handleBankruptcy() {
  const resetBtn = document.createElement('button');
  resetBtn.id = 'reset-game';
  resetBtn.textContent = 'Reset Game';
  resetBtn.onclick = resetGame;
  
  const controlsDiv = document.querySelector('.controls');
  controlsDiv.appendChild(resetBtn);
  disableControls(true);
}

function resetGame() {
  bankroll = 100;
  bet = 10;
  document.getElementById('reset-game')?.remove();
  startRound();
}

function disableControls(state) {
  const hitBtn = document.getElementById('hit');
  const standBtn = document.getElementById('stand');
  const newRoundBtn = document.getElementById('new-round');
  const resetBtn = document.getElementById('reset-game');

  if (bankroll === 0) {
    // Show only reset button when bankrupt
    hitBtn.style.display = 'none';
    standBtn.style.display = 'none';
    newRoundBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'inline-block';
  } else if (gameOver) {
    // Hide hit/stand, show new-round when game is over
    hitBtn.style.display = 'none';
    standBtn.style.display = 'none';
    newRoundBtn.style.display = 'inline-block';
    if (resetBtn) resetBtn.style.display = 'none';
  } else {
    // Show hit/stand, hide new-round during gameplay
    hitBtn.style.display = 'inline-block';
    standBtn.style.display = 'inline-block';
    newRoundBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
  }

  // Apply disabled state
  hitBtn.disabled = state;
  standBtn.disabled = state;
  newRoundBtn.disabled = state;
}

function render() {
  document.getElementById('player-hand').innerHTML =
    handToHTML(playerHand) + `<br>( ${handValue(playerHand)} )`;

  if (gameOver) {
    document.getElementById('dealer-hand').innerHTML =
      handToHTML(dealerHand) + `<br>( ${handValue(dealerHand)} )`;
  } else {
    document.getElementById('dealer-hand').innerHTML =
      handToHTML([dealerHand[0]]) + `<div class="card back">?</div>`;
  }

  document.getElementById('bankroll').textContent = `Bankroll: $${bankroll}`;
  document.getElementById('bet').textContent = `Bet: $${bet}`;
  document.getElementById('deck-count').textContent =
    `Cards left: ${deck.length}`;
  
  disableControls(false);
}


function endRound() {
  gameOver = true;

  while (handValue(dealerHand) < 17) {
    dealerHand.push(deck.pop());
  }

  const playerVal = handValue(playerHand);
  const dealerVal = handValue(dealerHand);
  let msg;

  if (playerVal > 21) {
    bankroll = Math.max(0, bankroll - bet);
    msg = "You bust! Dealer wins.";
  } else if (dealerVal > 21 || playerVal > dealerVal) {
    bankroll += bet;
    msg = "You win!";
  } else if (playerVal === dealerVal) {
    msg = "Push (tie).";
  } else {
    bankroll = Math.max(0, bankroll - bet);
    msg = "Dealer wins.";
  }

  // Check for bankruptcy after updating bankroll
  if (bankroll === 0) {
    msg += " Game Over - Bankrupt!";
    handleBankruptcy();
  } else if (bankroll < bet) {
    // Automatically adjust bet to maximum possible
    bet = bankroll;
    msg += ` Bet adjusted to $${bet} (maximum possible).`;
  }

  document.getElementById('message').textContent = msg;
  render();
}

document.getElementById('hit').onclick = () => {
  if (gameOver) return;
  // Check if player already has 21
  if (handValue(playerHand) === 21) {
    document.getElementById('message').textContent = "You have 21! Please stand.";
    document.getElementById('hit').style.display = 'none';
    return;
  }
  playerHand.push(deck.pop());
  if (handValue(playerHand) > 21) {
    endRound();
  } else {
    render();
  }
};

document.getElementById('stand').onclick = () => {
  if (gameOver) return;
  endRound();
};

document.getElementById('new-round').onclick = () => {
  startRound();
};

startRound();
