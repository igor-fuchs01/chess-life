-- Chess Life — physical model, part 1: database and tables.
-- Implements the logical model in .docs/03-database.md. Requires MySQL 8.0.16 or later, which enforces CHECK constraints.
-- Run it before 02-seed.sql. It can run again safely: existing objects are kept.

CREATE DATABASE IF NOT EXISTS chess_life;

USE chess_life;

-- A person with an account (RF01–RF05). Strong entity.
CREATE TABLE IF NOT EXISTS usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL,
    -- bcrypt hashes are always 60 characters; the plain password is never stored.
    senha_hash CHAR(60) NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

-- A known opening and the SAN moves that define it. Strong entity.
CREATE TABLE IF NOT EXISTS abertura (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(60) NOT NULL,
    -- Empty only for "Abertura irregular", the opening of games that match no other row.
    lances VARCHAR(100) NOT NULL,
    CONSTRAINT uq_abertura_lances UNIQUE (lances)
) ;

-- Optional chess details of a user: 1:1 with usuario, identifying relationship (the FK is the PK).
CREATE TABLE IF NOT EXISTS perfil (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rating INT NULL,
    ano_inicio YEAR NULL,
    bio VARCHAR(280) NULL,
    fk_usuario INT NOT NULL,
    fk_abertura_favorita INT NULL,
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario (id),
    CONSTRAINT fk_perfil_abertura FOREIGN KEY (fk_abertura_favorita) REFERENCES abertura (id)
) ;

-- A game played on the site: 1:N with usuario and with abertura, non-identifying relationships.
CREATE TABLE IF NOT EXISTS partida (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    fk_abertura INT NOT NULL,
    resultado VARCHAR(7) NOT NULL,
    adversario VARCHAR(6) NOT NULL,
    cor VARCHAR(7) NOT NULL,
    -- Set by the database when the game is saved, so it is never in the future (RN05).
    data_partida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partida_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario (id),
    CONSTRAINT fk_partida_abertura FOREIGN KEY (fk_abertura) REFERENCES abertura (id),
    CONSTRAINT chk_partida_resultado CHECK (resultado IN ('vitoria', 'derrota', 'empate')),
    CONSTRAINT chk_partida_adversario CHECK (adversario IN ('humano', 'ia')),
    CONSTRAINT chk_partida_cor CHECK (cor IN ('brancas', 'pretas')),
) ;

-- One move of a game: weak entity, 1:N with partida, identifying relationship.
-- Deleting a game deletes its moves (RN03).
CREATE TABLE IF NOT EXISTS lance (
    fk_partida INT NOT NULL,
    -- Half-move number: 1 is White's first move, 2 is Black's reply.
    numero INT NOT NULL,
    san VARCHAR(10) NOT NULL,
    PRIMARY KEY (fk_partida, numero),
    CONSTRAINT fk_lance_partida FOREIGN KEY (fk_partida) REFERENCES partida (id) ON DELETE CASCADE,
    CONSTRAINT chk_lance_numero CHECK (numero >= 1)
) ;
