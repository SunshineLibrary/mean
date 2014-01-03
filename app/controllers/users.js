/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId,
    Room = mongoose.model('Room'),
    User = mongoose.model('User');

/**
 * Auth callback
 */
exports.authCallback = function (req, res, next) {
    res.redirect('/');
};


//Show Customed form
exports.register = function(req, res) {
    res.render('users/register', {
        error: req.flash('error'),
        success: req.flash('success')
    });
};

exports.login = function(req, res) {
    res.render('users/login', {
        error: req.flash('error'),
        success: req.flash('success')
    });
};

exports.auth = function(req, res) {
    if(req.user) {
        res.send({
            'index': '/app/102/index.html'
        })
    } else {
        res.send(401)
    }
};


/**
 * Show login form
 */
exports.signin = function (req, res) {
    res.render('users/signin', {
        title: 'Signin',
        message: req.flash('error')
    });
};

/**
 * Show sign up form
 */
exports.signup = function (req, res) {
    res.render('users/signup', {
        title: 'Sign up',
        user: new User()
    });
};

/**
 * Logout
 */
exports.signout = function (req, res) {
    req.logout();
    res.redirect('/');
};

/**
 * Session
 */
exports.session = function (req, res) {
    res.redirect('/app/102/index.html');
};

/**
 * Create user
 */
exports.create = function (req, res) {
    var user = new User(req.body);
    var message = null;

    user.provider = 'local';
    user.save(function (err) {
        if (err) {
            switch (err.code) {
                case 11000:
                case 11001:
                    message = 'Username already exists';
                    break;
                default:
                    message = 'Please fill all the required fields';
            }

            return res.render('users/register', {
                message: message,
                user: user
            });
        }
        req.logIn(user, function (err) {
            if (err) return next(err);
            return res.redirect('/app/102/index.html');
        });
    });
};

/**
 * Send User
 */
exports.me = function (req, res) {
    res.jsonp(req.user || null);
};
exports.all = function (req, res) {
    User.find().exec(function (err, users) {
        res.json((err) ? null : users);
    });
};
exports.show = function (req, res) {
    res.json(req.profile);
};
exports.rooms = function (req, res) {
    Room.find({users: {
        $in: [req.profile]
    }}).exec(function (err, rooms) {
            if (err) return res.json(500);
            res.json(rooms);
        })
//    res.json(req.profile);
};
exports.destroy = function (req, res) {
    if (req.profile) {
        req.profile.remove(function (err, user) {
            if (err) return res.send(500);
            res.json(user);
        });
    } else {
        res.send(404);
    }
};

/**
 * Find user by id
 */
exports.user = function (req, res, next, id) {
    User
        .findOne({
            _id: id
        })
        .exec(function (err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('Failed to load User ' + id));
            req.profile = user;
            next();
        });
};
