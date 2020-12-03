const router = require('express').Router();
const userController = require('./controllers/userController');

router.get('/', userController.displayHome);

router.post('/register', userController.register)

module.exports = router;
