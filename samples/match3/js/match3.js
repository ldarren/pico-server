pico.def('m3Frame', function(me){
  me.link('floodfill', '../js/actions/floodFills.js');
  me.link('grid', '../js/models/grid.js');

  var
  pageHolder,
  onRotate = function(evt){
    switch(window.orientation){
      case 0:
        break;
      case -90:
      case 90:
        break;
    }
  },
  main = function(){
      var
      holders = document.getElementsByClassName('holder'),
      holder,
      l = holders.length;

      pageHolder = document.getElementById('pageHolder');
      
      for(var i=0; i<l; i++){
          holder = holders[i];
          setPage.call(holder, null, holder);
      }
  };

  pico.slot('load', main);
  //window.addEventListener('orientationchange', onRotate);
});
