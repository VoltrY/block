const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validation');
const { userUpdateValidator } = require('../utils/validators');
const multer = require('multer');
const path = require('path');
const logger = require('../utils/logger');
const User = require('../models/User');

// Multer konfigürasyonu
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/avatars');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir'));
    }
  }
});

// @route   GET /api/users
// @desc    Get all users
// @access  Private
router.get('/', auth, userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, userController.getUserById);

// @route   PATCH /api/users/:id
// @desc    Update user
// @access  Private
router.patch('/:id', auth, userUpdateValidator, validate, userController.updateUser);

// Avatar yükleme endpoint'i
router.post('/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Dosya yüklenemedi'
      });
    }

    // Kullanıcı kendi avatarını mı güncelliyor kontrol et
    if (req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Bu işlem için yetkiniz yok'
      });
    }

    // Avatar URL'ini güncelle
    const avatarUrl = `/avatars/${req.file.filename}`;
    const fullAvatarUrl = `${process.env.BASE_URL}${avatarUrl}`;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: fullAvatarUrl,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

module.exports = router; 