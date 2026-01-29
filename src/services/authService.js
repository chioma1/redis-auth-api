const client = require('./redis');
const { hashPassword, comparePassword, validatePassword } = require('../utils/password');
const {
  ensureStringCredentials,
  ensureCredentialsPresent,
  normalizeAndValidateUsername,
} = require('../utils/validation');

const register = async ({username, password}) => {
    ensureStringCredentials({ username, password });
    ensureCredentialsPresent({ username, password });

    const trimmedUsername = normalizeAndValidateUsername(username);

    if(!validatePassword(password)) {
        throw { status: 400, message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number' };
    }

    const exists = await client.exists(`user:${trimmedUsername}`);
    if(exists) {
        throw { status: 400, message: 'Username already exists'};
    }

    const passwordHash = await hashPassword(password);

    await client.hset(`user:${trimmedUsername}`, {
        username: trimmedUsername,
        password: passwordHash,
        createdAt: new Date().toISOString(),
        lastLoginAt: null,
    });

    return 'User created successfully';
};

const login = async ({ username, password }) => {
    ensureStringCredentials({ username, password });
    ensureCredentialsPresent({ username, password });

    const trimmedUsername = normalizeAndValidateUsername(username);
    const user = await client.hGetAll(`user:${trimmedUsername}`);
    if (!user || Object.keys(user).length === 0) {
        throw { status: 401, message: 'Invalid username or password' };
    }

    const isPasswordMatch = await comparePassword(password, user.password);
    if(!isPasswordMatch) {
        throw { status: 401, message: 'Invalid username or password' };
    }
    
    await client.hset(`user:${trimmedUsername}`, { lastLoginAt: new Date().toISOString() });

    return 'Login successful';
}

module.exports = { register, login };