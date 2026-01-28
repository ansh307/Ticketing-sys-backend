const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(), // no disk usage
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = { upload };
