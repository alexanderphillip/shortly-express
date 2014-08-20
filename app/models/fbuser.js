var db = require('../config');

var FbUser = db.Model.extend({
  tableName: 'fbUsers',
  hasTimestamps: true,

});

module.exports = FbUser;
