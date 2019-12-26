'use strict';

const express = require('express');
const router = express.Router();
let crypto = require('crypto');
const http = require("http");
let mysql = require('mysql');
const socketIO = require("socket.io");

let con = mysql.createConnection({
    host: "mysql-server-80",
    port: "3306",
    user: "viacheslav",
    password: "1234",
    database: "sos"
});
// con.connect(function(err){
//     if(err){
//         console.log('Error connecting to Db');
//         return;
//     }
//     console.log('Connection established');
// });
// con.end(function(err) {
// // The connection is terminated gracefully
//     // Ensures all previously enqueued queries are still
//     // before sending a COM_QUIT packet to the MySQL server.
//     if(err) console.log('err: ', err);
//     else console.log('Terminated done: ');
// });
  

// Constants
const PORT = 8080;
const HOST = '0.0.0.0';


// App
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json())


let nsp = io.of('/chat')
nsp.on("connection", socket => {
    socket.on("join", (join_data) => {
        console.log("----------------------- ROOM JOIN ---------------------------")
        console.log(`${join_data.user} joins ${join_data.room}`)
        socket.join(join_data.room)
        nsp.to(join_data.room).emit('joined', {"room": join_data.room})
    })

    socket.on("message", message_data => {
        console.log(`*** Message - ${message_data}`)
        nsp.to(message_data.room).emit('message', message_data.message)
    })
})


app.get('/', (req, res) => {
  res.send('Hellodsfsdfsdfsdforld\n');
});


app.post('/login', (req, res) => {
    let json = req.body;
    let email = json.email;
    let passwd = json.password;
    let passwd_sha256 = crypto.createHash('sha256').update(passwd).digest('hex');
    con.query("SELECT * FROM sos.users WHERE email = '" + email + "' AND password = '" + passwd_sha256 + "'", function (err, result, fields) {
        if (err) throw err;
        if ( result.length == 0 ) {
            res.status(403).send('Not Acceptable')
        }
        console.log(result);
        if ( result.length > 0 ){ 
            res.status(200).json({'email': email})
        }
    });
})

app.post('/register', (req, res) => {
    let json = req.body;
    let email = json.email;
    let passwd = json.password;
    let passwd_sha256 = crypto.createHash('sha256').update(passwd).digest('hex');
    let sql = "INSERT INTO users(email, password) VALUES('" + email + "','" + passwd_sha256 +"')";
    con.query(sql, function (err, result, fields) {
        if (err) {
            res.status(403).send('Not Acceptable')
            throw err;
        }
        console.log("INSERTED", result);
        res.status(200).json({'email': email})
    });
})


app.get('/contacts/:user', (req, res) => {
    let user = req.params.user;
    con.query("SELECT * FROM users", function (err, result, fields) {
        if (err) throw err;
        // console.log(result);
        if ( result.length > 0 ){ 
            res.status(200).json(result)
        }
    });
});
  


server.listen(PORT);
console.log(`Running on http://${HOST}:${PORT}`);