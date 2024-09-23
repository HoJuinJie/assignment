const router = require('express').Router();

const {
    apps
} = require('../controllers/tmsController');

const {
    isAuthenticatedUser,
    userBelongsTo
} = require('../middleware/auth');

// Protected Routes
router.get('/apps', [isAuthenticatedUser, apps]);


module.exports = router;
