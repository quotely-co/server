const express = require("express");
const { allUser, deleteUser, Branding1, getSingleUser, generatePdf } = require("../controllers/UserController");
const userToken = require("../middleware/userToken");
const verifyTokenMiddleware = require("../middleware/verifyTokenMiddleware");

const router = express.Router();

// Register route
router.get("/users", allUser);
router.delete('/users/:id', deleteUser);
router.post('/branding1', Branding1);
router.get("/", userToken, getSingleUser)
router.post('/generate-pdf', verifyTokenMiddleware, generatePdf);
module.exports = router;
