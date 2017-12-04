#! /usr/bin/env node

var fs = require('fs')
var path = require('path')
var os = require('os')
var fse = require('fs.extra')
var Zip = require('node-zip')
var util = require('./util')

var DM_CERTS_DIR = 'certs'
var DM_MACHINE_DIR = 'machines'
var TMP = os.tmpdir()

var cli = util.cli()
var machineArg = cli.params[0]
if (!machineArg) {
  console.log('machine-import <config-zip>')
  process.exit(1)
}

// Make sure command points to a zip or tar file
var fileType = machineArg.substring(machineArg.length - 4)
var machine = fileType.match(/^(.zip|.tar)$/) ? machineArg.substring(0, machineArg.length - 4) : machineArg

console.log('Importing machine "' + machine + '" into', cli.storagePath)

var configDir = path.join(cli.storagePath, DM_MACHINE_DIR, machine)
try {
  fs.statSync(configDir)
  console.log('that machine already exists')
  process.exit(1)
} catch (e) {
}

var tmp = path.join(TMP, machine)
fse.rmrfSync(tmp)

unzip()
processConfig()

util.copyDir(tmp, configDir)
util.copyDir(path.join(tmp, 'certs'), path.join(cli.storagePath, DM_CERTS_DIR, machine))
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
    if (typeof value === 'string') {
      if (value.indexOf('{{HOME}}') >= 0) {
        parent[key] = path.join(value.replace('{{HOME}}/.docker/machine', cli.storagePath))
      }
      if (value.indexOf('{{STORAGE}}') >= 0) {
        parent[key] = path.join(value.replace('{{STORAGE}}', cli.storagePath))
      }
    }
  })

  var raw = config.RawDriver
  if (raw) {
    var decoded = new Buffer(raw, 'base64').toString()
    var driver = JSON.parse(decoded)
    // update store path
    driver.StorePath = cli.storagePath

    var updatedBlob = new Buffer(JSON.stringify(driver)).toString('base64')
    // update old config
    config.RawDriver = updatedBlob
  }

  fs.writeFileSync(configName, JSON.stringify(config))
}
