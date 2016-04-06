
/** Web Crawler 
 *  1. Multiple processes crawling on CNN website together to get all recent news.
 *  2. Use Mongodb to store data.
 *  3. Use message-queue(RabbitMQ) design to dispatch works to all the worker processes; 
 *     Main process take control of managing when to stop the crawling, and worker processes 
 *     are responsible for doing the crawling work.
 *  4. Use Redis to serve as cache layer to store the sharing resources between processes.
 *     Here I use redis to store visited url, so that the same url will not be visited again.
 */

var cp = require("child_process");
var workers = [];
var count = 0;
var WORKER_NUM = require('os').cpus().length-1; // deduct the main process
var MAX_PAGES_TO_VISIT = 100; 

var start = 0;
var end = 0;

console.log("CPU Number = %d", WORKER_NUM);

function killAll() {
    for (var i = 0; i < WORKER_NUM; i++) {
        workers[i].kill();
    }
}

process.on('SIGINT', function() {
    console.log("main Caught interrupt signal");
    killAll();
    process.exit();
});

process.on('exit', function() {
    console.log("main Caught exit signal");
    killAll();
    console.log("Total spending time = %d seconds", (end - start)/1000);
    process.exit();
});

for (var i = 0; i < WORKER_NUM; i++) {
    var n = cp.fork('./worker.js');
    n.on('message', function(m) {
        if (m.count) {
            count++;
            if (count > MAX_PAGES_TO_VISIT)
            {
                end = new Date().getTime();
                killAll();
            }
        }
    });
    workers.push(n);
}

start = new Date().getTime();
workers[0].send({url : "http://www.cnn.com"});


