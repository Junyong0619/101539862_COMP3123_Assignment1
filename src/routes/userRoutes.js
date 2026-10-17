const express = require('express');
const { signup, login } = require('../controllers/userController');
const { runValidation, signupRules, loginRules } = require('../middleware/validate');

const router = express.Router();

router.post('/signup', signupRules, runValidation, signup);
router.post('/login', loginRules, runValidation, login);

module.exports = router;
