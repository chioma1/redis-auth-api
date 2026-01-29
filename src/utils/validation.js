const ensureStringCredentials = ({ username, password }) => {
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw { status: 400, message: 'Username and password must be strings' };
  }
};

const ensureCredentialsPresent = ({ username, password }) => {
  if (!username || !password) {
    throw { status: 400, message: 'Username and password are required' };
  }
};

const normalizeAndValidateUsername = (username) => {
  const trimmed = username.trim();

  if (trimmed.length < 3 || trimmed.length > 20) {
    throw { status: 400, message: 'Username must be between 3 and 20 characters long' };
  }

  return trimmed;
};

module.exports = {
  ensureStringCredentials,
  ensureCredentialsPresent,
  normalizeAndValidateUsername,
};

