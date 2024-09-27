const router = require('express').Router();

const {
    apps,
    plans,
    getPlansInApp,
    getTasksInApp,
    createApp,
    editApp,
    createPlan,
    createTask,
    saveTaskChanges
} = require('../controllers/tmsController');

const {
    isAuthenticatedUser,
    userBelongsTo
} = require('../middleware/auth');

// Protected Routes
router.post('/createApp', [isAuthenticatedUser, userBelongsTo(['PL']), createApp]);
router.post('/editApp', [isAuthenticatedUser, userBelongsTo(['PL']), editApp]);
router.post('/createPlan', [isAuthenticatedUser, userBelongsTo(['PL']), createPlan]);
router.post('/createTask', [isAuthenticatedUser, createTask]); // remember to review permissions 

// FRONT-END Protected routes
router.get('/apps', [isAuthenticatedUser, apps]);
router.get('/plans', [isAuthenticatedUser, plans]);
router.post('/getPlansInApp', [isAuthenticatedUser, getPlansInApp]);
router.post('/getTasksInApp', [isAuthenticatedUser, getTasksInApp]);
router.post('/saveTaskChanges', [isAuthenticatedUser, saveTaskChanges]);


module.exports = router;
