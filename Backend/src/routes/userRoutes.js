const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// User routes
router.get('/profile', userController.getCurrentUserProfile);
router.put('/profile', userController.updateCurrentUserProfile);

// Admin routes
router.route('/')
  .get(authorize('admin'), userController.getUsers)
  .post(authorize('admin'), userController.createUser);

router.route('/:id')
  .get(authorize('admin'), userController.getUserById)
  .put(authorize('admin'), userController.updateUser)
  .delete(authorize('admin'), userController.deleteUser);

module.exports = router;