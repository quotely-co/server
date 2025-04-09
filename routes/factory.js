const express = require("express");
const { AddFactory,getFactory, generatePdf, getAllFactory, deleteFactory,activateAccount } = require("../controllers/FactoryController");
const verifyTokenMiddleware = require("../middleware/verifyTokenMiddleware");
const verifyFactory = require("../middleware/verifyFactory");

const router = express.Router();


router.post('/add-factory', AddFactory); // Add a new factory
router.get('/', getFactory);
router.post('/generate-pdf', verifyTokenMiddleware, generatePdf);
router.get('/factories', getAllFactory);
router.delete('/factories/:id', deleteFactory);
router.post('/activate-account',verifyFactory ,  activateAccount);

module.exports = router;
