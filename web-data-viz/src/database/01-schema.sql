CREATE DATABASE IF NOT EXISTS chess_life;

USE chess_life;

CREATE TABLE usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL
);

CREATE TABLE perfil (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(80) NOT NULL,
    rating INT NULL,
    ano_inicio YEAR NULL,
    bio VARCHAR(280) NULL,
    abertura_favorita VARCHAR(50) NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fk_usuario INT NOT NULL UNIQUE,
    CONSTRAINT fk_perfil_usuario FOREIGN KEY (fk_usuario) REFERENCES usuario (id)
);

CREATE TABLE lista (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(40) NOT NULL UNIQUE,
    descricao VARCHAR(120) NOT NULL,
    ordem INT NOT NULL UNIQUE,
    CONSTRAINT chk_lista_ordem CHECK (ordem >= 1)
);

CREATE TABLE exercicio (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(60) NOT NULL,
    posicao VARCHAR(150) NOT NULL UNIQUE,
    solucao VARCHAR(100) NOT NULL
);

CREATE TABLE lista_exercicio (
    fk_lista INT NOT NULL,
    fk_exercicio INT NOT NULL,
    ordem INT NOT NULL,
    PRIMARY KEY (fk_lista, fk_exercicio),
    CONSTRAINT fk_lista_exercicio_lista FOREIGN KEY (fk_lista) REFERENCES lista (id),
    CONSTRAINT fk_lista_exercicio_exercicio FOREIGN KEY (fk_exercicio) REFERENCES exercicio (id),
    CONSTRAINT chk_lista_exercicio_ordem CHECK (ordem >= 1)
);

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
