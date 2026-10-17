const { body, param, query, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

function runValidation(req, res, next) {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    logger.warn(`Validation failed on ${req.method} ${req.originalUrl}: ${details.map((d) => d.field).join(', ')}`);
    next(new AppError(400, 'Validation failed', details));
}

const signupRules = [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username may contain letters, numbers and underscore only'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Za-z]/).withMessage('Password must contain a letter')
        .matches(/\d/).withMessage('Password must contain a number'),
];

const loginRules = [
    body('password').notEmpty().withMessage('Password is required'),
    body().custom((value) => {
        if (!value.username && !value.email) throw new Error('Username or email is required');
        return true;
    }),
];

const employeeBody = (optional) => {
  const f = (name) => (optional ? body(name).optional() : body(name));
  return [
    f('first_name').trim().notEmpty().withMessage('first_name is required').isLength({ max: 50 }),
    f('last_name').trim().notEmpty().withMessage('last_name is required').isLength({ max: 50 }),
    f('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    f('position').trim().notEmpty().withMessage('position is required').isLength({ max: 100 }),
    f('salary').isFloat({ min: 0 }).withMessage('salary must be a number >= 0').toFloat(),
    f('date_of_joining').isISO8601().withMessage('date_of_joining must be a valid date (YYYY-MM-DD)').toDate(),
    f('department').trim().notEmpty().withMessage('department is required').isLength({ max: 100 }),
  ];
};

const createEmployeeRules = employeeBody(false);
const updateEmployeeRules = [
  ...employeeBody(true),
  body().custom((value) => {
    if (!value || Object.keys(value).length === 0) throw new Error('Request body must contain at least one field to update');
    return true;
  }),
];

const eidParamRule = [param('eid').isMongoId().withMessage('Invalid employee id')];
const eidQueryRule = [query('eid').notEmpty().withMessage('Query parameter eid is required').bail().isMongoId().withMessage('Invalid employee id')];

module.exports = {
  runValidation, signupRules, loginRules, createEmployeeRules, updateEmployeeRules, eidParamRule, eidQueryRule,
};

