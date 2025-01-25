const express = require("express");
const { AddFactory,getFactory, generatePdf, getAllFactory, deleteFactory } = require("../controllers/FactoryController");
const verifyTokenMiddleware = require("../middleware/verifyTokenMiddleware");

const router = express.Router();


router.post('/add-factory', AddFactory);
router.get('/', getFactory);
router.get('/generate-pdf',verifyTokenMiddleware, generatePdf);
router.get('/factories', getAllFactory);
router.delete('/factories/:id', deleteFactory);

module.exports = router;
