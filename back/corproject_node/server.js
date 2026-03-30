const express = require('express')
const app = express()
const mysql = require("mysql2")

// 주소 통신
const cors = require('cors')
app.use(cors())

// DB연결
const conn = require('./config/db')

// body 데이터 사용
app.use(express.urlencoded({extended:true}))
app.use(express.json())

// 로그인
app.post('/login', (req, res) => {
  let id = req.body.id
  let pw = req.body.pw

  let sql = 'SELECT * FROM T_USER WHERE USER_ID=? AND PW=?'
  conn.query(sql, [id, pw], (err, rows) => {
    if (err) {
      console.log("쿼리 실행 중 에러:", err.message)
      return res.status(500).json({
        success: false,
        message: "서버 오류"
      })
    }

    if (rows.length > 0) {
      const user = rows[0]

      return res.json({
        success: true,
        user: {
          id: user.USER_ID,
          pw: user.PW,
          nickname: user.NICK,
          email: user.EMAIL,
          company: user.COMPANY_NAME
        }
      })
    } else {
      return res.status(401).json({
        success: false,
        message: "아이디 또는 비밀번호가 틀렸습니다."
      })
    }
  })
})

// 회원가입 API
app.post('/join', (req, res) => {
  const { id, pw, nickname, email, company } = req.body

  // 1. 빈값 체크
  if (!id || !pw || !nickname || !email || !company) {
    return res.status(400).json({
      success: false,
      message: '모든 값을 입력해주세요.'
    })
  }

  // 2. 아이디 중복 검사
  const checkSql = 'SELECT * FROM T_USER WHERE USER_ID = ?'
  conn.query(checkSql, [id], (err, rows) => {
    if (err) {
      console.log('중복검사 에러:', err.message)
      return res.status(500).json({
        success: false,
        message: '서버 오류'
      })
    }

    if (rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: '이미 사용 중인 아이디입니다.'
      })
    }

    // 3. 회원가입 INSERT
    const insertSql = `
      INSERT INTO T_USER (USER_ID, EMAIL, PW, NICK, COMPANY_NAME, CREATED_AT, UPDATED_AT)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `

    conn.query(insertSql, [id, email, pw, nickname, company], (err, result) => {
      if (err) {
        console.log('회원가입 에러:', err.message)
        return res.status(500).json({
          success: false,
          message: '회원가입 실패'
        })
      }

      return res.status(201).json({
        success: true,
        message: '회원가입 성공'
      })
    })
  })
})

// 정보 수정
app.put('/user/update', (req, res) => {
  console.log("/user/update 요청 들어옴");
  console.log("body:", req.body);

  const { id, nickname, email, company } = req.body;

  if (!id || !nickname || !email || !company) {
    return res.status(400).json({
      success: false,
      message: '모든 값을 입력해주세요.'
    });
  }

  const sql = `
    UPDATE T_USER
    SET NICK = ?, EMAIL = ?, COMPANY_NAME = ?, UPDATED_AT = NOW()
    WHERE USER_ID = ?
  `;

  conn.query(sql, [nickname, email, company, id], (err, result) => {
    if (err) {
      console.log('회원정보 수정 에러:', err.message);
      return res.status(500).json({
        success: false,
        message: '회원정보 수정 실패'
      });
    }

    console.log("수정 결과:", result);

    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        message: '회원정보가 수정되었습니다.'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      });
    }
  });
});

// 비밀번호 변경
app.put('/user/password', (req, res) => {
  const { id, currentPw, newPw } = req.body

  if (!id || !currentPw || !newPw) {
    return res.status(400).json({
      success: false,
      message: '모든 값을 입력해주세요.'
    })
  }

  const checkSql = 'SELECT * FROM T_USER WHERE USER_ID = ? AND PW = ?'

  conn.query(checkSql, [id, currentPw], (err, rows) => {
    if (err) {
      console.log('비밀번호 확인 에러:', err.message)
      return res.status(500).json({
        success: false,
        message: '서버 오류'
      })
    }

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: '현재 비밀번호가 일치하지 않습니다.'
      })
    }

    const updateSql = `
      UPDATE T_USER
      SET PW = ?, UPDATED_AT = NOW()
      WHERE USER_ID = ?
    `

    conn.query(updateSql, [newPw, id], (err, result) => {
      if (err) {
        console.log('비밀번호 변경 에러:', err.message)
        return res.status(500).json({
          success: false,
          message: '비밀번호 변경 실패'
        })
      }

      if (result.affectedRows > 0) {
        return res.json({
          success: true,
          message: '비밀번호가 변경되었습니다.'
        })
      } else {
        return res.status(404).json({
          success: false,
          message: '해당 사용자를 찾을 수 없습니다.'
        })
      }
    })
  })
})

// 회원 탈퇴
app.delete('/user/delete', (req, res) => {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({
      success: false,
      message: '사용자 아이디가 없습니다.'
    })
  }

  const sql = 'DELETE FROM T_USER WHERE USER_ID = ?'

  conn.query(sql, [id], (err, result) => {
    if (err) {
      console.log('회원탈퇴 에러:', err.message)
      return res.status(500).json({
        success: false,
        message: '회원탈퇴 실패'
      })
    }

    if (result.affectedRows > 0) {
      return res.json({
        success: true,
        message: '회원탈퇴가 완료되었습니다.'
      })
    } else {
      return res.status(404).json({
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.'
      })
    }
  })
})

// 콘텐츠 조회 API
app.get("/content", (req, res) => {
  const sql = "SELECT * FROM TREND_CONTENT";

  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("DB 오류");
    } else {
      res.json(result);
    }
  });
});


app.listen(3002, () => {
  console.log("서버 실행 중: http://localhost:3002");
});