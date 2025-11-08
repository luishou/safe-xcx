const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const { uploadFileToCOS } = require('../utils/cosUploader');

const router = express.Router();

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer - 支持文档和图片
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '');
    cb(null, 'doc-' + uniqueSuffix + path.extname(cleanName));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制，支持大文档
  },
  fileFilter: function (req, file, cb) {
    // 检查文件类型 - 支持图片和文档
    const allowedMimes = [
      // 图片类型
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // 文档类型
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型，仅支持图片、Word、PDF文件'));
    }
  }
});

// 图片上传接口（带错误捕获，更明确的状态码与信息）
router.post('/image', authenticateToken, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      // 处理multer错误
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: '图片过大，超过5MB限制'
        });
      }
      // 非multer错误
      return res.status(400).json({
        success: false,
        message: err.message || '上传失败'
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }

      // 仅上传到 COS 并返回 COS URL
      try {
        const cosKey = `uploads/${req.file.filename}`;
        const result = await uploadFileToCOS(req.file.path, cosKey);
        const fileUrl = result.url;
        if (!fileUrl) {
          return res.status(500).json({ success: false, message: 'COS上传失败，未返回URL' });
        }
        return res.json({
          success: true,
          message: '文件上传成功',
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            url: fileUrl,
            localPath: req.file.path
          }
        });
      } catch (error) {
        console.error('上传到COS失败:', error);
        return res.status(500).json({ success: false, message: 'COS上传失败' });
      }
      // 不会走到这里
    } catch (error) {
      console.error('文件上传失败:', error);
      res.status(500).json({
        success: false,
        message: '文件上传失败',
        error: error.message
      });
    }
  });
});

// 多图片上传接口
router.post('/images', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    const uploadedFiles = [];
    for (const file of req.files) {
      try {
        const cosKey = `uploads/${file.filename}`;
        const result = await uploadFileToCOS(file.path, cosKey);
        const fileUrl = result.url;
        if (!fileUrl) throw new Error('COS未返回URL');
        uploadedFiles.push({
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: fileUrl,
          localPath: file.path
        });
      } catch (error) {
        console.error('上传到COS失败（多图）:', error);
        return res.status(500).json({ success: false, message: 'COS上传失败' });
      }
    }

    return res.json({ success: true, message: '文件上传成功', data: uploadedFiles });
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 通用文件上传接口（兼容微信小程序）
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }
    // 仅上传到 COS 并返回 COS URL
    try {
      // 根据文件类型确定COS目录
      const isImage = req.file.mimetype.startsWith('image/');
      const cosKey = isImage
        ? `images/${req.file.filename}`
        : `documents/${req.file.filename}`;

      const result = await uploadFileToCOS(req.file.path, cosKey);
      const fileUrl = result.url;
      if (!fileUrl) {
        return res.status(500).json({ success: false, message: 'COS上传失败，未返回URL' });
      }
      return res.json({
        success: true,
        message: '文件上传成功',
        filePath: fileUrl,
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          localPath: req.file.path,
          type: isImage ? 'image' : 'document'
        }
      });
    } catch (error) {
      console.error('上传到COS失败:', error);
      return res.status(500).json({ success: false, message: 'COS上传失败' });
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文件上传失败',
      error: error.message
    });
  }
});

// 专门的安全知识文档上传接口
router.post('/document', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '没有上传文件'
      });
    }

    // 检查是否为文档类型
    const isDocument = !req.file.mimetype.startsWith('image/');
    if (!isDocument) {
      return res.status(400).json({
        success: false,
        message: '只能上传文档文件（Word、PDF）'
      });
    }

    try {
      // 上传到COS的文档目录
      const cosKey = `documents/${req.file.filename}`;
      const result = await uploadFileToCOS(req.file.path, cosKey);
      const fileUrl = result.url;
      if (!fileUrl) {
        return res.status(500).json({ success: false, message: 'COS上传失败，未返回URL' });
      }

      // 检测文件类型
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let fileType = 'unknown';
      if (fileExtension === '.pdf') {
        fileType = 'pdf';
      } else if (fileExtension === '.doc' || fileExtension === '.docx') {
        fileType = 'word';
      }

      return res.json({
        success: true,
        message: '文档上传成功',
        filePath: fileUrl,
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          localPath: req.file.path,
          type: fileType
        }
      });
    } catch (error) {
      console.error('上传文档到COS失败:', error);
      return res.status(500).json({ success: false, message: 'COS上传失败' });
    }
  } catch (error) {
    console.error('文档上传失败:', error);
    res.status(500).json({
      success: false,
      message: '文档上传失败',
      error: error.message
    });
  }
});

module.exports = router;