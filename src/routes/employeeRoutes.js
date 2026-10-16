const express = require('express');
const { protect } = require('../middleware/auth');
const { getEmployees, createEmployee, getEmployeeById, updateEmployee, deleteEmployee } = require('../controllers/employeeController');
const router = express.Router();

router.use(protect);

router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.get('/employees/:eid',getEmployeeById);
router.put('/employees/:eid',updateEmployee);
router.delete('/employees',deleteEmployee);

module.exports = router;
