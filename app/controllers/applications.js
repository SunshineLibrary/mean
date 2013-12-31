/**
 * ApplicationController
 */
var APP_BASE = 'data/app'
    , DOWNLOAD_BASE = 'data/dl'
    , AM = require('../services/am')
    , am = AM.init(APP_BASE, DOWNLOAD_BASE);

var inspect = require('util').inspect;

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
