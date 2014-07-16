const
MODEL = 'common'

var common

module.exports = common = {
    pluck: function(objs, key){
        var arr = []
        if (objs.length){
            var map = {}, obj, id, i, l, k
            for(i=0,l=objs.length; i<l; i++){
                obj = objs[i]
                if (!obj) continue
                id = obj[key]
                if (undefined === id) continue
                map[id] = id
            }
            for(k in map){
                arr.push(map[k])
            }
        }
        return arr
    }
}
