const express = require("express");
const {
    getPrepTasks,
    createPrepTask,
    completePrepTask,
} = require("../controllers/prepTaskController");

const router = express.Router();

router.route("/").get(getPrepTasks).post(createPrepTask);

router.route("/:id/complete").patch(completePrepTask);

module.exports = router;