var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.Types.ObjectId;

var UserDataSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    dataid: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    }
});

mongoose.model('Userdata', UserDataSchema);
