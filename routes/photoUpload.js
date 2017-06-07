var mysql = require('mysql');
var fs = require('fs-extra');
var fsdelete = require("fs");
var moment = require('moment');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({ uploadDir: './routes/'});

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

var appRouterImageUpload = function(app) {

    app.post('/customer/updateDeal', multipartMiddleware, function (req, res) {
        var fileName;
        try {
            var date = moment().format('YYYY-MM-DD H:mm:ss');
            var dealImageID = (req.params.DealImageID != undefined && req.params.DealImageID != null) ? req.params.DealImageID : '';
            var dealImageOrder = (req.params.DealImageOrder != undefined && req.params.DealImageOrder != null) ? req.params.DealImageOrder : '';
            //var dealImageName = (req.params.DealImageName != undefined && req.params.DealImageName != null) ? req.params.DealImageName : '';
            var createdBy = (req.params.CreatedBy != undefined && req.params.CreatedBy != null) ? req.params.CreatedBy : '';

            console.log("test path"+createdBy);


            var fileName;
            var dateval = moment().format('YYYYMMDDHHmmss');
            fileName = req.files.dealImage.path;
            var profilename = dealImageID+"_" + dateval;
            var strresult = imgProfileUrl(req.files.dealImage.path, profilename);
            console.log("test path"+strresult);
            var filebill = strresult.split("routes/");
            fileName = filebill[1];

            // }
            console.log(fileName);

            pool.getConnection(function (err, conn) {
                if (err) {
                    res.json({"status": "100", "message": "Error in connection database"});

                }
                else {


                        //var id = result[0].CustomerID;
                        // var fileselect = result[0].ProfileImages;
                        var updateQuery = "UPDATE ss_deals SET DealImageOrder='" + dealImageOrder + "',DealImageName='" + fileName + "',CreatedBy='" + createdBy + "' WHERE DealImageID=" + dealImageID + ";";
                        var query = conn.query(updateQuery, function (err, result) {
                            if (err) {
                                res.json({"status": "200", "message": "Input InValid"});
                            }
                            else {
                                if (result != "") {
                                    conn.release();
                                    res.json({"status": "200", "message": "success"});

                                }
                                else {
                                    res.json({"status": "201", "message": "Result Empty"});
                                }

                            }
                        });

                }
            });

        }


        catch (ex) {
            console.error("Internal error:" + "**ERROR!!! Error in Posting ** " + ex);
            //return next(ex);
        }
    });


    app.get('/customer/getDeals', function (req, res) {
        try {
            var result = [];
            pool.getConnection(function (err, conn) {
                if (err) {
                    console.log(err);
                    res.json({"code": 100, "status": "Error in connection database"});
                }
                else {
                    var selectSql = "Select * from ss_deals";
                    var query = conn.query(selectSql, function (err, rows) {

                        if (rows.length != 0) {

//console.log(rows);

                            for (var i = 0; i <rows.length; i++) {


                                result.push({
                                    "dealimageid":rows[i].DealImageID,
                                    "dealimageorder":rows[i].DealImageOrder,
                                    "dealimagename": "http://27.251.54.162/static/uploads/deals/"+rows[i].DealImageName,
                                });
                            }



                            res.json({"status": "200","message": "success","response":result});
                        }
                        else {
                            res.json({"Status": 400, "message": "Select Statement Failed/Zero results"});
                        }
                    });
                }
            });
        } catch (ex) {
            console.error("Internal error");
        }
    });










}

module.exports = appRouterImageUpload;


function imgProfileUrl(filePath,fileName)
{

    var dirname = './routes/uploads/deals/';

    fs.move(filePath,dirname+fileName+'.jpg',function(err)
    {

        if(err)
        {
            return
        }

    })

    var imageProfileUrl = dirname+fileName+'.jpg';
    return imageProfileUrl;


}