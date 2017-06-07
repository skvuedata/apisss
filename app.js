var express = require("express")
var bodyParser = require("body-parser");
var app = express();
var mysql = require('mysql');
var connection = require("express-myconnection");


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('/static', express.static("./routes/uploads/T.Nagar"));
app.use('/static', express.static("./routes/apphtmlcontent"));
var router = express.Router();
//var billTagHO = express.Router();
var contestwinner = express.Router();
var redeem = express.Router();
var photoupload = express.Router();
var fcmpush = express.Router();
app.use('/sss/v1',router);
//app.use('/sss/v1',billTagHO);
app.use('/sss/v1',contestwinner);
app.use('/sss/v1',redeem);
app.use('/sss/v1',photoupload);
app.use('/sss/v1',fcmpush);
var routes = require("./routes/index.js")(router); // Routes
//var routesForMysql = require("./routes/billtag.js")(billTagHO); //Billtag
var routesForRedeem = require("./routes/redeem.js")(redeem);
var routesForContest = require("./routes/contestwinner.js")(contestwinner); //Contestwinner
var routesForUpload = require("./routes/photoUpload.js")(photoupload);
var routesForFcmpush = require("./routes/pushnotification.js")(fcmpush);
var server = app.listen(80,function(){
console.log("Port:",server.address().port);
});
