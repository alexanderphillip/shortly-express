var db = require('../config');
var Promise = require('bluebird');
var crypto = require('crypto');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function(params) {
    this.on('creating', function(model, attrs, options){
      // var shasum = crypto.createHash('sha1');
      var salt = (new Date()).toString();
      this.doHashPassword(salt);
      // shasum.update(model.get('password'));
      // shasum.update(salt);

      // model.set('password', shasum.digest('hex'));
      // model.set('salt', salt);
    });
  },

  doHashPassword: function(salt) {
    var shasum = crypto.createHash('sha1');

    shasum.update(this.get('password'));
    shasum.update(salt);

    this.set('password', shasum.digest('hex'));
    this.set('salt', salt);
  }
});

module.exports = User;
