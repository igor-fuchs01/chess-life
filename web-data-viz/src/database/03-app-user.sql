DROP USER IF EXISTS 'chess_life_user'@'localhost';
CREATE USER 'chess_life_user'@'localhost' IDENTIFIED BY 'Urubu100';

-- PERMISSIONS
GRANT SELECT, INSERT ON chess_life.usuario TO 'chess_life_user'@'localhost';
GRANT SELECT, INSERT, UPDATE ON chess_life.perfil TO 'chess_life_user'@'localhost';
GRANT SELECT ON chess_life.lista TO 'chess_life_user'@'localhost';
GRANT SELECT ON chess_life.exercicio TO 'chess_life_user'@'localhost';
GRANT SELECT ON chess_life.lista_exercicio TO 'chess_life_user'@'localhost';
GRANT SELECT, INSERT ON chess_life.tentativa TO 'chess_life_user'@'localhost';
