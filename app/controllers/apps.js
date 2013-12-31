var mongoose = require('mongoose');
var App = mongoose.model('App');
var Room = mongoose.model('Room');

exports.show = function(req, res) {
    if(!req.app) res.send(500);
    res.json(req.app);
};

exports.rooms = function (req, res) {
    if(!req.app) res.send(500);
    App.findAppByAppId(req.app.id, function(err, app) {
        if(err) {
            console.log('Server Error, Not found the app by appId' + JSON.stringify(err));
            res.json(500, err);
        }

         Room.find({ apps: {
            $in: [app._id]
         }}).exec(function(err, rooms) {
            if(err) {
                console.log('Server Error, Get rooms by app' + JSON.stringify(err));
                res.json(500, err);
            }
            res.json(200, rooms);
         })
    })
};

exports.create = function(req, res) {
    console.log(JSON.stringify(req.body));
    var app = new App(req.body);
    app.save(function(err, app) {
        if(err) {
        	console.log('Server Error...');
        	res.send(500, JSON.stringify(err));
        }
        res.json(200, app);
    })
}

