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


// backend
exports.createApp = async (req,res) => {
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
    const epochStartDate = Math.floor(userStartDate.getTime()/1000);
    
    const userEndDate = new Date(endDate);
    const epochEndDate = Math.floor(userEndDate.getTime()/1000);

    try {
        const [resultsFromApplication] = await getConnection().query('SELECT * FROM application WHERE App_Acronym = ?', [appAcronym]);
        if (resultsFromApplication.length !== 0) return res.status(400).json({ message: 'App Acronym already exists' });

        await getConnection().query(
            'INSERT INTO application (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate, App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done, App_permit_Create) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [appAcronym, appDescription, rNumber, epochStartDate, epochEndDate, appPermitOpen, appPermitToDo, appPermitDoing, appPermitDone, appPermitCreate]);
            
        res.status(201).json({ message: 'Plan created successfully' });    
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while creating application' });
    }
}
