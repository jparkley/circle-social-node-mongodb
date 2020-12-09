const Post = require('../models/Post');

exports.displayForm = function(req, res) {
  res.render('create-post');
}

exports.saveForm = function(req, res) {
  let post = new Post(req.body, req.session.user._id);
  post.saveForm().then(function() {
      res.send("new post created")
  }).catch(function(errors) {
    res.send(errors);
  });
}

exports.displaySinglePost = async function(req, res) {
  try {
    let post = await Post.findSingleById(req.params.id);

    res.render('display-single-post', {post: post});
  } catch {
    res.render('404');
  }
}
