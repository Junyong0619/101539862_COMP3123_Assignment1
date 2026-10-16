const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const ALLOWED = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

function pickFields(body) {
    const out = {};
    for (const key of ALLOWED) {
        if (body[key] !== undefined) out[key] = body[key];
    }
    return out;
}

function assertObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(400, 'Invalid employee id');
    }
}

async function getEmployees(req, res, next) {
    try {
        const employees = await Employee.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(employees);
    } catch (err) {
        next(err);
    }
}

async function createEmployee (req, res, next) {
    try {
        const employee = await Employee.create({ ...pickFields(req.body), user: req.user._id });
        logger.info(`Employee created: ${employee._id} by user ${req.user._id}`);
        res.status(201).json({ message: 'Employee created successfully', employee_id: employee._id});
    } catch (err) {
        next(err);
    }
}

async function getEmployeeById(req, res, next) {
    try {
        const { eid } = req.params;
        assertObjectId(eid);
        const employee = await Employee.findOne({ _id: eid, user: req.user._id });
        if (!employee) throw new AppError(404, 'Employee not found');
        res.status(200).json(employee);
    } catch (err) {
        next(err);
    }

}

async function updateEmployee(req, res, next) {
    try {
        const { eid }  = req.params;
        assertObjectId(eid);
        const employee = await Employee.findOneAndUpdate(
            { _id : eid, user: req.user._id },
            pickFields(req.body),
            { new : true, runValidators: true }
        );
        if (!employee) throw new AppError(404, 'Employee not found');
        logger.info(`Employee updated: ${employee._id} by user ${req.user._id}`);
        res.status(200).json({ message: 'Employee details updated successfully', employee });
    } catch (err) {
        next(err);
    }
}

async function deleteEmployee(req, res, next) {
    try {
        const { eid } = req.query;
        if (!eid) throw new AppError(400, 'Query parameter eid is required');
        assertObjectId(eid);
        const employee = await Employee.findOneAndDelete({ _id: eid, user: req.user._id });
        if (!employee) throw new AppError(404, 'Employee not found');
        logger.info(`Employee deleted: ${eid} by user ${req.user._id}`);
        res.status(204).send(); 
    } catch (err) {
        next(err);
    }
}



module.exports = { getEmployees, createEmployee, getEmployeeById, updateEmployee, deleteEmployee };