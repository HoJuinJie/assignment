const { getConnection } = require('../database');
const nodemailer = require('nodemailer');
const bcrpyt = require('bcryptjs');

class MsgCode {
    // Success Code
    static SUCCESS = "SUCC2001";
    // Payload Structure
    static INVALID_KEY = "ERR4001";
    // Transaction Error
    static INVALID_INPUT = "ERR4002";
    static INVALID_STATE_CHANGE = "ERR4003";
    static NOT_FOUND = "ERR4004";
    static INTERNAL = "ERR5001";
    // Authentication Error
    static INVALID_CREDENTIALS = "ERR4005"; // do not have credentials
    static NOT_AUTHORIZED = "ERR4006";    // do not have access rights
};

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

    const allowedKeys = ['username', 'password', 'appAcronym', 'taskName', 'description', 'taskNotes', 'taskPlan'];
    const invalidKeys = Object.keys(req.body).filter(key => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
        res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
        return;
    }

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
    const newTaskNotes = `"${taskNotes}"` + `\n[${taskCreator}, Current state: ${taskState}, ${displayDate} at ${formattedTime}] \n\n` +
                '===============================================================================================\n\n';

    // Get a connection from the pool
    const connection = await getConnection().getConnection();

    if (!username || !password) { // no US or PW
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
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

    } catch (err) {
        console.error(err);
        return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
    }

    try { // check if appAcronym exist
        const [app] = await getConnection().query('SELECT * FROM tms.application WHERE App_Acronym = ?', [appAcronym]);
        if (app.length === 0) throw "app acronym does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
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
    
        if (!userGroups.includes(permitCreate[0]['App_permit_Create'])) return res.status(403).json({ msgCode: MsgCode.NOT_AUTHORIZED });    
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
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

        // const [result] = await connection.query(`SELECT * from task WHERE Task_id = ?`,[newTaskID]);

        res.status(200).json({ result: { Task_id : newTaskID }, msgCode: MsgCode.SUCCESS });

    } catch (err) {
        // if any error occurs, rollback the transaction
        await connection.rollback();
        console.log(JSON.stringify(err));
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
    } finally {
        // Release connection back to the pool
        connection.release();
    }
};

exports.GetTaskbyState = async (req, res) => { 
    const {
        username,
        password,
        taskState,
        appAcronym
    } = req.body;

    const allowedKeys = ['username', 'password', 'taskState', 'appAcronym'];
    const invalidKeys = Object.keys(req.body).filter(key => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
        res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
        return;
    }

    
    if (!username || !password) { // no US or PW
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!appAcronym || !taskState) { //no AA or TS
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!['open', 'to do', 'doing', 'done', 'closed'].includes(taskState)) { // if taskState does not exist
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    try { // check login details
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";

    } catch (err) {
        console.error(err);
        return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
    }

    try { // check if appAcronym exist
        const [app] = await getConnection().query('SELECT * FROM tms.application WHERE App_Acronym = ?', [appAcronym]);
        if (app.length === 0) throw "app acronym does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
    }

    try {
        const [rows] = await getConnection().query(`SELECT * from task WHERE Task_app_Acronym = ? AND Task_state = ?`, [appAcronym, taskState]);
        res.status(200).json({result: rows, msgCode: MsgCode.SUCCESS });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
    }

};

exports.PromoteTask2Done = async (req, res) => {
    const {
        username,
        password,
        taskId,
        appAcronym,
        taskNotes
    } = req.body;

    const allowedKeys = ['username', 'password', 'taskId', 'appAcronym', 'taskNotes'];
    const invalidKeys = Object.keys(req.body).filter(key => !allowedKeys.includes(key));
    if (invalidKeys.length > 0) {
        res.status(400).json({ msgCode: MsgCode.INVALID_KEY });
        return;
    }

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
    const newTaskNotes = `"${taskNotes}"` + `\n[${taskOwner}, Current state: ${taskState}, ${displayDate} at ${formattedTime}] \n\n` +
                `${taskOwner} moved '${taskId}' from <doing> state to <${taskState}> state \n[${taskOwner}, Current State: ${taskState}, ${displayDate} at ${formattedTime}]\n\n` +
                '===============================================================================================\n\n';

    if (!username || !password) { // no US or PW
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    if (!appAcronym || !taskId) { //no AA or Tid
        res.status(400).json({ msgCode: MsgCode.INVALID_INPUT });
        return
    }

    try { // check login details
        const [result] = await getConnection().query('SELECT * FROM accounts WHERE username = ?', [username]);
        if (result.length === 0) throw "user does not exist";
        if (result[0].accountStatus !== 'ACTIVE') throw "account disabled";

        const isPasswordValid = await bcrpyt.compare(password, result[0].password);
        if (!isPasswordValid) throw "password not matched";

    } catch (err) {
        console.error(err);
        return res.status(401).json({ msgCode: MsgCode.INVALID_CREDENTIALS });
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
    
        if (!userGroups.includes(permitDoing[0]['App_permit_Doing'])) return res.status(403).json({ msgCode: MsgCode.NOT_AUTHORIZED });  

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
    }

    try { // check if appAcronym exist
        const [app] = await getConnection().query('SELECT * FROM tms.application WHERE App_Acronym = ?', [appAcronym]);
        if (app.length === 0) throw "app acronym does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
    }

    try { // check if taskId exist
        const [tasks] = await getConnection().query(`SELECT * from tms.task WHERE Task_app_Acronym = ? AND Task_id = ?`, [appAcronym, taskId]);
        if (tasks.length === 0) throw "task does not exist";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.NOT_FOUND });
    }

    try { // check if task is currently in <doing> state i.e not allowed to promote to <done> otherwise
        const [state] = await getConnection().query(`SELECT Task_state FROM tms.task WHERE Task_id = ?`, [taskId]);
        if (state[0].Task_state !== 'doing') throw "invalid state change";
    } catch (err) {
        console.error(err);
        return res.status(400).json({ msgCode: MsgCode.INVALID_STATE_CHANGE });
    }

    try { // update database when all fields meet requirements
        await getConnection().query(
            'UPDATE task SET Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?',
            [newTaskNotes, taskState, taskOwner, taskId]
        );

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
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

    const subject = `Requesting review for ${taskId}`;
    const message = `${taskOwner} moved ${taskId} from <doing> state to <done> state for review`;

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

        // const [result] = await getConnection().query(`SELECT * from task WHERE Task_id = ?`,[taskId]);
        res.status(200).json({ result: { Task_id: taskId, Task_state : 'done'  }, msgCode: MsgCode.SUCCESS });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ msgCode: MsgCode.INTERNAL });
    }
};

/*
!cURL:
!ENDPOINT 1: CreateTask
?command prompt:
curl --location "http://localhost:3000/api/demo/CreateTask" --header "Content-Type: application/json" --data "{\"username\":\"pl\",\"password\":\"abc123!!\",\"appAcronym\":\"app1\",\"taskName\":\"task1\",\"description\":\"the is the description\",\"taskNotes\":\"testing cURL\", \"taskPlan\":\"sprint 1\"}"
OR
curl --location "http://localhost:3000/api/demo/CreateTask" ^
--header "Content-Type: application/json" ^
--data "{\"username\":\"pl\",\"password\":\"abc123!!\",\"appAcronym\":\"app1\",\"taskName\":\"task1\",\"description\":\"the is the description\",\"taskNotes\":\"testing cURL\", \"taskPlan\":\"sprint 1\"}"


?powershell:
curl -Method POST `
-Uri "http://localhost:3000/api/demo/CreateTask" `
-Headers @{
    "Content-Type" = "application/json"
} `
-Body '{
    "username" : "pl",
    "password" : "abc123!!",
    "appAcronym" : "app1",
    "taskName" : "task100",
    "description" : "this is the description for task100",
    "taskNotes" : "testing cURL on powershell",
    "taskPlan" : "sprint 1"
}'

!ENDPOINT 2: GetTaskbyState
?command prompt:
curl --location "http://localhost:3000/api/demo/GetTaskbyState" --header "Content-Type: application/json" --data "{\"username\":\"test\",\"password\":\"abc123!!\",\"taskState\":\"open\",\"appAcronym\":\"app1\"}"
OR
curl --location "http://localhost:3000/api/demo/GetTaskbyState" ^
--header "Content-Type: application/json" ^
--data "{\"username\":\"test\", \"password\":\"abc123!!\", \"taskState\":\"open\", \"appAcronym\":\"app1\"}"


?powershell:
curl -Method POST `
-Uri "http://localhost:3000/api/demo/GetTaskbyState" `
-Headers @{
    "Content-Type" = "application/json"
} `
-Body '{
    "username" : "test",
    "password" : "abc123!!",
    "taskState" : "doing",
    "appAcronym" : "app1"
}'

!ENDPOINT 3: PromoteTask2Done
?command prompt:
curl --location "http://localhost:3000/api/demo/PromoteTask2Done" --header "Content-Type: application/json" --data "{\"username\":\"test\",\"password\":\"abc123!!\",\"taskId\":\"app1_129\",\"appAcronym\":\"app1\",\"taskNotes\":\"testing cURL\"}"
OR
curl --location "http://localhost:3000/api/demo/PromoteTask2Done" ^
--header "Content-Type: application/json" ^
--data "{\"username\":\"test\", \"password\":\"abc123!!\", \"taskId\":\"app1_130\", \"appAcronym\":\"app1\", \"taskNotes\":\"testing cURL multilines\"}"


?powershell:
curl -Method POST `
-Uri "http://localhost:3000/api/demo/PromoteTask2Done" `
-Headers @{
    "Content-Type" = "application/json"
} `
-Body '{
    "username" : "test",
    "password" : "abc123!!",
    "taskId" : "app1_129",
    "appAcronym" : "app1",
    "taskNotes" : "testing cURL on powershell"
}'

*/