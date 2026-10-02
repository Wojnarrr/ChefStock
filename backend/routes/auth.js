const express = require("express");
const {
    registerOwner,
    registerStaff,
    login,
    getMe,
    changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register/owner", registerOwner);
router.post("/register/staff", registerStaff);
router.post("/login", login);
router.get("/me", protect, getMe);
router.put("/password", protect, changePassword);

module.exports = router;