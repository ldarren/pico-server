pico = function(n){
  if (n){
    return Object.create(pico.inner,
      {
        _s: {writable:false, configurable:false, enumerable:false, value:[]},
        _n: {writable:false, configurable:false, enumerable:false, value: 
        (n instanceof Element) ? [n] : Array.prototype.slice.call(document.querySelectorAll(n))}
      });
  }

  Object.defineProperty(this, 'slots', {value:{}, writable:false, configurable:false, enumerable:false});
  Object.defineProperty(this, 'deps', {value:[], writable:false, configurable:false, enumerable:false});
  return this;
};

Object.defineProperty(pico.prototype, 'links', {value:{}, writable:true, configurable:false, enumerable:false});

pico.prototype.slot = pico.slot = function(channel, cb){
  var channel = this.slots[channel] = this.slots[channel] || [];
  channel.push(cb);
}

pico.prototype.signal = pico.signal = function(channel, events){
  var channel = this.slots[channel];
  if (!channel) return;
  for(var i=0, l=channel.length; i<l; i++){
    channel[i].apply(undefined, events);
  }
}

pico.prototype.use = function(name){ this.deps.push(name);}

pico.prototype.link = function(name, url){
  this.links[name] = url;
  this.use(name);
}

pico.def = function(name, factory){
  var module = new pico;
  factory(module);
  return this.modules[name] = module;
}

pico.setup = function(names, cb){
  if (!names || !names.length) return cb();

  var module = this.modules[names.pop()];

  this.loadJS(module, function(){
    pico.setup(names, cb);
  });
}

pico.loadJS = function(host, cb){
  if (!cb) cb = function(){};
  var names = host.deps;
  if (!names || !names.length) return cb();

  var
  name = names.pop(),
  module = this.modules[name];

  if (module){
    host[name] = module;
    return pico.loadJS(module, function(){
      return pico.loadJS(host, cb);
    });
  }else{
    var link = host.links[name];
    if(link){
      pico.ajax('get', link, '', function(err, xhr, userData){
        if (!err){
          var func = new Function('module', xhr.responseText);

          module = pico.def(name, func);
          host[name] = module;
          return pico.loadJS(module, function(){
            return pico.loadJS(host, cb);
          });
        }else{
          return pico.loadJS(host, cb);
        }
      });
    }else{
      return pico.loadJS(host, cb);
    }
  }
}

pico.embed = function(holder, url, cb){
  pico.ajax('get', url, '', function(err, xhr, userData){
    if (err) return cb(err);
    holder.innerHTML = xhr.responseText;

    var
    scripts = Array.prototype.slice.call(holder.getElementsByTagName('script')),
    host = new pico;

    pico.embedJS(host, scripts, function(){
      pico.loadJS(host, function(){
        pico.modules[holder.name] = host;
        if (cb) return cb();
      });
    });
  });
}

pico.embedJS = function(host, scripts, cb){
    if (!scripts || !scripts.length) return cb();

    var
    script = scripts.pop(),
    func, module;

    if (script.getAttribute('templ')) return pico.embedJS(host, scripts, cb); // template node, ignore
    if (script.src){
      host.link(script.name, script.src);
      return pico.embedJS(host, scripts, cb);
    }
    func = new Function('module', script.innerText);
    module = pico.def(script.name, func);
    pico.loadJS(module, function(){
      return pico.embedJS(host, scripts, cb);
    });
}

pico.ajax = function(method, domain, params, cb, userData){
    if (!domain) return cb(new Error('domain not defined'));
    var
    xhr = window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP'),
    post = 'post' === method;

    if (!post && params){
        domain += '?'+params;
        params = null;
    }

    xhr.open(method, domain, true);
    
    if (post) xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

    xhr.send(params);
    xhr.onreadystatechange=function(){
        if (4 === xhr.readyState){
            if (cb)
              return cb(200 === xhr.status ? null : new Error("Error["+xhr.statusText+"] Info: "+xhr.responseText), xhr, userData);
        }
    }
    xhr.onerror=function(evt){if (cb) return cb(evt, xhr, userData);}
}

Object.defineProperty(pico, 'modules', {value:{}, writable:false, configurable:false, enumerable:false});
Object.defineProperty(pico, 'slots', {value:{}, writable:false, configurable:false, enumerable:false});
Object.defineProperty(pico, 'inner', {value:{
  nn: function(i){
    if (!this._n.length) throw new Error('Nodes not set');
    if (arguments.length) return this._n[i];
    return this._n;
  },
  ii: function(err, obj, Type){
    if (err){
      if (err instanceof Error) throw obj;
      throw new Error(err);
    }
    if (Type && !(obj instanceof Type)) throw new Error('push type mismatch');
    this._s.push(obj);
  },
  oo: function(Type){
    if (!this._s.length) throw new Error('Pop a empty stack');
    var obj = this._s.pop();
    if (Type && !(obj instanceof Type)) throw new Error('pop type mismatch');
    return obj;
  },
  pushArray: function(){ this.ii(null, []); return this; },
  pushAttr: function(attr){ this.ii(null, this.nn(0)[attr]); return this; },
  popAttr: function(attr){
    var
    o = this.oo(),
    nodes = this.nn(),
    node,
    l = nodes.length;
    for(var i=0;i<l;i++) nodes[i][attr] = o;
    return this;
  },
  pushStyle: function(){
    var
    n = this.nn(),
    l = n.length,
    styles = [];
    for(var i=0; i<l; i++) styles.push(n[i].style);
    this.ii(null, styles);
    this.ii(null, CSSStyleDeclaration.prototype.setProperty);
    return this;
  },
  set: function(key, value){
    var
    func = this.oo(Function),
    csss = this.oo(),
    l = csss.length;
    for(var i=0; i<l; i++) func.call(csss[i], key, value);
    return this;
  },
  split: function(delimiter){
    var str = this.oo();
    this.ii(null, str.split(delimiter));
    return this;
  },
  join: function(delimiter){
    var arr = this.oo(Array);
    this.ii(null, arr.join(delimiter));
    return this;
  },
  push: function(obj){
    var list = this.oo(Array);
    if (list.indexOf(obj) < 0) list.push(obj);
    this.ii(null, list);
    return this;
  },
  pop: function(obj){
    var
    list = this.oo(Array),
    i = list.indexOf(obj);
    if (i > 0) list.splice(i, 1);
    this.ii(null, list);
    return this;
  },
  toggle: function(obj){
    var
    list = this.oo(Array), 
    i = list.indexOf(obj);
    if (i < 0) list.push(obj);
    else list.splice(i, 1);
    this.ii(null, list);
    return this;
  },
  }, writable:false, configurable:false, enumerable:false});

Object.freeze(pico);

window.addEventListener('load', function(){
  pico.setup(Object.keys(pico.modules), function(){
    pico.signal('load');
  });
});
