var fs = require('fs')
var path = require('path')
var os = require('os')
var mkdirp = require('mkdirp').sync

exports.copy = function (from, to) {
  var file = fs.readFileSync(from)
  fs.writeFileSync(to, file)
}

exports.copyDir = function (from, to) {
  mkdirp(to)
  var files = fs.readdirSync(from)
  for (var i = 0; i < files.length; i++) {
    var file = from + '/' + files[i]
    if (fs.statSync(file).isFile()) {
      exports.copy(file, to + '/' + files[i])
    }
  }
}

exports.mkdir = mkdirp

exports.startsWith = function (s, prefix) {
  return s.substring(0, prefix.length) === prefix
}

exports.recurseJson = function (obj, func) {
  for (var key in obj) {
    var val = obj[key]
    func(obj, key, val)
    if (val !== null && typeof val === 'object') {
      exports.recurseJson(val, func)
    }
  }
}

exports.permissions = function (path, chmod) {
  try {
    fs.chmodSync(path, chmod)
  } catch (e) {
  }
}

var DM_STORAGE_DIR = '/.docker/machine'

exports.cli = function () {
  var cli = {options: {}, params: []}
  for (var i = 2; i < process.argv.length; i++) {
    if (process.argv[i].substring(0, 2) === '--') {
      cli.options[process.argv[i].substring(2)] = process.argv[i + 1]
      i++
    } else {
      cli.params.push(process.argv[i])
    }
  }
  cli.storagePath = cli.options['storage-path'] || process.env['MACHINE_STORAGE_PATH'] || path.join(os.homedir(), DM_STORAGE_DIR)
  return cli
}
