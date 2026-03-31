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
  `;

  conn.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).send("DB 오류");
    } else {
      res.json(result);
    }
  });
});

// GPT_API_KEY
const GPT_API_KEY = "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";

/**
 * AI 카테고리 분류 로직
 * [상세 설명 포함] AI 정밀 분류 함수
 * TITLE과 DESCRIPTION을 모두 분석하여 정확도를 극대화합니다.
 */
const runAiClassificationOnce = async () => {
    console.log("🚀 [설명란 포함 정밀 분석] 작업을 시작합니다...");

    // 1. DESCRIPTION 컬럼을 추가로 조회합니다.
    const selectSql = `
        SELECT t.CONTENT_ID, t.TITLE, t.DESCRIPTION, t.ORIGINAL_LINK, t.FILE_PATH 
        FROM TREND_CONTENT t
        LEFT JOIN CONTENT_CATEGORY c ON t.CONTENT_ID = c.CONTENT_ID
        WHERE c.CONTENT_ID IS NULL
    `;

    conn.query(selectSql, async (err, rows) => {
        if (err) {
            console.error("❌ 데이터 조회 실패:", err.message);
            return;
        }

        if (rows.length === 0) {
            console.log("✅ 분석할 새로운 데이터가 없습니다.");
            return;
        }

        console.log(`🔎 총 ${rows.length}개의 데이터를 심층 분석합니다...`);

        for (const item of rows) {
            try {
                const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GPT_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `너는 대한민국 1030 세대의 트렌드와 밈(Meme)을 분석하는 데이터 전문가야. 
                            TITLE(제목)이 모호하더라도 DESCRIPTION(설명)에 포함된 키워드, 해시태그, 맥락을 정밀 분석하여 카테고리 ID '하나'만 출력해.

                            [카테고리 정의]
                            1: 챌린지/댄스 (숏폼 유행, 댄스 따라하기, 동작 반복)
                            2: 유머/상황극 (스케치 코미디, 일상 공감, 병맛 밈, 웃긴 영상)
                            3: 게임/테크 (게임 플레이, 게임 밈, 공략, IT/가전 리뷰, AI/신기술)
                            4: 엔터/덕질 (아이돌, 배우, 팬 메이드 콘텐츠, 직캠, 공식 MV)
                            5: 라이프스타일 (브이로그, 요리/먹방, 패션/OOTD, 운동, 여행)
                            6: 동물 (반려동물 및 모든 동물의 귀여운/웃긴 영상)
                            7: 이슈/리액션 (뉴스 보도, 커뮤니티 논란, 반응/비평 영상)

                            [분류 우선순위 - 아래 순서대로 강제 적용]
                            1. (게임/테크 최우선): TITLE이나 DESCRIPTION에 특정 게임명(쿠키런, LoL, 로아, 배그, 마인크래프트 등)이나 게임 관련 해시태그가 존재하면, '챌린지' 단어가 포함되어도 무조건 [3번]으로 분류한다.
                            2. (아이돌 전용): 제목/설명에 아이돌 그룹명, 멤버명, 공식 곡명이 명시된 경우 무조건 [4번].
                            3. (강력 키워드): 1~2번에 해당하지 않으면서 '#챌린지', '#challenge', '따라하기' 문구가 메인 주제인 경우 [1번].
                            4. (동물): 영상의 주체가 동물이면 상황극이라도 [6번].
                            5. (유머/상황극): "ㅋㅋㅋ", "레전드", "웃긴" 키워드가 반복되거나 스케치 코미디 형식인 경우 [2번].
                            6. (기타): 위 모든 조건에 해당하지 않는 브이로그나 일상 정보는 [5번].

                            [응답 규칙]
                            - 분석 근거 없이 오직 '숫자' 하나만 출력할 것.
                            - 게임 플레이 영상이 '도전/챌린지'라는 단어를 사용하더라도 반드시 3번으로 분류할 것.`
                            },
                            {
                                role: "user",
                                content: `분석 데이터:
                                - 제목: ${item.TITLE || "없음"}
                                - 설명: ${item.DESCRIPTION || "내용 없음"}
                                - 게시물 URL: ${item.ORIGINAL_LINK}
                                - 영상 URL: ${item.FILE_PATH}`
                            }
                        ],
                        temperature: 0.1 
                    })
                });

                const aiData = await aiResponse.json();
                
                if (!aiData.choices) {
                    console.error(`ID ${item.CONTENT_ID} API 응답 오류`);
                    continue;
                }

                const content = aiData.choices[0].message.content.trim();
                const categoryId = parseInt(content.replace(/[^0-9]/g, ''));

                if (isNaN(categoryId)) {
                    console.log(`⚠️ ID ${item.CONTENT_ID} 결과 해석 실패: ${content}`);
                    continue;
                }

                // 2. 결과 저장
                const insertSql = "INSERT INTO CONTENT_CATEGORY (CONTENT_ID, CATEGORY_ID) VALUES (?, ?)";
                conn.query(insertSql, [item.CONTENT_ID, categoryId], (insertErr) => {
                    if (!insertErr) {
                        console.log(`✨ [성공] ID: ${item.CONTENT_ID} | 분류: ${categoryId} | 제목: ${item.TITLE?.substring(0, 20)}...`);
                    } else {
                        console.error(`❌ DB 저장 실패 (ID ${item.CONTENT_ID}):`, insertErr.message);
                    }
                });

            } catch (error) {
                console.error(`❌ 처리 중 오류 (ID ${item.CONTENT_ID}):`, error.message);
            }
        }
    });
};

// 즉시 실행 호출
runAiClassificationOnce();












/**
 * [Trendformer] 영상 경로(FILE_PATH)를 포함한 AI 키워드 추출 로직
 */
const runAiKeywordExtraction = async () => {
    console.log("🚀 [영상 기반 키워드 분석] 작업을 시작합니다...");

    // 1. ORIGINAL_LINK와 FILE_PATH를 추가로 조회합니다.
    const selectSql = `
        SELECT t.CONTENT_ID, t.TITLE, t.DESCRIPTION, t.ORIGINAL_LINK, t.FILE_PATH 
        FROM TREND_CONTENT t
        LEFT JOIN CONTENT_KEYWORD ck ON t.CONTENT_ID = ck.CONTENT_ID
        WHERE ck.CONTENT_ID IS NULL
    `;

    conn.query(selectSql, async (err, rows) => {
        if (err) {
            console.error("❌ 데이터 조회 실패:", err.message);
            return;
        }

        if (rows.length === 0) {
            console.log("✅ 분석할 새로운 영상 데이터가 없습니다.");
            return;
        }

        for (const item of rows) {
            try {
                const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${GPT_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            {
                                role: "system",
                                content: `너는 대한민국 1030 세대의 밈과 트렌드를 분석하는 전문가야.
                                제공된 제목, 설명, 그리고 영상의 경로(파일명)를 종합하여 영상의 핵심을 관통하는 키워드를 추출해줘.
                                
                                [분류 지침]
                                1. FILE_PATH에 포함된 파일명(예: 쿠키런.mp4, 챌린지_v1.mp4)은 강력한 분류 힌트야.
                                2. 검색에 유용한 핵심 키워드를 1~20개 사이로 뽑아줘.
                                3. 반드시 아래 JSON 형식으로만 응답해.
                                예: { "keywords": ["슬릭백", "공감", "쿠키런"] }`
                            },
                            {
                                role: "user",
                                content: `분석 데이터:
                                - 제목: ${item.TITLE || "없음"}
                                - 설명: ${item.DESCRIPTION || "내용 없음"}
                                - 원본링크: ${item.ORIGINAL_LINK || "없음"}
                                - 영상경로: ${item.FILE_PATH || "없음"}`
                            }
                        ],
                        response_format: { type: "json_object" },
                        temperature: 0.5 
                    })
                });

                const aiData = await aiResponse.json();
                const resObj = JSON.parse(aiData.choices[0].message.content);
                const keywords = resObj.keywords || Object.values(resObj)[0];

                if (keywords && Array.isArray(keywords) && keywords.length > 0) {
                    const insertSql = "INSERT IGNORE INTO CONTENT_KEYWORD (CONTENT_ID, KEYWORD) VALUES ?";
                    const values = keywords
                        .filter(kw => kw && kw.trim().length > 0)
                        .map(kw => [item.CONTENT_ID, kw.trim().substring(0, 50)]);

                    if (values.length > 0) {
                        conn.query(insertSql, [values], (insErr) => {
                            if (!insErr) {
                                console.log(`✨ ID ${item.CONTENT_ID} 분석 완료: [${keywords.join(", ")}]`);
                            } else {
                                console.error(`❌ DB 저장 실패:`, insErr.message);
                            }
                        });
                    }
                }
            } catch (error) {
                console.error(`❌ ID ${item.CONTENT_ID} 처리 중 오류:`, error.message);
            }
        }
    });
};


runAiKeywordExtraction();










app.listen(3002, () => {
  console.log("서버 실행 중: http://localhost:3002");
});