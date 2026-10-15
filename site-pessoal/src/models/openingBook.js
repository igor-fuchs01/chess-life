// Known openings and the moves, in standard algebraic notation (SAN), that define each one.
// A longer sequence is a more specific line of a shorter one, such as "Giuoco Piano" inside "Abertura Italiana".
var OPENINGS = [
    { name: "Abertura do Peão do Rei", moves: "e4" },
    { name: "Abertura do Peão da Dama", moves: "d4" },
    { name: "Abertura Inglesa", moves: "c4" },
    { name: "Abertura Réti", moves: "Nf3" },
    { name: "Abertura Bird", moves: "f4" },
    { name: "Abertura Larsen", moves: "b3" },
    { name: "Abertura Húngara", moves: "g3" },

    { name: "Abertura Italiana", moves: "e4 e5 Nf3 Nc6 Bc4" },
    { name: "Giuoco Piano", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5" },
    { name: "Gambito Evans", moves: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4" },
    { name: "Defesa dos Dois Cavalos", moves: "e4 e5 Nf3 Nc6 Bc4 Nf6" },
    { name: "Abertura Espanhola", moves: "e4 e5 Nf3 Nc6 Bb5" },
    { name: "Espanhola: Defesa Morphy", moves: "e4 e5 Nf3 Nc6 Bb5 a6" },
    { name: "Espanhola: Defesa Berlinense", moves: "e4 e5 Nf3 Nc6 Bb5 Nf6" },
    { name: "Abertura Escocesa", moves: "e4 e5 Nf3 Nc6 d4" },
    { name: "Abertura dos Quatro Cavalos", moves: "e4 e5 Nf3 Nc6 Nc3 Nf6" },
    { name: "Defesa Petrov", moves: "e4 e5 Nf3 Nf6" },
    { name: "Defesa Philidor", moves: "e4 e5 Nf3 d6" },
    { name: "Gambito do Rei", moves: "e4 e5 f4" },
    { name: "Abertura Vienense", moves: "e4 e5 Nc3" },
    { name: "Abertura do Bispo", moves: "e4 e5 Bc4" },
    { name: "Abertura Central", moves: "e4 e5 d4 exd4" },

    { name: "Defesa Siciliana", moves: "e4 c5" },
    { name: "Siciliana: Najdorf", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6" },
    { name: "Siciliana: Dragão", moves: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6" },
    { name: "Siciliana: Dragão Acelerado", moves: "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6" },
    { name: "Siciliana: Fechada", moves: "e4 c5 Nc3" },
    { name: "Siciliana: Alapin", moves: "e4 c5 c3" },
    { name: "Siciliana: Gambito Smith-Morra", moves: "e4 c5 d4 cxd4 c3" },
    { name: "Defesa Francesa", moves: "e4 e6" },
    { name: "Defesa Caro-Kann", moves: "e4 c6" },
    { name: "Defesa Escandinava", moves: "e4 d5" },
    { name: "Defesa Alekhine", moves: "e4 Nf6" },
    { name: "Defesa Pirc", moves: "e4 d6" },
    { name: "Defesa Moderna", moves: "e4 g6" },

    { name: "Gambito da Dama", moves: "d4 d5 c4" },
    { name: "Gambito da Dama Aceito", moves: "d4 d5 c4 dxc4" },
    { name: "Gambito da Dama Recusado", moves: "d4 d5 c4 e6" },
    { name: "Defesa Eslava", moves: "d4 d5 c4 c6" },
    { name: "Sistema Londres", moves: "d4 d5 Bf4" },
    { name: "Sistema Londres", moves: "d4 Nf6 Bf4" },
    { name: "Sistema Londres", moves: "d4 d5 Nf3 Nf6 Bf4" },
    { name: "Defesa Índia", moves: "d4 Nf6" },
    { name: "Defesa Índia do Rei", moves: "d4 Nf6 c4 g6" },
    { name: "Defesa Grünfeld", moves: "d4 Nf6 c4 g6 Nc3 d5" },
    { name: "Defesa Nimzo-Índia", moves: "d4 Nf6 c4 e6 Nc3 Bb4" },
    { name: "Defesa Índia da Dama", moves: "d4 Nf6 c4 e6 Nf3 b6" },
    { name: "Defesa Benoni", moves: "d4 Nf6 c4 c5" },
    { name: "Defesa Holandesa", moves: "d4 f5" }
];
var UNKNOWN_OPENING = "Abertura irregular";
// Check and mate marks do not change which opening was played.
var CHECK_MARKS = /[+#]/g;

/**
 * Finds the opening of a game: the known opening with the longest move sequence that the game starts with.
 * @param {string[]} moves - The game's moves in SAN, such as ["e4", "e5", "Nf3"].
 * @returns {string} The opening name, or UNKNOWN_OPENING when no known opening matches.
 */
function identifyOpening(moves) {
    // The trailing spaces make every match end on a whole move.
    const gameStart = moves.join(" ").replace(CHECK_MARKS, "") + " ";
    let opening = UNKNOWN_OPENING;
    let openingLength = 0;

    for (const knownOpening of OPENINGS) {
        const isLonger = knownOpening.moves.length > openingLength;

        if (isLonger && gameStart.startsWith(knownOpening.moves + " ")) {
            opening = knownOpening.name;
            openingLength = knownOpening.moves.length;
        }
    }

    return opening;
}

module.exports = {
    identifyOpening
};
