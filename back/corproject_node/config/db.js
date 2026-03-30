const mysql = require('mysql2')

const conn = mysql.createConnection({
    host : 'project-db-campus.smhrd.com',
    port : 3307,
    database : 'cgi_25k_da3_p2_2',
    password : 'smhrd2',
    user : 'cgi_25k_da3_p2_2'
})

conn.connect()
console.log('DB 연결 완료')

module.exports = conn