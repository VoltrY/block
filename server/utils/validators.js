const { body } = require('express-validator');

exports.loginValidator = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

exports.userUpdateValidator = [
  body('displayName').optional().isLength({ min: 3 }).withMessage('Display name must be at least 3 characters'),
  body('status').optional().isIn(['online', 'offline']).withMessage('Status must be either online or offline')
];

exports.channelValidator = [
  body('name').notEmpty().withMessage('Channel name is required')
    .isLength({ min: 3, max: 30 }).withMessage('Channel name must be between 3 and 30 characters'),
  body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
];

exports.messageValidator = [
  body('content').notEmpty().withMessage('Message content is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  body('channelId').optional().isMongoId().withMessage('Invalid channel ID'),
  body('receiverId').optional().isMongoId().withMessage('Invalid receiver ID')
];

exports.registerValidator = [
  body('username')
    .notEmpty().withMessage('Kullanıcı adı gerekli')
    .isLength({ min: 3, max: 20 }).withMessage('Kullanıcı adı 3-20 karakter olmalı')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir'),
  body('email')
    .notEmpty().withMessage('E-posta adresi gerekli')
    .isEmail().withMessage('Geçerli bir e-posta adresi girin'),
  body('password')
    .notEmpty().withMessage('Şifre gerekli')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),
  body('displayName')
    .notEmpty().withMessage('Görünen ad gerekli')
    .isLength({ min: 2, max: 30 }).withMessage('Görünen ad 2-30 karakter olmalı')
]; 