var mysql = require('mysql');

//MYSQL SERVER CONFIG
var pool = mysql.createPool({
  connectionLimit : 100,
    host: "localhost",
    user: "root",
    password: "rootadmin",
    database: "supersaravanaprod",
    port:"3306",
	multipleStatements : 'Allow',
    debug: false
 });
 

var appRouterContestWinner = function(app)
{
app.get('/contests', function(req, res) {

	pool.getConnection(function(err, conn){
		if(err)
		{
			res.json({"code" : 100, "status" : "Error in connection database"});
			return;
		}
		else
		{
			var checksqlquery = "select contestid, contestname from SS_Contest";
			var queryChecking = conn.query(checksqlquery, function (err, result){
				if(err)
				{
				res.json({"Status" : 201,"message":"Query Access Denied"});
				}
				else
				{
					if(result!="")
                     {
						res.json(JSON.stringify({"contests":result}));
                     }
                     else
                     {
                     	res.json([])
                     }
				}
			});
		}
	});
});

app.get('/contests/:contestid/winners', function(req, res) {
	
	pool.getConnection(function(err, conn){
		if(err)
		{
			res.json({"code" : 100, "status" : "Error in connection database"});
			return;
		}
		else
		{
			if (queryBy = ""){
				res.json({"code" : 100, "status" : "Invalid Input."});
			return;
			}
			var queryBy = req.params.contestid;
			console.log(queryBy);

			var checksqlquery = "SELECT CP.CustomerName, CP.mobileno from SS_CustomerProfiles as CP INNER JOIN (SELECT t.customerid FROM SS_ContestEntries AS t where EntryStatus = 2 and contestid=" + queryBy + " ORDER BY RAND() LIMIT 1) as CE on CP.customerid =CE.customerid";
			console.log(checksqlquery);
			var queryChecking = conn.query(checksqlquery, function (err, result){
				if(err)
				{
				res.json({"Status" : 201,"message":"Query Access Denied"});
				}
				else
				{
					console.log(result);
					if(result!="")
                     {
                   		var id = result[0].CustomerName;
				   		var phonenumber = result[0].mobileno;
				   		res.json({"winners": [{"phone": id,"name": phonenumber}]})
                     }
                     else
                     {
                     	res.json({"winners":[]});
                     }
				}
			});
		}
	});
});
}
module.exports = appRouterContestWinner;
 
