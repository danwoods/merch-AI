var fs        = require('fs'),
    nconf     = require('nconf'),
    request   = require("request"),
    cheerio   = require("cheerio"),
    log       = require("winston"),
    http      = require('http'),
    director  = require('director'),
    plates    = require('plates');

// Setup logger colors
log.remove(log.transports.Console);
log.add(log.transports.Console, {colorize: true});

// Setup command line arguments/defaults
nconf.argv({
  'siteUrl': {
    alias: 'url',
    describe: 'The url to scrape',
    demand: false,
    default: 'http://www.jspro.com'
  },
  'pageType': {
    alias: 'type',
    describe: 'The type of page to scrape, ie: "amazon-search"',
    demand: true,
    default: 'amazon-search'
  },
  'query': {
    alias: 'query',
    describe: 'Search term used in conjunction with search pages, ie: "amazon-search"',
    demand: false,
    default: ''
  }
});

// Setup parameters
var url = nconf.get('url');
var type = nconf.get('type');
var query = nconf.get('query');
log.info('Starting merch-AI with the following parameters:');
log.info('url = '+url);
log.info('type = '+type);
log.info('query = '+query);

// Setup controller functions
function index() {
  var res = this.res;
  fs.readFile('index.html', 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(data);
  });
}
function search(q) {
  var res = this.res,
      url = 'http://www.amazon.com/s/ref=nb_sb_noss_2?field-keywords=' + (q || 'test');

  fs.readFile('search.html', 'utf8', function (err, html) {
    if (err) {
      return console.log(err);
    }
    request(
      {uri: url}, 
      function(error, response, body) {
        var $ = cheerio.load(body),
            prodList = $("div#atfResults div.prod"); 
        
        var data = [];
        for(var i = 0; i< prodList.length; i++){
          var imgSrc = $(prodList[i]).find('img').attr('src'),
              link = $(prodList[i]).find('h3.newaps').find('a').attr('href'),
              price = $(prodList[i]).find('ul.rsltL li span.bld').text();
          data.push({ "img-src": imgSrc, "link": link, "price": price }); 
        }
        var map = plates.Map();
        
        map.where('src').is("/").insert('img-src');
        map.where('href').is("/").insert('link');
        map.class('price').to('price');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(plates.bind(html, data, map));
      }
    );
  });
}

// Setup router
var router = new director.http.Router({
  '/': {
    get: index
  },
  '/search': {
    get: search
  },
  '/search/:q': {
    get: function(q){
      res = this.res;
      search(q);
    }
  }
});

// Setup server
var server = http.createServer(function (req, res) {
  router.dispatch(req, res, function (err) {
    if (err) {
      res.writeHead(404);
      res.end();
    }
  });
});
server.listen(8080);
