const express = require("express");
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, deleteAccount } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  changePasswordValidator,
} = require('../validators/authValidator');


router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.get("/me", protect, getMe); // 'protect' is called before getMe
router.put('/profile', protect, updateProfileValidator, validate, updateProfile);
router.put('/change-password', protect, changePasswordValidator, validate, changePassword);
router.delete('/me', protect, deleteAccount);

module.exports = router;


