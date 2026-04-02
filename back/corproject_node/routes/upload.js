const express = require('express');
const router = express.Router();
const multer = require('multer');
const conn = require('../config/db');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

router.post('/', upload.single('file'), (req, res) => {
    console.log("업로드 요청 들어옴");
    console.log("파일:", req.file);
    console.log("body:", req.body);

    const { title, content, userId } = req.body;
    console.log("userId 값:", JSON.stringify(userId));
    console.log("userId 길이:", userId?.length);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const sql = `
        INSERT INTO TREND_CONTENT 
        (CONTENT_ID, USER_ID, PLATFORM_TYPE, TITLE, DESCRIPTION, FILE_PATH, SOURCE_TYPE)
        VALUES (UUID(), ?, 'TRENDFORMER', ?, ?, ?, 'USER_UPLOAD')
    `;

    conn.query(sql, [userId, title, content, fileUrl], (err, result) => {
        if (err) {
            console.error('업로드 DB 저장 실패:', err.message);
            return res.status(500).json({ success: false, message: '저장 실패' });
        }
        res.json({ success: true, fileUrl });
    });
});

module.exports = router;