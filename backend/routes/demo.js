const router = require('express').Router();
    
const {
    CreateTask,
    GetTaskbyState,
    PromoteTask2Done
} = require('../controllers/tmsDemoController')

class MsgCode {
    static INVALID_URL = "ERR3001";
    static INVALID_PARAMETER = "ERR3002";
};

router.use((req, res, next) => {
    if (Object.keys(req.query).length !== 0) { // check if url does not contain any special char
        res.status(400).json({ msgCode: MsgCode.INVALID_PARAMETER})
        return;
    }

    console.log(`req.originalUrl: ${req.originalUrl}`);
    const validUrls = [
      "/api/demo/CreateTask",
      "/api/demo/GetTaskbyState",
      "/api/demo/PromoteTask2Done",
    ];
    const url = req.originalUrl;
    console.log("incoming url:", url);
  
    let isValidUrl = false;
  
    for (const i of validUrls) {
      if (i.toLowerCase() === url.toLowerCase()) {
        isValidUrl = true;
        break;
      }
    }
  
    if (isValidUrl) {
      next();
      return;
    }
  
    res.status(400).json({ msgCode: MsgCode.INVALID_URL });
    return;
  });

router.post('/CreateTask', [CreateTask]); 
router.post('/GetTaskbyState', [GetTaskbyState]); 
router.post('/PromoteTask2Done', [PromoteTask2Done]); 



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
