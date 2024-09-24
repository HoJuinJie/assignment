const bcrpyt = require('bcryptjs');
const { getConnection } = require('../database');
const sendToken = require('../jwtToken');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');

const {
    validatePassword,
    validateEmail,
    validateUsername,
    validateGroupName
} = require('../functions');

// FRONTEND (START)
const getDetailsByUsername = async (username) => {
    try {
        const [rows] = await getConnection().query(`
            SELECT a.*, GROUP_CONCAT(ug.user_group) AS user_groups
            FROM accounts a
            LEFT JOIN usergroup ug ON a.username = ug.username
            WHERE a.username =?
            GROUP BY a.username
            `, [username]);
        if (rows.length) {
            const user = rows[0];
            return {
                ...user,
                user_groups: user.user_groups ? user.user_groups.split(",") : []
            };
        } else {
            return null;
        }
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching user details by username' });
        // throw new Error(err.message);
    }
};

exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.query;

        if (!username) res.status(400).json({ message: 'Username required', error: err });

        const userDetails = await getDetailsByUsername(username);

        if (userDetails.length === 0) return res.status(400).json({ message: 'User not found', error: err });
        res.status(200).json(userDetails);

    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching user' });
    }
};

exports.allUsers = async (req, res) => {
    try {
        const [rows] = await getConnection().query(`
            SELECT a.*, GROUP_CONCAT(ug.user_group) AS user_groups
            FROM accounts a
            LEFT JOIN usergroup ug ON a.username = ug.username
            GROUP BY a.username
            `);

        const filteredRows = rows.map(element => {
            return {
                ...element, // Keep other properties as they are
                user_groups: element.user_groups ? element.user_groups.split(",") : [] // Split usergroups into an array or set to empty array if null
            };
        });
        res.status(200).json(filteredRows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching users' });
    }
};

exports.allGroups = async (req, res) => {
    try {
        const [rows] = await getConnection().query(`SELECT DISTINCT user_group FROM usergroup`);
        const filteredRows = rows.map(element => element.user_group);
        res.status(200).json(filteredRows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching groups' });
    }
}

exports.BelongsTo = async (req, res) => {
    // added 3 lines below from middleware
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Login required' });
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    try {
        const [rows] = await getConnection().query(`
            SELECT ug.user_group
            FROM usergroup ug
            JOIN accounts a ON a.username = ug.username
            WHERE a.username = ?`,
            [req.user.username]
        );
        const filteredRows = rows.map(element => element.user_group);
        const isAdmin = filteredRows.includes('admin');
        res.status(200).json({ result: filteredRows, isAdmin, username: req.user.username });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(401).json({ message: `An error occurred while fetching user's groups` });
    }
}
// FRONTEND (END)

// BACKEND (START)
exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and Password are required' });
    try {
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) return res.status(400).json({ message: 'Invalid Username or Password' });
        if (result[0].accountStatus !== 'ACTIVE') return res.status(400).json({ message: `Login failed. Account is ${result[0].accountStatus}` });

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid Username or Password' })
        sendToken(result[0], 200, res, req);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred during login' });
    }
};

exports.register = async (req, res) => {
    const { username, password, email, accountStatus, group } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Both Username and Password required' });
    if (username.length < 1 || username.length > 50) return res.status(400).json({ message: 'Invalid username format. Username must be 1-50 characters' });
    if (!validateUsername(username)) return res.status(400).json({ message: 'Invalid username format. Username must only have alphanumeric characters' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be 8-10 characters long and include alphabets, numbers, and special characters' });
    if (email && !validateEmail(email)) return res.status(400).json({ message: 'Invalid email format. Correct Format: example@domain.com' });
    try {
        const [resultsFromAccounts] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (resultsFromAccounts.length !== 0) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrpyt.hash(password, 10);
        await getConnection().query(
            'INSERT INTO accounts (username, password, email, accountStatus) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email || '', accountStatus || 'ACTIVE']
        );
        if (group && group.length !==0) {
            const toAddValue = group.map(user_group => [username, user_group])
            await getConnection().query('INSERT INTO usergroup (username, user_group) VALUES ?', [toAddValue]);
        }
        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred during register' });
    }
};

exports.addGroup = async (req, res) => {
    const { user_group } = req.body;
    if (!user_group) return res.status(400).json({ message: 'Group name required' });
    if (user_group.length < 1 || user_group.length > 50) return res.status(400).json({ message: 'Invalid group name. Group name must be 1-50 characters' });
    if (!validateGroupName(user_group)) return res.status(400).json({ message: 'Invalid group name. Group name must only have alphanumeric characters including "_"' });
    try {
        const [result] = await getConnection().query('SELECT * FROM usergroup WHERE user_group = ?', [user_group]);
        if (result.length !== 0) return res.status(400).json({ message: 'Group already exists' });
        await getConnection().query('INSERT INTO usergroup (user_group) VALUES (?)', [user_group]);
        res.status(201).json({ message: 'Group added successfully' })
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating group' });
    }
};

exports.updateProfile = async (req, res) => {
    const { password, email } = req.body;
    if (!password && !email) return res.status(400).json({ message: 'At least one field must be updated' });

    let updateFields = [];
    let values = [];

    if (email) {
        if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
        updateFields.push('email = ?');
        values.push(email);
    }

    try {
        const token = req.cookies.token;
        const decoded = jwt.verify(token, JWT_SECRET);

        if (password) {
            if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be 8-10 characters long and include alphabets, numbers, and special characters' });
            const hashedPassword = await bcrpyt.hash(password, 10);
            updateFields.push('password = ?');
            values.push(hashedPassword);
        }

        if (updateFields.length !== 0) {
            values.push(decoded.username);
            await getConnection().query(`UPDATE accounts SET ${updateFields.join(', ')} WHERE username = ?`, values);
            res.status(200).json({ message: 'Profile updated successfully' });
        }

    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred when updating profile' });
    }
};

exports.adminResetCredentials = async (req, res) => {
    const { username, password, email, accountStatus, user_groups } = req.body;
    if (username === 'admin') return res.status(400).json({ message: 'Hardcoded admin account cannot be modified' });

    if (!username) return res.status(400).json({ message: 'Username required' });
    if (!password && !email && !accountStatus && !user_groups) return res.status(400).json({ message: 'At least one field must be updated' });

    let updateFields = [];
    let values = [];

    if (email) {
        if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email format' });
        updateFields.push('email = ?');
        values.push(email);
    }

    updateFields.push('accountStatus = ?');
    values.push(accountStatus || 'ACTIVE');

    try {
        const [resultsFromAccounts] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (resultsFromAccounts.length === 0) return res.status(400).json({ message: 'User not found' });

        if (user_groups) {
            const [originalGroups] = await getConnection().query('SELECT user_group FROM usergroup WHERE username = ?', [username]);

            const ogList = originalGroups.map((group) => group['user_group']);
            const toRemove = ogList.filter((group) => !user_groups.includes(group));
            const toAdd = user_groups.filter((group) => !ogList.includes(group));

            if (toRemove && toRemove.length !== 0) {
                await getConnection().query('DELETE FROM usergroup WHERE username = ? AND user_group IN (?)', [username, toRemove]);
            }
            if (toAdd && toAdd.length !== 0) {
                const toAddValue = toAdd.map(group => [username, group]);
                await getConnection().query('INSERT INTO usergroup (username, user_group) VALUES ?', [toAddValue]);
            }
        }

        if (password) {
            if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be 8-10 characters long and include alphabets, numbers, and special characters' });
            const hashedPassword = await bcrpyt.hash(password, 10);
            updateFields.push('password = ?');
            values.push(hashedPassword);
        }

        if (updateFields.length !== 0) {
            values.push(username);
            await getConnection().query(`UPDATE accounts SET ${updateFields.join(', ')} WHERE username = ?`, values);
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(500).json({ message: 'An error occurred while updating user' });
    }
};

exports.logout = (req, res) => {
    try {
        res.clearCookie('token', { httpOnly: true });
        res.status(200).json({ message: 'Logged out and cookie cleared' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: err });
    }
};

// exports.disableUser = async (req, res) => {
//     const { username, accountStatus } = req.body;
//     if (username === 'admin') return res.status(400).json({ message: 'Hardcoded admin account cannot be disabled' });
//     if (!username || !accountStatus) return res.status(400).json({ message: 'Username and Account Status required' });
//     try {
//         const [resultsFromAccounts] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
//         if (resultsFromAccounts.length === 0) return res.status(400).json({ message: 'User not found' });

//         const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ? AND accountStatus = ?', [username, accountStatus]);
//         if (result.length !== 0) return res.status(400).json({ message: `User already ${accountStatus}` });

//         await getConnection().query('UPDATE accounts SET accountStatus = ? WHERE username = ?', [accountStatus, username]);
//         res.status(200).json({ message: `Account status set to ${accountStatus}` });
//     } catch (err) {
//         console.log(JSON.stringify(err));
//         return res.status(400).json({ message: 'An error occurred when disabling user' });
//     }
// };
// BACKEND (END)

/*
TODO: NOTES
?query
a.*: Selects all columns from the accounts table.
GROUP_CONCAT: Concatenates related user_group values into one string.
LEFT JOIN: Combines accounts with usergroup based on username.
WHERE a.username = ?: Filters the results to a specific username.
GROUP BY a.username: Groups results by the username, so aggregate functions like GROUP_CONCAT work correctly.

?VALIDATE PW
/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$/:
1. (?=.*[a-zA-Z]): Ensures that there is at least one alphabet (uppercase or lowercase).
2. (?=.*[0-9]): Ensures that there is at least one digit.
3. (?=.*[!@#$%^&*]): Ensures that there is at least one special character from the set [!@#$%^&*]. You can modify this set to include other special characters as needed.
4. [a-zA-Z0-9!@#$%^&*]{8,10}: Ensures that the password length is between 8 and 10 characters, consisting only of allowed characters (alphabets, digits, and special characters).

console.log(validatePassword("Test123!"));  // true
console.log(validatePassword("Short1!"));   // false (less than 8 characters)
console.log(validatePassword("LongPassword123!"));  // false (more than 10 characters)
console.log(validatePassword("NoSpecial123"));  // false (missing special character)

?VALIDATE EMAIL
/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
1. [a-zA-Z0-9]: Allows uppercase and lowercase English letters (a-z, A-Z), and digits (0-9).
2. ._%+-: Allows the special characters ., _, %, +, and - to be part of the local part.
3. +: Ensures that there is at least one or more of these characters in the local part of the email.
4. @: This matches the @ symbol, which is required in all email addresses to separate the local part from the domain.
5. [a-zA-Z0-9.-]+: This part matches the domain name (after the @).
6. [a-zA-Z0-9]: Allows letters and digits in the domain name.
7. . and -: Allows dots (.) and hyphens (-) in the domain name (e.g., example.com or mail-server.net).
8. +: Ensures that there is at least one or more of these characters in the domain part.
9. \.[a-zA-Z]{2,}: This part matches the top-level domain (TLD) like .com, .org, .net, etc.
10. \.: Matches the literal dot (.) separating the domain from the TLD.
11. [a-zA-Z]{2,}: Ensures that the TLD consists of at least two or more letters (e.g., .com, .net).
12. $: This denotes the end of the string. It ensures that the string ends after the TLD part.

    console.log(validateEmail('test@example.com')); // expected: true
    console.log(validateEmail('test.email+foo@example.com')); // expected: true
    console.log(validateEmail('test@sub.example.co.uk')); // expected: true
    console.log(validateEmail('invalid-email')); // expected: false
    console.log(validateEmail('test@com')); // expected: false
    console.log(validateEmail('test@.com')); // expected: false
    console.log(validateEmail('test@domain.c')); // expected: false
*/
