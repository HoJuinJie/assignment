const { getConnection } = require('./database');

async function checkGroup(userid, groupname) {
    try {
        const [result] = await getConnection().query('SELECT * FROM usergroup WHERE username = ? AND user_group = ?', [userid, groupname]);
        return (result[0] != null);
    } catch (err) {
        return res.status(400).json({ message: `An error occurred while checking group`, error: err });
    }
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$/; // Refer to notes below
    return passwordRegex.test(password);
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Refer to notes
    return emailRegex.test(email);
};

module.exports = {
    checkGroup,
    validatePassword,
    validateEmail
}