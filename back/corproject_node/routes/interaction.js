const express = require("express");
const router = express.Router();
const conn = require("../config/db");

// ==========================
// 좋아요 저장
// POST /interaction/like
// ==========================
router.post("/like", async (req, res) => {
  const { user_id, content_id } = req.body;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    await conn.promise().query(
      `
      INSERT IGNORE INTO CONTENT_LIKE (USER_ID, CONTENT_ID)
      VALUES (?, ?)
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      message: "좋아요 저장 완료",
    });
  } catch (err) {
    console.error("좋아요 저장 오류:", err);
    return res.status(500).json({
      success: false,
      message: "좋아요 저장 실패",
      error: err.message,
    });
  }
});

// ==========================
// 좋아요 삭제
// DELETE /interaction/like
// ==========================
router.delete("/like", async (req, res) => {
  const { user_id, content_id } = req.body;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    await conn.promise().query(
      `
      DELETE FROM CONTENT_LIKE
      WHERE USER_ID = ? AND CONTENT_ID = ?
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      message: "좋아요 삭제 완료",
    });
  } catch (err) {
    console.error("좋아요 삭제 오류:", err);
    return res.status(500).json({
      success: false,
      message: "좋아요 삭제 실패",
      error: err.message,
    });
  }
});

// ==========================
// 보관 저장
// POST /interaction/bookmark
// ==========================
router.post("/bookmark", async (req, res) => {
  const { user_id, content_id } = req.body;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    await conn.promise().query(
      `
      INSERT IGNORE INTO TREND_BOOKMARK (USER_ID, CONTENT_ID)
      VALUES (?, ?)
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      message: "보관 저장 완료",
    });
  } catch (err) {
    console.error("보관 저장 오류:", err);
    return res.status(500).json({
      success: false,
      message: "보관 저장 실패",
      error: err.message,
    });
  }
});

// ==========================
// 보관 삭제
// DELETE /interaction/bookmark
// ==========================
router.delete("/bookmark", async (req, res) => {
  const { user_id, content_id } = req.body;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    await conn.promise().query(
      `
      DELETE FROM TREND_BOOKMARK
      WHERE USER_ID = ? AND CONTENT_ID = ?
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      message: "보관 삭제 완료",
    });
  } catch (err) {
    console.error("보관 삭제 오류:", err);
    return res.status(500).json({
      success: false,
      message: "보관 삭제 실패",
      error: err.message,
    });
  }
});

// ==========================
// 좋아요 여부 확인
// GET /interaction/like-status?user_id=...&content_id=...
// ==========================
router.get("/like-status", async (req, res) => {
  const { user_id, content_id } = req.query;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    const [rows] = await conn.promise().query(
      `
      SELECT COUNT(*) AS cnt
      FROM CONTENT_LIKE
      WHERE USER_ID = ? AND CONTENT_ID = ?
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      liked: rows[0].cnt > 0,
    });
  } catch (err) {
    console.error("좋아요 상태 조회 오류:", err);
    return res.status(500).json({
      success: false,
      message: "좋아요 상태 조회 실패",
      error: err.message,
    });
  }
});

// ==========================
// 보관 여부 확인
// GET /interaction/bookmark-status?user_id=...&content_id=...
// ==========================
router.get("/bookmark-status", async (req, res) => {
  const { user_id, content_id } = req.query;

  if (!user_id || !content_id) {
    return res.status(400).json({
      success: false,
      message: "user_id 또는 content_id가 없습니다.",
    });
  }

  try {
    const [rows] = await conn.promise().query(
      `
      SELECT COUNT(*) AS cnt
      FROM TREND_BOOKMARK
      WHERE USER_ID = ? AND CONTENT_ID = ?
      `,
      [user_id, content_id]
    );

    return res.json({
      success: true,
      bookmarked: rows[0].cnt > 0,
    });
  } catch (err) {
    console.error("보관 상태 조회 오류:", err);
    return res.status(500).json({
      success: false,
      message: "보관 상태 조회 실패",
      error: err.message,
    });
  }
});

// ==========================
// 콘텐츠 좋아요 개수 조회
// GET /interaction/like-count/:content_id
// ==========================
router.get("/like-count/:content_id", async (req, res) => {
  const { content_id } = req.params;

  if (!content_id) {
    return res.status(400).json({
      success: false,
      message: "content_id가 없습니다.",
    });
  }

  try {
    const [rows] = await conn.promise().query(
      `
      SELECT COUNT(*) AS like_count
      FROM CONTENT_LIKE
      WHERE CONTENT_ID = ?
      `,
      [content_id]
    );

    return res.json({
      success: true,
      like_count: rows[0].like_count,
    });
  } catch (err) {
    console.error("좋아요 개수 조회 오류:", err);
    return res.status(500).json({
      success: false,
      message: "좋아요 개수 조회 실패",
      error: err.message,
    });
  }
});

// ==========================
// 내가 좋아요한 콘텐츠 목록
// GET /interaction/my-likes/:user_id
// ==========================
router.get("/my-likes/:user_id", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id가 없습니다.",
    });
  }

  try {
    const [rows] = await conn.promise().query(
      `
      SELECT TC.*
      FROM CONTENT_LIKE CL
      JOIN TREND_CONTENT TC
        ON CL.CONTENT_ID = TC.CONTENT_ID
      WHERE CL.USER_ID = ?
      ORDER BY CL.CREATED_AT DESC
      `,
      [user_id]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("내 좋아요 목록 조회 오류:", err);
    return res.status(500).json({
      success: false,
      message: "좋아요 목록 조회 실패",
      error: err.message,
    });
  }
});

// ==========================
// 내가 보관한 콘텐츠 목록
// GET /interaction/my-bookmarks/:user_id
// ==========================
router.get("/my-bookmarks/:user_id", async (req, res) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "user_id가 없습니다.",
    });
  }

  try {
    const [rows] = await conn.promise().query(
      `
      SELECT TC.*
      FROM TREND_BOOKMARK TB
      JOIN TREND_CONTENT TC
        ON TB.CONTENT_ID = TC.CONTENT_ID
      WHERE TB.USER_ID = ?
      ORDER BY TB.SAVED_AT DESC
      `,
      [user_id]
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("내 보관 목록 조회 오류:", err);
    return res.status(500).json({
      success: false,
      message: "보관 목록 조회 실패",
      error: err.message,
    });
  }
});

module.exports = router;