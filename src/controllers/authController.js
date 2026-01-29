const { register, login } = require('../services/authService');

const registerUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await register({username, password});
        res.status(201).json({message: result});
    } catch (err) {
        next(err); //The errorHandler middleware will handle it
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { username, password } = req.body;
        const result = await login({username, password});
        res.status(200).json({message: result});
    } catch (err) {
        next(err);
    }
};

module.exports = { registerUser, loginUser};