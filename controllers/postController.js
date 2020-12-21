const Post = require('../models/Post');

exports.displayForm = function(req, res) {
  res.render('create-post');
}

//*** create a new post
exports.saveForm = function(req, res) {
  let post = new Post(req.body, req.session.user._id);
  post.saveForm().then(function(newId) {
    req.flash("success", "New post successfully created.");
    req.session.save(() => res.redirect(`/post/${newId}`));

  }).catch(function(errors) {
    req.session.save(() => res.redirect('/create-post'))
  });
}

exports.apiCreate = function(req, res) {
  let post = new Post(req.body, req.apiUser._id);
  post.saveForm().then(function(newId) {
    res.json("congrats")
  }).catch(function(errors) {
    res.json(errors)
  });
}

exports.displaySinglePost = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId);

    res.render('display-single-post', {post: post, title:post.title});
  } catch {
    res.render('404');
  }
}

exports.displayEditForm = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render("edit-post", {post: post})
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect("/"))
    }
  } catch {
    res.render("404")
  }
}

exports.updateForm = function(req, res) {
  let post = new Post(req.body, req.visitorId, req.params.id);
  post.updateForm().then((status) => {
    if (status == 'success') {
      req.flash("success", "Post successfully updated.");
      req.session.save(function() {
        res.redirect(`/post/${req.params.id}/edit`)
      })
      // updated sucess
    } else {
     req.flash("error", post.errors);
     req.session.save(function() {
       res.redirect(`/post/${req.params.id}/edit`)
     })
    }
  }).catch(() => {
    req.flash("erros", "You do not have permission to perform that action.");
    req.session.save(function() {
      res.redirect('/'); // 1. post doesn't exist or 2. visitor is not user
    })
  });
}

exports.deleteForm = function(req, res) {
  //console.log("visitor id: ", req.visitorId);
  Post.deleteForm(req.params.id, req.visitorId).then(() => {
    req.flash("success", "Post successfully deleted.");
    req.session.save(() => res.redirect(`/profile/${req.session.user.username}`));
  }).catch((err) => {
    req.flash("errors", "You do not have permission to perform that action.");
    req.session.save(() => res.redirect('/'));
  });
}

exports.apiDelete = function(req, res) {
  //console.log("visitor id: ", req.visitorId);
  Post.deleteForm(req.params.id, req.apiUser._id).then(() => {
    res.json("Success")
  }).catch((err) => {
    res.json("You do not have permission to perform that action.")
  });
}

exports.search = function(req, res) {
  Post.search(req.body.searchTerm).then(posts => {
    res.json(posts)
  }).catch(() => {
    res.json([])
  });
}
