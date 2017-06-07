/**
 * Created by VueData on 26-May-17.
 */

//Module For GiftVoucher Printing API :-)


var giftVoucher = function (app) {
    //After Printing Status Update
    app.post("/:redeemID/RedeemStatusUpdate",function (req,res) {
        var redeemID = (req.params.redeemID !=undefined && req.params.redeemID != null) ? req.params.redeemID : ''
        if(redeemID != '')
        {
            pool.getConnection(function (err,conn) {

                if(err)
                {
            res.json({"status":503,"message":"DB Connection Error"});
                }
                else
                {
                    var updateQuery = "UPDATE SS_RedeemLog SET RedeemStatus=2 WHERE RedeemID= ?"

                    var query = conn.query(updateQuery,function (err,result){

if(err)
{
    res.json({"status":200,"message":"Input InValid"});
}
else
{
    if(result!="")
    {
        res.json({"status":200,"message":"Success"});
    }
    else
    {
        res.json({"status":200,"message":"Result Not Found"});
    }
}
                    });
                }
            })
        }
else
        {
            res.json({"status":400,"message":"Bad Request"});
        }


    });



    //GiftVoucher For Printing APIs Verb GET
    app.get("/:mobile/GiftVoucherData",function (req,res) {
        var mobile = (req.params.mobile != undefined && req.params.mobile != null) ? req.params.mobile : '',
            result = {
                "Status":200,
                "GiftVouchers":[]
            };
        if(mobile != ''){
            pool.getConnection(function(err,conn){
                if(err){
                    console.log(err);
                }
                else {
                    var getQuery = "SELECT SS_CustomerProfiles.CustomerID,SS_CustomerProfiles.CustomerName,SS_RedeemLog.RedeemID,SS_RedeemLog.RedeemValue" + " FROM SS_CustomerProfiles " + "INNER JOIN SS_RedeemLog ON SS_RedeemLog.CustomerID = SS_CustomerProfiles.CustomerID " + "WHERE SS_RedeemLog.RedeemStatus = 1 AND SS_CustomerProfiles.MobileNo=" + mobile + ";";

                    var query = conn.query(getQuery, function (err, results) {
                        if(err){
                            console.log(err);
                        }
                        else if(results.length != 0){
                            for (var i=0;i<results.length;i++){
                                result.GiftVouchers.push({
                                    "CustomerID":results[i].CustomerID,
                                    "CustomerName":results[i].CustomerName ,
                                    "RedeemID":results[i].RedeemID,
                                    "RedeemValue":results[i].RedeemValue
                                });
                            }
                            res.json(result);
                        }
                        else{
                            res.json({"Status":400,"message":"Select Statement Failed/Zero results"});
                        }
                    });
                }
            });
        }
        else {
            res.json({"Status":400,"message":"Bad Request"})
        }
    });


}

module.exports = giftVoucher;




