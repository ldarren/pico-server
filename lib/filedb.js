var
fs = require('fs'),
path = require('path')

function FileDB(home, ext, fnames){
    var fnames = []

    this.home = home
    this.ext = ext
    this.fnames = fnames

    fs.readdir(home, function(err, files){
        if (err) return next(err)
        for(var i=0,f; f=files[i]; i++){
            if (path.extname(f) === ext){
                fnames.push(path.basename(f, ext))
            }
        }
    })
}

FileDB.prototype = {
    fname: function(name){
        if (-1 === this.fnames.indexOf(name)) return
        return this.home+name+this.ext
    },
    list: function(cb){
		return cb(null, this.fnames.slice())
    },
    create: function(name, json, cb){
		if (!name || !json) return cb('missing params')
        var f = this.fname(name)
        if (!f) return cb(name+' exists')

		fs.writeFile(f, json, {flag:'wx'}, cb)
    },
    read: function(name, cb){
		var f = this.fname(name)

		if (!f) return cb(f+' not found')

		fs.readFile(f, function(err, buf){
			if (err) return cb(err)
			cb(null, buf.toString())
		})
    },
    update: function(name, json, cb){
		var f = this.fname(name)

		if (!f || !json) return cb('missing params')

		fs.writeFile(f, json, cb)
    },
    remove: function(name, cb){
		var f = this.fname(name)

		if (!f) return cb('missing params')

		fs.unlink(f, cb)
    }
}

exports.init = function(appConfig, config, next){
    var
    home = config.home || __dirname + path.sep,
    ext = config.ext || '.json'

	if (path.sep !== home[home.length-1]) home += path.sep
    if ('.' !== ext[0]) ext = '.'+ext

    console.log('filedb[',home+'*'+ext,']')

    return next(null, new FileDB(home, ext))
}
