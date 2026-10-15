// Check and mate marks do not change which opening was played.
const CHECK_MARKS = /[+#]/g;

/**
 * Finds the opening of a game: the known opening with the longest move sequence that the game starts with,
 * such as "Giuoco Piano" (e4 e5 Nf3 Nc6 Bc4 Bc5) over "Abertura Italiana" (e4 e5 Nf3 Nc6 Bc4).
 * A game that matches none gets the opening with empty lances, "Abertura irregular".
 * @param {string[]} moves - The game's moves in SAN, such as ["e4", "e5", "Nf3"].
 * @param {{id: number, nome: string, lances: string}[]} openings - The rows of the abertura table.
 * @returns {{id: number, nome: string, lances: string}} The matching opening.
 */
function identifyOpening(moves, openings) {
    // The trailing spaces make every match end on a whole move.
    const gameStart = moves.join(" ").replace(CHECK_MARKS, "") + " ";
    let bestOpening = openings.find((opening) => opening.lances === "");

    for (const opening of openings) {
        const isLonger = opening.lances.length > bestOpening.lances.length;

        if (isLonger && gameStart.startsWith(opening.lances + " ")) {
            bestOpening = opening;
        }
    }

    return bestOpening;
}

module.exports = {
    identifyOpening
};
