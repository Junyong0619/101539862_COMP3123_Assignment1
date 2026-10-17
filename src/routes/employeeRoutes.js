const express = require('express');
const { protect } = require('../middleware/auth');
const { runValidation, createEmployeeRules, updateEmployeeRules, eidParamRule, eidQueryRule} 
= require('../middleware/validate');
const { getEmployees, createEmployee, getEmployeeById, updateEmployee, deleteEmployee } 
= require('../controllers/employeeController');
const router = express.Router();

router.use(protect);

router.get('/employees', getEmployees);
router.post('/employees', createEmployeeRules, runValidation, createEmployee);
router.get('/employees/:eid', eidParamRule, runValidation, getEmployeeById);
router.put('/employees/:eid', eidParamRule, updateEmployeeRules, runValidation,updateEmployee);
router.delete('/employees', eidQueryRule, runValidation, deleteEmployee);

module.exports = router;
