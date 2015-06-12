// parse arguments to json 
//
var
path = require('path'),
beginner = 45

module.exports= {
    parse: function(defaults, b){
        defaults= defaults || ret
        b = b || beginner

        var ret= {},val,j,c

        for(var key in defaults) ret[key]= defaults[key][0];

        error: {
            for(var i=2,args=process.argv,a; a=args[i]; i++){
                if (a.length < 2) break error
                if (b !== a.charCodeAt(0)) break error
                if (b === a.charCodeAt(1)){
                    a=a.substr(2)
                    val=defaults[a]
                    if (!val) break error
                    switch(typeof val[0]){
                    case 'boolean': ret[a]= true; break
                    case 'string': ret[a]= args[++i]; break
                    case 'number': ret[a]= parseFloat(args[++i]); break
                    default: break error
                    }
                }else{
                    for(j=1,c; c=a.charAt(j); j++){
                        val=defaults[c]
                        if (!val) break error
                        switch(typeof val[0]){
                        case 'boolean': ret[c]= true; break
                        case 'string': ret[c]= args[++j]; break
                        case 'number': ret[c]= parseFloat(args[++j]); break
                        default: break error
                        }
                    }
                }
            }
            return ret
        }
        console.error('Invalid argument',a)
        return this.usage(defaults)
    },
    usage: function(defaults){
        console.log('Usage',path.basename(process.argv[0]),process.argv[1], '[arguments]')
        console.log('Arguments:')
        var val
        for(var key in defaults){
            val = defaults[key]
            console.log(key.length > 1 ? '--'+key : '-'+key, '\t',val[1], '\t','['+val[0]+']')
        }
    }
}
