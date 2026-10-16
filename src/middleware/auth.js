const User = require('../models/User');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');


async function protect(req, res, next) {
    try{
        const header = req.headers.authorization || '';
        if(!header.startsWith('Bearer ')){
            throw new AppError(401,'Authentication token is missing');
        }
        const token = header.slice(7);

        let payload;
        try {
            payload = verifyToken(token);
        } catch(err) {
            const msg = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
            logger.warn(`Auth failed: ${msg}`);
            throw new AppError(401, msg);
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            throw new AppError(401, 'User for this token no longer exists');
        }

        req.user= user;
        next();
    } catch(err){
        next(err);
    }
}

module.exports = { protect };