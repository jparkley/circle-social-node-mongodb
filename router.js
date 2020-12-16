const router = require('express').Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');

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
router.get('/profile/:username', userController.ifUserExists, userController.sharedProfileData, userController.displayProfileHome);
router.get('/profile/:username/followers', userController.ifUserExists, userController.sharedProfileData, userController.displayFollowers);
router.get('/profile/:username/following', userController.ifUserExists, userController.sharedProfileData, userController.displayFollowings);

// Follow related routes
router.post('/addFollow/:username', userController.mustBeLoggedIn, followController.addFollow);
router.post('/removeFollow/:username', userController.mustBeLoggedIn, followController.removeFollow);

module.exports = router;
