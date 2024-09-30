const { getConnection } = require('../database');
const jwt = require('jsonwebtoken');
const { checkGroup } = require('../functions');
const { JWT_SECRET } = require('../config/config');

exports.belongInAppPermit = (state) => async (req, res, next) => {
    console.log('logging state', state);
    console.log('logging req.body', req.body);
    
    const appAcronym = req.body.appAcronym;
    console.log('logging appAcronym:', req.body.appAcronym);
    try {
        const [result] = await getConnection().query(`
            SELECT ${state}
            FROM application
            WHERE App_Acronym = ?`, [appAcronym]);
    
        console.log('logging result in belonginapppermit:', result);
        console.log('logging result[0] in belonginapppermit:', result[0][state]);
    
        const token = req.cookies.token;
        const decoded = jwt.verify(token, JWT_SECRET);
        const [rows] = await getConnection().query(`
            SELECT a.*, GROUP_CONCAT(ug.user_group) AS user_groups
            FROM accounts a
            LEFT JOIN usergroup ug ON a.username = ug.username
            WHERE a.username = ?
            GROUP BY a.username`, [decoded.username]);
    
        const filteredRows = rows.map(element => {
            return {
                ...element, // Keep other properties as they are
                user_groups: element.user_groups ? element.user_groups.split(",") : [] // Split usergroups into an array or set to empty array if null
            };
        });
    
        const userGroups = filteredRows[0].user_groups;
        console.log('logging userGroups', userGroups);
    
        console.log(userGroups.includes(result[0][state]));
        if (!userGroups.includes(result[0][state])) res.status(401).json({ message: 'Access denied, unauthorised user' });    
    } catch (err) {
        return res.status(400).json({ message: 'Error when checking if Account belongs to permitted groups', error: err });
    }
    next();

    // try {
    //     const permittedGroups = [
    //         req.body.App_permit_Open,
    //         req.body.App_permit_toDoList,
    //         req.body.App_permit_Doing,
    //         req.body.App_permit_Done,
    //         req.body.App_permit_Create
    //     ];
    //     const userInPermits = permittedGroups.filter((group) => userGroups.includes(group));
    //     console.log('userinpermits:', userInPermits);

    //     if (userInPermits.length === 0) return res.status(401).json({ message: 'Access denied, unauthorised user' });
    // } catch (err) {
    //     return res.status(400).json({ message: 'Error when checking if Account belongs to permitted groups', error: err });
    // }

    // const [sql] = await getConnection().query(`
    //     SELECT DISTINCT a.* 
    //     FROM application a
    //     JOIN usergroup u
    //     ON u.user_group = a.App_permit_Open
    //     OR u.user_group = a.App_permit_toDoList
    //     OR u.user_group = a.App_permit_Doing
    //     OR u.user_group = a.App_permit_Done
    //     OR u.user_group = a.App_permit_Create
    //     WHERE u.username = 'pl';
    //     `, [decoded.username]);
    // console.log('logging sql', sql);

}

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


