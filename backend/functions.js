const { getConnection } = require('./database');

async function checkGroup(userid, groupname) {
    try {
        const [result] = await getConnection().query('SELECT * FROM usergroup WHERE username = ? AND user_group = ?', [userid, groupname]);
        return (result[0] != null);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: `An error occurred while checking group`, error: err });
    }
};

const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,10}$/;
    return passwordRegex.test(password);
};

const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
};

const validateUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9]{1,50}$/;
    return usernameRegex.test(username);
}

const validateGroupName = (groupName) => {
    const groupNameRegex = /^[a-zA-Z0-9_]{1,50}$/;
    return groupNameRegex.test(groupName);
}

module.exports = {
    checkGroup,
    validatePassword,
    validateEmail,
    validateUsername,
    validateGroupName
}