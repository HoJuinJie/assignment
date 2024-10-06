const { getConnection } = require('../database');
const { validateAppAcronym } = require('../functions');
const nodemailer = require('nodemailer');

// frontend
exports.apps = async (req, res) => {
    try {
        const [rows] = await getConnection().query(`SELECT * from application`);
        res.status(200).json(rows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching applications' });
    }
};

exports.plans = async (req, res) => { // rmb to only fetch plans that exist in that APP
    try {
        const [rows] = await getConnection().query(`SELECT * from plan`);
        res.status(200).json(rows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching plans' });
    }
};

exports.getPlansInApp = async (req, res) => {
    const { App_Acronym } = req.body;
    try {
        const [rows] = await getConnection().query(`SELECT * from plan WHERE Plan_app_Acronym = ?`, [App_Acronym]);
        res.status(200).json(rows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching plans from application' });
    }
};

exports.getTasksInApp = async (req, res) => {
    const { App_Acronym } = req.body;
    try {
        const [rows] = await getConnection().query(`SELECT * from task WHERE Task_app_Acronym = ?`, [App_Acronym]);
        res.status(200).json(rows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching tasks from application' });
    }
};


// backend
exports.createApp = async (req, res) => {
    const {
        appAcronym,
        rNumber,
        appDescription,
        startDate,
        endDate,
        appPermitCreate,
        appPermitOpen,
        appPermitToDo,
        appPermitDoing,
        appPermitDone
    } = req.body;

    if (!appAcronym || !rNumber || !startDate || !endDate) return res.status(400).json({ message: 'Required fields cannot be empty' });
    if (!validateAppAcronym(appAcronym)) return res.status(400).json({ message: 'Invalid App Acronym format' });
    if (rNumber > 2**32 -1) return res.status(400).json({ message: 'R-number exceeded acceptable range' });
    if (!/^[1-9]\d*$/.test(rNumber)) return res.status(400).json({ message: 'R-number must be a positive integer' });

    // convert date to epoch
    const userStartDate = new Date(startDate);
    const epochStartDate = Math.floor(userStartDate.getTime() / 1000);

    const userEndDate = new Date(endDate);
    const epochEndDate = Math.floor(userEndDate.getTime() / 1000);

    try {
        const [resultsFromApplication] = await getConnection().query('SELECT * FROM application WHERE App_Acronym = ?', [appAcronym]);
        if (resultsFromApplication.length !== 0) return res.status(400).json({ message: `App Acronym "${appAcronym}" already exists` });

        await getConnection().query(
            'INSERT INTO application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_Create) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [appAcronym, appDescription, rNumber, epochStartDate, epochEndDate, appPermitOpen, appPermitToDo, appPermitDoing, appPermitDone, appPermitCreate]);

        res.status(201).json({ message: 'Application created successfully' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating application' });
    }
}

exports.editApp = async (req, res) => {
    const {
        appAcronym,
        rNumber,
        appDescription,
        startDate,
        endDate,
        appPermitCreate,
        appPermitOpen,
        appPermitToDo,
        appPermitDoing,
        appPermitDone
    } = req.body;

    if (!startDate || !endDate) return res.status(400).json({ message: 'Both App_startDate and App_endDate are required' });

    // convert date to epoch
    const userStartDate = new Date(startDate);
    const epochStartDate = Math.floor(userStartDate.getTime() / 1000);
    const userEndDate = new Date(endDate);
    const epochEndDate = Math.floor(userEndDate.getTime() / 1000);

    try {
        let updateFields = [];
        let values = [];

        updateFields.push('App_Description = ?');
        values.push(appDescription);
        updateFields.push('App_startDate = ?');
        values.push(epochStartDate);
        updateFields.push('App_endDate = ?');
        values.push(epochEndDate);
        updateFields.push('App_permit_Open = ?');
        values.push(appPermitOpen);
        updateFields.push('App_permit_toDoList = ?');
        values.push(appPermitToDo);
        updateFields.push('App_permit_Doing = ?');
        values.push(appPermitDoing);
        updateFields.push('App_permit_Done = ?');
        values.push(appPermitDone);
        updateFields.push('App_permit_Create = ?');
        values.push(appPermitCreate);

        values.push(appAcronym);
        await getConnection().query(`UPDATE application SET ${updateFields.join(', ')} WHERE App_Acronym = ?`, values);

        res.status(201).json({ message: 'Application edited successfully' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while editing application' });
    }
}

exports.createPlan = async (req, res) => {
    const {
        planName,
        appAcronym,
        startDate,
        endDate,
        colour
    } = req.body;

    if (!planName || !startDate || !endDate) return res.status(400).json({ message: 'Required fields cannot be empty' });

    // rmb to validate plan name
    if (planName.length > 255) return res.status(400).json({ message: 'plan name exceeded limit of 255' });

    // convert date to epoch
    const userStartDate = new Date(startDate);
    const epochStartDate = Math.floor(userStartDate.getTime() / 1000);
    const userEndDate = new Date(endDate);
    const epochEndDate = Math.floor(userEndDate.getTime() / 1000);

    try {
        const [results] = await getConnection().query('SELECT * FROM plan WHERE Plan_MVP_name = ? AND Plan_MVP_name = ?', [planName, appAcronym]);
        if (results.length !== 0) return res.status(400).json({ message: `Plan MVP name "${planName}" already exists` });

        await getConnection().query(
            'INSERT INTO plan (Plan_MVP_name, Plan_app_Acronym, Plan_startDate, Plan_endDate, Plan_colour) VALUES (?, ?, ?, ?, ?)',
            [planName, appAcronym, epochStartDate, epochEndDate, colour]);

        res.status(201).json({ message: 'Plan created successfully' });
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating plan' });
    }
};

exports.createTask = async (req, res) => {
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

exports.saveTaskChanges = async (req, res) => {
    const {
        taskID,
        planName,
        taskNotes,
        taskState,
        taskOwner
    } = req.body;

    // consider race condition if you have the time
    console.log('taskid, planname, tasknotes, taskState', [taskID, planName, taskNotes, taskState]);
    try {
        if (planName === '') {
            await getConnection().query(
                'UPDATE task SET Task_plan = ?, Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?',
                [null, taskNotes, taskState, taskOwner, taskID]
            );
        } else {
            await getConnection().query(
                'UPDATE task SET Task_plan = ?, Task_notes = ?, Task_state = ?, Task_owner = ? WHERE Task_id = ?',
                [planName, taskNotes, taskState, taskOwner, taskID]
            );
        }

        res.status(201).json({ message: 'Task updated successfully' });

    } catch (err) {
        console.log(err);
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while updating task' });
    }
}

exports.sendEmail = async (req, res) => {
    const {
        to,
        appAcronym,
        taskName,
        taskOwner,
        taskID

    } = req.body;

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

    try {
        const [results] = await getConnection().query(`
            SELECT a.email FROM accounts a  
            JOIN usergroup u ON u.username = a.username 
            JOIN application app ON u.user_group = app.App_permit_Done 
            WHERE app.App_Acronym = ?`, [appAcronym]);
        
        console.log('logging to', to);
        
        const emails = results.map(user => user.email).filter(email => email).join(', ');
        
        console.log('logging emails:', emails);

        await transporter.sendMail({
            from: '"Dev Team" <jjstengg98@gmail.com>',
            to: emails,
            subject,
            text: message,
        });
        res.status(200).send('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send email');
    }
}




