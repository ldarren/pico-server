const
MODEL = 'common'

var common

module.exports = common = {
    stringify: function(session, order, next){
        var json = order.json
        if (!json) return next()
        if ('string' !== typeof json) order.json = JSON.stringify(json)
        next()
    },
    parse: function(session, order, next){
        var
        model = session.getModel(MODEL),
        keys = Object.keys(model),
        key, res

        for(var i=0,l=keys.length; i<l; i++){
            key = keys[i]
            res = session.getModel(key)[model[key]]

            if (res.length){
                common.parseAll(res)
            }else{
                common.parseOne(res)
            }
        }
        next()
    },
    parseOne: function(res){
        var json = res.json
        if ('string' !== typeof json) return res
        res.json = JSON.parse(res.json)
        return res
    },
    parseAll: function(arr){
        for(var j=0,k=arr.length;j<k;j++){
            common.parseOne(arr[j])
        }
        return arr
    }
}
