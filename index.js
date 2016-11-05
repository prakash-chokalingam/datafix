var express = require('express');
var app = express();
var bodyParser = require('body-parser');
// var cleaner = require('dirty-markup');
var request = require('request');
var htmlmin = require('htmlmin');
var mysql = require('mysql');
// sql connection local

// var connection = mysql.createConnection({
//   socketPath: "/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock",
//   user:"root",
//   password: "",
//   database: "datafix"
// });

// end of connection
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


app.set('port', (process.env.PORT || 5000));


app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
});


app.use(express.static(__dirname + '/public'));


// dashboard
app.get('/', function(request, response) {
  response.sendFile(__dirname+'/views/index.html');
});

// parser -> mysql

app.post('/parser', function(req,res) {
  var query = req.body.code;
  var table = req.body.table;
  var sendData;
  //sql connection Production
  var connection = mysql.createConnection("dummy");
  connection.connect(function(err) {
    if(err) {
      console.error('error connecting: ' + err.stack);
      return;

    }
    else {
       console.log('connected as id ' + connection.threadId);
    }
  });
  connection.query(query, function(err, result) {
    if (err) {
      console.log("err");
    };
    // get data
    var q = "SELECT * FROM "+table+" WHERE id = " + result.insertId;
    connection.query(q,function(err,rows){
       sendData = rows[0];
       var q = "DELETE FROM "+table+" WHERE id = " + result.insertId;
       connection.query(q,function(err,row){
       });
       console.log(result.insertId + "Deleted");
       connection.destroy();
       res.send(sendData);
    });

  });

});

// mark up clean -- removed
// app.post('/clean-html',function(req,response) {
//   request.post({url:"https://dirtymarkup.com/api/html",form:{code:req.body.code}},function(err,res,body){
//     if (!err && res.statusCode == 200) {
//         response.send(htmlmin(body));
//       }
//       else {
//         console.log(err);
//       }
//   });
// });

// minifier
app.post('/minify',function(req,res) {
  var min = htmlmin(req.body.code);
  res.send(min);
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

// err
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
});
