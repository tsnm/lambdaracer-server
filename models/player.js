// Player model
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var playerSchema = new Schema({
  fbid: { type: String, 'default': "" },
  time: { type: Number, 'default': 0  },
  name: { type: String, 'default': "" }
});

module.exports = mongoose.model('Player', playerSchema);