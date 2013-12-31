var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TestSchema = new Schema({
    name: String
});

mongoose.model('Test', TestSchema);