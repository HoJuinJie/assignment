require('dotenv').config(); // Load environment variables from .env

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_TIME: process.env.JWT_EXPIRES_TIME,
    COOKIE_EXPIRES_TIMES: process.env.COOKIE_EXPIRES_TIMES,
    HOST: process.env.HOST,
    USER: process.env.USER,
    PASSWORD: process.env.PASSWORD,
    DATABASE: process.env.DATABASE
};

