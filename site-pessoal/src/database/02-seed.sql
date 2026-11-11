USE chess_life;

-- The three lists, one per level.
INSERT INTO lista (id, nome, descricao, ordem) VALUES
    (1, 'Mate em 1', 'Um lance para dar xeque-mate.', 1),
    (2, 'Mate em 2', 'Dois lances seus, com uma resposta do adversário no meio.', 2),
    (3, 'Mate em 3', 'Três lances seus para encurralar o rei.', 3);

-- The positions, in FEN, and their solutions in SAN. White is always to move: the user plays White.
-- The patterns first played by Black are mirrored, with the board upside down and the colors swapped.
INSERT INTO exercicio (id, titulo, fen, solucao) VALUES
    (1, 'Mate do Louco', 'rnbqkbnr/ppppp2p/5p2/6p1/4P3/8/PPPP1PPP/RNBQKBNR w KQkq g6 0 1', 'Qh5#'),
    (2, 'Mate do Pastor', 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', 'Qxf7#'),
    (3, 'Mate sufocado na Caro-Kann', 'r1bqkb1r/pp1npppp/2p2n2/8/3PN3/8/PPP1QPPP/R1B1KBNR w KQkq - 0 1', 'Nd6#'),
    (4, 'Armadilha do Gambito Budapeste', 'r2qkb1r/1p1npppp/5n2/1pp2b2/4N3/2N5/PPPPQPPP/R1B1K2R w KQkq - 0 1', 'Nd6#'),
    (5, 'Mate árabe', '7k/7p/5N2/8/8/8/8/6RK w - - 0 1', 'Rg8#'),
    (6, 'Mate de Légal', 'rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 1', 'Bxf7+ Ke7 Nd5#'),
    (7, 'Partida da Ópera', '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1', 'Qb8+ Nxb8 Rd8#'),
    (8, 'Sacrifício de dama na oitava', 'r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 0 1', 'Qd8+ Bxd8 Re8#'),
    (9, 'Sacrifício de dama em e8', 'r1k2b1r/pppb1ppp/8/4Q1B1/2q5/5P2/PPP2PPP/1K1R3R w - - 0 1', 'Qe8+ Bxe8 Rd8#'),
    (10, 'Mate de Damiano', '3nr1k1/ppp1b2p/5pP1/7Q/8/8/PPP2PPP/6K1 w - - 0 1', 'Qxh7+ Kf8 Qh8#'),
    (11, 'Réti contra Tartakower', 'rnb1kb1r/pp3ppp/2p5/4q3/4n3/3Q4/PPPB1PPP/2KR1BNR w kq - 0 1', 'Qd8+ Kxd8 Bg5+ Kc7 Bd8#'),
    (12, 'Partida Sempre-Viva', '1r4r1/pbpknp1p/1b3P2/8/8/B1PB1q2/P4PPP/3R2K1 w - - 0 1', 'Bf5+ Ke8 Bd7+ Kf8 Bxe7#'),
    (13, 'Partida Imortal', 'r1b1k1nr/p2p1ppp/n2B4/1p1NPN1P/6P1/3P1Q2/P1P1K3/q5b1 w kq - 0 1', 'Nxg7+ Kd8 Qf6+ Nxf6 Be7#'),
    (14, 'Mate de Anastasia', 'rq3rk1/ppp2ppp/8/3N3Q/8/4R3/PPP2PPP/6K1 w - - 0 1', 'Ne7+ Kh8 Qxh7+ Kxh7 Rh3#'),
    (15, 'Mate sufocado', '2r2rk1/1p3Npp/p3Q3/q7/8/8/PP3PPP/6K1 w - - 0 1', 'Nh6+ Kh8 Qg8+ Rxg8 Nf7#');

-- Each exercise in its list, at its place.
INSERT INTO lista_exercicio (fk_lista, fk_exercicio, ordem) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5),
    (2, 6, 1), (2, 7, 2), (2, 8, 3), (2, 9, 4), (2, 10, 5),
    (3, 11, 1), (3, 12, 2), (3, 13, 3), (3, 14, 4), (3, 15, 5);
