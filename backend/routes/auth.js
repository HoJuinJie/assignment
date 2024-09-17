const express = require('express');
const router = express.Router();

// Importing auth controller methods
const {
    getUserByUsername,
    allUsers,
    allGroups,
    BelongsTo,
    login,
    register,
    addGroup,
    disableUser,
    updateProfile,
    adminResetCredentials,
    logout
} = require('../controllers/authController');

const { 
    isAuthenticatedUser,
    isActive,
    isAdminUser
} = require('../middleware/auth');

// Routes
router.get('/getUserByUsername', [isAuthenticatedUser, isActive, getUserByUsername]);
router.get('/allUsers', [ isAuthenticatedUser, isActive, allUsers ]);
router.get('/allGroups', [ isAuthenticatedUser, isActive, allGroups ]);

router.post('/login', login);
router.post('/logout', logout);
// Protected routes
router.put('/updateProfile', [ isAuthenticatedUser, isActive, updateProfile ]);
// ADMIN ONLY routes
router.post('/register',  [ isAuthenticatedUser, isActive, isAdminUser, register ]);
router.post('/addGroup', [ isAuthenticatedUser, isActive, isAdminUser, addGroup ]);
router.patch('/disableUser', [ isAuthenticatedUser, isActive, isAdminUser, disableUser ]);
router.patch('/adminResetCredentials', [ isAuthenticatedUser, isActive, isAdminUser, adminResetCredentials ]);

// FRONT-END Protected routes
router.get('/application', [ isAuthenticatedUser, isActive, BelongsTo]);
router.get('/userManagement', [ isAuthenticatedUser, isActive, isAdminUser, BelongsTo ]);

module.exports = router;

/*
TODO: NOTES
When to Use Each:
POST: When creating a new resource (e.g., registering a new user, adding a group).
PUT: When you want to fully replace/update a resource (e.g., updating all fields in a profile).
PATCH: When you want to partially update a resource (e.g., updating only a password or username).
GET: When retrieving or reading data (e.g., fetching user details or list of groups).
DELETE: When you need to delete a resource (e.g., disabling a user or removing a group).

Using these methods properly helps you design a more RESTful API. 
REST (Representational State Transfer) is an architectural style that promotes the use of these HTTP methods to interact with resources, leading to more predictable and organized API behavior.
*/