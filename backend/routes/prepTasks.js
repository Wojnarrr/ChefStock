const express = require("express");
const {
    getPrepTasks,
    createPrepTask,
    completePrepTask,
} = require("../controllers/prepTaskController");
const { protect, attachRestaurantContext } = require("../middleware/auth");

const router = express.Router();

router.use(protect, attachRestaurantContext);

router.route("/").get(getPrepTasks).post(createPrepTask);

router.route("/:id/complete").patch(completePrepTask);

module.exports = router;