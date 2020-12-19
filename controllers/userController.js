const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

exports.sharedProfileData = async function(req, res, next) {
  let isVisitorProfile = false;
  let isFollowing = false;
  if (req.session.user) { // Check if this visitor is logged in
    // console.log("profile userid: " , req.profileUser._id);
    // console.log("visitorid: ", req.visitorId);
    //isVisitorProfile = req.profileUser._id.equals(req.visitorId); <- hj
    isVisitorProfile = req.profileUser._id.equals(req.session.user._id); // <- original
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }
  req.isVisitorProfile = isVisitorProfile;
  req.isFollowing = isFollowing;

  // Retrive post, followers, followings counts
  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id);
  let followerCountPromise = Follow.countFollowerByAuthor(req.profileUser._id);
  let followingCountPromise = Follow.countFollowingByAuthor(req.profileUser._id);

  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise]);
  req.postCount = postCount;
  req.followerCount = followerCount;
  req.followingCount = followingCount;
  next();
}

exports.mustBeLoggedIn = function(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    req.flash("errors", "You must be logged in to perform the action.");
    req.session.save(function() {
      res.redirect('/');
    })
  }
}

exports.register = function(req, res) {
  let user = new User(req.body);

  user.register().then(() => {
    req.session.user = {username: user.data.username, avatar:user.avatar, _id:user.data._id};
    req.session.save(function() {
      res.redirect('/')
    });
  }).catch((regErrors) => {
    req.flash('regErrors', regErrors);
    req.session.save(function() {
      res.redirect('/');
    });
  });
}

exports.login = function(req, res) {
  let user = new User(req.body);

  // user.login(function(result) {
  //   res.send(result);
  // }); // -> using traditional callback function

  user.login().then(function(result) {
    console.log("in login: ", user.data._id);
    req.session.user = {username: user.data.username, avatar:user.avatar, _id:user.data._id};
    req.session.save(function() { // Manually call "save" to use callback function (for async DB work)
        res.redirect('/');
    });
  }).catch(function(err) {
    req.flash('errors', err); // Add error message to the session (req.session.flash.errors = [err];)
    req.session.save(function() {
      res.redirect('/');
    });
  });
}

exports.logout = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/');
  });
}


exports.displayHome = async function(req, res) {
  if (req.session.user) {
    // Fetch homepage feed for current user
    let posts = await Post.getPosts(req.session.user._id);
    res.render('home-dashboard', {posts: posts});
  } else {
    // Access err msg & save it to the new object and delete the msg from session, hence flash
    res.render('home-guest', {regErrors: req.flash('regErrors')});
  }
}


exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(user){
      req.profileUser = user;
      next();
    }).catch(function() {
      res.render('404')
    });
}


exports.displayProfileHome = function(req, res) {
  Post.findByAuthorId(req.profileUser._id).then(function(posts) {
    res.render('profile', {
      title: `Profile for ${req.profileUser.username}`,
      currentPage: "posts",
      posts: posts,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    })
  }).catch(function() {
    res.render('404')
  });
}


exports.displayFollowers = async function(req, res) {
  try {
    let followers = await Follow.getFollowersById(req.profileUser._id);
    res.render('profile-followers', {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    });
  } catch(err) {
    console.log(err);
    res.render('404');
  }
}



exports.displayFollowings = async function(req, res) {
  try {
    let followings = await Follow.getFollowingsById(req.profileUser._id);
    res.render('profile-followings', {
      currentPage: "followings",
      followings: followings,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorProfile: req.isVisitorProfile,
      counts: {postCount: req.postCount, followerCount: req.followerCount, followingCount: req.followingCount}
    });
  } catch {
    res.render('404');
  }
}
