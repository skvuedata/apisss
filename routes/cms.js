var mysql = require('mysql');
var sql = require("mssql");
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

//MSSQL SERVER CONFIG
var config = {
    server:"192.168.0.22",
    database:"Test_HO",
    user:"sa",
    password:"Welcome123",
    port:1433,

};

var appRouterForCMS = function(app)
{
    app.get("/rules/:id",function (req,res) {

        var id = (req.params.id != undefined && req.params.id != null) ? req.params.id : '',
            result = {
                "httpCode":200,
                "message":"Rules Listed Successfully",
                "RuleID":"",
                "RuleName":"",
                "RuleDescription":"",
                "RuleStartDate":"",
                "RuleEndDate":"",
                "RuleStatus":"",
                "Level":"",
                "Rules":[]
            },
            selectQuery = "SELECT * FROM SS_RulesLog WHERE RuleID = "+id+";SELECT * FROM SS_RulesDescription WHERE RuleID = "+id+";";
        if(id != ''){
            pool.getConnection(function(err, conn){
                if(err){
                    res.json({
                        "status": 201,
                        "message": "Error Database Connection"
                    });
                }
                else{
                    conn.query(selectQuery, function(err, rows1){
                        if(err){
                            res.json({
                                "status": 201,
                                "message": "Query Access Denied"
                            });
                        }
                        else if(rows1.length ==2 && rows1[0].length == 1 && rows1[1].length >= 0 && rows1[0] != undefined && rows1[1] != undefined){
                            var i = 0;
                            result.RuleID = rows1[0][0].RuleID;
                            result.RuleName = rows1[0][0].RuleName;
                            result.RuleDescription = rows1[0][0].RuleDescription;
                            result.RuleStartDate = rows1[0][0].RuleStartDate;
                            result.RuleEndDate = rows1[0][0].RuleEndDate;
                            result.RuleStatus = rows1[0][0].RuleStatus;
                            result.Level = rows1[0][0].Level;
                            for (i=0;i<rows1[1].length;i++){
                                result.Rules.push({
                                    "RuleDescID":rows1[1][i].RuleDescID,
                                    "RuleID":rows1[1][i].RuleID,
                                    "GroupID":rows1[1][i].GroupID,
                                    "MinBillOrItemAmount":rows1[1][i].MinBillOrItemAmount,
                                    "MaxBillOrItemAmount":rows1[1][i].MaxBillOrItemAmount,
                                    "RewardValue":rows1[1][i].RewardValue,
                                    "ComputeType":rows1[1][i].ComputeType

                                });
                            }
                            res.json(result);
                        }
                        else if(rows1[0].length == 0){
                            res.json({
                                "status":202,
                                "message":"No data found"
                            });
                        }
                        else{
                            res.json({
                                "status":205,
                                "message":"Select Statement Failed"
                            });
                        }
                    });
                }
            });
        }
        else{
            res.json({
                "status":400,
                "message":"Bad Request"
            });
        }
    });

    app.post("/rules",function (req,res) {

        141

        var RuleName = req.body.RuleName != undefined ? req.body.RuleName : '',
            RuleDescription = req.body.RuleDescription != undefined ? req.body.RuleDescription : '',
            RuleStartDate = req.body.RuleStartDate != undefined ? req.body.RuleStartDate : '',
            RuleEndDate = req.body.RuleEndDate != undefined ? req.body.RuleEndDate : '',
            RuleStatus = req.body.RuleStatus != undefined ? req.body.RuleStatus : '',
            Level = req.body.Level != undefined ? req.body.Level : '',
            selectQuery = "SELECT RuleID FROM SS_RulesLog WHERE RuleName = '"+RuleName+"';",
            insertUpdate = "";
        if(RuleName != '' && RuleStartDate != '' && RuleEndDate != '' && RuleStatus != '' && Level != ''){
            pool.getConnection(function(err,conn){
                if(err){
                    res.json({
                        "status": 201,
                        "message": "Error Database Connection"
                    });
                }
                else{
                    conn.query(selectQuery, function(err, rows){
                        if(err){
                            res.json({
                                "status": 201,
                                "message": "Query Access Denied"
                            });
                        }
                        else if(rows.length == 0 || rows.length == 1){
                            var i = 0;
                            if(rows.length == 0 ){
                                //insert
                                insertUpdate = "INSERT INTO SS_RulesLog (RuleName,RuleDescription,RuleStartDate,RuleEndDate,RuleStatus,Level,CreatedBy,CreatedDate,UpdatedBy,UpdatedDate) VALUES ('"+RuleName+"','"+RuleDescription+"','"+RuleStartDate+"','"+RuleEndDate+"',"+RuleStatus+","+Level+",'Admin',CURRENT_TIMESTAMP,'Admin',CURRENT_TIMESTAMP);";

                                var countVal;
                                if(req.body.Rules.length!="")
                                {
                                    countVal = req.body.Rules.length;
                                }
                                else
                                {
                                    res.json({"status": 201,"message": "Rules Array Empty"});
                                }

                                for(i=0;i<countVal;i++){
                                    insertUpdate+="INSERT INTO SS_RulesDescription (RuleID,GroupID,MinBillOrItemAmount,MaxBillOrItemAmount,RewardValue,ComputeType,CreatedBy,CreatedDate,UpdatedBy,UpdatedDate) VALUES ((SELECT RuleID FROM SS_RulesLog WHERE RuleName='"+RuleName+"'),"+req.body.Rules[i].GroupID+","+req.body.Rules[i].MinBillOrItemAmount+","+req.body.Rules[i].MaxBillOrItemAmount+","+req.body.Rules[i].RewardValue+",'"+req.body.Rules[i].ComputeType+"','Admin',CURRENT_TIMESTAMP,'Admin',CURRENT_TIMESTAMP);";
                                }
                            }
                            else if(rows.length == 1){
                                //update
                                insertUpdate = "UPDATE SS_RulesLog SET RuleDescription = '"+RuleDescription+"',RuleStartDate='"+RuleStartDate+"',Level="+Level+",RuleEndDate='"+RuleEndDate+"',RuleStatus="+RuleStatus+",UpdatedDate=CURRENT_TIMESTAMP;DELETE FROM SS_RulesDescription WHERE RuleID =(SELECT RuleID FROM SS_RulesLog WHERE RuleName='"+RuleName+"');";
                                var countVal;
                                if(req.body.Rules.length!="")
                                {
                                    countVal = req.body.Rules.length;
                                }
                                else
                                {
                                    res.json({"status": 201,"message": "Rules Array Empty"});
                                }
                                for(i=0;i<countVal;i++){
                                    insertUpdate+="INSERT INTO SS_RulesDescription (RuleID,GroupID,MinBillOrItemAmount,MaxBillOrItemAmount,RewardValue,ComputeType,CreatedBy,CreatedDate,UpdatedBy,UpdatedDate) VALUES ((SELECT RuleID FROM SS_RulesLog WHERE RuleName='"+RuleName+"'),"+req.body.Rules[i].GroupID+","+req.body.Rules[i].MinBillOrItemAmount+","+req.body.Rules[i].MaxBillOrItemAmount+","+req.body.Rules[i].RewardValue+",'"+req.body.Rules[i].ComputeType+"','Admin',CURRENT_TIMESTAMP,'Admin',CURRENT_TIMESTAMP);";
                                }
                            }
                            conn.query(insertUpdate, function(err, rows1){
                                if(err){
                                    console.log(insertUpdate);
                                    res.json({
                                        "status": 201,
                                        "message": "Query Access Denied"
                                    });
                                }
                                else if(rows1 != undefined || rows1[0].affectedRows != 0){  //checkLater and Correct it
                                    res.json({
                                        "httpCode":200,
                                        "message":"Insert/Update Success"
                                    })
                                }
                                else{
                                    res.json({
                                        "status":400,
                                        "message":"something went wrong"
                                    })
                                }

                            });
                        }
                        else{
                            res.json({
                                "status":400,
                                "message":"something went wrong"
                            })
                        }
                    });
                }
            });
        }
        else{
            res.json({
                "status":400,
                "message":"Bad Request"
            });
        }
    });

    app.get("/Rules",function(req,res){



        try{
            pool.getConnection(function (err,conn) {
                if(err){
                    console.log(err);
                    res.json({"code": 100, "status": "Error in connecting database"});
                }
                else{
                    var getSql="SELECT RuleID, RuleName,RuleDescription, RuleStartDate, RuleEndDate,RuleStatus,Level FROM SS_RulesLog WHERE RuleStatus=1 Order by CreatedBy DESC";
                    var getQuery=conn.query(getSql,function (err,list) {
                        if(err){
                            console.log(err);
                            res.json({"code": 100, "status": "Query Access Denied"});
                        }
                        else if(list.length!=0){
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({"response": list}));
                        }
                        else{
                            res.json({"code": 201, "status": "Error Selecting Rules"});
                        }

                    });

                }

            })
        }
        catch(ex){
            throw new ex("UnExpected Error");
        }
    });
    app.get("/ProductGroups",function(req,res){




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
                    var selectQuery = "Select ProductGroupKey 'GrpKey', [Description] 'GrpDesc' from  InvProductGroup where isDeleted=0 and LEN([Description])>1"
                    request.query(selectQuery, function (err, results)
                    {
                        if(err)
                        {
                            // console.log("selectQuery" + err);
                            res.json({"status" : 201,"message":err});
                        }
                        else
                        {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({"status":200,"response": results.recordset}));
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

module.exports = appRouterForCMS;
