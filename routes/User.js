const express = require("express");
const { allUser,deleteUser, Branding1} = require("../controllers/UserController");

const router = express.Router();

// Register route
router.get("/users", allUser);
router.delete('/users/:id', deleteUser);
router.post('/branding1', Branding1);


module.exports = router;
