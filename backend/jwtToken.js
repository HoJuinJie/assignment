const jwt = require('jsonwebtoken');

const { // refer to notes below
    JWT_SECRET,
    JWT_EXPIRES_TIME,
    COOKIE_EXPIRES_TIMES
} = require('./config/config');

const getJwtToken = async (user, req) => {
    const ipAddress = req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const payload = {
        ipAddress,
        userAgent,
        username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_TIME
    });

    return token;
}

// Create and send token and save in cookie
const sendToken = async (user, statusCode, res, req) => {
    // Create JWT Token
    const token = await getJwtToken(user, req)

    // Options for cookie
    const options = {
        expires: new Date(Date.now() + COOKIE_EXPIRES_TIMES * 24 * 60 * 60 * 1000), 
        httpOnly: true
    };
    
    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            message: 'User authenticated',
            token
        });
}

module.exports = sendToken;

/*
TODO: NOTES
?JWT expiration 
defines how long the JWT token is considered valid for authentication. After this time, the token becomes invalid, and the user must re-authenticate to get a new token.
Usual practice: JWT tokens typically have shorter expiration times for security reasons, such as 1 hour or 2 hours (1h, 2h).
Security purpose: This limits the window in which the token can be abused if compromised (e.g., in case the JWT is leaked). Once the token expires, the user has to log in again to get a new one.

?cookie expiration 
defines how long the cookie containing the JWT will persist in the client’s browser. The cookie expiration typically reflects how long you want the user to stay "logged in" without needing to re-authenticate, which can be set for days, weeks, or even months.
Usual practice: Cookie expiration is often longer, such as 7 days, 30 days, or even longer in some cases (especially for "Remember Me" functionality).
Purpose: This ensures that the user can remain authenticated across sessions and browser restarts without needing to log in again, as long as the cookie is still valid and hasn't expired.

?How They Differ:
JWT Expiration:
Determines how long the JWT itself is valid for authorization (the token inside the cookie).
Once expired, it requires the user to log in again to get a new token.
Cookie Expiration:
Determines how long the cookie containing the JWT is stored in the browser.
If the cookie expires, the browser no longer sends the token, even if the token itself is still valid.
If the cookie is deleted or expires, the user will need to log in again to generate a new cookie.
*/

/*
const jwt = require('jsonwebtoken');
// const { checkGroup } = require('./functions');


const { // refer to notes below
    JWT_SECRET,
    JWT_EXPIRES_TIME,
    COOKIE_EXPIRES_TIMES
} = require('./config/config');

const getJwtToken = async (user, req) => {
    const ipAddress = req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';

    const payload = {
        ipAddress,
        userAgent,
        username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_TIME
    });

    return token;
}

// Create and send token and save in cookie
const sendToken = async (user, statusCode, res, req) => {
    // Create JWT Token
    const token = await getJwtToken(user, req)
    // const decoded = jwt.verify(token, JWT_SECRET);
    // let isAdmin = await checkGroup(decoded.username, 'ADMIN');

    // Options for cookie
    const options = {
        expires: new Date(Date.now() + COOKIE_EXPIRES_TIMES * 24 * 60 * 60 * 1000), 
        httpOnly: true
    };
    
    res
        .status(statusCode)
        .cookie('token', token, options)
        .json({
            message: 'User authenticated',
            // isAdmin: isAdmin,
            token
        });
}

module.exports = sendToken;
*/