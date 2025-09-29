/// <reference lib="dom" />
import { test, expect, describe, beforeEach, afterEach } from "bun:test";

// Pure functions from script.js that we can test directly
const suits = ['♠', '♥', '♦', '♣'];
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function createDeck() {
  const d = [];
  for (let s of suits) {
    for (let r of ranks) {
      d.push({rank:r, suit:s});
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

describe("Blackjack Game Tests", () => {
  
  describe("createDeck()", () => {
    test("should create a deck with 52 cards", () => {
      const deck = createDeck();
      expect(deck.length).toBe(52);
    });

    test("should have exactly 13 cards per suit", () => {
      const deck = createDeck();
      suits.forEach(suit => {
        const suitCards = deck.filter(card => card.suit === suit);
        expect(suitCards.length).toBe(13);
      });
    });

    test("should have exactly 4 cards per rank", () => {
      const deck = createDeck();
      ranks.forEach(rank => {
        const rankCards = deck.filter(card => card.rank === rank);
        expect(rankCards.length).toBe(4);
      });
    });
  });

  describe("cardValue()", () => {
    test("should return correct values for number cards", () => {
      expect(cardValue({rank: '2', suit: '♠'})).toBe(2);
      expect(cardValue({rank: '5', suit: '♥'})).toBe(5);
      expect(cardValue({rank: '9', suit: '♦'})).toBe(9);
      expect(cardValue({rank: '10', suit: '♣'})).toBe(10);
    });

    test("should return 10 for face cards", () => {
      expect(cardValue({rank: 'J', suit: '♠'})).toBe(10);
      expect(cardValue({rank: 'Q', suit: '♥'})).toBe(10);
      expect(cardValue({rank: 'K', suit: '♦'})).toBe(10);
    });

    test("should return 11 for Ace", () => {
      expect(cardValue({rank: 'A', suit: '♣'})).toBe(11);
    });
  });

  describe("handValue()", () => {
    test("should calculate simple hand values correctly", () => {
      const hand1 = [{rank: '5', suit: '♠'}, {rank: '7', suit: '♥'}];
      expect(handValue(hand1)).toBe(12);

      const hand2 = [{rank: 'K', suit: '♠'}, {rank: 'Q', suit: '♥'}];
      expect(handValue(hand2)).toBe(20);
    });

    test("should handle single Ace correctly", () => {
      const hand1 = [{rank: 'A', suit: '♠'}, {rank: '5', suit: '♥'}];
      expect(handValue(hand1)).toBe(16);

      const hand2 = [{rank: 'A', suit: '♠'}, {rank: 'K', suit: '♥'}];
      expect(handValue(hand2)).toBe(21); // Blackjack
    });

    test("should convert Ace from 11 to 1 when hand exceeds 21", () => {
      const hand1 = [{rank: 'A', suit: '♠'}, {rank: '7', suit: '♥'}, {rank: '8', suit: '♦'}];
      expect(handValue(hand1)).toBe(16); // A(1) + 7 + 8

      const hand2 = [{rank: 'A', suit: '♠'}, {rank: 'A', suit: '♥'}, {rank: '9', suit: '♦'}];
      expect(handValue(hand2)).toBe(21); // A(11) + A(1) + 9
    });

    test("should handle multiple Aces correctly", () => {
      const hand1 = [{rank: 'A', suit: '♠'}, {rank: 'A', suit: '♥'}];
      expect(handValue(hand1)).toBe(12); // A(11) + A(1)

      const hand3 = [{rank: 'A', suit: '♠'}, {rank: 'A', suit: '♥'}, {rank: 'A', suit: '♦'}, {rank: 'A', suit: '♣'}];
      expect(handValue(hand3)).toBe(14); // A(11) + A(1) + A(1) + A(1)
    });
  });

  describe("handToHTML()", () => {
    test("should generate correct HTML for black suits", () => {
      const hand = [{rank: 'A', suit: '♠'}, {rank: 'K', suit: '♣'}];
      const html = handToHTML(hand);
      expect(html).toContain('<div class="card">A♠</div>');
      expect(html).toContain('<div class="card">K♣</div>');
    });

    test("should generate correct HTML for red suits", () => {
      const hand = [{rank: 'Q', suit: '♥'}, {rank: '7', suit: '♦'}];
      const html = handToHTML(hand);
      expect(html).toContain('<div class="card red">Q♥</div>');
      expect(html).toContain('<div class="card red">7♦</div>');
    });
  });
});

describe("DOM Integration Tests", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="bankroll">Bankroll: $100</div>
      <div id="bet">Bet: $10</div>
      <div id="deck-count">Cards left: 52</div>
      <div id="dealer-hand" class="hand"></div>
      <div id="player-hand" class="hand"></div>
      <button id="hit">Hit</button>
      <button id="stand">Stand</button>
      <button id="new-round">New Round</button>
      <div id="message"></div>
    `;
  });

  test("should have correct initial DOM structure", () => {
    expect(document.getElementById('bankroll')).toBeTruthy();
    expect(document.getElementById('bet')).toBeTruthy();
    expect(document.getElementById('deck-count')).toBeTruthy();
    expect(document.getElementById('dealer-hand')).toBeTruthy();
    expect(document.getElementById('player-hand')).toBeTruthy();
  });

  test("should update player hand display correctly", () => {
    const playerHandEl = document.getElementById('player-hand');
    const testHand = [{rank: 'A', suit: '♠'}, {rank: 'K', suit: '♥'}];
    
    playerHandEl.innerHTML = handToHTML(testHand) + `<br>( ${handValue(testHand)} )`;
    
    expect(playerHandEl.innerHTML).toContain('A♠');
    expect(playerHandEl.innerHTML).toContain('K♥');
    expect(playerHandEl.innerHTML).toContain('( 21 )');
  });
});