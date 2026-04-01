const express = require('express')
const app = express()
const mysql = require("mysql2")
const { spawn } = require('child_process')
const path = require('path')

const cors = require('cors')
app.use(cors())

// body 파싱 미들웨어 먼저!
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const conn = require('./config/db')
const GPT_API_KEY = require('./config/api')

const userRouter = require('./routes/user')
const uploadRouter = require('./routes/upload')

app.use('/uploads', express.static('uploads'))
app.use('/upload', uploadRouter)
app.use('/user', userRouter)

// Python 실행
const pythonFilePath = path.join(__dirname, '..', 'youtube', 'main.py')
const pythonProcess = spawn('python', [pythonFilePath], {
  stdio: 'inherit',
  shell: true
})
pythonProcess.on('error', (err) => { console.error('Python 실행 오류:', err) })
pythonProcess.on('close', (code) => { console.log(`Python 프로세스 종료됨, 종료코드: ${code}`) })

app.get("/category", (req, res) => {
    conn.query("SELECT * FROM T_CATEGORY", (err, result) => {
        if (err) return res.status(500).json([]);
        res.json(result);
    });
});

app.get("/content", (req, res) => {
  const sql = `
    SELECT 
      tc.*,
      GROUP_CONCAT(ck.KEYWORD SEPARATOR ' ') AS KEYWORDS
    FROM TREND_CONTENT tc
    LEFT JOIN CONTENT_KEYWORD ck
      ON tc.CONTENT_ID = ck.CONTENT_ID
    GROUP BY tc.CONTENT_ID
    ORDER BY tc.CREATED_AT DESC
    LIMIT 100
  `
  conn.query(sql, (err, result) => {
    if (err) { console.error(err); res.status(500).send("DB 오류") }
    else { res.json(result) }
  })
})

app.listen(3002, () => {
  console.log("서버 실행 중: http://localhost:3002")
})