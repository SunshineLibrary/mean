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
    ]
});

var isInRoom = function (target, room) {
    return room.users.some(function (user) {
        return user.equals(target._id);
    })
}

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

var Room = mongoose.model('Room', RoomSchema);
