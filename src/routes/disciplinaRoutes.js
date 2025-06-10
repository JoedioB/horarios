const express = require('express');
const router = express.Router();
const disciplinaController = require('../controllers/disciplinaController');

router.get('/', disciplinaController.list);
router.get('/novo', disciplinaController.createForm);
router.post('/novo', disciplinaController.create);
router.get('/editar/:id', disciplinaController.editForm);
router.post('/editar/:id', disciplinaController.update);
router.post('/deletar/:id', disciplinaController.delete);

module.exports = router;