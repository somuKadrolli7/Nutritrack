const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET         || 'dev_access_secret_change_me';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
const ACCESS_EXPIRE  = process.env.JWT_EXPIRE          || '15m';
const REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE  || '7d';

exports.signAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRE });

exports.signRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRE });

exports.verifyAccessToken = (token) =>
  jwt.verify(token, ACCESS_SECRET);

exports.verifyRefreshToken = (token) =>
  jwt.verify(token, REFRESH_SECRET);

exports.generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
