const { getConnection } = require('../database');

exports.apps = async (req, res) => {
    try {
        const [rows] = await getConnection().query(`SELECT * from application`);
        res.status(200).json(rows);
    } catch (err) {
        console.log(JSON.stringify(err));
        return res.status(400).json({ message: 'An error occurred while fetching applications' });
    }
};
