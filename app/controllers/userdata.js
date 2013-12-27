/**
 * ExerciseController
 *
 * @module      :: Controller
 * @description    :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var UDM = require('../services/udm')
    , USERDATA_BASE = 'data/userdata'
    , udm = UDM.init(USERDATA_BASE)

/**
 * ISSUE
 * https://github.com/SunshineLibrary/turtle-public/issues/3
 */
exports.read = function (req, res) {
    var username = req.session.user.username;
    console.log("get userdata:%s", username);
    if (username) {
        var result = udm.getData(username, req.params.appId + req.params.entityId);
        res.send(result || {});
    } else {
        res.send(401);
    }
};

exports.write = function (req, res) {
    var username = req.session.user.username;
    console.log("post userdata:%s", username);
    if (username) {
        var result = udm.putData(username, req.params.appId + req.params.entityId, JSON.stringify(req.body));
        res.send(result || {});
    } else {
        res.send(401);
    }
    res.send(result);
};
