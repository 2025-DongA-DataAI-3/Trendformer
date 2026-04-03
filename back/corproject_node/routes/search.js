const express = require("express");
const router = express.Router();
const conn = require("../config/db");

/* =========================
   검색 로그 저장
   POST /search/log
========================= */
router.post("/log", (req, res) => {
    const { user_id, keyword_id, search_word } = req.body;

    console.log("받은 req.body:", req.body);

    if (!user_id || !search_word) {
        return res.status(400).json({
            success: false,
            message: "user_id와 search_word는 필수입니다."
        });
    }

    const sql = `
        INSERT INTO SEARCH_LOG (
            USER_ID,
            KEYWORD_ID,
            SEARCH_WORD,
            SEARCHED_AT
        )
        VALUES (?, ?, ?, NOW())
    `;

    const params = [user_id, keyword_id || null, search_word];

    console.log("실행 SQL:", sql);
    console.log("실행 파라미터:", params);

    conn.query(sql, params, (err, result) => {
        if (err) {
            console.error("검색 로그 저장 실제 오류:", err);
            return res.status(500).json({
                success: false,
                message: "검색 로그 저장 실패",
                error: {
                    code: err.code,
                    errno: err.errno,
                    sqlMessage: err.sqlMessage,
                    sqlState: err.sqlState
                }
            });
        }

        console.log("검색 로그 저장 성공:", result);

        return res.json({
            success: true,
            message: "검색 로그 저장 성공",
            insertId: result.insertId
        });
    });
});

module.exports = router;