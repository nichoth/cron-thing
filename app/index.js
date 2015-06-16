var request = require('request');
var split = require('split');
var postmark = require('postmark');
var Client = require('mongodb').MongoClient;
var dbUri = process.env.MONGOLAB_URI;

var pmClient = new postmark.Client(process.env.POSTMARK_API_TOKEN);

var re = /olympia/;
var matches = 0;
var searchUri = 'http://www.lightspeedpos.com/careers/';

request(searchUri)
  .pipe(split())
  .on('data', function(chunk) {
    var m = chunk.toString().match(re);
    matches += m ? m.length : 0;
  })
  .on('end', function() {
    dbStuff(matches);
  })
;

function updateOrCreate(db, doc, cb) {
  var coll = db.collection('tasks');
  coll.findOneAndUpdate(
    { _id: doc._id },
    { $set: { matches: doc.matches } },
    {
      returnOriginal: true,
      upsert: true
    },
    cb
  );
}

function dbStuff(matches) {
  Client.connect(dbUri, function(err, db) {
    if (err) {
      console.log(err);
      return;
    }
    updateOrCreate(db, {_id: searchUri, matches: matches}, function(err, resp) {
      // send an email if the number of matches changed since yesterday
      if (resp.value.matches !== matches) {
        pmClient.sendEmail({
          "From": process.env.FROM,
          "To": process.env.TO,
          "Subject": "new results",
          "TextBody": searchUri
        }, function(err, resp) {
          if (err) console.log(err);
        });
      }
    });
  });
}
