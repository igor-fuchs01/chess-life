-- Chess Life — physical model, part 3: the MySQL user the API connects with.
-- Run it as an administrator (such as root), after 01-schema.sql. It can run again safely.
--   mysql -u root -p < site-pessoal/src/database/03-app-user.sql
-- The API's environment file then gets DB_USER=chess_life_user and the same password in DB_PASSWORD.

-- The password is written here by the author's choice, so it is public with the repository: use it only for local
-- development, and give the VM's user another password with ALTER USER.
-- IF NOT EXISTS keeps an existing user and its password: to change it, use ALTER USER.
CREATE USER IF NOT EXISTS 'chess_life_user'@'localhost' IDENTIFIED BY 'Urubu100';

-- Least privilege: only the statements the API runs (.docs/04-api.md). No UPDATE, no table changes, no other database,
-- so a flaw in the API cannot drop tables or rewrite the data.
-- perfil gets no grant: no route uses it yet.
GRANT SELECT, INSERT ON chess_life.usuario TO 'chess_life_user'@'localhost';
GRANT SELECT ON chess_life.abertura TO 'chess_life_user'@'localhost';
GRANT SELECT, INSERT, DELETE ON chess_life.partida TO 'chess_life_user'@'localhost';
GRANT SELECT, INSERT, DELETE ON chess_life.lance TO 'chess_life_user'@'localhost';
