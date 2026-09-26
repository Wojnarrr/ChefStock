const express = require("express");
const { getMembers, updateMemberRole, removeMember } = require("../controllers/memberController");
const { protect, attachRestaurantContext } = require("../middleware/auth");
const requireOwner = require("../middleware/requireOwner");

const router = express.Router();

// Every members route is owner-only, so requireOwner runs for all of them.
router.use(protect, attachRestaurantContext, requireOwner);

router.get("/", getMembers);
router.route("/:id").patch(updateMemberRole).delete(removeMember);

module.exports = router;