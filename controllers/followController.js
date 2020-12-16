const Follow = require('../models/Follow');

exports.addFollow = function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  follow.create().then(() => {
    req.flash("success", `Successfully followed ${req.params.username}.`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`));
  }).catch(errors => {
        console.log('in catch: ', errors);
    req.flash("errors", errors);
    req.session.save(() => res.redirect('/'))
  });
}


exports.removeFollow = function(req, res) {
  let follow = new Follow(req.params.username, req.visitorId);
  follow.remove().then(() => {
    req.flash("success", `Successfully removed following ${req.params.username}.`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`));
  }).catch(errors => {

    req.flash("errors", errors);
    req.session.save(() => res.redirect('/'))
  });
}
