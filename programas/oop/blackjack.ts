// ============================================================
// Blackjack - OOP Paradigm Demo
// Written in TypeScript, compiled to JavaScript for the browser
// ============================================================

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

class Card {
  constructor(public suit: Suit, public rank: Rank) {}

  get value(): number {
    if (['J', 'Q', 'K'].includes(this.rank)) return 10;
    if (this.rank === 'A') return 11;
    return parseInt(this.rank);
  }

  get isRed(): boolean {
    return this.suit === '♥' || this.suit === '♦';
  }

  render(faceDown = false): string {
    if (faceDown) {
      return `<div class="card face-down"><div class="card-back-pattern"></div></div>`;
    }
    const colorClass = this.isRed ? 'red' : 'black';
    return `
      <div class="card ${colorClass}">
        <div class="card-corner top-left">
          <span class="card-rank">${this.rank}</span>
          <span class="card-suit">${this.suit}</span>
        </div>
        <div class="card-center-suit">${this.suit}</div>
        <div class="card-corner bottom-right">
          <span class="card-rank">${this.rank}</span>
          <span class="card-suit">${this.suit}</span>
        </div>
      </div>`;
  }
}

class Deck {
  private cards: Card[] = [];

  constructor() {
    this.build();
    this.shuffle();
  }

  private build(): void {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    for (const suit of suits)
      for (const rank of ranks)
        this.cards.push(new Card(suit, rank));
  }

  private shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  deal(): Card {
    if (this.cards.length === 0) {
      this.build();
      this.shuffle();
    }
    return this.cards.pop()!;
  }
}

class Hand {
  cards: Card[] = [];

  add(card: Card): void {
    this.cards.push(card);
  }

  get score(): number {
    let total = this.cards.reduce((sum, c) => sum + c.value, 0);
    let aces = this.cards.filter(c => c.rank === 'A').length;
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    return total;
  }

  get isBust(): boolean { return this.score > 21; }
  get isBlackjack(): boolean { return this.cards.length === 2 && this.score === 21; }

  clear(): void { this.cards = []; }
}

class BlackjackGame {
  private deck: Deck = new Deck();
  player: Hand = new Hand();
  dealer: Hand = new Hand();
  state: 'idle' | 'playing' | 'dealerTurn' | 'over' = 'idle';
  message: string = '';
  result: 'win' | 'lose' | 'push' | null = null;

  deal(): void {
    this.player.clear();
    this.dealer.clear();
    this.result = null;
    this.message = '';
    this.player.add(this.deck.deal());
    this.dealer.add(this.deck.deal());
    this.player.add(this.deck.deal());
    this.dealer.add(this.deck.deal());
    this.state = 'playing';

    if (this.player.isBlackjack) {
      if (this.dealer.isBlackjack) {
        this.endGame('push');
      } else {
        this.endGame('win', 'Blackjack! You win!');
      }
    }
  }

  hit(): void {
    if (this.state !== 'playing') return;
    this.player.add(this.deck.deal());
    if (this.player.isBust) this.endGame('lose', 'Bust! You went over 21.');
  }

  stand(): void {
    if (this.state !== 'playing') return;
    this.state = 'dealerTurn';
    while (this.dealer.score < 17) {
      this.dealer.add(this.deck.deal());
    }
    if (this.dealer.isBust) {
      this.endGame('win', 'Dealer busts! You win!');
    } else if (this.dealer.score > this.player.score) {
      this.endGame('lose', 'Dealer wins.');
    } else if (this.dealer.score < this.player.score) {
      this.endGame('win', 'You win!');
    } else {
      this.endGame('push', 'Push — it\'s a tie!');
    }
  }

  private endGame(result: 'win' | 'lose' | 'push', msg?: string): void {
    this.state = 'over';
    this.result = result;
    this.message = msg || (result === 'push' ? "It's a tie!" : result === 'win' ? 'You win!' : 'Dealer wins.');
  }
}

// ---- UI Controller ----
const game = new BlackjackGame();

function render(): void {
  const isOver = game.state === 'over' || game.state === 'dealerTurn';
  const dealerCards = game.dealer.cards
    .map((c, i) => c.render(i === 1 && game.state === 'playing'))
    .join('');
  const playerCards = game.player.cards.map(c => c.render()).join('');
  const dealerScore = game.state === 'playing'
    ? game.dealer.cards[0].value
    : game.dealer.score;

  (document.getElementById('dealer-cards') as HTMLElement).innerHTML = dealerCards;
  (document.getElementById('player-cards') as HTMLElement).innerHTML = playerCards;
  (document.getElementById('dealer-score') as HTMLElement).textContent =
    game.state === 'playing' ? `${dealerScore}+?` : `${game.dealer.score}`;
  (document.getElementById('player-score') as HTMLElement).textContent = `${game.player.score}`;

  const msg = document.getElementById('message') as HTMLElement;
  msg.textContent = game.message;
  msg.className = 'message ' + (game.result || '');

  (document.getElementById('btn-hit') as HTMLButtonElement).disabled = game.state !== 'playing';
  (document.getElementById('btn-stand') as HTMLButtonElement).disabled = game.state !== 'playing';
  (document.getElementById('btn-deal') as HTMLButtonElement).textContent =
    game.state === 'idle' ? 'Deal' : 'New Game';
}

(document.getElementById('btn-deal') as HTMLButtonElement).addEventListener('click', () => {
  game.deal();
  render();
});
(document.getElementById('btn-hit') as HTMLButtonElement).addEventListener('click', () => {
  game.hit();
  render();
});
(document.getElementById('btn-stand') as HTMLButtonElement).addEventListener('click', () => {
  game.stand();
  render();
});

render();
