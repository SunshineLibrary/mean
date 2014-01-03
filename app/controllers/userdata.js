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
    , udm = UDM.init(USERDATA_BASE);

var mongoose = require('mongoose');
var Userdata = mongoose.model('Userdata');

/**
 * ISSUE
 * https://github.com/SunshineLibrary/turtle-public/issues/3
 */
exports.read = function (req, res) {
    //beacuse the login authentication and the appId route, so there should be req.user and req.app
    if(!req.user) return res.send(500);
    var username = req.user.username;
    //var appId = req.app.appId;
    var dataid = req.params.dataId + req.params.entityId;

    console.log("get userdata: username="+username+"  dataid="+dataid);
    Userdata.findOne({
        username: username,
        dataid: dataid
    }).exec(function(err, userdata) {
         if(err) {
            console.log("Server Error:  "+JSON.stringify(err));
            return res.send(500);
         }
         res.json(200, userdata);
    })
};

exports.write = function (req, res) {
    if(!req.user) return res.send(500);
    
    var username = req.session.user.username;
    var dataid = req.params.dataId + req.params.entityId;
    var data = JSON.stringify(req.body);
    console.log('get the raw data: '+data);

    var userdata = {
        username: username,
        dataid: dataid,
        data: data
    };

    var savedata = new Userdata(userdata);
    savedata.save(function(err) {
        if(err) {
            console.log('Server Error: '+JSON.stringify(err));
            return res.send(500);
        }
        console.log('save the userdata successful: '+savedata.username);
        res.json(200, savedata);
    });
};
