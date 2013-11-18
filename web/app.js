
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

require('./routes/main')(app);

// init tags

var tags = [
    { name: "Featured", showInMenu: true },
    { name: "Recent", showInMenu: true },
    { name: "Mentoring", showInMenu: true  },
    { name: "Technologies", showInMenu: true  },
    { name: "Soft skills", showInMenu: true  },
    { name: "Algorithms" },
    { name: "OOP Concepts" },
    { name: ".NET" },
    { name: "C#" },
    { name: "ADO.NET" },
    { name: "LINQ" },
    { name: "Entity Framework" },
    { name: "NHibernate" },
    { name: "WPF" },
    { name: "WCF" },
    { name: "ASP.NET" },
    { name: "ASP.NET MVC" },
    { name: "Node.js" },
    { name: "JavaScript" },
    { name: "JQuery" },
    { name: "HTML" },
    { name: "CSS" },
    { name: "SQL" },
    { name: "SQL Server" },
    { name: "Oracle" },
    { name: "Java" },
    { name: "XML" },
    { name: "Multithreading" },
    { name: "Unit Testing" }
]

var collections = ["video", "tags"]
var mongojs = require('mongojs');
var db = mongojs("hack", collections)

db.tags.remove(function() {
    tags.forEach(function(tag) {
        db.tags.insert(tag)        
    })
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
