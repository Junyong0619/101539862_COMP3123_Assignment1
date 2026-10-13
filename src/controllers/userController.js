const User = require('../models/User');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');


async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      const field = exists.username === username ? 'Username' : 'Email';
      throw new AppError(409, `${field} already exists`);
    }

    const user = await User.create({ username, email, password });
    logger.info(`User registered: ${user._id}`);
    res.status(201).json({ message: 'User created successfully', user_id: user._id });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { username, email, password } = req.body;

    const user = await User.findOne(username ? { username } : { email }).select('+password');
    const valid = user && (await user.comparePassword(password));
    if (!valid) {
      logger.warn(`Failed login attempt for ${username || email}`);
      throw new AppError(401, 'Invalid username or password');
    }

    const token = signToken(user);
    logger.info(`User logged in: ${user._id}`);
    res.status(200).json({ message: 'Login successful', jwt_token: token, user_id: user._id });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };