#!/usr/bin/env node

var Crawler = require("./crawler");
var amqp = require('amqplib/callback_api');
var mongo = require("mongoose");
var channel = {};
var queue = 'hello';
var offlineQueue = [];

process.on("message", function (m){
    if(m.url) {
        offlineQueue.push(m.url);
    }
});

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    process.exit();
});

function processURL(URLs) {

    URLs.forEach(function (element) {
        //send job
        channel.sendToQueue(queue, new Buffer(element), {persistent: true});
        // console.log(" [x] Sent '%s'", element);
    });
}

mongo.connect('mongodb://localhost:27017/cnnDB');
var cnnDB = mongo.model('CNN', {
    url : String,
    header : String
});
var crawler = new Crawler(cnnDB);

amqp.connect('amqp://localhost', function(err, conn) {

    if(err) {
        console.log(err);
    }
    else {

        conn.createChannel(function (err, ch) {
            channel = ch;
            ch.assertQueue(queue, {durable: true});
            ch.prefetch(1);
            ch.consume(queue, function (url) 
            {
                //process url
                crawler.run(url.content.toString(), processURL);
                ch.ack(url);

            }, {noAck: false});

            while (true)
            {
                var m = offlineQueue.shift();
                if(!m) {
                    break;
                }
                channel.sendToQueue(queue, new Buffer(m), {persistent: true});
            }
        });
    }
});



