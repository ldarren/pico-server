var pico = require('pico');

pico.createContext(process.argv, function(err, context){
  if (err) return console.log(err);
  var pipeline = context.pipeline;
  pipeline.setDefaultWorkers([pipeline.makeJSON,pipeline.makeHTTP]);
  pico.setup(context, function(err, elements){
    if (err) return console.log(err);
  });
});
