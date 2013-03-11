module.writeSomething = function(){
  var testDiv = document.getElementById('test-div');
  testDiv.innerHTML += '<p>WriteSomething</p>';
  this.signal('data');
}
