const router = require('express').Router();

const {
    apps,
    createApp,
    editApp
} = require('../controllers/tmsController');

const {
    isAuthenticatedUser,
    userBelongsTo
} = require('../middleware/auth');

// Protected Routes
router.post('/createApp', [isAuthenticatedUser, userBelongsTo(['PL']), createApp]);
router.post('/editApp', [isAuthenticatedUser, userBelongsTo(['PL']), editApp]);

// FRONT-END Protected routes
router.get('/apps', [isAuthenticatedUser, apps]);


module.exports = router;
