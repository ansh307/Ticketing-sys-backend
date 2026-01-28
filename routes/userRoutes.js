const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/password', protect, userController.updatePassword);

// router.delete('/:id', protect, adminOnly, userController.deleteUser
// );

// router.put(
//     '/:id',
//     protect,
//     adminOnly,
//     userController.updateUserByAdmin
// );

// router.get('/', protect, adminOnly,
//     userController.getAllUsers
// );
router.delete('/:id', userController.deleteUser
);

router.put(
    '/:id',
    userController.updateUserByAdmin
);

router.get('/',
    userController.getAllUsers
);


module.exports = router;
