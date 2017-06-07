
var sql = require("mssql");
//MSSQL SERVER CONFIG
var config = {
    server:"192.168.0.22",
    database:"Test_HO",
    user:"sa",
    password:"Welcome123",
    port:1433,
    pool: {
        max: 100,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

var appRouterTestForHO = function(app){
    app.get("/customer/TestHO",function(req,res){


        try
        {
            sql.close();
            sql.connect(config, function(err){
                if(err)
                {
                    console.log(err);
                    res.json({"status" : 100, "status" : "Error in connection database"});
                }
                else
                {
                    var request = new sql.Request();
                    var selectQuery = "Select IPG.ProductGroupKey 'GroupID', SUM(TS.TotalTaxableAmount) 'groupTotal', SUM(TS.DiscountAmount)'disTot' ,TT.TransactionKey from TrxTransactionSaleItem TS " +
                        "inner join TrxTransaction TT on TS.TransactionKey=TT.TransactionKey " +
                        "inner join InvProduct IP on TS.ProductKey=IP.ProductKey " +
                        "inner join InvProductGroup IPG On IP.ProductGroupKey=IPG.ProductGroupKey " +
                        "where TT.TransactionId=003516 and StoreKey=10000000000000003 and businessDate='2016-08-09' group by  IPG.ProductGroupKey,TT.TransactionKey order by  IPG.ProductGroupKey,TT.TransactionKey"

                    console.log(selectQuery);
                    var rewardPoints =0;
                    var totalAmount = 0;
                    var totalDis = 0;
                    request.query(selectQuery, function (err, results)
                    {
                        if(err)
                        {
                            // console.log("selectQuery" + err);
                            res.json({"status" : 201,"message":err});
                        }
                        else
                        {
                            if( results.recordset != ""){

                                // console.log("into select outout1" + JSON.stringify(results));
                                res.json(results.recordset);
                            }
                            else
                            {

                            }
                        }
                    });
                }
            });

        }

        catch(ex){
            console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);
        }


    });
}
pool.getConnection(function(err, conn){


    if(err)
    {
        res.json({"status" : 100, "status" : "Error in connection database"});
        return;
    }
    else {
        var insertSql = "select * from ss_customerbills WHERE BillNo =" + billNo + " AND BillTagDate='" + billdate + "' AND StoreLocation = " + storelocation + " AND BillStatus = 2";

        var query = conn.query(insertSql, function (err, rows) {

            if (err) {
                res.json({"status": 201, "message": "Invalid Value"});
            }
            else {

                if (rows != "") {
                    var updateSqlValue = "UPDATE SS_CustomerBills SET BillStatus = 4 WHERE BillNo =" + billNo + " AND BillTagDate='" + billdate + "' AND StoreLocation = " + storelocation + " AND BillStatus = 1";
                    var query = conn.query(insertSql, function (err, rows) {

                        if (err) {
                            res.json({"status": 201, "message": "Invalid Value"});
                        }
                        else {
                            if (rows != "") {
                                res.json({"status": 201, "message": "This Bill is Already Validated"});
                            }
                            else {

                            }
                        }


                    });
                }
                else {

                }

            }
        });
    }
    });



module.exports = appRouterTestForHO;
