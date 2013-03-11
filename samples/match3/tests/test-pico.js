pico.def('picoTester', function(me){
  me.link('test_external', './test-external.js');

  var
  main = function(){
      pico('#test-div').pushAttr('className').split(' ').pop('class2').push('class1').join(' ').popAttr('className');

      me.test_external.slot('data', function(){
        var testDiv = document.getElementById('test-div');
        testDiv.innerHTML += '<p>data signaled</p>';
      });
      me.test_external.writeSomething();

      var
      holders = document.getElementsByClassName('holder'),
      holder;
      for(var i=0, l=holders.length; i<l; i++){
        holder = holders[i];
        pico.embed(holder, holder.getAttribute('templ')+'.html');
      }
  };

  pico.slot('load', main);
});
