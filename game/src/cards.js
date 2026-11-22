// The cards of Ember Duel: four suits, each told apart by colour AND shape,
// each card with a readable value, a name, and plain effect text.
export const SUITS = {
  FLAME: 'flame',
  FROST: 'frost',
  LEAF: 'leaf',
  STORM: 'storm',
};

// Suit presentation: glyph shape + colour, never text alone.
export const SUIT_STYLE = {
  [SUITS.FLAME]: { glyph: '▲', colour: '#ff6b35', label: 'Flame' },
  [SUITS.FROST]: { glyph: '◆', colour: '#4fc3f7', label: 'Frost' },
  [SUITS.LEAF]: { glyph: '●', colour: '#7ed957', label: 'Leaf' },
  [SUITS.STORM]: { glyph: '★', colour: '#c77dff', label: 'Storm' },
};

let nextId = 0;

/** One card: suit, kind, value, name and the effect text the table shows. */
function makeCard(suit, kind, value, name, text) {
  nextId += 1;
  return { id: `card-${nextId}`, suit, kind, value, name, text };
}

/** The full 24-card deck, in a fixed order before shuffling. */
export function buildDeck() {
  nextId = 0;
  const cards = [];
  // Flame: straight attacks.
  cards.push(makeCard(SUITS.FLAME, 'attack', 3, 'Ember Strike', 'Deal 3 damage.'));
  cards.push(makeCard(SUITS.FLAME, 'attack', 4, 'Ember Strike', 'Deal 4 damage.'));
  cards.push(makeCard(SUITS.FLAME, 'attack', 4, 'Cinder Slash', 'Deal 4 damage.'));
  cards.push(makeCard(SUITS.FLAME, 'attack', 2, 'Cinder Slash', 'Deal 2 damage.'));
  cards.push(makeCard(SUITS.FLAME, 'attack', 5, 'Wildfire', 'Deal 5 damage.'));
  cards.push(makeCard(SUITS.FLAME, 'attack', 3, 'Wildfire', 'Deal 3 damage.'));
  // Frost: shield that absorbs damage.
  cards.push(makeCard(SUITS.FROST, 'shield', 3, 'Guard', 'Gain 3 shield.'));
  cards.push(makeCard(SUITS.FROST, 'shield', 4, 'Guard', 'Gain 4 shield.'));
  cards.push(makeCard(SUITS.FROST, 'shield', 5, 'Ice Wall', 'Gain 5 shield.'));
  cards.push(makeCard(SUITS.FROST, 'shield', 3, 'Ice Wall', 'Gain 3 shield.'));
  cards.push(makeCard(SUITS.FROST, 'shield', 4, 'Frost Ward', 'Gain 4 shield.'));
  cards.push(makeCard(SUITS.FROST, 'shield', 2, 'Frost Ward', 'Gain 2 shield.'));
  // Leaf: healing.
  cards.push(makeCard(SUITS.LEAF, 'heal', 3, 'Mend', 'Restore 3 life.'));
  cards.push(makeCard(SUITS.LEAF, 'heal', 4, 'Mend', 'Restore 4 life.'));
  cards.push(makeCard(SUITS.LEAF, 'heal', 5, 'Bloom', 'Restore 5 life.'));
  cards.push(makeCard(SUITS.LEAF, 'heal', 3, 'Bloom', 'Restore 3 life.'));
  cards.push(makeCard(SUITS.LEAF, 'heal', 4, 'Soothing Rain', 'Restore 4 life.'));
  cards.push(makeCard(SUITS.LEAF, 'heal', 2, 'Soothing Rain', 'Restore 2 life.'));
  // Storm: tricks that combine with the table.
  cards.push(makeCard(SUITS.STORM, 'spark', 2, 'Spark', 'Deal 2 damage. +2 if the foe is shielded.'));
  cards.push(makeCard(SUITS.STORM, 'spark', 2, 'Spark', 'Deal 2 damage. +2 if the foe is shielded.'));
  cards.push(makeCard(SUITS.STORM, 'kindle', 0, 'Kindle', 'Your next Flame card deals +3.'));
  cards.push(makeCard(SUITS.STORM, 'kindle', 0, 'Kindle', 'Your next Flame card deals +3.'));
  cards.push(makeCard(SUITS.STORM, 'douse', 1, 'Douse', 'Remove the foe shield. Deal 1 damage.'));
  cards.push(makeCard(SUITS.STORM, 'surge', 0, 'Surge', 'Deal damage equal to your shield.'));
  return cards;
}
