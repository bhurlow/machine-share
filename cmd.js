#! /usr/bin/env node

"use strict";
var fs      = require('fs')
var zlib    = require('zlib')
var tar     = require('tar')
var fstream = require('fstream')
var args    = process.argv.slice(2)

function usage() {
  console.log('usage:')
  console.log('machine-share export <machine-name>')
  console.log('machine-share import <machine-name>')
}

if (args.length === 0) {
  usage()
  process.exit()
}

if (args.length < 2) {
  usage()
  process.exit()
}

var validCmds = new Set(['export', 'import'])
var cmd = args[0]

if (!validCmds.has(cmd)) {
  console.log(args[0] + ' not a command')
}

// TODO: 
// should consider the $MACHINE_STORAGE_PATH env var
function doExport() {
  let machineName = args[1]
  console.log('exporting ' + machineName)
  var path = process.env.HOME + '/.docker/machine/machines/' + machineName
  console.log('looking in: ' + path)
  try {
    var dir = fs.readdirSync(path)
  }
  catch(e) {
    console.log('can\'t find that machine :(')
    process.exit()
  }
  createArchive(path)
}

function createArchive(path) {
  console.log('creating archive')
  var dirDest = fs.createWriteStream('dir.tar')

  var packer = tar.Pack({ noProprietary: true })
    .on('error', function() { console.log('tar issues') })
    .on('end', function() { console.log('archive complete') });

  fstream.Reader({ path: path , type: "Directory" })
    .on('error', function() { console.log('yoo') })
    .pipe(packer)
    .pipe(dirDest)

}

function doImport() {

}


switch(cmd) {
  case 'export': doExport();
  case 'import': doImport();
}

