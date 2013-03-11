var args = process.argv;
var json1 = require(args[2]);
var json2 = require(args[3]);
var output;

console.log('Input1');
console.log(json1);
console.log('Input2');
console.log(json2);
console.log('Output');

function mergeObj(base, obj, options){
    if (typeof base !== typeof obj) {
        base = obj;
        return base;
    }
    if (!options || typeof options !== 'object') options = {};
    var key, value;
    if (obj.length === undefined){
        for (key in obj){
            value = obj[key];
            if (typeof value === 'object')
                base[key] = mergeObj(base[key], value);
            else
                base[key] = obj[key];
        }
    }else{
        if (options.mergeArray){
            var i, l, unique={};
            for (i=0,l=base.length; i<l; i++){
                value = base[i];
                unique[value] = value;
            }
            for (i=0,l=obj.length; i<l; i++){
                value = obj[i];
                unique[value] = value;
            }
            base = [];
            for (key in unique){
                base.push(unique[key]);
            }
        }else{
            base = obj;
        }
    }
    return base;
}

output = mergeObj(json1, json2, {mergeArray:true});

console.log(JSON.stringify(output));
