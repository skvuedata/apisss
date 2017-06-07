var mysql = require('mysql');
var speakeasy = require('speakeasy');
var moment = require('moment');
var fs = require('fs-extra');
var fsdelete = require("fs");
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart({ uploadDir: './routes/'});

// MYSQL SERVER
/**var pool = mysql.createPool({
  connectionLimit : 100,
    host: "test.cj5gze9solpl.ap-southeast-1.rds.amazonaws.com",
    user: "root",
    password: "root1234",
    database: "test",
    port:"3306",
	multipleStatements : 'Allow',
    debug: false
 });**/

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


 
 

var appRouter = function(app)
{
app.get("/",function(req,res){
res.send("Super Saravana Store");
});
	// API For OTP Generate
app.post("/generateOTP",function(req,res,next){
var date = moment().format('YYYY-MM-DD H:mm:ss'); // Creation Data 
var secret = speakeasy.generateSecret({length:20}); // Secret Key Generate
var token = speakeasy.totp({secret:secret.base32,encoding:'base32'}); // Token Generate
try{
	var reqObj = req.body;
	var mobileNo = (reqObj.mobileNo != undefined && reqObj.mobileNo != null) ?reqObj.mobileNo : '';
	var deviceID = (reqObj.deviceID != undefined && reqObj.deviceID != null) ?reqObj.deviceID : '';
	var otpActiveStatus = 0;
	var createdBy = (reqObj.createdBy != undefined && reqObj.createdBy != null) ?reqObj.createdBy : '';
	var handSetVersion = (reqObj.OSVersion != undefined && reqObj.OSVersion != null) ?reqObj.OSVersion : '';
	var brandName = (reqObj.brandName != undefined && reqObj.brandName != null) ?reqObj.brandName : '';
	var modelName = (reqObj.modelName != undefined && reqObj.modelName != null) ?reqObj.modelName : '';

	if(mobileNo!=''&&deviceID!=''&&otpActiveStatus!=''&&createdBy!=''&&handSetVersion!=''&&brandName!=''&&modelName!='')
	{
	pool.getConnection(function(err, conn){
		if(err)
		{
		  res.json({"status" : 100, "message" : "Error in DataBase connection"});
		}
		else
		{
			var checksqlquery = "SELECT CustomerID FROM ss_customerprofiles WHERE MobileNo = ?";
			var query = conn.query(checksqlquery,mobileNo,function(err,result)
			{
				if(err)
				{
					res.json({"status":"200","message":"Input Invalid"});
				}
				else
				{
				if(result!="")
					{
					   var customerID = result[0].CustomerID;
					   var updateSql = "UPDATE ss_customerprofiles SET ModelName= ?,BrandName= ?, OSVersion= ?,DeviceID= ?, OTPKey= ? ,CreatedTime= ?,CreatedBy= ?,OTPActiveStatus= ? WHERE CustomerID= ?"
                       var updatequery = conn.query(updateSql,[modelName,brandName,handSetVersion,deviceID,token,date,createdBy,otpActiveStatus,customerID],function(err,result){
                       if (err)
						   {
							 res.json({"status":"200","message":"Input Invalid"});
                           }
                           else
                           {
							   if (result!="") {


								   conn.release();
								   res.json({
									   "status": "200",
									   "message": "success",
									   "response": {
										   "customerID": customerID,
										   "mobileNo":mobileNo,
										   "OTP": token
									   }

								   });
								   var sms = require('./sms.js')(mobileNo, token);
							   }
							   else
							   {
								   res.json({"status" :"200","message":"Failed"});
							   }
                           }
                         });
					}
					else
					{
			var insertSql = "INSERT INTO ss_customerprofiles SET ?";
			var insertValues = {
			"MobileNo":mobileNo,
			"OTPKey":token,
			"DeviceID":deviceID,
			"OSVersion":handSetVersion,
			"BrandName":brandName,
			"ModelName":modelName,
			"CreatedTime":date,
			"CreatedBy":createdBy,
			"OTPActiveStatus":otpActiveStatus
		};
			var query = conn.query(insertSql,insertValues, function (err, result){
				if(err){
					res.json({"status":"200","message":"Input Invalid"});
				}
				else
				{
					if(result!="")
					{
				conn.release();
				var customerID = result.insertId;
						res.json(  {
							"status": "200",
							"message": "success",
							"response" : {
								"customerid": customerID,
								"phoneno": mobileNo,
								"otp": token }
						});
                var sms = require('./sms.js')(mobileNo,token);
					}
					else
					{
						res.json({"status" :"200","message":"Failed"});
					}
				}

			});
					}
				}
			});

		}
		});

	}
	else
	{
		res.json({"status":"400","message":"Bad Request"});
	}
	}
	catch(ex){
	console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);
	return next(ex);
	}

});
app.get("/verifyOTP",function(req,res) {
	try {
		var otp = (req.query.otp != undefined && req.query.otp != null) ? req.query.otp : '';

		if (otp != '') {
			pool.getConnection(function (err, conn) {
				if (err) {
					res.json({"status": "100", "message": "Error in connection database"});
				}
				else {
					var insertSql = "SELECT CustomerID,CreatedTime FROM ss_customerprofiles WHERE OTPKey=?";
					var query = conn.query(insertSql, otp, function (err, result) {

						if (err) {
							res.json({"status": "200", "message": "Input Invalid"});

						}
						else {

							if (result != "") {
								var id = result[0].CustomerID;
								var createatime = result[0].CreatedTime
								console.log(id);

								if (!id) {
									res.json({"status": "200", "message": "Input Invalid"});
								}
								else {
									var date = moment().format('YYYY-MM-DD H:mm:ss');
									var startDate = moment(createatime, 'YYYY-M-DD HH:mm:ss');
									var endDate = moment(date, 'YYYY-M-DD HH:mm:ss');
									var secondsDiff = endDate.diff(startDate, 'seconds');
									if (secondsDiff <= 900) {
										var updateSql = "UPDATE ss_customerprofiles SET OTPActiveStatus=? WHERE CustomerID=?"
										var updatequery = conn.query(updateSql, [1, id], function (err, result) {
											if (err) {
												res.json({"status": "200", "message": "Input Invalid"});
											}
											else {
												conn.release();
												res.json({"status": "200", "message": "success"});

											}
										});
									}
								}
							}
							else {
								res.json({"status":400,"message": "Invalid OTP"});

							}
						}

					});
				}
			});
		}

	else
	{
		res.json({"status":400,"message":"Bad Request"});
	}
}
	catch(ex){
	console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);

	}
});
app.post('/customer/profile', multipartMiddleware, function(req, res) {
  var fileName;
  if(!req.files.avatar)
  {
	  filename = "localname";

  }
  else
  {
	  filename = req.files.avatar.path;

  }

 try{
	var date = moment().format('YYYY-MM-DD H:mm:ss');
	var reqObj = req.body;
	var phoneProfile = (reqObj.mobileNo != undefined && reqObj.mobileNo != null) ? reqObj.mobileNo : '';
	 var nameProfile = (reqObj.name != undefined && reqObj.name != null) ? reqObj.name : '';var genderProfile = (reqObj.gender != undefined && reqObj.gender != null) ? reqObj.gender : '';
    var emailProfile = (reqObj.email != undefined && reqObj.email != null) ? reqObj.email : '';
    var	addressProfile = (reqObj.address != undefined && reqObj.address != null) ? reqObj.address : '';
	 var genderProfile = (reqObj.gender != undefined && reqObj.gender != null) ? reqObj.gender : '';
	var updateby = (reqObj.updateby != undefined && reqObj.updateby != null) ? reqObj.updateby : '';

	 if(phoneProfile!=''&&nameProfile!=''&&genderProfile!=''&&emailProfile!=''&&addressProfile!='')
	 {
	pool.getConnection(function(err, conn){
		if(err)
		{
			 res.json({"status" : "100", "message" : "Error in connection database"});

		}
		else
		{
			var checksqlquery = "SELECT * FROM ss_customerprofiles WHERE MobileNo="+phoneProfile;
			var queryChecking = conn.query(checksqlquery, function (err, result){
				if(err)
				{
					res.json({"status":"200","message":"Input Invalid"});
				}
				else
				{
					if(result!="")

                                          {
                    var id = result[0].CustomerID;
				   var fileselect = result[0].ProfileImage;
				   var file;
				   if(filename=="localname")
				   {

					   if(!fileselect)
					   {

						    file = "localname";
					   }
					   else
					   {

						    file = fileselect;
					   }
				   }
				   else
				   {
					   file = filename;
				   }

				    var updateSql = "UPDATE ss_customerprofiles SET CustomerName= ? ,Gender= ? ,EmailID= ? ,PostalAddress= ? ,ProfileImage= ? ,UpdateTime= ? ,UpdateBy= ? WHERE MobileNo= ?"
                       var updatequery = conn.query(updateSql,[nameProfile,genderProfile,emailProfile,addressProfile,file,date,updateby,phoneProfile],function(err,result){
                       if (err)
			   {
				   res.json({"status":"200","message":"Input Invalid"});
                           }
                           else
                           {
							   if(result!="")
							   {
								   conn.release();
								   res.json({
									   "status": "200",
									   "message": "success",
									   "response" : {
										   "name":nameProfile,
										   "gender":genderProfile,
										   "email":emailProfile,
										   "address":addressProfile,
										   "fileName":file}
								   });
							   }
							   else
							   {
								   res.json({"status":"200","message":"Result Empty"});
							   }

                           }
                         });
                     }
					 else
					 {
						 res.json({"status":"200","message":"Result Empty"});
					 }
				}
			});
		}
		});

	 }
	 else
	 {
		 res.json({"status":"400","message":"Bad Request"});
	 }
	}
	catch(ex){
	console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);
	//return next(ex);
	}
});


// Bill tag For Manually Valiation

app.post('/customer/manualbilltag', multipartMiddleware,function(req, res) {
	

  var filename;
  if(!req.files.billcopy)
  {
	  filename = "localname";
  }
  else
  {
	 filename = req.files.billcopy.path;

         var strresult = filename;
	var filebill = strresult.split("routes/uploads/");
        filename = filebill[1];


  }
  var date = moment().format('YYYY-MM-DD H:mm:ss');
	try {
		var reqObj = req.body;
		var billNo = (reqObj.billNo != undefined && reqObj.billNo != null) ? reqObj.billNo : '';
		var billTagged = (reqObj.billTagBy != undefined && reqObj.billTagBy != null) ? reqObj.billTagBy : '';
		var customerID = ( reqObj.customerID != undefined &&  reqObj.customerID != null) ?  reqObj.customerID : '';
		var storeLocation = (reqObj.storeLocation != undefined && reqObj.storeLocation != null) ? reqObj.storeLocation : '';
		var billDate =      (reqObj.billDate != undefined && reqObj.billDate != null) ? reqObj.billDate : '';

		if (billNo != '' && billTagged != '' && customerID != '') {
			pool.getConnection(function (err, conn) {
				if (err) {
					res.json({"code": "100", "status": "Error in connection database"});
				}
				else {


					var storeKey;
					if(storeLocation=="T.NAGAR")
					{
						storeKey = '10000000000000001';
					}
					else if(storeLocation=="PURASAWALKAM")
					{
						storeKey = '10000000000000002';
					}
					else
					{
						storeKey = '10000000000000003';
					}



					var billNoCheckQuery = "SELECT * FROM ss_customerbills WHERE BillNo=" + billNo;

					var txnValidationQuery = conn.query(billNoCheckQuery, function (err, result) {
						if (err) {

							res.json({"status": "400", "message": "Bad Request"});
						}
						else {

							if (result != "") {
								res.json({"status": "200", "message": "Already Exists"});
							}
							else {
								var insertSql = "INSERT INTO ss_customerbills SET ?";
								var insertValues = {
									"CustomerID":customerID,
									"BillNo": billNo,
									"BillTaggedBy": billTagged,
									"BillTagDate": billDate,
									"StoreLocation":storeKey,
									"ProfileImages": filename,
									"BillStatus": "1"
								};
								var query = conn.query(insertSql, insertValues, function (err, result) {
									if (err) {
										console.error('SQL error: ', err);
									}
									else {
										if (result != "") {
											conn.release();
											res.json({"status": "200", "message": "success"});
										}
										else {

											res.json({"status": "200", "message": "Result Empty"});
										}

									}
								});
							}
						}
					});
				}
			});

		}
		else {
			res.json({"status": "400", "message": "Bad Request"});
		}
	}
	catch(ex)
	{
		console.log(ex);
	}
});

// Bill tag With QRCode Validation

app.post('/customer/autobilltags',multipartMiddleware,function(req, res) {
  var filename
  var date = moment().format('YYYY-MM-DD H:mm:ss');
	try{
		var reqObj = req.body;
		var transactionKey = reqObj.transactionKey;
		var billTagBy = reqObj.billTagBy;
		var customerID =reqObj.customerID;
		if(transactionKey!=''&&billTagBy!=''&&customerID!='')
		{
		pool.getConnection(function(err, conn){
		if(err)
		{
		res.json({"status" : "100", "status" : "Error in connection database"});
		}
		else
		{
			 var txnNoCheckQuery = "SELECT * FROM ss_customerbills WHERE TransactionKey = ?";
		
			var txnValidationQuery = conn.query(txnNoCheckQuery,transactionKey,function(err, result){
				if(err)
				{
					res.json({"status":"400","message":"Invalid Value"});
				}
				else
				{  	
			if(result!="")
			{
				res.json({"status":"200","message":"Already Exists"});
			}
			else
			{
				//Insert Values
		    var insertSql = "INSERT INTO ss_customerbills SET ?"; 
			var insertValues = {
			"CustomerID":customerID,
			"TransactionKey":transactionKey,
			"BillTagDate":date,
			"BillTaggedBy":billTagBy,
			"BillStatus":"1"
		        };	
            var query = conn.query(insertSql, insertValues, function (err, result){
				if(err){
				console.error('SQL error: ', err);
				}
				else
				{
					if(result!="")
					{
				conn.release();
				res.json({"status":"200","message":"success"});
					}
					else
					{

						res.json({"status":"200","message":"Result Empty"});
					}
				}		
				
		});				
					
			}
						
				}
			});
		   
		
		
		}
		});
		}
		else
		{
			res.json({"status": "400", "message": "Bad Request"});
		}
	}
	catch(ex)
	{
		console.log(ex);
	}
});

//Bill Details Show
app.get("/:customerID/billtaggedlist",function(req,res){

	try
	{
var result = [];
var customerID = req.query.customerID;

		if (customerID!='')
		{
pool.getConnection(function(err, conn){
		if(err)
		{
			 res.json({"status" : "100", "message" : "Error in connection database"});
		}
		else
		{
			var insertSql = "select * from ss_customerbills where CustomerID="+customerID;
			var query = conn.query(insertSql, function (err, rows){

				if(err)
				{
				res.json({"status" : 201,"message":"Invalid Value"});

				}
				else
				{

 if(rows!="")
  {
	  conn.release();
for (var i = 0; i <rows.length; i++) {
	

                result.push({
                    "transactionKey":rows[i].TransactionKey,
                    "billNo": rows[i].BillNo,
                    "billStatus": rows[i].BillStatus,
                    "amount":rows[i].BillAmount,
                    "location": rows[i].location,
                    "billCopy": "http://27.251.54.162/static/"+rows[i].ProfileImages,
                });
            }
			
			res.json({"status": "200","message": "success","response":result.reverse()});
  }
  else
  {
	  res.json({"status":"200","message":"Result Empty"});

  }
                 }
				
			});
		}
		});


		}
		else
		{
			res.json({"status": "400", "message": "Bad Request"});
		}

	}
	catch(ex){
	console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);

	}


});
//ProfileDetaills
app.get("/profiledetails",function(req,res){

 try
 {

var phoneNo = req.query.customerID;
	 if(phoneNo!='')
	 {
pool.getConnection(function(err, conn){
  if(err)
  {
    res.json({"status" : "100", "message" : "Error in connection database"});
          return;
  }
  else
  {
   var insertSql = "SELECT * FROM ss_customerprofiles WHERE CustomerID=?";
   var query = conn.query(insertSql,phonenos, function (err, rows){

    if(err)
    {
    res.json({"status" : "201","message":"Invalid Value"});

    }
    else
    {

 if(rows!="")
  {
        
        conn.release();
        var id =rows[0].CustomerID,
			name=rows[0].CustomerName,
			gender=rows[0].gender,
			filename=rows[0].ProfileImages,
			address=rows[0].address,
			email=rows[0].email;
        res.json({
			"status": "200",
			"message": "success",
			"response" : {
				"customerID": id,
				"name":name,
				"gender":gender,
				"address":address,
				"profileImage":filename}});
		
  }
  else
  {
   res.json({"status" : 201,"message":"Result Empty"});

  }
                 }
   });
  }
  });
	 }
	 else
	 {
		 res.json({"status": "400", "message": "Bad Request"});
	 }
 }
 catch(ex){
 console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);
 }
});

	app.post('/customer/filecheck',multipartMiddleware,function (req,res) {

		var dateval  = moment().format('YYYYMMDDHHmmss');

		var date = moment().format('YYYYMMDD');
		var filename = req.files.billcopy.path;
		var tmpname = req.files.billcopy.name;
		var location = req.body.locName;
		tmpname = tmpname + dateval;
		console.log(dateval);

var imgUploaded = imgURLValue(filename,tmpname,location);
		console.log("NameURl"+imgUploaded);


	});

	function imgURLValue(filePath,fileName,location) {
		var date = moment().format('YYYYMMDD');
		var basePath ;
		if (location=="T.Nagar")
		{
			basePath = './routes/uploads/tnagar/';
		}
		else if (location=="Purasulvagam")
		{
			basePath = './routes/uploads/purasawalkam/';
		}
		else
		{
			basePath = './routes/uploads/chrompet/';
		}
		var dirname = basePath+date+'/';
		console.log(dirname);
		if (!fsdelete.existsSync(dirname)){
			fsdelete.mkdirSync(dirname);
			fs.move(filePath, dirname+fileName+'.jpg', function (err) {
				if (err) return console.error(err)
				console.log("success!")
			})
		}
		else
		{
			fs.move(filePath, dirname+fileName+'.jpg', function (err) {
				if (err) return console.error(err)
				console.log("success!")
			})
		}

		var imageurl = dirname+fileName+'.jpg';
		return imageurl;
	}


}
module.exports = appRouter;







