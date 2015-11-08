#! /usr/bin/env node

console.log('fixing driver..')

var fs      = require('fs')
var args    = process.argv.slice(2)
var machine = args[0]

var configPath = process.env.HOME + '/.docker/machine/machines/' + machine + '/config.json'
var config = fs.readFileSync(configPath)

config = config.toString()
config = JSON.parse(config)

var raw = config.RawDriver
var decoded = new Buffer(raw, 'base64').toString()
var driver = JSON.parse(decoded)

// update store path
driver.StorePath = process.env.HOME + '/.docker/machine'

var updatedBlob = new Buffer( JSON.stringify(driver)).toString('base64')

// update old config
config.RawDriver = updatedBlob

fs.writeFileSync(configPath, JSON.stringify(config))



