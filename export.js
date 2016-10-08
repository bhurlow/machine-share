#! /usr/bin/env node

console.log('exporting.')

var fs = require('fs')
var path = require('path')
var os = require('os');
var fse = require('fs.extra')
var zip = require('node-zip')
var util = require('./util')

var args = process.argv.slice(2)

var machine = args[0]
if (!machine) {
    console.log('machine-export <machine-name>')
    process.exit(1)
}

var tmp = path.join(os.tmpdir(), machine);
fse.rmrfSync(tmp)

var configDir = path.join(process.env.HOME, '/.docker/machine/machines', machine)
util.copyDir(configDir, tmp)
fs.mkdirSync(path.join(tmp, 'certs'))

processConfig()
createZip()

function processConfig() {
    var home = process.env['HOME']
    var configName = path.join(tmp, 'config.json');
    var configFile = fs.readFileSync(configName)
    var config = JSON.parse(configFile.toString())

    util.recurseJson(config, function (parent, key, value) {
        if (typeof value === 'string') {
            if (util.startsWith(value, path.join(home, '/.docker/machine/certs/'))) {
                var name = path.basename(value)
                util.copy(value, path.join(tmp, 'certs', name))
                value = path.join(home, '/.docker/machine/certs', machine, name)
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
