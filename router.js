const router = require('express').Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');

// User related routes
router.get('/', userController.displayHome);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Post related routes
router.get('/create-post', userController.mustBeLoggedIn, postController.displayForm);
router.post('/create-post', userController.mustBeLoggedIn, postController.saveForm);
router.get('/post/:id', postController.displaySinglePost);

module.exports = router;
