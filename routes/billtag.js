var sql = require("mssql");
var mysql = require('mysql');
var moment = require('moment');
var Q = require('q');
//MYSQL SERVER CONFIG
var pool = mysql.createPool({
    connectionLimit: 100,
    host: "localhost",
    user: "root",
    password: "rootadmin",
    database: "supersaravanaprod",
    port: "3306",
    multipleStatements: 'Allow',
    debug: false
});


//MSSQL SERVER CONFIG
var config = {
    server: "192.168.0.22",
    database: "Test_HO",
    user: "sa",
    password: "Welcome123",
    port: 1433,
    pool: {
        max: 100,
        min: 0,
        idleTimeoutMillis: 30000
    }
};
//TestHO
var appRouterForHO = function (app) {


    app.post('/customer/points/trxno', function (req, res) {
        var transactionkey = (req.body.txnkey != undefined && req.body.txnkey != null) ? req.body.txnkey : '';
        var customerID = req.body.customerID;
        var dateForLastPointUpdate = moment().format('YYYY-MM-DD');
        if (transactionkey != '') {
            function getBillSummary(t_transactionkey) {

                var deferred = Q.defer();
                try {

                    pool.getConnection(function (err, conn) {
                        if (err) {
                            res.json({"status": 100, "status": "Error in connection database"});
                            return;
                        }
                        else {
                            var insertSql = "select * from ss_customerbills WHERE TransactionKey =" + transactionkey + " AND BillStatus = 2";
                            var query = conn.query(insertSql, function (err, rows) {

                                if (err) {
                                    res.json({"status": 201, "message": "Invalid Value"});
                                }
                                else {

                                    if (rows != "") {
                                        var updateSqlValue = "UPDATE SS_CustomerBills SET BillStatus = 4 WHERE  TransactionKey =" + transactionkey + " AND BillStatus = 1";
                                        var query = conn.query(insertSql, function (err, rows) {

                                            if (err) {
                                                res.json({"status": 201, "message": "Invalid Value"});
                                            }
                                            else {
                                                if (rows != "") {
                                                    res.json({
                                                        "status": 201,
                                                        "message": "This Bill is Already Validated"
                                                    });
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


                    console.log("connecting to db");
                    sql.close();
                    sql.connect(config, function (err) {
                        if (err) {
                            //  console.log("One Err:"+err);
                            res.json({"code": 100, "status": "Error in connection database"});
                            //deferred.reject({"code": 100, "status": "Error in connection database"});
                        }
                        else {
                            var request = new sql.Request();

                            var selectQuery = "Select IPG.ProductGroupKey, SUM(TS.TotalTaxableAmount) 'GroupTotal', SUM(TS.DiscountAmount) 'Discount',TT.TransactionId 'BillNo', TT.BusinessDate 'BillDate' from TrxTransactionSaleItem TS inner join trxTransaction TT on TS.TransactionKey = TT.TransactionKey inner join InvProduct IP on TS.ProductKey=IP.ProductKey inner join InvProductGroup IPG On IP.ProductGroupKey=IPG.ProductGroupKey where TS.TransactionKey = " + t_transactionkey + " group by  IPG.ProductGroupKey , TT.TransactionId ,TT.BusinessDate order by  IPG.ProductGroupKey";


                            request.query(selectQuery, function (err, results) {
                                if (err) {
                                    console.log("Two Err:" + err);
                                    res.json({"status": 100, "message": "Error in connection database"});
                                    //deferred.reject({"status": 100, "message": "Error in connection database"});
                                } else {

                                    if (results.recordset != "") {

                                        deferred.resolve(results);
                                    } else {

                                        deferred.reject("No Records found");
                                    }
                                }
                            });
                        }
                    });
                } catch (ex) {

                    res.json({"status": 101, "message": "No Records found"});
                }


                return deferred.promise;
            }

            getBillSummary(transactionkey).then(function (results, error) {

                if (error != null && error != "undefined") {
                    if (error == "No Records found") {
                        pool.getConnection(function (err, conn) {
                            if (err) {
                                res.json({"stauts": 100, "status": "Error in connection database"});
                            }
                            else {

                                var insertQuery = "UPDATE SS_CustomerBills SET BillStatus = 3 WHERE TransactionKey =" + transactionkey + ";"
                                var query = conn.query(insertQuery, function (err, results) {
                                    conn.release();
                                    if (err) {

                                        res.json({"status": 201, "message": "Own DB Query Access Denied"});
                                    }
                                    else {

                                        if (results != "") {
                                            sql.close();
                                            res.json({
                                                "status": 200,
                                                "message": "No Record Found"
                                            });
                                        }
                                        else {
                                            sql.close();
                                            res.json({
                                                "status": 200,
                                                "message": "Result Empty"
                                            });
                                        }


                                    }


                                });
                            }


                        });
                    }
                    else {

                    }
                }
                else {
                    var rewardPoints = 0;
                    var totalAmount = 0;
                    var totalDis = 0;
                    if (results != "" && results != "undefined") {

//console.log("into select outout1" + JSON.stringify(results));

//res.json(results.recordset);
                        var count = 0;
                        var fail = 0;
                        var actualRecordset = results.recordset;
                        for (var i = 0; i < actualRecordset.length; i++) {
                            var grpID = actualRecordset[i].ProductGroupKey;
                            var grpTol = actualRecordset[i].GroupTotal;
                            var totDiscount = actualRecordset[i].Discount;
                            var billNo = actualRecordset[i].BillNo;
                            var momentDate = moment(actualRecordset[i].BillDate).format('YYYY-MM-DD H:mm:ss');
                            //var storeLocation = actualRecoredset[i].StoreLocation;


                            groupPoints(grpID, grpTol, momentDate, function (points, err) {

                                if (err) {
                                    sql.close();
                                    res.json({"status": 101, "message": "No Records found"});
                                    fail++
                                }
                                else {
                                    rewardPoints += points;
                                    totalAmount += grpTol;
                                    totalDis += totDiscount;

                                    count++;

                                }

                                if (fail + count == actualRecordset.length) {

                                    pool.getConnection(function (err, conn) {
                                        if (err) {
                                            res.json({"code": 100, "status": "Error in connection database"});
                                            return;
                                        }
                                        else {

                                            var insertQuery = "INSERT INTO SS_PointsHistory (CustomerID,BillNo,Points,EarnedOrClaimed,EarnedOrClaimedDate,UpdatedBy,UpdatedDate) VALUES (" + customerID + "," + transactionkey + "," + rewardPoints + ",1,CURRENT_TIMESTAMP,'Admin',CURRENT_TIMESTAMP);UPDATE SS_CustomerBills SET BillStatus = 2,Points = " + rewardPoints + ",BillAmount=" + totalAmount + ",DiscountAmount=" + totalDis + ",BillTagDate='" + momentDate + "',BillNo=" + billNo + ",PointsLastUpdatedDate = current_timestamp  WHERE TransactionKey =" + transactionkey + ";"

                                            var query = conn.query(insertQuery, function (err, results) {
                                                conn.release();
                                                if (err) {

                                                    res.json({"status": 201, "message": "Query Access Denied"});
                                                }
                                                else {

                                                    if (results != "") {
                                                        sql.close();
                                                        res.json({
                                                            "status": 200,
                                                            "message": "Success!!",
                                                            "points": rewardPoints,
                                                            "total Amount": totalAmount,
                                                            "discounted Amount": totalDis
                                                        });
                                                    }
                                                    else {
                                                        sql.close();
                                                        res.json({
                                                            "status": 200,
                                                            "message": "Result Empty"
                                                        });
                                                    }


                                                }


                                            });
                                        }


                                    });


                                }
                            });
                        }
                        //console.log(i + "   " + rewardPoints);
                    }
                }

            }).catch(function (err) {
                sql.close();
                res.json({"status": 201, "message": "No Records found"});
                //console.log("Called Back with Value" + " " + err);
            });
        }
        else {

            res.json({"status": "400", "message": "Bad Request"});
        }
    });


    var groupPoints = function (groupID, groupTotal, billDate, returnPoints) {
        // var points =
        console.log(groupID);
        try {
            pool.getConnection(function (err, conn) {
                if (err) {
                    console.log(err);
                    res.json({"status": 100, "status": "Error in connection database"});
                }
                else {
                    // var selectSql = "Select RewardValue from SS_RulesDescription  where GroupID="+groupID+" and " + groupTotal + " between MinBillOrItemAmount and MaxBillorItemAmount";

                    var selectSql = "Select RD.RewardValue from SS_RulesDescription RD, ss_ruleslog RL where GroupID=" + groupID + " and (" + groupTotal + " between MinBillOrItemAmount and MaxBillorItemAmount)and('" + billDate + "' BETWEEN RL.RuleStartDate and RL.RuleEndDate)";
                    console.log(selectSql);
                    var query = conn.query(selectSql, function (err, rows) {
                        conn.release();
                        if (err) {
                            console.log(err);
                            //returnPoints()
                        }
                        else {


                            setTimeout(function () {
                                if (rows.length > 0) {
                                    points = rows[0].RewardValue;
                                }
                                else {
                                    points = 0;
                                }
                                returnPoints(points);
                            }, 0);


                        }
                    });
                }
            });
        }
        catch (ex) {
            console.error("Internal error");
        }

    };


    app.post("/customer/points/billno", function (req, res) {
        var billNo = (req.body.billNo != undefined && req.body.billNo != null) ? req.body.billNo : '';
        var customerID = (req.body.customerID != undefined && req.body.customerID != null) ? req.body.customerID : '';
        var billdate = (req.body.billDate != undefined && req.body.billDate != null) ? req.body.billDate : '';
        var storelocation = (req.body.storeLocation != undefined && req.body.storeLocation != null) ? req.body.storeLocation : '';
//console.log(billNo,customerID,billdate,storelocation);

        if (billNo != '' && customerID != '' && billdate != '' && storelocation != '') {

            try {

                pool.getConnection(function (err, conn) {


                    if (err) {
                        res.json({"status": 100, "status": "Error in connection database"});
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


//HO
                                    sql.close();
                                    sql.connect(config, function (err) {
                                        if (err) {
                                            console.log(err);
                                            res.json({"status": 100, "status": "Error in connection database"});
                                        }
                                        else {
                                            var request = new sql.Request();
                                            var selectQuery = "Select IPG.ProductGroupKey 'GroupID', SUM(TS.TotalTaxableAmount) 'groupTotal', SUM(TS.DiscountAmount)'disTot' from TrxTransactionSaleItem TS inner join TrxTransaction TT on TS.TransactionKey=TT.TransactionKey inner join InvProduct IP on TS.ProductKey=IP.ProductKey inner join InvProductGroup IPG On IP.ProductGroupKey=IPG.ProductGroupKey where TT.TransactionId=" + billNo + " and StoreKey=" + storelocation + " and businessDate='" + billdate + "' group by  IPG.ProductGroupKey order by  IPG.ProductGroupKey"

                                            console.log(selectQuery);

                                            var rewardPoints = 0;
                                            var totalAmount = 0;
                                            var totalDis = 0;

                                            request.query(selectQuery, function (err, results) {
                                                if (err) {
                                                    // console.log("selectQuery" + err);
                                                    res.json({"status": 201, "message": err});
                                                }
                                                else {
                                                    if (results.recordset != "") {

                                                        //console.log("into select outout1" + JSON.stringify(results));

//res.json(results.recordset);
                                                        var count = 0;
                                                        var fail = 0;
                                                        var actualRecordset = results.recordset;
                                                        for (var i = 0; i < actualRecordset.length; i++) {
                                                            var grpID = actualRecordset[i].GroupID;
                                                            var grpTol = actualRecordset[i].groupTotal;
                                                            var totDiscount = actualRecordset[i].disTot;
                                                            //var date = results[i].Date;
//console.log("Group:"+grpID)

                                                            groupPoints(grpID, grpTol, billdate, function (points, err) {

                                                                if (err) {
                                                                    sql.close();
                                                                    res.json({
                                                                        "status": 101,
                                                                        "message": "No Records found"
                                                                    });
                                                                    fail++
                                                                }
                                                                else {
                                                                    rewardPoints += points;
                                                                    totalAmount += grpTol;
                                                                    totalDis += totDiscount;
                                                                    console.log(i + "   " + rewardPoints);
                                                                    count++;

                                                                }


                                                                if (fail + count == actualRecordset.length) {

                                                                    pool.getConnection(function (err, conn) {
                                                                        if (err) {
                                                                            res.json({
                                                                                "status": 100,
                                                                                "status": "Error in connection database"
                                                                            });
                                                                            return;
                                                                        }
                                                                        else {


                                                                            var insertQuery = "INSERT INTO SS_PointsHistory (CustomerID,BillNo,Points,EarnedOrClaimed,EarnedOrClaimedDate,UpdatedBy,UpdatedDate) VALUES (" + customerID + "," + billNo + "," + rewardPoints + ",1,CURRENT_TIMESTAMP,'Admin',CURRENT_TIMESTAMP);UPDATE SS_CustomerBills SET BillStatus = 2,Points = " + rewardPoints + ",BillAmount=" + totalAmount + ",DiscountAmount=" + totalDis + ",PointsLastUpdatedDate = current_timestamp WHERE BillNo =" + billNo + " AND BillTagDate='" + billdate + "' AND StoreLocation = " + storelocation + ";"

                                                                            console.log(insertQuery);
                                                                            var query = conn.query(insertQuery, function (err, results) {
                                                                                if (err) {
                                                                                    console.log(err);
                                                                                    res.json({
                                                                                        "status": 201,
                                                                                        "message": "Query Access Denied"
                                                                                    });
                                                                                }
                                                                                else {
                                                                                    res.json({
                                                                                        "status": 200,
                                                                                        "message": "success",
                                                                                        "points": rewardPoints,
                                                                                        "Total Amount": totalAmount,
                                                                                        "Discounted Amount": totalDis
                                                                                    });
                                                                                }


                                                                            });
                                                                        }


                                                                    });


                                                                }
                                                            });
                                                        }
                                                        //console.log(i + "   " + rewardPoints);
                                                    }
                                                    else {
                                                        pool.getConnection(function (err, conn) {
                                                            if (err) {
                                                                res.json({
                                                                    "stauts": 100,
                                                                    "status": "Error in connection database"
                                                                });
                                                            }
                                                            else {
                                                                var insertQuery = "UPDATE SS_CustomerBills SET BillStatus = 3 WHERE BillNo =" + billNo + " AND BillTagDate='" + billdate + "' AND StoreLocation = " + storelocation + ";"
                                                                var query = conn.query(insertQuery, function (err, results) {
                                                                    if (err) {

                                                                        res.json({
                                                                            "status": 201,
                                                                            "message": "Own DB Query Access Denied"
                                                                        });
                                                                    }
                                                                    else {

                                                                        if (results != "") {
                                                                            sql.close();
                                                                            res.json({
                                                                                "status": 201,
                                                                                "message": "No Record Found"
                                                                            });
                                                                        }
                                                                        else {
                                                                            sql.close();
                                                                            res.json({
                                                                                "status": 201,
                                                                                "message": "Result Empty"
                                                                            });
                                                                        }


                                                                    }


                                                                });
                                                            }


                                                        });
                                                    }
                                                }

                                                //console.log(rewardPoints);

                                            });
                                        }
                                    });

//Select Check Whether Bill Already Verifed
                                }

                            }


                        });
                    }


                });


            }

            catch (ex) {
                console.error("Internal error:" + "**ERROR!!! Error in Posting ** " + ex);
            }
        }
        else {
            res.json({"Status": 400, "message": "Bad Request"});
        }

    });

    app.post("/:ContestEntryID/ContestRegistration", function (req, res) {
        var entryId = (req.params.ContestEntryID != undefined && req.params.ContestEntryID != null) ? req.params.ContestEntryID : '';
        pool.getConnection(function (err, conn) {
            if (err) {
                console.log(err);
            }
            else {
                if (entryId != '') {
                    var updateQuery = "UPDATE SS_ContestEntries SET EntryStatus = 2 WHERE ContestEntryID =" + entryId + ";";
                    var Query = conn.query(updateQuery, function (err, result) {
                        if (err) {
                            console.log(err);
                        }
                        else if (result.affectedRows != 0) {
                            res.json({"httpCode": 200, "message": "Update Success!!"});
                        }
                        else {
                            res.json({"Status": 400, "message": "Update Failed"});
                        }
                    });
                }
                else {
                    res.json({"Status": 400, "message": "Bad Request"});
                }
            }
        });
    });


    //After Printing Status Update
    app.post("/customer/redeem/RedeemStatusUpdate", function (req, res) {
        var redeemID = (req.body.redeemID != undefined && req.body.redeemID != null) ? req.body.redeemID : ''
        var redeemStatusCode = (req.body.redeemStatusCode != undefined && req.body.redeemStatusCode != null) ? req.body.redeemStatusCode : ''
        if (redeemID != '' && redeemStatusCode != '') {
            pool.getConnection(function (err, conn) {

                if (err) {
                    res.json({"status": 503, "message": "DB Connection Error"});
                }
                else {
                    var updateQuery = "UPDATE SS_RedeemLog SET RedeemStatus=? WHERE RedeemID= ?"

                    var query = conn.query(updateQuery, [redeemStatusCode, redeemID], function (err, result) {

                        if (err) {
                            res.json({"status": 200, "message": "Input InValid"});
                        }
                        else {
                            if (result != "") {
                                res.json({"status": 200, "message": "Success"});
                            }
                            else {
                                res.json({"status": 200, "message": "Result Not Found"});
                            }
                        }
                    });
                }
            })
        }
        else {
            res.json({"status": 400, "message": "Bad Request"});
        }


    });


//GiftVoucher For Printing APIs Verb GET
    app.get("/:mobile/GiftVoucherData", function (req, res) {
        var mobile = (req.params.mobile != undefined && req.params.mobile != null) ? req.params.mobile : '',
            result = {
                "Status": 200,
                "GiftVouchers": []
            };
        if (mobile != '') {
            pool.getConnection(function (err, conn) {
                if (err) {
                    console.log(err);
                }
                else {
                    var getQuery = "SELECT SS_CustomerProfiles.CustomerID,SS_CustomerProfiles.CustomerName,SS_RedeemLog.RedeemID,SS_RedeemLog.RedeemValue" + " FROM SS_CustomerProfiles " + "INNER JOIN SS_RedeemLog ON SS_RedeemLog.CustomerID = SS_CustomerProfiles.CustomerID " + "WHERE SS_RedeemLog.RedeemStatus = 1 AND SS_CustomerProfiles.MobileNo=" + mobile + ";";

                    var query = conn.query(getQuery, function (err, results) {
                        if (err) {
                            console.log(err);
                        }
                        else if (results.length != 0) {
                            for (var i = 0; i < results.length; i++) {
                                result.GiftVouchers.push({
                                    "CustomerID": results[i].CustomerID,
                                    "CustomerName": results[i].CustomerName,
                                    "RedeemID": results[i].RedeemID,
                                    "RedeemValue": results[i].RedeemValue
                                });
                            }
                            res.json(result);
                        }
                        else {
                            res.json({"Status": 400, "message": "Select Statement Failed/Zero results"});
                        }
                    });
                }
            });
        }
        else {
            res.json({"Status": 400, "message": "Bad Request"})
        }
    });


}


module.exports = appRouterForHO;