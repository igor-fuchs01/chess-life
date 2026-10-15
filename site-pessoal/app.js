// "producao" reads .env (remote database); "desenvolvimento" reads .env.dev (local database).
const ENVIRONMENT = "desenvolvimento";
const ENVIRONMENT_FILE = ENVIRONMENT === "producao" ? ".env" : ".env.dev";

require("dotenv").config({ path: ENVIRONMENT_FILE });

const express = require("express");
const cors = require("cors");
const path = require("path");

const usuariosRouter = require("./src/routes/usuarios");
const partidasRouter = require("./src/routes/partidas");

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use("/usuarios", usuariosRouter);
app.use("/partidas", partidasRouter);

app.listen(process.env.APP_PORT, function () {
    console.log(`
    ##   ##  ######   #####             ####       ##     ######     ##              ##  ##    ####    ######  
    ##   ##  ##       ##  ##            ## ##     ####      ##      ####             ##  ##     ##         ##  
    ##   ##  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##        ##   
    ## # ##  ####     #####    ######   ##  ##   ######     ##     ######   ######   ##  ##     ##       ##    
    #######  ##       ##  ##            ##  ##   ##  ##     ##     ##  ##            ##  ##     ##      ##     
    ### ###  ##       ##  ##            ## ##    ##  ##     ##     ##  ##             ####      ##     ##      
    ##   ##  ######   #####             ####     ##  ##     ##     ##  ##              ##      ####    ######  
    \n\n\n
    Chess Life running at http://${process.env.APP_HOST}:${process.env.APP_PORT} (${process.env.AMBIENTE_PROCESSO}, reading ${ENVIRONMENT_FILE})`);
});
