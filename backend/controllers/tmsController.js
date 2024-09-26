const { getConnection } = require('../database');
const { validateAppAcronym } = require('../functions')

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
    if (rNumber <= 0) return res.status(400).json({ message: 'R-number must be > 0' });

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
    if (planName.length >255) return res.status(400).json({ message: 'plan name exceeded limit of 255' });

    // convert date to epoch
    const userStartDate = new Date(startDate);
    const epochStartDate = Math.floor(userStartDate.getTime() / 1000);
    const userEndDate = new Date(endDate);
    const epochEndDate = Math.floor(userEndDate.getTime() / 1000);
    
    try {
        const [results] = await getConnection().query('SELECT * FROM plan WHERE Plan_MVP_name = ?', [planName]);
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
        rNumber +=1;

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
        connection.release();
    }
};