/**
 * Generic require login routing middleware
 */
exports.requiresLogin = function(req, res, next) {
    console.log('进行验证...');
    if (!req.isAuthenticated()) {
        console.log('木有登陆！');
        return res.redirect('/login');
        //return res.send(401, 'User is not authorized');
    }
    console.log('验证通过');
    next();
};

/**
 * User authorizations routing middleware
 */
/*exports.user = {
    hasAuthorization: function(req, res, next) {
        if (req.profile.id != req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};*/

exports.user = function(req, res, next) {
    if(!req.user) res.send(500);
    console.log('拿到user');
    if(req.user.utype == 'student') {
         console.log('是学生');
        res.redirect('/app/102/index.html');
    } else if(req.user.utype == 'teacher') {
        console.log('是老师');
        res.redirect('/app/103/index.html');
    }
};


/**
 * Article authorizations routing middleware
 */
exports.article = {
    hasAuthorization: function(req, res, next) {
        if (req.article.user.id != req.user.id) {
            return res.send(401, 'User is not authorized');
        }
        next();
    }
};