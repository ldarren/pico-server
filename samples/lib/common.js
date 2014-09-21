'use strict'
var common

module.exports = common = {
	parseInts: function(arr){
		for(var i=0,l=arr.length; i<l; i++){
			arr[i] = parseInt(arr[i])
		}
		return arr
	},
	// pluck([{k:1},{k:2}], 'k') = [1,2]
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
	},
	// strip([{k:1,q:1},{k:2,q:2}], 'k') = [{q:1},{q:2}]
    strip: function(objs, key){
        if (objs.length){
            for(var i=0,o; o=objs[i]; i++){
				o[key] = undefined
            }
        }
        return objs 
	},
	// keyValues([{k:1, v:5},{k:2, v:6}], 'k', 'v') = {1:5, 2:6}
	keyValues: function(arr, key, value){
		var kv = {}
		for(var i=0,a; a=arr[i]; i++){
			kv[a[key]] = a[value]
		}
		return kv
	},
	// map([{k:1, v:5},{k:2, v:6}], {1:'key1', 2:'key2'}, 'k', 'v') = {key1:5, key2:6}
	map: function(arr, keys, K, V){
		var output = {}
		for(var i=0,a; a=arr[i]; i++){
			output[keys[a[K]]] = a[V]
		}
		return output
	},
	// replace([{k:1, v:5},{k:2, v:6}], {1:'key1', 2:'key2'}, 'k') = [{k:'key1', v:5},{k:'key2', v:6}]
	replace: function(arr, keys, K){
		for(var i=0,a; a=arr[i]; i++){
			a[K] = keys[a[K]]
		}
		return arr
	},
	// group([{k:1, v:5},{k:1, v:6}], {1:'key1', 2:'key2'}, 'k') = {key1:[{k:1,v:5},{k:1,v:6}]}
	group: function(arr, keys, K){
		var
		output = {},
		k
		for(var i=0,a; a=arr[i]; i++){
			k = keys[a[K]]
			output[k] = output[k] || []
			output[k].push(a)
		}
		return output
	},
	// values(['key1','key2'], {key1:1, key2:2}) = [1,2]
	values: function(keys, kv){
		var output = []
		for(var i=0,k; k=keys[i]; i++){
			output.push(kv[k])
		}
		return output
	},
	// merge({key1:1, key2:2}, {key3:3, key4:4}) = {key1:1,key2:2,key3:3,key4:4}
	merge: function(obj1, obj2){
		if (!obj1) return obj2
		if (!obj2) return obj1
		for(var i=0,keys = Object.keys(obj2),k; k=keys[i]; i++){
			obj1[k] = obj2[k]
		}
		return obj1
	},
	// mergeByKey({key1:1, key2:2}, {key1:2, key3:3}, {key1:1, key3:4}, 'key1') = [{key1:1,key2:2,key3:4},{key1:2,key3:3}]
	mergeByKey: function(arr1, arr2, KEY){
		var m=common.merge,k, obj={}, arr=[]
		if (arr1){
			for(var i=0,a1; a1=arr1[i]; i++){
				k = a1[KEY]
				if (undefined === k) continue
				obj[k] = a1
			}
		}
		if (arr2){
			for(var j=0,a2; a2=arr2[j]; j++){
				k = a2[KEY]
				if (undefined === k) continue
				a1 = obj[k]
				obj[k] = a1 ? m(a1,a2) : a2
			}
		}
		for(k in obj){
			arr.push(obj[k])
		}
		return arr
	},
	// filter([{key1:1,key2:2},{key1:2,key2:3}], [1], 'key1') = [{key1:2,key2:3}]
	filter: function(list, exclude, key){
		var arr=[],k
		for(var i=0,l; l=list[i]; i++){
			k = l[key]
			if (!k || -1 !== exclude.indexOf(k)) continue
			arr.push(l)
		}
		return arr
	},
	// insert([{key2:2}, {key3:3}, {key1:3}], {key4:4,key5:5}) = [{key2:2,key4:4,key5:5},{key3:3,key4:4,key5:5},{key1:3,key4:4,key5:5}]
	insert: function(arr, obj){
		var m = common.merge
		for(var i=0,a; a=arr[i]; i++){
			a = m(a, obj)
		}
		return arr
    }
}
