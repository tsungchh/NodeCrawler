###　　　　　　　　　　　　Author:Tsung Chun Hsu
###　　　　　　　　　 E-mail:tsungchh@gmail.com

===========================


 *  Multiple processes crawling on CNN website together to get all recent news.
 *  Use Mongodb to store data.
 *  Use message-queue(RabbitMQ) design to dispatch works to all the worker processes; Main process take control of managing when to stop the crawling, and worker processes are responsible for doing the crawling work.
 *  Use Redis to serve as cache layer to store the sharing resources between processes. Here I use redis to store visited url, so that the same url will not be visited again.
