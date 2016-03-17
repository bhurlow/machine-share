var fs = require('fs')

exports.copy = function (from, to) {
    var file = fs.readFileSync(from)
    fs.writeFileSync(to, file)
}

exports.copyDir = function (from, to) {
    exports.mkdir(to)
    var files = fs.readdirSync(from)
    for (var i = 0; i < files.length; i++) {
        var file = from + '/' + files[i]
        if (fs.statSync(file).isFile()) {
            exports.copy(file, to + '/' + files[i])
        }
    }
}

exports.mkdir = function (dir) {
    try {
        fs.mkdirSync(dir)
    } catch (e) {
    }
}

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
