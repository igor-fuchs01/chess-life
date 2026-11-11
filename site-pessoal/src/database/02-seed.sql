USE chess_life;

-- The three lists, one per level.
INSERT INTO lista (id, nome, descricao, ordem) VALUES
    (1, 'Mate em 1', 'Um lance para dar xeque-mate.', 1),
    (2, 'Mate em 2', 'Dois lances seus, com uma resposta do adversário no meio.', 2),
    (3, 'Mate em 3', 'Três lances seus para encurralar o rei.', 3);

-- The positions and their solutions in SAN. White is always to move: the user plays White.
-- A position lists each piece with its square: uppercase is White, lowercase is Black, P/p is a pawn.
-- The patterns first played by Black are mirrored, with the board upside down and the colors swapped.
INSERT INTO exercicio (id, titulo, posicao, solucao) VALUES
    (1, 'Mate do Louco', 'Ke1 Qd1 Ra1 Rh1 Bc1 Bf1 Nb1 Ng1 Pa2 Pb2 Pc2 Pd2 Pf2 Pg2 Ph2 Pe4 ke8 qd8 ra8 rh8 bc8 bf8 nb8 ng8 pg5 pf6 pa7 pb7 pc7 pd7 pe7 ph7', 'Qh5#'),
    (2, 'Mate do Pastor', 'Ke1 Qh5 Ra1 Rh1 Bc1 Bc4 Nb1 Ng1 Pa2 Pb2 Pc2 Pd2 Pf2 Pg2 Ph2 Pe4 ke8 qd8 ra8 rh8 bc8 bf8 nc6 nf6 pe5 pa7 pb7 pc7 pd7 pf7 pg7 ph7', 'Qxf7#'),
    (3, 'Mate sufocado na Caro-Kann', 'Ke1 Qe2 Ra1 Rh1 Bc1 Bf1 Ng1 Ne4 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 Pd4 ke8 qd8 ra8 rh8 bc8 bf8 nf6 nd7 pc6 pa7 pb7 pe7 pf7 pg7 ph7', 'Nd6#'),
    (4, 'Armadilha do Gambito Budapeste', 'Ke1 Qe2 Ra1 Rh1 Bc1 Nc3 Ne4 Pa2 Pb2 Pc2 Pd2 Pf2 Pg2 Ph2 ke8 qd8 ra8 rh8 bf5 bf8 nf6 nd7 pb5 pc5 pb7 pe7 pf7 pg7 ph7', 'Nd6#'),
    (5, 'Mate árabe', 'Kh1 Rg1 Nf6 kh8 ph7', 'Rg8#'),
    (6, 'Mate de Légal', 'Ke1 Ra1 Rh1 Bc1 Bc4 Nc3 Ne5 Pa2 Pb2 Pc2 Pd2 Pf2 Pg2 Ph2 Pe4 ke8 qd8 ra8 rh8 bd1 bf8 nb8 ng8 pd6 pg6 pa7 pb7 pc7 pf7 ph7', 'Bxf7+ Ke7 Nd5#'),
    (7, 'Partida da Ópera', 'Kc1 Qb3 Rd1 Bg5 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 Pe4 ke8 qe6 rh8 bf8 nd7 pe5 pa7 pf7 pg7 ph7', 'Qb8+ Nxb8 Rd8#'),
    (8, 'Sacrifício de dama na oitava', 'Kg1 Qd5 Ra1 Re1 Bb5 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 Pc3 kf8 qf4 ra8 rh8 be7 bc8 pa7 pb7 pc7 pf7 pg7 ph7', 'Qd8+ Bxd8 Re8#'),
    (9, 'Sacrifício de dama em e8', 'Kb1 Qe5 Rd1 Rh1 Bg5 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 Pf3 kc8 qc4 ra8 rh8 bd7 bf8 pa7 pb7 pc7 pf7 pg7 ph7', 'Qe8+ Bxe8 Rd8#'),
    (10, 'Mate de Damiano', 'Kg1 Qh5 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 Pg6 kg8 re8 be7 nd8 pf6 pa7 pb7 pc7 ph7', 'Qxh7+ Kf8 Qh8#'),
    (11, 'Réti contra Tartakower', 'Kc1 Qd3 Rd1 Rh1 Bf1 Bd2 Ng1 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 ke8 qe5 ra8 rh8 bc8 bf8 ne4 nb8 pc6 pa7 pb7 pf7 pg7 ph7', 'Qd8+ Kxd8 Bg5+ Kc7 Bd8#'),
    (12, 'Partida Sempre-Viva', 'Kg1 Rd1 Ba3 Bd3 Pa2 Pf2 Pg2 Ph2 Pc3 Pf6 kd7 qf3 rb8 rg8 bb6 bb7 ne7 pa7 pc7 pf7 ph7', 'Bf5+ Ke8 Bd7+ Kf8 Bxe7#'),
    (13, 'Partida Imortal', 'Ke2 Qf3 Bd6 Nd5 Nf5 Pa2 Pc2 Pd3 Pg4 Pe5 Ph5 ke8 qa1 ra8 rh8 bg1 bc8 na6 ng8 pb5 pa7 pd7 pf7 pg7 ph7', 'Nxg7+ Kd8 Qf6+ Nxf6 Be7#'),
    (14, 'Mate de Anastasia', 'Kg1 Qh5 Re3 Nd5 Pa2 Pb2 Pc2 Pf2 Pg2 Ph2 kg8 qb8 ra8 rf8 pa7 pb7 pc7 pf7 pg7 ph7', 'Ne7+ Kh8 Qxh7+ Kxh7 Rh3#'),
    (15, 'Mate sufocado', 'Kg1 Qe6 Nf7 Pa2 Pb2 Pf2 Pg2 Ph2 kg8 qa5 rc8 rf8 pa6 pb7 pg7 ph7', 'Nh6+ Kh8 Qg8+ Rxg8 Nf7#');

-- Each exercise in its list, at its place.
INSERT INTO lista_exercicio (fk_lista, fk_exercicio, ordem) VALUES
    (1, 1, 1), (1, 2, 2), (1, 3, 3), (1, 4, 4), (1, 5, 5),
    (2, 6, 1), (2, 7, 2), (2, 8, 3), (2, 9, 4), (2, 10, 5),
    (3, 11, 1), (3, 12, 2), (3, 13, 3), (3, 14, 4), (3, 15, 5);
