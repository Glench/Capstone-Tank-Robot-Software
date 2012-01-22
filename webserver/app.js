
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , io = require('socket.io')
  , mustache = require('mustache')

var app = module.exports = express.createServer();

// Configuration

var tmpl = {
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};
                if (options.body) // for express.js > v1.0
                    locals.body = options.body;
                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};


app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));

  // disable layout to render html files
  app.set("view options", {layout: false});

  // make a custom html template
  // app.register('.html', {
  //   compile: function(str, options){
  //     return function(locals){
  //       return str;
  //     };
  //   }
  // });

  app.register(".html", tmpl)

});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000);

// websocket stuff
var sio = io.listen(app)
sio.sockets.on('connection', routes.socket_connection)


console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
