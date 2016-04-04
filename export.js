#! /usr/bin/env node

console.log('exporting.')

var fs = require('fs')
var path = require('path')
var fse = require('fs.extra')
var zip = require('node-zip')
var util = require('./util')
var mkdirp=require('mkdirp')

var args = process.argv.slice(2)

var machine = args[0]
if (!machine) {
    console.log('machine-export <machine-name>')
    process.exit(1)
}

var tmp = '/tmp/' + machine + '/'
fse.rmrfSync(tmp)

var configDir = process.env.HOME + '/.docker/machine/machines/' + machine
util.copyDir(configDir, tmp)
mkdirp.sync(tmp+'certs')

processConfig()
createZip()

function processConfig() {
    var home = process.env['HOME']
    var configName = tmp + 'config.json';
    var configFile = fs.readFileSync(configName)
    var config = JSON.parse(configFile.toString())

    util.recurseJson(config, function (parent, key, value) {
        if (typeof value === 'string') {
            if (util.startsWith(value, home + '/.docker/machine/certs/')) {
                var name = value.substring(value.lastIndexOf('/') + 1)
                util.copy(value, tmp + 'certs/' + name)
                value = home + '/.docker/machine/certs/' + machine + '/' + name
            }
            value = value.replace(home, '{{HOME}}')
            parent[key] = value
        }
    })

    fs.writeFileSync(configName, JSON.stringify(config))
}

function createZip() {
    var zip = new require('node-zip')()
    var walker = fse.walk(tmp)
    walker.on('file', function (root, stat, next) {
        var dir = path.resolve(root, stat.name)
        zip.folder(root.substring(tmp.length + 1)).file(stat.name, fs.readFileSync(dir).toString())
        next()
    });
    walker.on('end', function () {
        var data = zip.generate({base64: false, compression: 'DEFLATE'});
        fs.writeFileSync(machine + '.zip', data, 'binary')
        fse.rmrfSync(tmp)
    })
}
