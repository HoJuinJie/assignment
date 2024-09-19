const { getConnection } = require('../database');
const jwt = require('jsonwebtoken');
const { checkGroup } = require('../functions');
const { JWT_SECRET } = require('../config/config');

exports.isAuthenticatedUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Login required' });
    try {
        const ipAddress = req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.ipAddress !== ipAddress || decoded.userAgent !== userAgent) return res.status(401).json({ message: 'Access denied, authentication failed', error: err });
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [decoded.username]);
        if (result[0].accountStatus !== 'ACTIVE') return res.status(401).json({ message: 'Access denied, account disabled' });
        
        // req.user = decoded; // add this to endpoint directly so that api will not break if isAuthenticatedUser is not called
    } catch (err) {
        return res.status(400).json({ message: 'Error when authenticating user', error: err });
    }
    next();
};

exports.userBelongsTo = (groupNames) => async (req, res, next) => {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, JWT_SECRET);
    try {
        for (let i = 0; i < groupNames.length; i++) {
            if (await checkGroup(decoded.username, groupNames[i]) === false) return res.status(401).json({ message: 'Access denied, unauthorised user' });
        }
    } catch (err) {
        return res.status(400).json({ message: 'Error when checking if Account belongs to allowed group(s)', error: err });
    }
    next();
};

// exports.isAdminUser = async (req, res, next) => {
//     const token = req.cookies.token;
//     const decoded = jwt.verify(token, JWT_SECRET);
//     try {
//         if (await checkGroup(decoded.username, 'admin') === false) return res.status(401).json({ message: 'Access denied, unauthorised user' });
//     } catch (err) {
//         return res.status(400).json({ message: 'Error when checking if Account belongs to admin group', error: err });
//     }
//     next();
// };

// exports.isActive = async (req, res, next) => {
//     const token = req.cookies.token;
//     const decoded = jwt.verify(token, JWT_SECRET);
//     try {
//         const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [decoded.username]);
//         if (result[0].accountStatus !== 'ACTIVE') return res.status(401).json({ message: 'Access denied2, account disabled' });
//     } catch (err) {
//         return res.status(400).json({ message: 'Error when checking if Account is ACTIVE', error: err });
//     }
//     next();
// };

