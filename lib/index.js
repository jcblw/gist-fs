'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var request = require('request-promise');
var untildify = require('untildify');
var Promise = require('bluebird');
var path = require('path');
var headers = { 'User-Agent': 'Gist FS' };
var repo = require('./repo');
var fs = require('fs');

var GistFs = (function () {
  function GistFs() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, GistFs);

    this._options = options;
  }

  _createClass(GistFs, [{
    key: 'readFile',
    value: function readFile(_path) {
      var fragments = _path.split(/\//);
      var id = fragments.shift().trim();
      var filePath = fragments.join('/');
      var args = makeArray(arguments);
      var callback = args[args.length - 1];
      // fixing path to point towards file system
      args.shift();
      args.unshift(path.resolve(getFullGistPath(this._options.dir, id), filePath));

      if (typeof callback !== 'function') {
        callback = function () {};
      }

      ensureGist(id, this._options.dir, function (err) {
        if (err) {
          return callback(err);
        }
        console.log(args);
        fs.readFile.apply(fs, args);
      });
    }
  }]);

  return GistFs;
})();

function makeArray(arr) {
  return Array.prototype.slice.call(arr, 0);
}

function getFullGistPath() {
  var dir = arguments.length <= 0 || arguments[0] === undefined ? '.gist-fs' : arguments[0];
  var id = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  console.log(path.resolve(untildify('~/'), dir, id));
  return path.resolve(untildify('~/'), dir, id);
}

function ensureGist() {
  var id = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var dir = arguments.length <= 1 || arguments[1] === undefined ? '.gist-fs' : arguments[1];
  var callback = arguments.length <= 2 || arguments[2] === undefined ? function () {} : arguments[2];

  var options = {
    url: 'https://api.github.com/gists/' + id,
    headers: headers,
    json: true
  };
  var promise = request(options);
  var fullDir = getFullGistPath(dir, id);
  var cloneURL = undefined;

  promise.then(function (body) {
    cloneURL = body.git_pull_url;
    return repo.isRepo(fullDir);
  }).then(function (isRepo) {
    if (!isRepo) {
      return repo.cloneRepo(cloneURL, fullDir);
    }
    return Promise.resolve(new repo.Repo(fullDir));
  }).then(callback.bind(null, null))['catch'](callback);

  return promise;
}

module.exports = GistFs;