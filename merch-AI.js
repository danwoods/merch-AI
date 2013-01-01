var fs      = require('fs'),
    nconf   = require('nconf'),
    request = require("request"),
    cheerio = require("cheerio"),
    logger  = require("winston");

// Setup command line arguments/defaults
nconf.argv({
  'siteUrl': {
    alias: 'url',
    describe: 'The url to scrape',
    demand: true,
    default: 'http://www.jspro.com'
  },
  'pageType': {
    alias: 'type',
    describe: 'The type of page to scrape, ie: "amazon-search"',
    demand: true,
    default: 'amazon-search'
  }
});

// Setup parameters
var url = nconf.get('url');
var type = nconf.get('type');
logger.info('Starting march-AI with the following parameters:');
logger.info('url = '+url);
logger.info('type = '+type);
// Make request
request({uri: url}, 
        function(error, response, body) {
          var $ = cheerio.load(body);
          if(type === 'amazon-search'){
            var imageSrc = $("div#result_0 div.image img").attr('src'); 
            logger.info('Image srouce = '+imageSrc);
          }
          else {
            $(".entry-title > a").each(function() {
              var link = $(this);
              var text = link.text();
              var href = link.attr("href");
              console.log(text + " -> " + href);
            });
          }
});
