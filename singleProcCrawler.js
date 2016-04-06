
var request = require("request");
var cheerio = require("cheerio");
var URLParse = require('url-parse');
var fs = require("fs");
var ws = fs.createWriteStream('./test.txt');


var targetURLs = [];
var startURL = new URLParse("http://www.cnn.com");
var MAX_PAGES_TO_VISIT = 1000;
var numURLVisited = 0;
var visitedURLs = {};
targetURLs.push(startURL);

console.log("start crawling!!");
// console.log("hostname = %s", startURL.hostname);
crawl();

function crawl() {

    console.log("going to crawl\n");

    if(numURLVisited >= MAX_PAGES_TO_VISIT) {
        console.log("Reached max limit of number of pages to visit.");
        return;
    }

    var url = targetURLs.pop();
    if(visitedURLs[url] == true) {
        crawl(); //do next crawl;
    }
    else {
        visitPage(url, crawl);
    }
}

function visitPage(url, cb) {

    console.log("Process " +  url );

    visitedURLs[url] = true;
    numURLVisited++;

    request ({
        url: url,
        method: "GET"
    }, function(err, response, body) {

        if(err || !body) {
            cb();
            return;
        }

        var $ = cheerio.load(body);
        searchURL($);
        cb();
    }); 

}

function searchURL($) {
    // var moreURLs = $("a[href^='http']");
    var moreURLs = $("a[href^='/'], a[href^='http']");
    
    console.log("Found " + moreURLs.length + " relative links on page");
    for(var i = 0; i < moreURLs.length; i++) {


        var url = $(moreURLs[i]).attr('href');

        if(url.match(/\/\d+\/\d+\/\d+.*/)) //find those match to news url /years/month/date/url/...
        {
            if(url.match(/.*video.*/))
                continue;

            // console.log( "Found!! url = " + startURL.protocol + "//" + startURL.hostname + url + "\n");
            if(!url.match(/^http/))
            {
                url = startURL.protocol + "//" + startURL.hostname + url;
            }
            else
            {
                var url_parse = new URLParse(url);
                if(url_parse.hostname != "www.cnn.com")
                    continue;
            }
            // console.log( "Found!! url = " + url + "\n");
            targetURLs.push(url);
        }
        // console.log("Found!! url = " + $(moreURLs[i]).attr('href') + "\n");
        // targetURLs.push($(moreURLs[i]).text());


    }
}



// var rs = fs.createReadStream('./test.txt');
// var ws = fs.createWriteStream('./testW.txt');

// rs.on('data', function(chunk){

//     // console.log(chunk.toString("utf-8") + " TEST\nTEST!");
//     ws.write(chunk.toString("utf-8") + " TEST\nTEST!");
// });