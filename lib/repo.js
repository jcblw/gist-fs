'use strict';

var Promise = require('bluebird');
var Repo = require('git-tools');

exports.Repo = Repo;

exports.cloneRepo = function cloneRepo(cloneURL, fullDir) {
  return new Promise(function (resolve, reject) {
    Repo.clone({ repo: cloneURL, dir: fullDir }, function (err, repo) {
      if (err) return reject(err);
      resolve(repo);
    });
  });
};

exports.isRepo = function isRepoCheck(fullDir) {
  return new Promise(function (resolve, reject) {
    Repo.isRepo(fullDir, function (err, isRepo) {
      if (err) return reject(err);
      resolve(isRepo);
    });
  });
};