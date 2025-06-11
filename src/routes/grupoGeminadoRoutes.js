const express = require('express');
const router = express.Router();
const grupoGeminadoController = require('../controllers/grupoGeminadoController');

router.get('/', grupoGeminadoController.list);
router.get('/novo', grupoGeminadoController.createForm);
router.post('/novo', grupoGeminadoController.create);
router.post('/deletar/:id', grupoGeminadoController.delete);

module.exports = router;