const express = require('express')
const app = express()
const mysql = require("mysql2")
const { spawn } = require('child_process')
const path = require('path')

const cors = require('cors')
app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const conn = require('./config/db')
const GPT_API_KEY = require('./config/api')

const userRouter = require('./routes/user')
const uploadRouter = require('./routes/upload')

app.use('/uploads', express.static('uploads'))
app.use('/upload', uploadRouter)
app.use('/user', userRouter)


// const pythonFilePath = path.join(__dirname, '..', 'youtube', 'main.py')
// const pythonProcess = spawn('python', [pythonFilePath], {
//   stdio: 'inherit',
//   shell: true
// })
// pythonProcess.on('error', (err) => { console.error('Python 실행 오류:', err) })
// pythonProcess.on('close', (code) => { console.log(`Python 프로세스 종료됨, 종료코드: ${code}`) })



// 인스타 스케줄러 실행
const instaScheduler = spawn('python', ['scheduler.py'], {
  cwd: path.join(__dirname, '..', 'insta'),
  stdio: 'inherit',
  shell: true
})
instaScheduler.on('error', (err) => { console.error('인스타 스케줄러 오류:', err) })
instaScheduler.on('close', (code) => { console.log(`인스타 스케줄러 종료, 코드: ${code}`) })

// 틱톡 스케줄러 실행
const tiktokScheduler = spawn('python', ['scheduler.py'], {
  cwd: path.join(__dirname, '..', 'tiktok'),
  stdio: 'inherit',
  shell: true
})
tiktokScheduler.on('error', (err) => { console.error('틱톡 스케줄러 오류:', err) })
tiktokScheduler.on('close', (code) => { console.log(`틱톡 스케줄러 종료, 코드: ${code}`) })


app.get("/category", (req, res) => {
  conn.query("SELECT * FROM T_CATEGORY", (err, result) => {
    if (err) return res.status(500).json([]);
    res.json(result);
  });
});

app.put("/user/filter", (req, res) => {
  const { userId, keywords } = req.body;
  // keywords 예: ["도파민", "챌린지", "먹방"]

  const findFilterSql = "SELECT FILTER_ID FROM C_FILTER WHERE USER_ID = ?";

  conn.query(findFilterSql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: "필터 조회 실패" });
    }

    const saveKeywords = (filterId) => {
      const deleteSql = "DELETE FROM C_FILTER_KEYWORD WHERE FILTER_ID = ?";

      conn.query(deleteSql, [filterId], (err2) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ success: false, message: "기존 필터 삭제 실패" });
        }

        // 사용자가 필터를 비워서 저장한 경우
        if (!keywords || keywords.length === 0) {
          return res.json({ success: true, message: "필터 저장 완료" });
        }

        const insertSql =
          "INSERT INTO C_FILTER_KEYWORD (FILTER_ID, KEYWORD) VALUES (?, ?)";

        let completed = 0;

        keywords.forEach((keyword) => {
          conn.query(insertSql, [filterId, keyword], (err3) => {
            if (err3) {
              console.error(err3);
            }

            completed += 1;

            if (completed === keywords.length) {
              return res.json({ success: true, message: "필터 저장 완료" });
            }
          });
        });
      });
    };

    // 이미 필터가 있는 유저
    if (rows.length > 0) {
      const filterId = rows[0].FILTER_ID;
      saveKeywords(filterId);
    } 
    // 처음 필터를 저장하는 유저
    else {
      const insertFilterSql =
        "INSERT INTO C_FILTER (USER_ID, CREATED_AT) VALUES (?, NOW())";

      conn.query(insertFilterSql, [userId], (err4, result) => {
        if (err4) {
          console.error(err4);
          return res.status(500).json({ success: false, message: "필터 생성 실패" });
        }

        const filterId = result.insertId;
        saveKeywords(filterId);
      });
    }
  });
});

app.get("/content/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      tc.*,
      GROUP_CONCAT(ck.KEYWORD SEPARATOR ' ') AS KEYWORDS
    FROM TREND_CONTENT tc
    LEFT JOIN CONTENT_KEYWORD ck
      ON tc.CONTENT_ID = ck.CONTENT_ID
    WHERE tc.CONTENT_ID NOT IN (
      SELECT ck2.CONTENT_ID
      FROM CONTENT_KEYWORD ck2
      JOIN C_FILTER_KEYWORD cfk
        ON TRIM(LOWER(ck2.KEYWORD)) = TRIM(LOWER(cfk.KEYWORD))
      JOIN C_FILTER cf
        ON cfk.FILTER_ID = cf.FILTER_ID
      WHERE cf.USER_ID = ?
    )
    GROUP BY tc.CONTENT_ID
    ORDER BY tc.CREATED_AT DESC
    LIMIT 100
  `;

  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB 오류");
    } else {
      return res.json(result);
    }
  });
});

// Search.jsx
app.get("/search-content/:userId", (req, res) => {
  const { userId } = req.params;
  const limit = Number(req.query.limit) || 10;
  const keyword = (req.query.keyword || "").trim();

  // 프론트에서 이미 보여준 id 목록 받기
  const excludeIds =
    req.query.excludeIds
      ? req.query.excludeIds
          .split(",")
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

  let sql = `
    SELECT 
      tc.*,
      GROUP_CONCAT(ck.KEYWORD SEPARATOR ' ') AS KEYWORDS
    FROM TREND_CONTENT tc
    LEFT JOIN CONTENT_KEYWORD ck
      ON tc.CONTENT_ID = ck.CONTENT_ID
    WHERE tc.CONTENT_ID NOT IN (
      SELECT ck2.CONTENT_ID
      FROM CONTENT_KEYWORD ck2
      JOIN C_FILTER_KEYWORD cfk
        ON TRIM(LOWER(ck2.KEYWORD)) = TRIM(LOWER(cfk.KEYWORD))
      JOIN C_FILTER cf
        ON cfk.FILTER_ID = cf.FILTER_ID
      WHERE cf.USER_ID = ?
    )
  `;

  const params = [userId];

  // 이미 화면에 보여준 영상 제외
  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => "?").join(",");
    sql += ` AND tc.CONTENT_ID NOT IN (${placeholders}) `;
    params.push(...excludeIds);
  }

  // 검색어가 있을 때
  if (keyword) {
    sql += `
      AND (
        LOWER(IFNULL(tc.TITLE, '')) LIKE ?
        OR LOWER(IFNULL(tc.PLATFORM_TYPE, '')) LIKE ?
        OR LOWER(IFNULL(tc.USER_ID, '')) LIKE ?
        OR CAST(tc.CONTENT_ID AS CHAR) LIKE ?
        OR tc.CONTENT_ID IN (
          SELECT ck3.CONTENT_ID
          FROM CONTENT_KEYWORD ck3
          WHERE LOWER(IFNULL(ck3.KEYWORD, '')) LIKE ?
        )
      )
    `;

    const likeKeyword = `%${keyword.toLowerCase()}%`;
    params.push(
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword,
      likeKeyword
    );
  }

  sql += `
    GROUP BY tc.CONTENT_ID
    ORDER BY RAND()
    LIMIT ?
  `;

  params.push(limit);

  conn.query(sql, params, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB 오류" });
    }

    res.json(result);
  });
});

app.listen(3002, () => {
  console.log("서버 실행 중: http://localhost:3002")
})