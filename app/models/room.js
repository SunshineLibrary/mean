/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

/**
 * Room Schema
 */
var RoomSchema = new Schema({
    name: String,
    users: [
        { type: ObjectId, ref: 'User' }
    ],
    apps: [
        { type: ObjectId, ref: 'App'}
    ]
});

var isInRoom = function (target, room) {
    return room.users.some(function (user) {
        return user.equals(target._id); 
    })
};

RoomSchema.methods.ifHaveUser = function(target, cb) {
    return this.users.some(function(user) {
        return user.equals(target._id);
    });
};

RoomSchema.methods.joinUser = function (newUser, cb) {
    if (isInRoom(newUser, this)) {
        if (cb) cb(null, this);
    } else {
        this.users.push(newUser);
        this.save(cb);
    }
};

RoomSchema.methods.exitUser = function (exitUser, cb) {
    if (isInRoom(exitUser, this)) {
        this.users.remove(exitUser);
        this.save(cb);
    } else {
        if (cb) cb(null, this);
    }
};

RoomSchema.methods.isAsigned = function(target) {
    return this.apps.some(function (app) {
        return app.equals(target._id); 
    })
};

var isAsigned = function(target, room) {
    return room.apps.some(function (app) {
        return app.equals(target._id); 
    })
};

RoomSchema.methods.addApp = function(newApp, cb) {
    if(!cb) return new Error('No Callback Function');
    if(!isAsigned(newApp, this)) {
        this.apps.push(newApp);
        this.save(cb);
    } else {
        cb(null, this);
    }
};

RoomSchema.methods.removeApp = function(exitApp, cb) {
    if(!cb) return new Error('No Callback Function');
    if(!isAsigned(exitApp, this)) return new Error('The App is not exist');
    if(isAsigned(exitApp, this)) {
        this.apps.remove(exitApp);
        this.save(cb);
    } else {
        cb(null, this);
    }
};


var Room = mongoose.model('Room', RoomSchema);







