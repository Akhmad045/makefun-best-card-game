// Ember Duel input: keyboard only — the mouse lives on the cards themselves
// (render.js wires each card's click). Keys: 1–5 play a hand card, Enter or
// Space starts the duel, R duels again after the end screen.
export function bindKeyboard(handlers) {
  document.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.key >= '1' && event.key <= '5') {
      handlers.onPlayIndex(Number(event.key) - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlers.onConfirm();
      return;
    }
    if (event.key === 'r' || event.key === 'R') {
      handlers.onAgain();
    }
  });
}
