USE chess_life;

-- The three lists, one per level.
INSERT INTO lista (id, nome, descricao, ordem) VALUES
    (1, 'Mate em 1', 'Um lance para dar xeque-mate.', 1),
    (2, 'Mate em 2', 'Dois lances seus, com uma resposta do adversário no meio.', 2),
    (3, 'Mate em 3', 'Três lances seus para encurralar o rei.', 3);

-- The positions, in FEN, and their solutions in SAN. The side to move is the side the user plays.
INSERT INTO exercicio (id, titulo, fen, solucao) VALUES
    (1, 'Mate do Louco', 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 1', 'Qh4#'),
    (2, 'Mate do Pastor', 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 1', 'Qxf7#'),
    (3, 'Mate sufocado na Caro-Kann', 'r1bqkb1r/pp1npppp/2p2n2/8/3PN3/8/PPP1QPPP/R1B1KBNR w KQkq - 0 1', 'Nd6#'),
    (4, 'Armadilha do Gambito Budapeste', 'r1b1k2r/ppppqppp/2n5/4n3/1PP2B2/5N2/1P1NPPPP/R2QKB1R b KQkq - 0 1', 'Nd3#'),
    (5, 'Mate árabe', '7k/7p/5N2/8/8/8/8/6RK w - - 0 1', 'Rg8#'),
    (6, 'Mate de Légal', 'rn1qkbnr/ppp2p1p/3p2p1/4N3/2B1P3/2N5/PPPP1PPP/R1BbK2R w KQkq - 0 1', 'Bxf7+ Ke7 Nd5#'),
    (7, 'Partida da Ópera', '4kb1r/p2n1ppp/4q3/4p1B1/4P3/1Q6/PPP2PPP/2KR4 w k - 0 1', 'Qb8+ Nxb8 Rd8#'),
    (8, 'Sacrifício de dama na oitava', 'r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 0 1', 'Qd8+ Bxd8 Re8#'),
    (9, 'Sacrifício de dama na primeira', 'r3r1k1/ppp2ppp/2p5/5Q2/1b1q4/8/PPP1BPPP/R1B2K1R b - - 0 1', 'Qd1+ Bxd1 Re1#'),
    (10, 'Mate de Damiano', '6k1/ppp2ppp/8/8/7q/5Pp1/PPP1B2P/3NR1K1 b - - 0 1', 'Qxh2+ Kf1 Qh1#'),
    (11, 'Réti contra Tartakower', 'rnb1kb1r/pp3ppp/2p5/4q3/4n3/3Q4/PPPB1PPP/2KR1BNR w kq - 0 1', 'Qd8+ Kxd8 Bg5+ Kc7 Bd8#'),
    (12, 'Partida Sempre-Viva', '1r4r1/pbpknp1p/1b3P2/8/8/B1PB1q2/P4PPP/3R2K1 w - - 0 1', 'Bf5+ Ke8 Bd7+ Kf8 Bxe7#'),
    (13, 'Partida Imortal', 'r1b1k1nr/p2p1ppp/n2B4/1p1NPN1P/6P1/3P1Q2/P1P1K3/q5b1 w kq - 0 1', 'Nxg7+ Kd8 Qf6+ Nxf6 Be7#'),
    (14, 'Mate de Anastasia', '6k1/ppp2ppp/4r3/8/3n3q/8/PPP2PPP/RQ3RK1 b - - 0 1', 'Ne2+ Kh1 Qxh2+ Kxh2 Rh6#'),
    (15, 'Mate sufocado', '2r2rk1/1p3Npp/p3Q3/q7/8/8/PP3PPP/6K1 w - - 0 1', 'Nh6+ Kh8 Qg8+ Rxg8 Nf7#');

-- Each exercise in its list, at its place.
INSERT INTO lista_exercicio (fk_lista, fk_exercicio, ordem) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5),
    (2, 6, 1), (2, 7, 2), (2, 8, 3), (2, 9, 4), (2, 10, 5),
    (3, 11, 1), (3, 12, 2), (3, 13, 3), (3, 14, 4), (3, 15, 5);
