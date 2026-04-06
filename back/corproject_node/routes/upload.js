const express = require("express");
const router = express.Router();
const multer = require("multer");
const conn = require("../config/db");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), (req, res) => {
  console.log("업로드 요청 들어옴");
  console.log("파일:", req.file);
  console.log("body:", req.body);

  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "업로드할 파일이 없습니다." });
  }

  const { title, content, userId, category, keywords } = req.body;

  console.log("userId 값:", JSON.stringify(userId));
  console.log("userId 길이:", userId?.length);

  const contentId = `upload-${Date.now()}`;
  const createdAt = new Date();

  const filePath = `/uploads/${req.file.filename}`;
  const fileUrl = `${req.protocol}://${req.get("host")}${filePath}`;

  const sql = `
    INSERT INTO TREND_CONTENT 
    (CONTENT_ID, USER_ID, PLATFORM_TYPE, TITLE, DESCRIPTION, FILE_PATH, SOURCE_TYPE, CREATED_AT)
    VALUES (?, ?, 'TRENDFORMER', ?, ?, ?, 'USER_UPLOAD', NOW())
  `;

  conn.query(sql, [contentId, userId, title, content, fileUrl], (err, result) => {
    if (err) {
      console.error("업로드 DB 저장 실패:", err.message);
      return res
        .status(500)
        .json({ success: false, message: "저장 실패" });
    }

    return res.json({
      success: true,
      message: "업로드가 완료되었습니다.",
      CONTENT_ID: contentId,
      USER_ID: userId || "",
      TITLE: title || "",
      DESCRIPTION: content || "",
      CATEGORY_NAME: category || "UPLOAD",
      KEYWORDS: keywords || "",
      FILE_PATH: fileUrl,
      ORIGINAL_URL: "",
      PLATFORM_TYPE: "TRENDFORMER",
      SOURCE_TYPE: "USER_UPLOAD",
      CREATED_AT: createdAt.toISOString(),
    });
  });
});

module.exports = router;