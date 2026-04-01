const express = require('express')
const app = express()
const mysql = require("mysql2")
const { spawn } = require('child_process')
const path = require('path')

// 주소 통신
const cors = require('cors')
app.use(cors())

// DB연결
const conn = require('./config/db')

const GPT_API_KEY = require('./config/api')

//회원 정보 불러오기
const userRouter = require('./routes/user')

app.use(express.json())

app.use('/user', userRouter)

// body 데이터 사용
app.use(express.urlencoded({extended:true}))
app.use(express.json())


// ==============================
// Python main.py 자동 실행 추가
// ==============================
const pythonFilePath = path.join(__dirname, '..', 'youtube', 'main.py')

const pythonProcess = spawn('python', [pythonFilePath], {
  stdio: 'inherit',
  shell: true
})

pythonProcess.on('error', (err) => {
  console.error('Python 실행 오류:', err)
})

pythonProcess.on('close', (code) => {
  console.log(`Python 프로세스 종료됨, 종료코드: ${code}`)
})


// 콘텐츠 조회 API
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
    if (err) {
      console.error(err)
      res.status(500).send("DB 오류")
    } else {
      res.json(result)
    }
  })
})


app.listen(3002, () => {
  console.log("서버 실행 중: http://localhost:3002")
})