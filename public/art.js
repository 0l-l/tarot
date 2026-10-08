// =====================================================================
// Card artwork: simple, original black-and-white line drawings as SVG.
//
// Every drawing uses "currentColor", so the art automatically takes the
// --ink color from the CSS. Change --ink and all 78 cards change with it.
//
// Coordinates: each drawing lives in a 100 x 110 box (x: left→right, y: top→bottom).
// =====================================================================

(function () {
  // ---------- Small helpers ----------

  // Wrap drawing parts in an <svg>. Lines are drawn with the ink color, no fill by default.
  const svg = (inner, viewBox = "0 0 100 110") =>
    `<svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="2.2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const solid = 'fill="currentColor"';
  // Fill with the card's background color: used to "cut out" shapes (e.g. a crescent).
  const paper = 'style="fill: var(--card-front)" stroke="none"';

  // A four-pointed sparkle ✦ at (x, y) with radius r.
  const sparkle = (x, y, r = 3) =>
    `<path ${solid} stroke="none" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z"/>`;

  // Several sparkles from a list of [x, y, r].
  const sparkles = (list) => list.map(([x, y, r]) => sparkle(x, y, r)).join("");

  // A star polygon: n points, outer radius R, inner radius r.
  function starPoints(cx, cy, R, r, n) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const rad = i % 2 === 0 ? R : r;
      const a = (Math.PI * i) / n - Math.PI / 2;
      pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(" ");
  }

  // Lines radiating from a center, from radius r1 to r2.
  function rays(cx, cy, r1, r2, count, offset = 0) {
    let out = "";
    for (let i = 0; i < count; i++) {
      const a = (2 * Math.PI * i) / count + offset;
      out += `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}"
                    x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}"/>`;
    }
    return out;
  }

  // Wavy water lines along the bottom.
  const water = (y) =>
    `<path d="M8 ${y} q5 -3 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t10 0"/>`;

  // A plain ground line (or two).
  const ground = (y) => `<line x1="8" y1="${y}" x2="92" y2="${y}"/><line x1="16" y1="${y + 5}" x2="84" y2="${y + 5}"/>`;

  // ---------- Suit symbols (drawn around 0,0, about 24 units tall) ----------
  const SUIT_ICONS = {
    cups: `<path d="M-9 -11 H9 Q9 4 0 4 Q-9 4 -9 -11Z"/><line x1="0" y1="4" x2="0" y2="10"/>
           <path d="M-6 12 H6"/><path d="M-9 -6 H9"/>`,
    wands: `<line x1="-4" y1="12" x2="4" y2="-12"/>
            <path ${solid} d="M2 -5 q6 -2 7 -9 q-6 1 -7 9Z"/>
            <path ${solid} d="M-1 3 q-6 -1 -8 -7 q6 0 8 7Z"/>`,
    swords: `<path d="M0 -13 L2.5 -9 V5 H-2.5 V-9Z"/><line x1="-7" y1="5" x2="7" y2="5"/>
             <line x1="0" y1="5" x2="0" y2="10"/><circle cx="0" cy="12" r="1.8" ${solid}/>`,
    pentacles: `<circle cx="0" cy="0" r="11"/><polygon points="${starPoints(0, 0, 9, 3.6, 5)}"/>`
  };

  // Place a suit symbol at (x, y) with a size multiplier s.
  const suitIcon = (suit, x, y, s = 1) =>
    `<g transform="translate(${x} ${y}) scale(${s})" stroke-width="${(2.2 / s).toFixed(2)}">${SUIT_ICONS[suit]}</g>`;

  // Where the symbols go for number cards 1–10 (like playing cards).
  const PIP_LAYOUTS = {
    1: [[50, 55]],
    2: [[50, 30], [50, 80]],
    3: [[50, 22], [50, 55], [50, 88]],
    4: [[32, 30], [68, 30], [32, 80], [68, 80]],
    5: [[32, 26], [68, 26], [50, 55], [32, 84], [68, 84]],
    6: [[32, 22], [68, 22], [32, 55], [68, 55], [32, 88], [68, 88]],
    7: [[32, 22], [68, 22], [50, 38], [32, 55], [68, 55], [32, 88], [68, 88]],
    8: [[32, 20], [68, 20], [50, 37], [32, 55], [68, 55], [50, 73], [32, 90], [68, 90]],
    9: [[32, 18], [68, 18], [32, 41], [68, 41], [50, 55], [32, 69], [68, 69], [32, 92], [68, 92]],
    10: [[32, 16], [68, 16], [50, 28], [32, 41], [68, 41], [32, 69], [68, 69], [50, 82], [32, 94], [68, 94]]
  };

  function pipArt(suit, n) {
    const size = n === 1 ? 2.4 : n <= 3 ? 1.0 : n <= 6 ? 0.95 : n <= 8 ? 0.8 : 0.7;
    const icons = PIP_LAYOUTS[n].map(([x, y]) => suitIcon(suit, x, y, size)).join("");
    const extra = n === 1 ? sparkles([[18, 18, 4], [82, 18, 4], [18, 92, 4], [82, 92, 4]]) + rays(50, 55, 34, 40, 16) : "";
    return svg(extra + icons);
  }

  // Court cards: a big suit symbol with a small emblem above it.
  const COURT_TOPPERS = {
    page: sparkle(50, 20, 8),
    knight: `<path d="M36 28 L50 14 L64 28"/><path d="M40 32 L50 22 L60 32"/>`,
    queen: `<path d="M34 30 H66 L62 18 L56 24 L50 14 L44 24 L38 18Z"/>
            <circle cx="38" cy="16" r="2" ${solid}/><circle cx="50" cy="12" r="2" ${solid}/><circle cx="62" cy="16" r="2" ${solid}/>`,
    king: `<path ${solid} d="M34 30 V14 L42 22 L50 10 L58 22 L66 14 V30Z"/>`
  };

  function courtArt(suit, rank) {
    return svg(
      COURT_TOPPERS[rank] +
      suitIcon(suit, 50, 66, 2.1) +
      `<circle cx="50" cy="66" r="32" stroke-dasharray="2 5"/>` +
      sparkles([[14, 16, 3], [86, 16, 3], [14, 100, 3], [86, 100, 3]])
    );
  }

  // ---------- Major Arcana (indexed by number 0–21) ----------
  const MAJOR = {
    // 0 The Fool: a cliff edge, a bright sun, birds in flight
    0: () => svg(
      `<circle cx="70" cy="24" r="9" ${solid}/>${rays(70, 24, 13, 19, 12)}
       <path d="M30 52 q5 -5 10 0 q5 -5 10 0"/><path d="M46 38 q4 -4 8 0 q4 -4 8 0"/>
       <path ${solid} d="M8 100 V74 L22 70 L34 72 L46 68 L52 76 L50 100Z"/>
       <line x1="58" y1="100" x2="92" y2="100"/>` +
      sparkles([[16, 20, 3], [30, 32, 2.5], [86, 50, 3]])
    ),
    // 1 The Magician: infinity sign above a raised wand, a table with the four suits
    1: () => svg(
      `<path d="M50 20 C44 12 32 12 32 20 C32 28 44 28 50 20 C56 12 68 12 68 20 C68 28 56 28 50 20Z"/>
       <line x1="50" y1="34" x2="50" y2="72" stroke-width="3.2"/>
       <circle cx="50" cy="33" r="2.5" ${solid}/><circle cx="50" cy="73" r="2.5" ${solid}/>
       <line x1="14" y1="82" x2="86" y2="82"/><line x1="20" y1="82" x2="20" y2="104"/><line x1="80" y1="82" x2="80" y2="104"/>` +
      suitIcon("cups", 30, 95, 0.45) + suitIcon("wands", 43, 95, 0.45) +
      suitIcon("swords", 57, 95, 0.45) + suitIcon("pentacles", 70, 95, 0.45) +
      sparkles([[20, 44, 3], [80, 44, 3], [26, 62, 2], [74, 62, 2]])
    ),
    // 2 The High Priestess: a dark pillar and a light pillar, a veil, a crescent
    2: () => svg(
      `<rect x="14" y="26" width="13" height="74" ${solid}/><rect x="73" y="26" width="13" height="74"/>
       <rect x="11" y="20" width="19" height="6"/><rect x="70" y="20" width="19" height="6"/>
       <path d="M27 36 Q50 54 73 36"/>
       <circle cx="50" cy="80" r="13" ${solid}/><circle cx="56" cy="76" r="11" ${paper}/>` +
      sparkles([[50, 20, 4], [40, 62, 2], [60, 60, 2]])
    ),
    // 3 The Empress: the Venus symbol under an arc of stars, with wheat
    3: () => svg(
      `<circle cx="50" cy="48" r="16"/><circle cx="50" cy="48" r="9" ${solid}/>
       <line x1="50" y1="64" x2="50" y2="96"/><line x1="38" y1="82" x2="62" y2="82"/>
       <line x1="16" y1="100" x2="16" y2="54"/><path d="M16 62 l-5 -6 M16 62 l5 -6 M16 72 l-5 -6 M16 72 l5 -6 M16 82 l-5 -6 M16 82 l5 -6"/>
       <line x1="84" y1="100" x2="84" y2="54"/><path d="M84 62 l-5 -6 M84 62 l5 -6 M84 72 l-5 -6 M84 72 l5 -6 M84 82 l-5 -6 M84 82 l5 -6"/>` +
      sparkles([[26, 22, 3], [38, 14, 3], [50, 11, 3.5], [62, 14, 3], [74, 22, 3]])
    ),
    // 4 The Emperor: a solid crown over steady steps
    4: () => svg(
      `<path ${solid} d="M26 56 V28 L38 42 L50 20 L62 42 L74 28 V56Z"/>
       <rect x="24" y="56" width="52" height="9"/>
       <circle cx="26" cy="24" r="3" ${solid}/><circle cx="50" cy="15" r="3" ${solid}/><circle cx="74" cy="24" r="3" ${solid}/>
       <path d="M18 100 H82 M24 92 H76 M30 84 H70 M36 76 H64"/>` +
      sparkles([[14, 40, 3], [86, 40, 3]])
    ),
    // 5 The Hierophant: two crossed keys
    5: () => {
      const key = `<circle cx="0" cy="-26" r="7"/><circle cx="0" cy="-26" r="2.5" ${solid}/>
                   <line x1="0" y1="-19" x2="0" y2="24"/><path d="M0 14 H7 M0 20 H6 M0 24 H8"/>`;
      return svg(
        `<g transform="translate(50 58) rotate(-32)">${key}</g>
         <g transform="translate(50 58) rotate(32)">${key}</g>` +
        sparkles([[50, 14, 4], [18, 90, 3], [82, 90, 3], [20, 30, 2.5], [80, 30, 2.5]])
      );
    },
    // 6 The Lovers: two linked rings beneath a heart
    6: () => svg(
      `<circle cx="40" cy="66" r="18"/><circle cx="60" cy="66" r="18"/>
       <path ${solid} d="M50 40 C36 30 38 14 50 22 C62 14 64 30 50 40Z"/>` +
      sparkles([[22, 30, 3], [78, 30, 3], [50, 98, 4], [16, 96, 2.5], [84, 96, 2.5]])
    ),
    // 7 The Chariot: a starry canopy over a carriage with two wheels
    7: () => svg(
      `<path d="M18 34 Q50 22 82 34"/><line x1="26" y1="32" x2="26" y2="54"/><line x1="74" y1="32" x2="74" y2="54"/>
       <rect x="22" y="54" width="56" height="26"/><path d="M34 54 V80 M66 54 V80"/>
       <circle cx="30" cy="88" r="10"/><circle cx="30" cy="88" r="3" ${solid}/>
       <circle cx="70" cy="88" r="10"/><circle cx="70" cy="88" r="3" ${solid}/>` +
      sparkles([[34, 18, 2.5], [50, 12, 3.5], [66, 18, 2.5], [50, 67, 5]])
    ),
    // 8 Strength (Fortitude): infinity over a gentle flower
    8: () => {
      let petals = "";
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        petals += `<circle cx="${(50 + 13 * Math.cos(a)).toFixed(1)}" cy="${(64 + 13 * Math.sin(a)).toFixed(1)}" r="9"/>`;
      }
      return svg(
        `<path d="M50 22 C44 14 32 14 32 22 C32 30 44 30 50 22 C56 14 68 14 68 22 C68 30 56 30 50 22Z"/>
         ${petals}<circle cx="50" cy="64" r="6" ${solid}/>
         <line x1="50" y1="86" x2="50" y2="104"/><path ${solid} d="M50 96 q-10 -2 -12 -10 q9 1 12 10Z"/>` +
        sparkles([[18, 50, 3], [82, 50, 3], [20, 96, 2.5], [80, 96, 2.5]])
      );
    },
    // 9 The Hermit: a lantern holding a star
    9: () => svg(
      `<circle cx="50" cy="16" r="4"/><path d="M38 32 L50 22 L62 32Z" ${solid}/>
       <rect x="38" y="32" width="24" height="32" rx="2"/><rect x="36" y="64" width="28" height="5" ${solid}/>
       ${sparkle(50, 48, 8)}${rays(50, 48, 22, 30, 10)}
       <line x1="50" y1="69" x2="50" y2="104"/>` +
      sparkles([[14, 92, 2.5], [86, 92, 2.5], [16, 16, 2.5], [84, 16, 2.5]])
    ),
    // 10 Wheel of Fortune: an eight-spoked wheel
    10: () => svg(
      `<circle cx="50" cy="55" r="32"/><circle cx="50" cy="55" r="25"/>
       ${rays(50, 55, 6, 25, 8)}<circle cx="50" cy="55" r="6" ${solid}/>
       ${rays(50, 55, 32, 38, 8, Math.PI / 8)}` +
      sparkles([[12, 12, 3], [88, 12, 3], [12, 100, 3], [88, 100, 3]])
    ),
    // 11 Justice: balanced scales
    11: () => svg(
      `<circle cx="50" cy="16" r="4" ${solid}/><line x1="50" y1="20" x2="50" y2="94"/>
       <line x1="20" y1="30" x2="80" y2="30"/>
       <path d="M24 30 L16 56 M24 30 L32 56 M76 30 L68 56 M76 30 L84 56"/>
       <path ${solid} d="M14 56 H34 Q24 68 14 56Z"/><path ${solid} d="M66 56 H86 Q76 68 66 56Z"/>
       <path d="M36 100 H64 L58 94 H42Z"/>` +
      sparkles([[30, 84, 2.5], [70, 84, 2.5]])
    ),
    // 12 The Hanged Man: a figure hanging calmly, a halo below
    12: () => svg(
      `<line x1="20" y1="14" x2="80" y2="14"/><line x1="50" y1="14" x2="50" y2="32"/>
       <path d="M42 32 H58 L50 66Z"/><circle cx="50" cy="76" r="7" ${solid}/>
       <circle cx="50" cy="76" r="14"/>${rays(50, 76, 18, 24, 12)}` +
      sparkles([[18, 40, 3], [82, 40, 3], [24, 100, 2.5], [76, 100, 2.5]])
    ),
    // 13 Death: a scythe against a setting sun (endings and new beginnings)
    13: () => svg(
      `<line x1="34" y1="96" x2="58" y2="16" stroke-width="3"/>
       <path ${solid} d="M58 16 Q84 20 88 44 Q76 30 56 26Z"/>
       <line x1="8" y1="96" x2="92" y2="96"/><path d="M58 96 A14 14 0 0 1 86 96"/>
       ${rays(72, 96, 18, 24, 7, Math.PI)}` +
      sparkles([[18, 30, 3], [24, 56, 2.5]])
    ),
    // 14 Temperance: water poured between two cups
    14: () => svg(
      suitIcon("cups", 30, 34, 1.3) + suitIcon("cups", 70, 74, 1.3) +
      `<path d="M40 34 Q62 40 66 60" stroke-dasharray="3 5"/>` +
      water(100) + sparkles([[78, 22, 3], [20, 70, 3]])
    ),
    // 15 The Devil: horns over a dark circle, with loose chains
    15: () => svg(
      `<path ${solid} d="M34 40 Q22 22 32 10 Q32 26 42 34Z"/><path ${solid} d="M66 40 Q78 22 68 10 Q68 26 58 34Z"/>
       <circle cx="50" cy="48" r="14" ${solid}/>
       <ellipse cx="38" cy="76" rx="5" ry="7"/><ellipse cx="38" cy="88" rx="5" ry="7"/>
       <ellipse cx="62" cy="76" rx="5" ry="7"/><ellipse cx="62" cy="88" rx="5" ry="7"/>` +
      ground(100)
    ),
    // 16 The Tower: a tower struck by lightning
    16: () => svg(
      `<path d="M36 100 L40 42 H60 L64 100Z"/>
       <path d="M38 42 V34 H44 V38 H50 V34 H56 V38 H62 V34 H62 V42"/>
       <rect x="46" y="54" width="8" height="10" ${solid}/><rect x="46" y="74" width="8" height="10" ${solid}/>
       <path ${solid} d="M84 6 L66 28 L74 28 L60 46 L80 24 L72 24 L88 6Z"/>
       <line x1="8" y1="100" x2="92" y2="100"/>` +
      sparkles([[18, 20, 3], [22, 50, 2.5], [80, 62, 2.5]])
    ),
    // 17 The Star: one great star, small stars, water below
    17: () => svg(
      `<polygon ${solid} points="${starPoints(50, 42, 26, 8, 8)}"/>` +
      sparkles([[16, 16, 3], [84, 16, 3], [14, 50, 2.5], [86, 50, 2.5], [26, 76, 3], [74, 76, 3], [50, 82, 2.5]]) +
      water(96) + water(104)
    ),
    // 18 The Moon: a crescent between two towers, water below
    18: () => svg(
      `<circle cx="48" cy="38" r="22" ${solid}/><circle cx="58" cy="32" r="19" ${paper}/>
       <path d="M12 92 V64 L18 58 L24 64 V92"/><path d="M76 92 V64 L82 58 L88 64 V92"/>` +
      water(98) + sparkles([[22, 18, 3], [82, 22, 2.5], [44, 74, 2.5], [60, 82, 2]])
    ),
    // 19 The Sun: a bright sun with long and short rays
    19: () => svg(
      `<circle cx="50" cy="48" r="16"/><circle cx="50" cy="48" r="10" ${solid}/>
       ${rays(50, 48, 20, 36, 12)}${rays(50, 48, 20, 27, 12, Math.PI / 12)}` +
      ground(96) + sparkles([[12, 12, 3], [88, 12, 3]])
    ),
    // 20 Judgement: a trumpet call with sound rays and clouds
    20: () => svg(
      `<line x1="22" y1="74" x2="64" y2="30" stroke-width="3"/>
       <path ${solid} d="M60 26 L84 12 L74 40Z"/>
       <path d="M84 48 q-6 4 -14 0 M90 56 q-10 6 -22 0"/>
       <path d="M10 96 q8 -12 18 -4 q8 -12 20 -2 q10 -10 20 0 q10 -8 22 4"/>` +
      sparkles([[16, 22, 3], [34, 14, 2.5], [86, 74, 2.5]])
    ),
    // 21 The World: a laurel wreath around a star
    21: () => {
      let leaves = "";
      for (let i = 0; i < 18; i++) {
        const a = (Math.PI * 2 * i) / 18;
        const x = 50 + 26 * Math.cos(a), y = 55 + 36 * Math.sin(a);
        const dx = 6 * Math.cos(a + 0.6), dy = 6 * Math.sin(a + 0.6);
        leaves += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + dx).toFixed(1)}" y2="${(y + dy).toFixed(1)}"/>`;
      }
      return svg(
        `<ellipse cx="50" cy="55" rx="26" ry="36"/>${leaves}${sparkle(50, 55, 12)}` +
        sparkles([[12, 12, 3.5], [88, 12, 3.5], [12, 100, 3.5], [88, 100, 3.5]])
      );
    }
  };

  // ---------- Card back (same for every card) ----------
  // Drawn in the card-front color on a dark background.
  const BACK = svg(
    `<g stroke="var(--card-front)" style="stroke: var(--card-front)">
       <rect x="6" y="6" width="88" height="128" rx="6"/>
       <rect x="11" y="11" width="78" height="118" rx="3"/>
       <circle cx="50" cy="70" r="22"/>
       ${rays(50, 70, 26, 36, 16)}
       <path d="M38 52 A20 20 0 1 0 62 52" />
     </g>
     <g style="fill: var(--card-front)">
       ${sparkle(50, 70, 9).replace(solid, "")}
       ${sparkle(50, 22, 4).replace(solid, "")}${sparkle(50, 118, 4).replace(solid, "")}
       ${sparkle(24, 30, 2.5).replace(solid, "")}${sparkle(76, 30, 2.5).replace(solid, "")}
       ${sparkle(24, 110, 2.5).replace(solid, "")}${sparkle(76, 110, 2.5).replace(solid, "")}
     </g>`,
    "0 0 100 140"
  );

  // ---------- Roman numerals for the top of each card ----------
  function roman(n) {
    if (n === 0) return "0";
    const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
    let out = "";
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  }

  const COURT_RANKS = { 11: "page", 12: "knight", 13: "queen", 14: "king" };

  // ---------- Public functions used by index.html ----------

  // Returns { numeral, art } for one card object from cards.json.
  window.cardArt = function (card) {
    if (card.type === "major") {
      const draw = MAJOR[card.value_int] || (() => svg(sparkle(50, 55, 20)));
      return { numeral: roman(card.value_int), art: draw() };
    }
    const n = card.value_int;
    if (n <= 10) return { numeral: roman(n), art: pipArt(card.suit, n) };
    return { numeral: COURT_RANKS[n].toUpperCase(), art: courtArt(card.suit, COURT_RANKS[n]) };
  };

  window.cardBackArt = BACK;
})();
