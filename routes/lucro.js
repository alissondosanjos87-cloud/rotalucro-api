const express = require('express');
const router = express.Router();
router.get('/', (req,res)=>res.json({status:'lucro ok'}));
router.post('/', (req,res)=>res.json({ok:true, lucro:0}));
module.exports = router;
