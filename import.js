#! /usr/bin/env node

console.log('importing.')

var fs = require('fs')
var path = require('path')
var os = require('os');
var fse = require('fs.extra')
var zip = require('node-zip')
var util = require('./util')

var DM_CERTS_DIR  = '/.docker/machine/certs/'
var DM_MACHINE_DIR = '/.docker/machine/machines'

var args = process.argv.slice(2)
var machine = args[0]
if (!machine) {
    console.log('machine-import <config-zip>')
    process.exit(1)
}

var machine = machine.substring(0, machine.length - 4)
var configDir = path.join(process.env.HOME, DM_MACHINE_DIR, machine)
try {
    fs.statSync(configDir)
    console.log('that machine already exists')
    process.exit(1)
} catch (e) {
    //ok
}

var tmp = path.join(os.tmpdir(), machine)
fse.rmrfSync(tmp)

unzip()
processConfig()

util.copyDir(tmp, configDir)
util.copyDir(path.join(tmp, 'certs'), path.join(process.env.HOME, DM_CERTS_DIR, machine))
// Fix file permissions for id_rsa key, if present
util.permissions(path.join(configDir, 'id_rsa'), 0600)
fse.rmrfSync(tmp)


function unzip() {
    var zip = new require('node-zip')()
    zip.load(fs.readFileSync(machine + '.zip'))
    for (var f in zip.files) {
        var file = zip.files[f]
        if (!file.dir) {
            util.mkdir(path.dirname(path.join(tmp, file.name)))
            fs.writeFileSync(path.join(tmp, file.name), file.asNodeBuffer())
        }
    }
}

function processConfig() {
    var home = process.env['HOME']
    var configName = path.join(tmp, 'config.json')
    var configFile = fs.readFileSync(configName)
    var config = JSON.parse(configFile.toString())

    util.recurseJson(config, function (parent, key, value) {
        if (typeof value === 'string') {
            parent[key] = value.replace('{{HOME}}', home)
        }
    })

    var raw = config.RawDriver
    if (raw) {
        var decoded = new Buffer(raw, 'base64').toString()
        var driver = JSON.parse(decoded)

        // update store path
        driver.StorePath = path.join(process.env.HOME, '/.docker/machine')

        var updatedBlob = new Buffer(JSON.stringify(driver)).toString('base64')

        // update old config
        config.RawDriver = updatedBlob
    }


    fs.writeFileSync(configName, JSON.stringify(config))
}
