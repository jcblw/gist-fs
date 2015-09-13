'use strict'

const request = require('request-promise')
const untildify = require('untildify')
const Promise = require('bluebird')
const path = require('path')
const headers = {'User-Agent': 'Gist FS'}
const repo = require('./repo')
const fs = require('fs')

class GistFs {
  constructor(options = {}) {
    this._options = options
  }

  readFile(_path) {
    const fragments = _path.split(/\//)
    const id = fragments.shift().trim()
    const filePath = fragments.join('/')
    const args = makeArray(arguments)
    let callback = args[args.length - 1]
    // fixing path to point towards file system
    args.shift()
    args.unshift(path.resolve(getFullGistPath(this._options.dir, id), filePath))

    if (typeof callback !== 'function') {
      callback = function() {}
    }

    ensureGist(id, this._options.dir, (err) => {
      if (err) {
        return callback(err)
      }
      fs.readFile.apply(fs, args)
    })
  }

}

function makeArray(arr) {
  return Array.prototype.slice.call(arr, 0)
}

function getFullGistPath(dir = '.gist-fs', id = '') {
  return path.resolve(untildify('~/'), dir, id);
}

function ensureGist(id = '', dir = '.gist-fs', callback = function(){}) {
  const options = {
    url: `https://api.github.com/gists/${id}`,
    headers: headers,
    json: true
  }
  const promise = request(options)
  const fullDir = getFullGistPath(dir, id)
  let cloneURL

  promise
    .then(function(body) {
      cloneURL = body.git_pull_url
      return repo.isRepo(fullDir)
    })
    .then(function(isRepo) {
      if (!isRepo) {
        return repo.cloneRepo(cloneURL, fullDir)
      }
      return Promise.resolve(new repo.Repo(fullDir))
    })
    .then(callback.bind(null, null))
    .catch(callback)

  return promise
}

module.exports = GistFs
