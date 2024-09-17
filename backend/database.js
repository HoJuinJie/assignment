const mySql = require("mysql2/promise");
const bcrpyt = require('bcryptjs');
const { HOST, USER, PASSWORD, DATABASE } = require('./config/config');


let myConnection;

const createConnection = () => {
    myConnection = mySql.createPool(
        {
            connectionLimit: 100,
            host: HOST,
            user: USER,
            password: PASSWORD,
            database: DATABASE
        })
};


function getConnection() {
    return myConnection;
};

async function createRootAdmin() {
    const hashedPassword = await bcrpyt.hash('P@ssw0rd1', 10);
    getConnection().query('INSERT IGNORE INTO accounts (username, password, email, accountStatus) VALUES (?, ?, ?, ?)', ['admin', hashedPassword, 'admin@admin.COM', 'ACTIVE']);
    getConnection().query('INSERT IGNORE INTO usergroup (username, user_group) VALUES (?, ?)', ['admin', 'admin']);
};

module.exports = {
    getConnection,
    createConnection,
    createRootAdmin
};