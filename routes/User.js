const express = require("express");
const { allUser, deleteUser, Branding1, getSingleUser } = require("../controllers/UserController");
const userToken = require("../middleware/userToken");

const router = express.Router();

// Register route
router.get("/users", allUser);
router.delete('/users/:id', deleteUser);
router.post('/branding1', Branding1);

router.get("/", userToken, getSingleUser)


module.exports = router;
