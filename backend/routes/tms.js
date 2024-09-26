const router = require('express').Router();

const {
    apps,
    plans,
    getPlansInApp,
    createApp,
    editApp,
    createPlan
} = require('../controllers/tmsController');

const {
    isAuthenticatedUser,
    userBelongsTo
} = require('../middleware/auth');

// Protected Routes
router.post('/createApp', [isAuthenticatedUser, userBelongsTo(['PL']), createApp]);
router.post('/editApp', [isAuthenticatedUser, userBelongsTo(['PL']), editApp]);
router.post('/createPlan', [isAuthenticatedUser, userBelongsTo(['PL']), createPlan]);

// FRONT-END Protected routes
router.get('/apps', [isAuthenticatedUser, apps]);
router.get('/plans', [isAuthenticatedUser, plans]);
router.post('/getPlansInApp', [isAuthenticatedUser, getPlansInApp]);


module.exports = router;
