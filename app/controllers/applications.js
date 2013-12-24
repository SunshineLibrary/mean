/**
 * AppmanController
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
var APP_BASE = 'data/app'
    , DOWNLOAD_BASE = 'data/dl'
    , AM = require('../services/am')
    , am = AM.init(APP_BASE, DOWNLOAD_BASE);

exports.all = function (req, res) {
    var filters = req.query
        , fields = (filters.fields) ? _.words(filters.fields, ",") : undefined
        , result;
    if (req.query) {
        result = am.query(filters);
        delete filters.fields;
    } else {
        result = am.all();
    }
    if (fields) {
        result = _.map(result, function (app) {
            var filtered = {};
            _.each(fields, function (field) {
                filtered[field] = app[field];
            })
            return filtered;
        });
    }
    res.send(result);
};

exports.install = function (req, res) {
    var file = req.body.zip
        , folder = req.body.folder
        , url = req.body.url;
    console.log('install app,%s,%s,%s', file, folder, url);
    try {
        if (file) {
            am.install(file, function (app) {
                res.send(app);
            });
        } else if (folder) {
            am.installFolder(folder, function (app) {
                res.send(app);
            });
        } else if (url) {
            // TODO move downloadFile here
            downloadFile(url, function (err, file) {
                if (err) {
                    console.error(err);
                    return;
                }
                am.install(file, function (app) {
                    res.send(app);
                });
            });
        } else {
            res.send(400, {msg: 'invalid request'});
        }
    } catch (err) {
        console.log('error,%s', err);
        res.send(500, {msg: err});
    }
};

exports.uninstall = function (req, res) {
    var appId = req.app.id;
    if (!appId) {
        res.send(400, {msg: 'id cannot be empty'});
        return;
    }
    try {
        am.uninstall(appId, function (app) {
            res.send(app);
        });
    } catch (err) {
        res.send(500, {msg: err});
    }
};

exports.app = function (req, res, next, id) {
    var app = am.getAppById(id);
    if (app) {
        req.app = app;
        next();
    } else {
        return next(new Error('Failed to load app ' + id));
    }
};
