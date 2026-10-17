const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// anything not filtered from route → 404
function notFound(req, res, next) {
    next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}

// Change Mongoose / body-parser error into AppError
function normalize(err) {
    if (err instanceof AppError) return err;
    if (err.type === 'entity.parse.failed') return new AppError(400, 'Malformed JSON in request body');
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message}));
        return new AppError(400, 'Validation failed', details);
    }
    if (err.name === 'CastError') return new AppError(400, `Invalid value for ${err.path}`);
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {}).join(', ');
        return new AppError(409, `Duplicate value for ${field}`);
    }
    return new AppError(500, 'Internal server error');
}

function errorHandler(err, req, res, next) {
    const e = normalize(err);
    if (e.statusCode >= 500) {
        logger.error(`${req.method} ${req.originalUrl} -> ${err.stack || err.message}`);
    } else {
        logger.warn(`${req.method} ${req.originalUrl} -> ${e.statusCode} ${e.message}`);
    }
    const payload = { status: 'error', message: e.message };
    if (e.details) payload.details = e.details;
    res.status(e.statusCode).json(payload);
}

module.exports = { notFound, errorHandler };