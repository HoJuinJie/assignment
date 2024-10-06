const { getConnection } = require('../database');
const nodemailer = require('nodemailer');
const bcrpyt = require('bcryptjs');

class MsgCode {
    static SUCCESS = "SUCC2001";
    static INVALID_INPUT = "ERR4001";
    static ENTRY_EXISTS = "ERR4002";
    static INVALID_STATE_CHANGE = "ERR4003";
    static NOT_FOUND = "ERR4004";
    static INVALID_CREDENTIALS = "ERR4005"; // do not have credentials
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
    } = req.body;

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
    const newTaskNotes = taskNotes + `\n[${taskCreator}, Current state: ${taskState}, ${displayDate} at ${formattedTime}] \n\n` +
                '===============================================================================================\n\n';

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

    if (taskName.length < 0 || taskName.length > 255) { // TN format validation
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    try { // check login details
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";
        // res.status(201).json({ message: 'create task looks good' }); //this is to test if create task works 

    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
    }

    try { // check permit create
        const [permitCreate] = await getConnection().query(`
            SELECT App_permit_Create
            FROM application
            WHERE App_Acronym = ?`, [appAcronym]);
    
        const [groups] = await getConnection().query(`
            SELECT a.*, GROUP_CONCAT(ug.user_group) AS user_groups
            FROM accounts a
            LEFT JOIN usergroup ug ON a.username = ug.username
            WHERE a.username = ?
            GROUP BY a.username`, [username]);
    
        const filteredRows = groups.map(element => {
            return {
                ...element, // Keep other properties as they are
                user_groups: element.user_groups ? element.user_groups.split(",") : [] // Split usergroups into an array or set to empty array if null
            };
        });
    
        const userGroups = filteredRows[0].user_groups;
    
        if (!userGroups.includes(permitCreate[0]['App_permit_Create'])) return res.status(401).json({ message: 'Access denied, unauthorised user', msgCode: MsgCode.NOT_AUTHORIZED });    
    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error when checking if Account belongs to permitted groups', error: err, msgCode: MsgCode.INTERNAL });
    }

    if (taskPlan) { // check if plan exists
        try { 
            const [plans] = await getConnection().query('SELECT Plan_MVP_name FROM tms.plan WHERE Plan_app_Acronym = ? AND Plan_MVP_name = ?', [appAcronym, taskPlan]);
            if (plans.length === 0) throw "plan does not exist";
        } catch (err) {
            console.error(err);
            return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
        }
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

        const [result] = await connection.query(`SELECT * from task WHERE Task_id = ?`,[newTaskID]);

        res.status(201).json({ result, msgCode: MsgCode.SUCCESS });

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

exports.GetTaskbyState = async (req, res) => {
    const {
        username,
        password,
        taskState,
        appAcronym
    } = req.body;

    if (!username || !password) { // no US or PW
        res.status(401).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!appAcronym || !taskState) { //no AA or TS
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }


    if (!['open', 'to do', 'doing', 'done', 'closed'].includes(taskState)) { // if taskState does not exist
        res.status(201).json({ result: [], msgCode: MsgCode.SUCCESS });
        return
    }

    try { // check login details
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";
        // res.status(201).json({ message: 'create task looks good' }); //this is to test if create task works 

    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
    }

    try {
        const [rows] = await getConnection().query(`SELECT * from task WHERE Task_app_Acronym = ? AND Task_state = ?`, [appAcronym, taskState]);
        res.status(200).json({result: rows, msgCode: MsgCode.SUCCESS });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'An error occurred while fetching tasks from application', msgCode: MsgCode.INTERNAL });
    }

}

exports.PromoteTask2Done = async (req, res) => {
    const {
        username,
        password,
        taskID,
        appAcronym,
        taskNotes
    } = req.body;

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
    const taskOwner = username;
    const taskState = 'done';
    // format taskNotes
    const newTaskNotes = taskNotes + `\n[${taskOwner}, Current state: ${taskState}, ${displayDate} at ${formattedTime}] \n\n` +
                `${taskOwner} moved '${taskID}' from <doing> state to <${taskState}> state \n[${taskOwner}, Current State: ${taskState}, ${displayDate} at ${formattedTime}]\n\n` +
                '===============================================================================================\n\n';

    if (!username || !password) { // no US or PW
        res.status(401).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!appAcronym || !taskID) { //no AA or Tid
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    try { // check login details
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";
        // res.status(201).json({ message: 'create task looks good' }); //this is to test if create task works 

    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
    }

    try { // check permit doing
        const [permitDoing] = await getConnection().query(`
            SELECT App_permit_Doing
            FROM application
            WHERE App_Acronym = ?`, [appAcronym]);
    
        const [groups] = await getConnection().query(`
            SELECT a.*, GROUP_CONCAT(ug.user_group) AS user_groups
            FROM accounts a
            LEFT JOIN usergroup ug ON a.username = ug.username
            WHERE a.username = ?
            GROUP BY a.username`, [username]);
    
        const filteredRows = groups.map(element => {
            return {
                ...element, // Keep other properties as they are
                user_groups: element.user_groups ? element.user_groups.split(",") : [] // Split usergroups into an array or set to empty array if null
            };
        });
    
        const userGroups = filteredRows[0].user_groups;
    
        if (!userGroups.includes(permitDoing[0]['App_permit_Doing'])) return res.status(401).json({ message: 'Access denied, unauthorised user', msgCode: MsgCode.NOT_AUTHORIZED });  

    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error when checking if Account belongs to permitted groups', error: err, msgCode: MsgCode.INTERNAL });
    }

    try { // check if taskID exist
        const [tasks] = await getConnection().query(`SELECT * from tms.task WHERE Task_app_Acronym = ? AND Task_id = ?`, [appAcronym, taskID]);
        if (tasks.length === 0) throw "task does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
    }

    try { // check if task is currently in <doing> state i.e not allowed to promote to <done> otherwise
        const [state] = await getConnection().query(`SELECT Task_state FROM tms.task WHERE Task_id = ?`, [taskID]);
        if (state[0].Task_state !== 'doing') throw "invalid state change";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_STATE_CHANGE });
    }

    try { // update database when all fields meet requirements
        await getConnection().query(
            'UPDATE task SET Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?',
            [newTaskNotes, taskState, taskOwner, taskID]
        );

    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error when promoting task to Done state', msgCode: MsgCode.INTERNAL });
    }

    //send email
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        secure: false,
        auth: {
            user: 'jjstengg98@gmail.com',
            pass: 'baij vtna snhp opqz',
        },
    });

    const subject = `Requesting review for ${taskID}`;
    const message = `${taskOwner} moved ${taskID} from <doing> state to <done> state for review`;

    try { // Send email
        const [results] = await getConnection().query(`
            SELECT a.email FROM accounts a  
            JOIN usergroup u ON u.username = a.username 
            JOIN application app ON u.user_group = app.App_permit_Done 
            WHERE app.App_Acronym = ?`, [appAcronym]);
                
        const emails = results.map(user => user.email).filter(email => email).join(', ');
        
        if (emails.length === 0) {
            res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
            return
        }

        await transporter.sendMail({
            from: '"Dev Team" <jjstengg98@gmail.com>',
            to: emails,
            subject,
            text: message,
        })

        const [result] = await connection.query(`SELECT * from task WHERE Task_id = ?`,[taskID]);
        res.status(201).json({ result, msgCode: MsgCode.SUCCESS });

    } catch (err) {
        console.error(err);
        return res.status(400).json({ message: 'Error when sending email', msgCode: MsgCode.INTERNAL });
    }
};
