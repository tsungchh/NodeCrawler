
var request = require("request");
var cheerio = require("cheerio");
var URLParse = require('url-parse');
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');

var cnnDB = {};

//constorctor
function crawlURL (db) {
    cnnDB = db;
}

/** 
 * Public API to crawling givin url.
 * @param {object} URL
 * @param {function} callback function
 */
crawlURL.prototype.run = function run (URL, cb) {

    if(!URL)
    {
        console.log("URL is NULL!");
        return false;
    }

    if(!cb)
    {
        console.log("callback is NULL!");
        return false;
    }

    redis.get(URL.trim(), function (err, reply) {
        if (err)
        {
            console.log(err);
        }
        else if (reply)
        {
            console.log("already visit " + URL.trim());
        }
        else
        {
            redis.set(URL.trim(), "test"); //aync
            var currRun = helper();
            currRun.setURL(URL.trim());
            currRun.visitPage(cb);
        }
    });
}



/**
 * Helper function that generates object to use helpers.
 */ 
function helper () {

    var myURL = "";
    var myURLParse = {};
    var myHeader = "";
    var myFoundURLs = [];

    /** 
     * Private helper to insert data to mongo database
     * @param {object} to be inserted data.
     */
    function insertDb (data) {
        var row = new cnnDB();
        row.url = data.url;
        row.header = data.header;
        row.save(function(err){
            if (err)
            {
                console.log("save to db ERR " + err);
            }
            
            //only send the count once inserting data successfully.
            process.send( { count : "count", pid: process.pid } );
        });
    }

    /** 
     * Private helper to search URL within the DOM tree object.
     * @param {object} DOM selector.
     */
    function searchURL ($) {
        
        var moreURLs = $("a[href^='/'], a[href^='http']");
        
        for (var i = 0; i < moreURLs.length; i++) {


            var url = $(moreURLs[i]).attr('href');

            if (url.match(/\/\d+\/\d+\/\d+.*/)) //find those match to news url /years/month/date/url/...
            {
                //skip the vidwo news.
                if (url.match(/.*video.*/))
                    continue;

                if (!url.match(/^http/))
                {
                    url = myURLParse.protocol + "//" + myURLParse.hostname + url;
                }
                else
                {
                    var url_parse = new URLParse(url);
                    if (url_parse.hostname != "www.cnn.com")
                        continue;
                }
                myFoundURLs.push(url);
            }
        }
    }

    /** 
     * Private helper to search header within the DOM tree object.
     * @param {object} DOM selector.
     */
    function searchHeader ($) {
        var header = $("h1.pg-headline");
        if (header.length == 0) {
            myHeader = "NO header";
        }
        else {
            myHeader = $(header[0]).text();
        }
    }


    /** 
     * Returning object and its helpers.
     */
    return {

        /** 
        * Setter for url.
        */
        setURL : function (url) {
            myURL = url;
            myURLParse = new URLParse(url);
        },

        /** 
        * Crawling current url.
        * @param {fucntion} Callback function to process the result. 
        */
        visitPage : function (cb) {

            if (!myURL) {
                return;
            }

            request({
                url: myURL,
                method: "GET"
            }, function (err, response, body) {

                if (err || !body) {
                    console.log("ERR! " + err);
                    return;
                }

                var $ = cheerio.load(body);
                searchURL($);
                cb(myFoundURLs);
                myFoundURLs = [];

                searchHeader($);
                // console.log("myURL = %s", myURL);
                insertDb({
                    url : myURL,
                    header : myHeader
                });

            }); 

        }
    };
}

module.exports = crawlURL;