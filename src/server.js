require('dotenv').config();
const express = require('express');
const helmet = require('helmet')
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');
const redisClient = require('./services/redis');

const app = express();

app.use(express.json({ limit: '10kb' })); // Will increase this to 50kb or 100kb when needed
app.use(helmet());

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many requests, please try again later.' }
}));

app.use('/api/auth', authRoutes);

// This will handle malformed JSON bodies as a clean 400 JSON response
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const shutdown = async () => {
    const forceExitTimer = setTimeout(() => process.exit(1), 10_000);
    server.close(async () => {
        try {
            await redisClient.quit();
        } finally {
            clearTimeout(forceExitTimer);
            process.exit(0);
        }
    });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

