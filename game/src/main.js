// Ember Duel bootstrap: read the URL, stage a screenshot scene or a live
// duel, and run one round at a time — you play, Ash answers, the table shows
// both. Sound is a few WebAudio blips, made in code, never a file.
import { createGame, startRound, playPlayerCard, resolveAiCard, isOver, winnerOf } from './engine.js';
import { renderTable, renderEnd, showScreen } from './render.js';
import { bindKeyboard } from './input.js';
import { stageShot } from './shots.js';

let game = null;
let screen = 'title';
let canPlay = false;
let played = { you: null, foe: null };
let audio = null;

function blip(frequency, seconds, type = 'sine', when = 0) {
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.08, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + seconds);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(audio.currentTime + when);
    oscillator.stop(audio.currentTime + when + seconds);
  } catch {
    // No audio device, or no gesture yet: the duel plays silent.
  }
}

function fanfare(win) {
  if (win) [523, 659, 784, 1047].forEach((note, i) => blip(note, 0.35, 'triangle', i * 0.13));
  else [392, 330, 262].forEach((note, i) => blip(note, 0.4, 'sine', i * 0.16));
}

function draw() {
  renderTable(game, { ...played, canPlay, onPlay: playCard });
}

function endDuel() {
  const winner = winnerOf(game);
  screen = 'end';
  canPlay = false;
  showScreen('end');
  renderEnd(game, winner);
  fanfare(winner === 'you');
}

function startDuel(seed) {
  game = createGame(seed);
  startRound(game);
  played = { you: null, foe: null };
  screen = 'table';
  canPlay = true;
  showScreen('table');
  draw();
}

function playCard(cardId) {
  if (screen !== 'table' || !canPlay) return;
  const card = game.you.hand.find((held) => held.id === cardId);
  if (!card || !playPlayerCard(game, cardId)) return;
  canPlay = false;
  played = { you: card, foe: null };
  blip(660, 0.12, 'triangle');
  draw();
  if (isOver(game)) {
    setTimeout(endDuel, 700);
    return;
  }
  setTimeout(() => {
    const foeCard = game.aiPick;
    if (foeCard) resolveAiCard(game, foeCard);
    played = { you: card, foe: foeCard };
    blip(440, 0.12, 'triangle');
    draw();
    if (isOver(game)) {
      setTimeout(endDuel, 700);
      return;
    }
    game.round += 1;
    startRound(game);
    played = { you: null, foe: null };
    canPlay = true;
    draw();
  }, 750);
}

function playIndex(index) {
  if (screen !== 'table' || !canPlay) return;
  const card = game.you.hand[index];
  if (card) playCard(card.id);
}

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // A reproducible scene for the screenshots: the same seed, the same frame.
  const seed = Number(params.get('seed') || '1');
  const staged = stageShot(shot, seed);
  game = staged.game;
  played = staged.played;
  if (staged.screen === 'title') {
    screen = 'title';
    showScreen('title');
  } else if (staged.screen === 'end') {
    screen = 'end';
    showScreen('end');
    renderEnd(game, staged.winner);
  } else {
    screen = 'table';
    canPlay = true;
    showScreen('table');
    draw();
  }
} else {
  showScreen('title');
  document.getElementById('start-button').addEventListener('click', () => {
    blip(523, 0.15, 'triangle');
    startDuel(Math.floor(Math.random() * 1000000));
  });
  document.getElementById('again-button').addEventListener('click', () => {
    startDuel(Math.floor(Math.random() * 1000000));
  });
  bindKeyboard({
    onPlayIndex: playIndex,
    onConfirm: () => {
      if (screen === 'title') startDuel(Math.floor(Math.random() * 1000000));
      else if (screen === 'end') startDuel(Math.floor(Math.random() * 1000000));
    },
    onAgain: () => {
      if (screen === 'end') startDuel(Math.floor(Math.random() * 1000000));
    },
  });
}
