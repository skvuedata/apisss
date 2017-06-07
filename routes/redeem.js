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


var appRouterForRedeem = function(app){

app.get("/:customerID/claims",function(req,res){

  

  try{
    var results={
      "Response":[]
    }

    var customerID=req.params.customerID;

    pool.getConnection(function(err, conn){
      if(err){
        console.log(err);
        res.json({"code" : 100, "status" : "Error in connecting database"});
      }
      else{
         var selectSql = "SELECT RedeemValue, RedeemStatus, RedeemRequestDate FROM SS_RedeemLog WHERE CustomerID="+customerID+";SELECT sum(Points) 'Points'  FROM SS_PointsHistory WHERE CustomerID="+customerID+" GROUP BY CustomerID";
	console.log(selectSql);

          var selectSql = "SELECT RedeemValue, RedeemStatus, RedeemRequestDate FROM SS_RedeemLog WHERE CustomerID=" + customerID + "ORDER BY RedeemID DESC;SELECT sum(IF(EarnedOrClaimed =1, Points, 0))-sum(IF(EarnedOrClaimed=2,Points, 0)) AS AvailablePoints FROM  SS_PointsHistory WHERE CustomerID="+customerID+";"
          var selectSql = "SELECT RedeemValue, RedeemStatus, RedeemRequestDate FROM SS_RedeemLog WHERE CustomerID=" + customerID + " ; SELECT sum(IF(`EarnedOrClaimed`=1, `Points`, 0))-sum(IF(`EarnedOrClaimed`=2, `Points`, 0)) AS    `AvailablePoints` FROM   `SS_PointsHistory` WHERE CustomerID = '12' ;";
         var query=conn.query(selectSql,function(err,logs){
          if(err){
            res.json({"Status" : 201,"message":"Query Access Denied"});
          }
          else{
            
           // results.point = logs[1][0].Points;
            if(logs!=""){
              results.point = logs[1][0].Points;
             res.setHeader('Content-Type', 'application/json');
              res.send(JSON.stringify({"response": logs.reverse()}));
              console.log(results +"   " );
              
            }
else {

}
          }
         });
      }
    });
  }
  catch(ex){
    
  }
});





app.post("/:customerID/claims/:points",function(req,res){

  try{
    pool.getConnection(function(err, conn){
      if(err){
        console.log(err);
        res.json({"code" : 100, "status" : "Error in connecting database"});
      }
      else{  

          var customerID=req.params.customerID;
          var points=req.params.points;
          var insertSql = "INSERT INTO SS_RedeemLog SET ?";
          var insertValues = {
          "RedeemValue" : points,
          "RedeemStatus":1,
          "customerID":customerID,
    };

         var query=conn.query(insertSql,insertValues,function(err,results){
          if(err){
            res.json({"Status" : 201,"message":"Query Access Denied"});
          }
          else{
            console.log("DB Connected");
            if(results!=null){
              res.json({"status" :"200","message":"created Insert"});
            }
          }
         });
      }
    });
  }
  catch(ex){
    
  }
});




}


module.exports = appRouterForRedeem;

