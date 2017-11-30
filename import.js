#! /usr/bin/env node
console.log('importing.')

var fs = require('fs')
var path = require('path')
var os = require('os')
var fse = require('fs.extra')
var Zip = require('node-zip')
var util = require('./util')

var DM_CERTS_DIR = '/.docker/machine/certs/'
var DM_MACHINE_DIR = '/.docker/machine/machines'
var HOME = os.homedir()
var TMP = os.tmpdir()

var args = process.argv.slice(2)
var machineArg = args[0]
if (!machineArg) {
  console.log('machine-import <config-zip>')
  process.exit(1)
}

// Make sure command points to a zip or tar file
var file_type = machineArg.substring(machineArg.length - 4)
var machine = ""
if (!file_type.match(/^(.zip|.tar)$/)) {
  machine = machineArg.substring(0, machineArg.length - 4)
}
machine = machineArg
console.log('Using ', machineArg, " as file name")

var configDir = path.join(HOME, DM_MACHINE_DIR, machine)
try {
  fs.statSync(configDir)
  console.log('that machine already exists')
  process.exit(1)
} catch (e) {}

var tmp = path.join(TMP, machine)
fse.rmrfSync(tmp)

unzip()
processConfig()

util.copyDir(tmp, configDir)
util.copyDir(path.join(tmp, 'certs'), path.join(HOME, DM_CERTS_DIR, machine))
// Fix file permissions for id_rsa key, if present
util.permissions(path.join(configDir, 'id_rsa'), '0600')
fse.rmrfSync(tmp)

function unzip () {
  var zip = new Zip()
  zip.load(fs.readFileSync(machine + '.zip'))
  for (var f in zip.files) {
    var file = zip.files[f]
    if (!file.dir) {
      util.mkdir(path.dirname(path.join(tmp, file.name)))
      fs.writeFileSync(path.join(tmp, file.name), file.asNodeBuffer())
    }
  }
}

function processConfig () {
  var configName = path.join(tmp, 'config.json')
  var configFile = fs.readFileSync(configName)
  var config = JSON.parse(configFile.toString())

  util.recurseJson(config, function (parent, key, value) {
    if (typeof value === 'string' && value.indexOf('{{HOME}}') > -1) {
      // path.join fixes windows/unix paths
      parent[key] = path.join(value.replace('{{HOME}}', HOME))
    }
  })

  var raw = config.RawDriver
  if (raw) {
    var decoded = new Buffer(raw, 'base64').toString()
    var driver = JSON.parse(decoded)
    // update store path
    driver.StorePath = path.join(HOME, '/.docker/machine')

    var updatedBlob = new Buffer(JSON.stringify(driver)).toString('base64')
    // update old config
    config.RawDriver = updatedBlob
  }

  fs.writeFileSync(configName, JSON.stringify(config))
}
