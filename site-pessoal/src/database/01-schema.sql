CREATE DATABASE IF NOT EXISTS chess_life;

USE chess_life;

-- A person with an account.
CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(80) NOT NULL,
    email VARCHAR(120) NOT NULL,
    senha VARCHAR(100) NOT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

-- Chess details of a user: 1:1 with usuario, non-identifying relationship.
-- abertura_favorita is the name of an opening from the list mocked in the front-end, stored as text with no table.
CREATE TABLE perfil (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rating INT NULL,
    ano_inicio YEAR NULL,
    bio VARCHAR(280) NULL,
    abertura_favorita VARCHAR(50) NULL,
    fk_usuario INT NOT NULL,
    CONSTRAINT uq_perfil_usuario UNIQUE (fk_usuario),
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
);

-- An exercise list, one per level: "Mate em 1", "Mate em 2" and "Mate em 3". Strong entity.
CREATE TABLE lista (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(40) NOT NULL,
    descricao VARCHAR(120) NOT NULL,
    ordem INT NOT NULL,
    CONSTRAINT uq_lista_nome UNIQUE (nome),
    CONSTRAINT uq_lista_ordem UNIQUE (ordem),
    CONSTRAINT chk_lista_ordem CHECK (ordem >= 1)
);

-- A position to solve, in FEN, always with White to move: the user plays White. Strong entity.
-- The solution is the moves in SAN separated by spaces, the user's moves first and then the replies in turn.
CREATE TABLE exercicio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(60) NOT NULL,
    fen VARCHAR(100) NOT NULL,
    solucao VARCHAR(100) NOT NULL,
    CONSTRAINT uq_exercicio_fen UNIQUE (fen)
);

-- An exercise in a list, at a given place: N:N between lista and exercicio, identifying relationships.
CREATE TABLE lista_exercicio (
    fk_lista INT NOT NULL,
    fk_exercicio INT NOT NULL,
    ordem INT NOT NULL,
    PRIMARY KEY (fk_lista, fk_exercicio),
    CONSTRAINT uq_lista_exercicio_ordem UNIQUE (fk_lista, ordem),
    CONSTRAINT fk_lista_exercicio_lista FOREIGN KEY (fk_lista) REFERENCES lista (id),
    CONSTRAINT fk_lista_exercicio_exercicio FOREIGN KEY (fk_exercicio) REFERENCES exercicio (id),
    CONSTRAINT chk_lista_exercicio_ordem CHECK (ordem >= 1)
);

-- One attempt of a user at an exercise of a list, right or wrong: 1:N with usuario and with lista_exercicio,
-- non-identifying relationships. The composite foreign key keeps every attempt at an exercise that is in its list.
CREATE TABLE tentativa (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_usuario INT NOT NULL,
    fk_lista INT NOT NULL,
    fk_exercicio INT NOT NULL,
    acertou BOOLEAN NOT NULL,
    data_tentativa DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tentativa_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario (id),
    CONSTRAINT fk_tentativa_lista_exercicio FOREIGN KEY (fk_lista, fk_exercicio) REFERENCES lista_exercicio (fk_lista, fk_exercicio)
);
