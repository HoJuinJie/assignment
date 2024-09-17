const { getConnection } = require('../database');
const jwt = require('jsonwebtoken');
const { checkGroup } = require('../functions');
const { JWT_SECRET } = require('../config/config');

exports.isAuthenticatedUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Login required' });
    try {
        const ipAddress = req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.ipAddress !== ipAddress || decoded.userAgent !== userAgent) return res.status(401).json({ message: 'Authentication failed', error: err });
        req.user = decoded;
    } catch (err) {
        return res.status(400).json({ message: 'Authentication failed', error: err });
    }
    next();
};

exports.isActive = async (req, res, next) => {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    try {
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [decoded.username]);
        if (result[0].accountStatus !== 'ACTIVE') return res.status(401).json({ message: 'User Disabled' });
    } catch (err) {
        return res.status(400).json({ message: 'Error when checking if Account is ACTIVE', error: err });
    }
    next();
};

exports.isAdminUser = async (req, res, next) => {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    try {
        if (await checkGroup(decoded.username, 'admin') === false) return res.status(401).json({ message: 'Unauthorised user' });
    } catch (err) {
        return res.status(400).json({ message: 'Error when checking if Account belongs to admin group', error: err });
    }
    next();
};

