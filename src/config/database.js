const mysql = require('mysql2');


const db = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "stay_here_db",
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
});

db.on('error', function (err) {
    console.error("DB dead: ", err);
})


module.exports = db