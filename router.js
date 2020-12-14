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
router.get('/post/:id/edit', userController.mustBeLoggedIn, postController.displayEditForm);
router.post('/post/:id/edit', userController.mustBeLoggedIn, postController.updateForm);
router.post('/post/:id/delete', userController.mustBeLoggedIn, postController.deleteForm);
router.post('/search', postController.search);

// Profile related routes
router.get('/profile/:username', userController.ifUserExists, userController.displayProfileHome);



module.exports = router;
