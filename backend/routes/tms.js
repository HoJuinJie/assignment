const router = require('express').Router();

const {
    apps,
    createApp
} = require('../controllers/tmsController');

const {
    isAuthenticatedUser,
    userBelongsTo
} = require('../middleware/auth');

// Protected Routes
router.post('/createApp', [isAuthenticatedUser, userBelongsTo(['PL']), createApp]);

// FRONT-END Protected routes
router.get('/apps', [isAuthenticatedUser, apps]);


module.exports = router;
