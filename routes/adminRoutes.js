const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);


router.get('/dashboard', adminController.getDashboard);
router.get('/analytics', adminController.getAnalytics);
router.get('/users', adminController.getAllUsers);
router.get('/admin-menu', adminController.adminMenu);
router.get('/admin-side-menu', adminController.adminSideMenu);
router.put('/users/:id/status', adminController.updateUserStatus);


module.exports = router;
