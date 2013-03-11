var
util = require('util'),
func = function(){
  this.comment = 'this is a comment';

  return 'this is a func';
};

func.prototype.init = function(){
  this.statement = 'this is a method';
}

func.prototype.method = function(){
  return this.statement;
}

func.staticMethod = function(){
  return 'this is a static method';
}

func.born = function(child){
  child.prototype = new func;
  child.prototype.parent = func.prototype;
  child.prototype.constructor = child;

  return new child;
}

console.log('##### func1:%s', func());
console.log('##### static1:%s', func.staticMethod());

var obj = new func;
obj.init();

console.log('##### obj:%s', obj.method());

console.log('##### func2:%s', func());
console.log('##### static2:%s', func.staticMethod());

function Child(){
  this.statement = 'a child method';
}

var child = func.born(Child);
console.log('##### child:%s', child.method());
