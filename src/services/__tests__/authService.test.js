jest.mock('../redis', () => ({
    exists: jest.fn(),
    hset: jest.fn(),
    hGetAll: jest.fn(),
}));

jest.mock('../../utils/password', () => ({
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
    validatePassword: jest.fn(),
}));

const client = require('../redis');
const { register, login } = require('../authService');
const { hashPassword, comparePassword, validatePassword } = require('../../utils/password');

describe('authService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        test('registers user when username is unique and password is valid', async () => {
            const fakeBcryptHash = '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfake';
            validatePassword.mockReturnValue(true);
            client.exists.mockResolvedValue(0);
            hashPassword.mockResolvedValue(fakeBcryptHash);
            client.hset.mockResolvedValue(1);

            const res = await register({ username: ' mary ', password: 'StrongPass1' });

            expect(res).toBe('User created successfully');
            expect(client.exists).toHaveBeenCalledWith('user:mary');
            expect(hashPassword).toHaveBeenCalledWith('StrongPass1');
            expect(client.hset).toHaveBeenCalledWith(
                'user:mary',
                expect.objectContaining({
                    username: 'mary',
                    password: fakeBcryptHash,
                    createdAt: expect.any(String),
                    lastLoginAt: null,
                })
            );
        });

        test('rejects when username already exists', async () => {
            validatePassword.mockReturnValue(true);
            client.exists.mockResolvedValue(1);

            await expect(register({ username: 'mary', password: 'StrongPass1' })).rejects.toMatchObject({
                status: 400,
                message: 'Username already exists',
            });
        });

        test('rejects weak passwords', async () => {
            validatePassword.mockReturnValue(false);

            await expect(register({ username: 'mary', password: 'weak' })).rejects.toMatchObject({
                status: 400,
            });
        });

        test('rejects invalid types', async () => {
            await expect(register({ username: 123, password: 'StrongPass1' })).rejects.toMatchObject({
                status: 400,
                message: 'Username and password must be strings',
            });
        });
    });

    describe('login', () => {
        test('returns success for correct credentials and updates lastLoginAt', async () => {
            const fakeBcryptHash = '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfake';
            client.hGetAll.mockResolvedValue({ username: 'mary', password: fakeBcryptHash });
            comparePassword.mockResolvedValue(true);
            client.hset.mockResolvedValue(1);

            const res = await login({ username: ' mary ', password: 'StrongPass1' });

            expect(res).toBe('Login successful');
            expect(client.hGetAll).toHaveBeenCalledWith('user:mary');
            expect(comparePassword).toHaveBeenCalledWith('StrongPass1', fakeBcryptHash);
            expect(client.hset).toHaveBeenCalledWith('user:mary', { lastLoginAt: expect.any(String) });
        });

        test('returns generic 401 for unknown user', async () => {
            client.hGetAll.mockResolvedValue({});

            await expect(login({ username: 'mary', password: 'StrongPass1' })).rejects.toMatchObject({
                status: 401,
                message: 'Invalid username or password',
            });
        });

        test('returns generic 401 for wrong password', async () => {
            const fakeBcryptHash = '$2b$10$fakehashfakehashfakehashfakehashfakehashfakehashfakehashfake';
            client.hGetAll.mockResolvedValue({ username: 'mary', password: fakeBcryptHash });
            comparePassword.mockResolvedValue(false);

            await expect(login({ username: 'mary', password: 'WrongPass1' })).rejects.toMatchObject({
                status: 401,
                message: 'Invalid username or password',
            });
        });
    });
});

