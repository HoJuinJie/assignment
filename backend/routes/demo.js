const router = require('express').Router();

// const {
//     apps,
//     plans,
//     getPlansInApp,
//     getTasksInApp,
//     createApp,
//     editApp,
//     createPlan,
//     createTask,
//     saveTaskChanges,
//     sendEmail
// } = require('../controllers/tmsController');


// const {
//         isAuthenticatedUser,
//         userBelongsTo,
//         belongInAppPermit
//     } = require('../middleware/auth');
    
const {
    CreateTask,
    GetTaskbyState
} = require('../controllers/tmsDemoController')

router.post('/CreateTask', [CreateTask]); 
router.post('/GetTaskbyState', [GetTaskbyState]); 



// // Protected Routes
// router.post('/createApp', [isAuthenticatedUser, userBelongsTo(['PL']), createApp]);
// router.post('/editApp', [isAuthenticatedUser, userBelongsTo(['PL']), editApp]);
// router.post('/createPlan', [isAuthenticatedUser, userBelongsTo(['PM']), createPlan]);
// router.post('/createTask', [isAuthenticatedUser, belongInAppPermit('App_permit_Create'), createTask]); 
// router.get('/apps', [isAuthenticatedUser, apps]);
// router.get('/plans', [isAuthenticatedUser, plans]);
// router.post('/getPlansInApp', [isAuthenticatedUser, getPlansInApp]);
// router.post('/getTasksInApp', [isAuthenticatedUser, getTasksInApp]);
// router.post('/saveTaskChanges', [isAuthenticatedUser, saveTaskChanges]);
// router.post('/sendEmail',[isAuthenticatedUser, sendEmail] )


module.exports = router;
