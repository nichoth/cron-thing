var http = require('http');
var request = require('request');
var split = require('split');
var postmark = require('postmark');
var Client = require('mongodb').MongoClient;
var dbUri = process.env.MONGOLAB_URI;

var pmClient = new postmark.Client(process.env.POSTMARK_API_TOKEN);

function findDocs(db, cb) {
  var coll = db.collection('testColl');
  coll.find({}).toArray(cb);
}

var re = /olympia/;
var matches = 0;

var port = process.env.port || 8000;
http.createServer(function(req, resp) {

  request('http://www.lightspeedpos.com/careers/')
    .pipe(split())
    .on('data', function(chunk) {
      var m = chunk.toString().match(re);
      matches += m ? m.length : 0;
    })
    .on('end', function() {
      resp.end('matches: '+matches.toString());
      pmClient.sendEmail({
        "From": process.env.FROM,
        "To": process.env.TO,
        "Subject": "matches: "+matches,
        "TextBody": "Hello from Postmark!"
      }, function(err, resp) {
        if (err) console.log(err);
      });
    })
  ;

  // Client.connect(dbUri, function(err, db) {
  //   if (err) {
  //     console.log(err);
  //     resp.end();
  //     return;
  //   }
  //   findDocs(db, function(err, docs) {
  //     console.log(docs);
  //     resp.writeHead(200, {"Content-Type": "application/json"});
  //     resp.end(JSON.stringify(docs));
  //   });
  // });

}).listen(port);

console.log('Listening on :'+port);
