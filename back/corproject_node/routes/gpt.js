const conn = require('../config/db');
const GPT_API_KEY = require('../config/api');

const runAiClassificationOnce = async () => {
    console.log("[설명란 포함 정밀 분석] 작업을 시작합니다...");

    const selectSql = `
        SELECT t.CONTENT_ID, t.TITLE, t.DESCRIPTION, t.ORIGINAL_LINK, t.FILE_PATH 
        FROM TREND_CONTENT t
        LEFT JOIN CONTENT_CATEGORY c ON t.CONTENT_ID = c.CONTENT_ID
        WHERE c.CONTENT_ID IS NULL
    `;

    const rows = await new Promise((resolve, reject) => {
        conn.query(selectSql, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    if (rows.length === 0) { console.log("분석할 새로운 데이터가 없습니다."); return; }

    console.log(`🔎 총 ${rows.length}개의 데이터를 심층 분석합니다...`);

    for (const item of rows) {
        try {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GPT_API_KEY}` },
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
            if (!aiData.choices) { console.error(`ID ${item.CONTENT_ID} API 응답 오류`); continue; }

            const content = aiData.choices[0].message.content.trim();
            const categoryId = parseInt(content.replace(/[^0-9]/g, ''));
            if (isNaN(categoryId)) { console.log(`⚠️ ID ${item.CONTENT_ID} 결과 해석 실패: ${content}`); continue; }

            await new Promise((resolve, reject) => {
                conn.query(
        "INSERT IGNORE INTO CONTENT_CATEGORY (CONTENT_ID, CATEGORY_ID) VALUES (?, ?)",
        [item.CONTENT_ID, categoryId],
        (insertErr) => {
            if (insertErr) {
                console.error(`DB 저장 실패 (ID ${item.CONTENT_ID}):`, insertErr.message);
                reject(insertErr);
            } else {
                console.log(`✨ [성공] ID: ${item.CONTENT_ID} | 분류: ${categoryId} | 제목: ${item.TITLE?.substring(0, 20)}...`);
                resolve();
            }
        }
    );
});

        } catch (error) {
            console.error(`처리 중 오류 (ID ${item.CONTENT_ID}):`, error.message);
        }
    }
};

const runAiKeywordExtraction = async () => {
    console.log("[영상 기반 키워드 분석] 작업을 시작합니다...");

    const selectSql = `
        SELECT t.CONTENT_ID, t.TITLE, t.DESCRIPTION, t.ORIGINAL_LINK, t.FILE_PATH 
        FROM TREND_CONTENT t
        LEFT JOIN CONTENT_KEYWORD ck ON t.CONTENT_ID = ck.CONTENT_ID
        WHERE ck.CONTENT_ID IS NULL
    `;

    const rows = await new Promise((resolve, reject) => {
        conn.query(selectSql, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    if (rows.length === 0) { console.log("분석할 새로운 영상 데이터가 없습니다."); return; }

    console.log(`🔎 총 ${rows.length}개의 데이터를 키워드 분석합니다...`);

    for (const item of rows) {
        try {
            const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GPT_API_KEY}` },
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
                const values = keywords
                    .filter(kw => kw?.trim())
                    .map(kw => [item.CONTENT_ID, kw.trim().substring(0, 50)]);

                if (values.length > 0) {
                    await new Promise((resolve, reject) => {
                        conn.query("INSERT IGNORE INTO CONTENT_KEYWORD (CONTENT_ID, KEYWORD) VALUES ?", [values], (insErr) => {
                            if (insErr) {
                                console.error(`DB 저장 실패:`, insErr.message);
                                reject(insErr);
                            } else {
                                console.log(`✨ ID ${item.CONTENT_ID} 분석 완료: [${keywords.join(", ")}]`);
                                resolve();
                            }
                        });
                    });
                }
            }

        } catch (error) {
            console.error(`ID ${item.CONTENT_ID} 처리 중 오류:`, error.message);
        }
    }
};

const runAiScheduler = () => {
    console.log("AI 스케줄러 시작 (1시간 간격)");

    // 서버 시작 시 즉시 1회 실행
    runAiClassificationOnce();
    runAiKeywordExtraction();

    // 이후 1시간마다 반복 실행
    setInterval(async () => {
        console.log("스케줄러 실행:", new Date().toLocaleString());
        await runAiClassificationOnce();
        await runAiKeywordExtraction();
    }, 60 * 60 * 1000);
};

module.exports = { runAiScheduler };