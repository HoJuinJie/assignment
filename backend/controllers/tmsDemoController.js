const { getConnection } = require('../database');
const { validateAppAcronym } = require('../functions');
const nodemailer = require('nodemailer');
const bcrpyt = require('bcryptjs');

class MsgCode {
    static SUCCESS = "SUCC2001";
    static INVALID_INPUT = "ERR4001";
    static ENTRY_EXISTS = "ERR4002";
    static INVALID_STATE_CHANGE = "ERR4003";
    static NOT_FOUND = "ERR4004";
    static NOT_AUTHENTICATED = "ERR4005"; // do not have credentials
    static NOT_AUTHORIZED = "ERR4006";    // do not have access rights
    static INTERNAL = "ERR5001";
    static UNHANDLED = "ERR6001";
}

exports.CreateTask = async (req, res) => {
    const {
        username,
        password,
        appAcronym,
        taskName,
        description,
        taskNotes,
        taskPlan
    } = req.body

    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const formattedDate = `${year}-${month}-${day}`;
    const displayDate = `${day}/${month}/${year}`

    let now = new Date();
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let seconds = String(now.getSeconds()).padStart(2, '0');
    let formattedTime = `${hours}:${minutes}:${seconds}`;

    // set other display fields that can be handled in backend 
    const taskState = 'open';
    const taskCreator = username;
    const taskOwner = username;
    // convert date to epoch
    const userCreateDate = new Date(formattedDate);
    const epochCreateDate = Math.floor(userCreateDate.getTime() / 1000);
    // format taskNotes
    let newTaskNotes = taskNotes + `\n[${taskCreator}, Current state: ${taskState}, ${displayDate} at ${formattedTime}] \n\n` +
                '===================================================================================\n\n';

    // Get a connection from the pool
    const connection = await getConnection().getConnection();

    if (!username || !password) { // no US or PW
        res.status(401).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!appAcronym || !taskName) { //no AA or TN
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!/^[a-zA-Z0-9_]{1,50}$/.test(appAcronym)) { // appAcronym format validation
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (taskName.length < 0 || taskName.length > 255) { // TN format validation
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    try {
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";
        // res.status(201).json({ message: 'create task looks good' }); //this is to test if create task works 

    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_AUTHENTICATED });
    }

    try { // check if plan exists
        const [plans] = await getConnection().query('SELECT Plan_MVP_name FROM tms.plan WHERE Plan_app_Acronym = ? AND Plan_MVP_name = ?', [appAcronym, taskPlan]);
        if (plans.length === 0) throw "plan does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
    }

    try {
        // Handle Race Condition - Transaction with Row Locking

        // Start transaction
        await connection.beginTransaction();

        // Lock the R_number row
        const [rows] = await connection.query(
            'SELECT App_Rnumber FROM application WHERE App_Acronym = ? FOR UPDATE', [appAcronym]
        );

        if (rows.length === 0) { // check if appAcronym input is exists
            throw { code: "NOT_FOUND" };
        }

        let rNumber = rows[0].App_Rnumber;
        rNumber += 1;

        // Update existing R-number
        await connection.query(
            'UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?', [rNumber, appAcronym]
        );

        let newTaskID = appAcronym + '_' + rNumber;

        if (taskPlan === '') {
            await connection.query(
                'INSERT INTO task (Task_id, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newTaskID, appAcronym, taskName, description, newTaskNotes, taskState, taskCreator, taskOwner, epochCreateDate]);
        } else {
            await connection.query(
                'INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newTaskID, taskPlan, appAcronym, taskName, description, newTaskNotes, taskState, taskCreator, taskOwner, epochCreateDate]);
        }

        // commit the transaction
        await connection.commit();

        res.status(201).json({ msgCode: MsgCode.SUCCESS });

    } catch (err) {
        if (err.code === "NOT_FOUND") {
            console.error(err);
            return res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        }

        // if any error occurs, rollback the transaction
        await connection.rollback();
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating application', msgCode: MsgCode.INTERNAL });
    } finally {
        // Release connection back to the pool
        connection.release();
    }
}

exports.createTask2 = async (req, res) => {
    const {
        taskID,
        planName,
        appAcronym,
        taskName,
        taskDescription,
        taskNotes,
        taskState,
        taskCreator,
        taskOwner,
        taskCreateDate
    } = req.body;

    if (!taskName) return res.status(400).json({ message: 'Required fields cannot be empty' });
    if (taskName.length > 255) return res.status(400).json({ message: 'plan name exceeded limit of 255' });

    // convert date to epoch
    const userCreateDate = new Date(taskCreateDate);
    const epochCreateDate = Math.floor(userCreateDate.getTime() / 1000);

    // Get a connection from the pool
    const connection = await getConnection().getConnection();

    try {
        // Handle Race Condition - Transaction with Row Locking
        console.log('step1');
        // Start transaction
        await connection.beginTransaction();
        console.log('managed to begin transaction')

        // Lock the R_number row
        const [rows] = await connection.query(
            'SELECT App_Rnumber FROM application WHERE App_Acronym = ? FOR UPDATE', [appAcronym]
        );

        let rNumber = rows[0].App_Rnumber;
        rNumber += 1;

        // Update existing R-number
        await connection.query(
            'UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?', [rNumber, appAcronym]
        );

        let newTaskID = appAcronym + '_' + rNumber;

        console.log('logging newtaskID', newTaskID);

        if (planName === '') {
            await connection.query(
                'INSERT INTO task (Task_id, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newTaskID, appAcronym, taskName, taskDescription, taskNotes, taskState, taskCreator, taskOwner, epochCreateDate]);
        } else {
            await connection.query(
                'INSERT INTO task (Task_id, Task_plan, Task_app_Acronym, Task_name, Task_description, Task_notes, Task_state, Task_creator, Task_owner, Task_createDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [newTaskID, planName, appAcronym, taskName, taskDescription, taskNotes, taskState, taskCreator, taskOwner, epochCreateDate]);
        }

        // commit the transaction
        await connection.commit();

        res.status(201).json({ message: 'Task created successfully' });
    } catch (err) {
        // if any error occurs, rollback the transaction
        await connection.rollback();
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating application' });
    } finally {
        // Release connection back to the pool
        connection.release();
    }
};