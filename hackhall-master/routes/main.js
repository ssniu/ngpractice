var bcrypt = require('bcryptjs');

exports.checkAdmin = function(request, response, next) {
  if (request.session && request.session.auth && request.session.userId && request.session.admin) {
    console.info('Access ADMIN: ' + request.session.userId);
    return next();
  } else {
    next('User is not an administrator.');
  }
};

exports.checkUser = function(req, res, next) {
  if (req.session && req.session.auth && req.session.userId && (req.session.user.approved || req.session.admin)) {
    console.info('Access USER: ' + req.session.userId);
    return next();
  } else {
    next(new Error('User is not logged in.'));
  }
};

exports.checkApplicant = function(req, res, next) {
  if (req.session && req.session.auth && req.session.userId && (!req.session.user.approved || req.session.admin)) {
    console.info('Access USER: ' + req.session.userId);
    return next();
  } else {
    next('User is not logged in.');
  }
};

exports.login = function(req, res, next) {
  console.log('Loging in USER with email:', req.body.email)
  req.db.User.findOne({
      email: req.body.email
    },null, {
      safe: true
    },
    function(err, user) {
      if (err) return next(err);
      if (user) {
        bcrypt.compare(req.body.password, user.password, function(err, match) {
          if (match) {
            req.session.auth = true;
            req.session.userId = user._id.toHexString();
            req.session.user = user;
            if (user.admin) {
              req.session.admin = true;
            }
            console.info('Login USER: ' + req.session.userId);
            res.status(200).json({
              msg: 'Authorized'
            });
          } else {
            next(new Error('Wrong password'));
          }
        });
      } else {
        next(new Error('User is not found.'));
      }
    });
};

exports.logout = function(req, res) {
  console.info('Logout USER: ' + req.session.userId);
  req.session.destroy(function(error) {
    if (!error) {
      res.send({
        msg: 'Logged out'
      });
    }
  });
};

exports.profile = function(req, res, next) {
  var fields = 'firstName lastName displayName' +
    ' headline photoUrl admin approved banned' +
    ' role angelUrl twitterUrl facebookUrl linkedinUrl githubUrl';
  req.db.User.findProfileById(req.session.userId, fields, function(err, obj) {
    console.log('err', err)
    if (err) return next(err);
    res.status(200).json(obj);
  });
};

exports.delProfile = function(req, res, next) {
  console.log('del profile');
  console.log(req.session.userId);
  req.db.User.findByIdAndRemove(req.session.user._id, {}, function(err, obj) {
    if (err) next(err);
    req.session.destroy(function(error) {
      if (err) {
        next(err)
      }
    });
    res.status(200).json(obj);
  });
};