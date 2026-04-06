const express = require('express')
const app = express()
const { spawn } = require('child_process')
const path = require('path')
const { runAiScheduler } = require('./routes/gpt')
const searchRouter = require("./routes/search")
const session = require("express-session")
const interactionRouter = require("./routes/interaction");

const cors = require('cors')
app.use(cors({
  origin: true,
  credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/interaction", interactionRouter);

app.use(session({
  secret: "trendformer",
  resave: false,
  saveUninitialized: false
}))

const conn = require('./config/db')
const GPT_API_KEY = require('./config/api')

const userRouter = require('./routes/user')
const uploadRouter = require('./routes/upload')

app.use("/search", searchRouter)
app.use('/uploads', express.static('uploads'))
app.use('/upload', uploadRouter)
app.use('/user', userRouter)

// 유튜브 Python 실행
const pythonFilePath = path.join(__dirname, '..', 'youtube', 'main.py')
const pythonProcess = spawn('python', [pythonFilePath], {
  stdio: 'inherit',
  shell: true
})
pythonProcess.on('error', (err) => { console.error('Python 실행 오류:', err) })
pythonProcess.on('close', (code) => { console.log(`Python 프로세스 종료됨, 종료코드: ${code}`) })

// 인스타 스케줄러 실행
// const instaScheduler = spawn('python', ['scheduler.py'], {
//   cwd: path.join(__dirname, '..', 'insta'),
//   stdio: 'inherit',
//   shell: true
// })
// instaScheduler.on('error', (err) => { console.error('인스타 스케줄러 오류:', err) })
// instaScheduler.on('close', (code) => { console.log(`인스타 스케줄러 종료, 코드: ${code}`) })

// 틱톡 스케줄러 실행
// const tiktokScheduler = spawn('python', ['scheduler.py'], {
//   cwd: path.join(__dirname, '..', 'tiktok'),
//   stdio: 'inherit',
//   shell: true
// })
// tiktokScheduler.on('error', (err) => { console.error('틱톡 스케줄러 오류:', err) })
// tiktokScheduler.on('close', (code) => { console.log(`틱톡 스케줄러 종료, 코드: ${code}`) })

// --- 상원님의 기존 Python 스케줄러 주석 유지 끝 ---

// 카테고리 전체 조회
app.get("/category", (req, res) => {
  const sql = `SELECT * FROM T_CATEGORY ORDER BY CATEGORY_ID ASC`
  conn.query(sql, (err, result) => {
    if (err) return res.status(500).json([])
    res.json(result)
  })
})

// 카테고리별 콘텐츠 조회
app.get('/api/categories/:categoryId/contents', (req, res) => {
  const { categoryId } = req.params
  const sql = `
    SELECT tc.*
    FROM TREND_CONTENT tc
    INNER JOIN CONTENT_CATEGORY cc ON tc.CONTENT_ID = cc.CONTENT_ID
    WHERE cc.CATEGORY_ID = ?
    ORDER BY tc.CREATED_AT DESC
  `
  conn.query(sql, [categoryId], (err, result) => {
    if (err) return res.status(500).json({ message: '카테고리별 콘텐츠 조회 실패' })
    res.json({ categoryId: Number(categoryId), contents: result })
  })
})

// 랭킹 리스트 조회 (데이터 2회 이상 수집된 것만 필터링)
app.get('/api/trend/ranking', (req, res) => {
  console.log("🚀 랭킹 데이터 요청 수신됨!");

  const sql = `
    SELECT 
    tk.KEYWORD_ID,
    tk.KEYWORD_NAME,
    km.LIFECYCLE_STAGE,
    km.GROWTH_RATE,
    km.TOTAL_VIEW_COUNT as LATEST_VIEW,
    km.TOTAL_LIKE_COUNT as LATEST_LIKE,
    km.TOTAL_CONTENT_COUNT,
    -- 영상 수로 나눈 평균 기반 점수
    ((km.TOTAL_VIEW_COUNT / km.TOTAL_CONTENT_COUNT) * 0.2 
     + (km.TOTAL_LIKE_COUNT / km.TOTAL_CONTENT_COUNT) * 0.8) AS ENGAGEMENT_SCORE
FROM T_KEYWORD tk
JOIN KEYWORD_METRIC km ON tk.KEYWORD_ID = km.KEYWORD_ID
WHERE 
    km.LIFECYCLE_STAGE IN ('성장', '성숙')
    AND km.RECORDED_AT >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    AND km.TOTAL_CONTENT_COUNT > 0  -- 0으로 나누기 방지
GROUP BY
    tk.KEYWORD_ID, tk.KEYWORD_NAME, km.LIFECYCLE_STAGE,
    km.GROWTH_RATE, km.TOTAL_VIEW_COUNT, km.TOTAL_LIKE_COUNT, km.TOTAL_CONTENT_COUNT
ORDER BY 
    FIELD(km.LIFECYCLE_STAGE, '성장', '성숙') ASC, 
    ENGAGEMENT_SCORE DESC,
    km.GROWTH_RATE DESC
LIMIT 10`;

  conn.query(sql, (err, results) => {
    if (err) {
      console.error("❌ SQL 쿼리 에러 발생:", err.sqlMessage || err);
      return res.status(500).json({ error: "랭킹 조회 실패" });
    }
    
    console.log(`✅ DB 조회 성공! 데이터 수: ${results.length}개`);
    res.json(results);
  });
});

// [통합] 생애주기 상세 리포트 조회 (중복 경로 제거 및 JOIN 최적화)
app.get('/api/lifecycle/detail', (req, res) => {
  const { keyword } = req.query;

  const sql = `
    SELECT 
        tk.KEYWORD_NAME,
        km.LIFECYCLE_STAGE, 
        km.GROWTH_RATE as DIFFUSION_SPEED,
        -- 🔥 가중치 적용 합산 지수 (조회수 20%, 좋아요 80% 비중)
        SUM((tm.VIEW_COUNT * 0.2) + (tm.LIKE_COUNT * 0.8)) AS ENGAGEMENT_SCORE,
        SUM(tm.VIEW_COUNT) AS TOTAL_VIEW,
        SUM(tm.LIKE_COUNT) AS TOTAL_LIKE,
        DATE_FORMAT(tm.RECORDED_AT, '%m/%d %H:%i') as time
    FROM T_KEYWORD tk
    JOIN CONTENT_KEYWORD ck ON tk.KEYWORD_NAME = ck.KEYWORD 
    JOIN TREND_METRIC tm ON ck.CONTENT_ID = tm.CONTENT_ID
    LEFT JOIN KEYWORD_METRIC km ON tk.KEYWORD_ID = km.KEYWORD_ID
    WHERE tk.KEYWORD_NAME = ?
    GROUP BY tm.RECORDED_AT, tk.KEYWORD_NAME, km.LIFECYCLE_STAGE, km.GROWTH_RATE
    ORDER BY tm.RECORDED_AT ASC
  `;

  conn.query(sql, [keyword], (err, results) => {
    if (err) return res.status(500).json({ error: "DB 에러" });

    const response = {
      aiInfo: {
        keywordName: results[0].KEYWORD_NAME,
        stage: results[0].LIFECYCLE_STAGE || "분석중",
        speed: results[0].DIFFUSION_SPEED || 0
      },
      chartData: {
        labels: results.map(r => r.time),
        // 🔥 이제 프론트엔드에 단일 지수(Score)를 메인으로 던져줍니다.
        scores: results.map(r => Math.round(r.ENGAGEMENT_SCORE)),
        views: results.map(r => r.TOTAL_VIEW),
        likes: results.map(r => r.TOTAL_LIKE)
      }
    };
    res.json(response);
  });
});

app.put("/user/filter", (req, res) => {
  const { userId, keywords } = req.body
  const findFilterSql = "SELECT FILTER_ID FROM C_FILTER WHERE USER_ID = ?"

  conn.query(findFilterSql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ success: false })

    const saveKeywords = (filterId) => {
      const deleteSql = "DELETE FROM C_FILTER_KEYWORD WHERE FILTER_ID = ?"
      conn.query(deleteSql, [filterId], (err2) => {
        if (err2) return res.status(500).json({ success: false })

        if (!keywords || keywords.length === 0) return res.json({ success: true })

        const insertSql = "INSERT INTO C_FILTER_KEYWORD (FILTER_ID, KEYWORD) VALUES (?, ?)"
        let completed = 0
        keywords.forEach((keyword) => {
          conn.query(insertSql, [filterId, keyword], (err3) => {
            completed += 1
            if (completed === keywords.length) return res.json({ success: true })
          });
        });
      });
    }

    if (rows.length > 0) {
      saveKeywords(rows[0].FILTER_ID)
    } else {
      conn.query("INSERT INTO C_FILTER (USER_ID, CREATED_AT) VALUES (?, NOW())", [userId], (err4, result) => {
        if (err4) return res.status(500).json({ success: false })
        saveKeywords(result.insertId)
      });
    }
  });
});

app.get("/content/:userId", (req, res) => {
  const { userId } = req.params
  const sql = `SELECT * FROM TREND_CONTENT WHERE (FILE_PATH IS NOT NULL AND FILE_PATH != '') OR PLATFORM_TYPE IN ('TIKTOK', 'INSTAGRAM') ORDER BY CREATED_AT DESC LIMIT 100`
  conn.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).send("DB 오류")
    res.json(result)
  })
})

app.get("/search-content/:userId", (req, res) => {
  const { userId } = req.params
  const limit = Number(req.query.limit) || 10
  const keyword = (req.query.keyword || "").trim()
  const excludeIds = req.query.excludeIds ? req.query.excludeIds.split(",").map(Number) : []

  let sql = `SELECT tc.*, GROUP_CONCAT(ck.KEYWORD SEPARATOR ' ') AS KEYWORDS FROM TREND_CONTENT tc LEFT JOIN CONTENT_KEYWORD ck ON tc.CONTENT_ID = ck.CONTENT_ID WHERE tc.CONTENT_ID NOT IN (SELECT ck2.CONTENT_ID FROM CONTENT_KEYWORD ck2 JOIN C_FILTER_KEYWORD cfk ON TRIM(LOWER(ck2.KEYWORD)) = TRIM(LOWER(cfk.KEYWORD)) JOIN C_FILTER cf ON cfk.FILTER_ID = cf.FILTER_ID WHERE cf.USER_ID = ?)`
  const params = [userId]
  if (excludeIds.length > 0) {
    sql += ` AND tc.CONTENT_ID NOT IN (${excludeIds.map(() => "?").join(",")}) `
    params.push(...excludeIds)
  }
  if (keyword) {
    sql += ` AND (LOWER(IFNULL(tc.TITLE, '')) LIKE ? OR LOWER(IFNULL(tc.PLATFORM_TYPE, '')) LIKE ? OR LOWER(IFNULL(tc.USER_ID, '')) LIKE ? OR CAST(tc.CONTENT_ID AS CHAR) LIKE ? OR tc.CONTENT_ID IN (SELECT ck3.CONTENT_ID FROM CONTENT_KEYWORD ck3 WHERE LOWER(IFNULL(ck3.KEYWORD, '')) LIKE ?)) `
    const lk = `%${keyword.toLowerCase()}%`
    params.push(lk, lk, lk, lk, lk)
  }
  sql += ` GROUP BY tc.CONTENT_ID ORDER BY RAND() LIMIT ? `
  params.push(limit)

  conn.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ message: "DB 오류" })
    res.json(result)
  })
})

// 카테고리, 키워드 분류 AI 실행
runAiScheduler()

app.listen(3002, () => {
  console.log("Trendformer 서버 실행 중: http://localhost:3002")
})