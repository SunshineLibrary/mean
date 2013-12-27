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

var inspect = require('util').inspect;
var upstreamServer = '';  //http://localhost:4000

var http = require('http');
var fs = require('fs');

var _ = require('underscore');
var _str = require('underscore.string');
_.mixin(_str.exports());

var temp = require('temp');
temp.track();

var request = require('request');

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

exports.sync = function (req, res) {
    console.log('post sync...');
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

//-------------------------------------------------------downstream-----------------------------------------------------------
exports.sync = function (req, res) {
    var upstreamServer = req.body.server,
        policy = req.body.policy;
    console.log('sync param:%s,%s', upstreamServer, policy);

    fetchUpstreamDiff({
        url: upstreamServer
    }, function (err, diff) {
        if (err) {
            res.send(500, {msg: err});
            return;
        }
        console.log('get diff successfully，begin parse...diff.lenght=' + diff.newApps.length);

        _.each(diff.newApps, function (app) {
            if (!_(app.download_url).startsWith('http://')) {
                app.download_url = upstreamServer + app.download_url;
            }
            console.log('download new app,%s', app.download_url);
            downloadFile(app.download_url, function (err, file) {
                if (err) {
                    console.error('download failed,%s', err);
                    return;
                }
                am.install(file, function (app) {
                    console.log('new app installed,%s', ((app) ? app.id : 'null'));
                });
            });
        });

        _.each(diff.updateApps, function (app) {
            console.log('update app,%s', JSON.stringify(app));
            if (!_(app.download_url).startsWith('http://')) {
                app.download_url = upstreamServer + app.download_url;
            }
            var info = temp.openSync('turtledl_');
            console.log('download update app,%s,%s', app.download_url, info.path);

            downloadFile(app.download_url, function (err, file) {
                console.log('ready to install zip,%s,%s,', err, file);
                if (err) {
                    console.error('download failed,%s', err);
                    return;
                }

                am.install(file, function (app) {
                    console.log('new app installed,%s', ((app) ? app.id : 'null'));
                });
            });
        });

        _.each(diff.deleteApps, function (app) {
            console.log('delete app,%s', JSON.stringify(app));
            am.uninstall(app.id, function (app) {
                console.log('app deleted,%s', app.id);
            });
        });

        console.log('sync over...');
    });
};

var fetchUpstreamDiff = function (options, cb) {
    if (!cb) {
        console.log('need a callback');
        return;
    }

    options.url = options.url + "/apps";
    options.json = true;
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var diff = {
                isModified: false,
                newApps: [],
                deleteApps: [],
                updateApps: []
            };
            var localApps = am.all();
            var newApps = _.indexBy(body, 'id');

            _.each(localApps, function (localApp) {
                if (!newApps[localApp.id]) {
                    diff.deleteApps.push(localApp);
                    diff.isModified = true;
                } else if (newApps[localApp.id].version_code > localApp.version_code) {
                    diff.updateApps.push(newApps[localApp.id]);
                    diff.isModified = true;
                }
                delete newApps[localApp.id];
            });

            _.each(newApps, function (newApp) {
                diff.newApps.push(newApp);
                diff.isModified = true;
            });
            console.log('parse apps over，return parsed diff...');
            cb(undefined, diff);
        } else {
            console.log('get apps failed...');
            cb(error, undefined);
        }
    });
};
/*
 download new app,http://localhost:4000/data/dl/0.3.wpk,%s
 download new app,http://localhost:4000/data/dl/101.20.wpk,%s
 download new app,http://localhost:4000/data/dl/102.8.wpk,%s
 同步完毕...
 begin downloading,http://localhost:4000/data/dl/0.3.wpk,/home/hellmagic/tmp/turtledl_1131126-7295-1c1x2ab
 file download completed,/home/hellmagic/tmp/turtledl_1131126-7295-1c1x2ab,http://localhost:4000/data/dl/0.3.wpk
 begin downloading,http://localhost:4000/data/dl/101.20.wpk,/home/hellmagic/tmp/turtledl_1131126-7295-zhi0tm
 file download completed,/home/hellmagic/tmp/turtledl_1131126-7295-zhi0tm,http://localhost:4000/data/dl/101.20.wpk
 begin downloading,http://localhost:4000/data/dl/102.8.wpk,/home/hellmagic/tmp/turtledl_1131126-7295-f5jjir
 file download completed,/home/hellmagic/tmp/turtledl_1131126-7295-f5jjir,http://localhost:4000/data/dl/102.8.wpk
 file write finish
 install zip,/home/hellmagic/tmp/turtledl_1131126-7295-1c1x2ab

 /home/hellmagic/sync/downupstream/node_modules/adm-zip/zipFile.js:66
 throw Utils.Errors.INVALID_FORMAT;
 ^
 Invalid or unsupported zip format. No END header found

 */
var downloadFile = function (url, cb) {
    var dstFile = temp.path({prefix: 'turtledl_'});
    console.log("begin downloading,%s,%s", url, dstFile);
    http.get(url,function (res) {
        var writeStream = fs.createWriteStream(dstFile);
        writeStream.on('finish', function () {
            console.log('file write finish');
            if (cb) cb(undefined, dstFile);
        });
        writeStream.on('end', function () {
            console.log('file write end');
        });
        writeStream.on('close', function () {
            console.log('file write close');
        });
        res.on('data', function (data) {
            writeStream.write(data);
        })
            .on('end', function () {
                console.log('file download completed,%s,%s', dstFile, url);
                writeStream.end();
            })
            .on('error', function (e) {
                console.error('download error,%s', url);
                writeStream.end();
                if (cb) cb(e);
            });
    }).on('error', function (e) {
            if (cb) cb(e);
        });
};
