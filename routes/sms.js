var request = require("request");

var appsms = function(param1,param2)
{
	var phoneno = "91"+param1;
	var otpno = param2;
	
	console.log(phoneno);
	console.log(otpno);
	
	var otpcontent = otpno+" is your Super Saravana Store Verification Code. Code is valid for 15 minutes for a one time use."
		

//var smsurl = "http://login.bulksmsgateway.in/sendmessage.php?user=balachandhar&password=balane84&mobile="+phoneno+"&message="+otpcontent+"&sender=SSSAPP&type=3"

var smsurl = "https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=LUDBakMuek6cKzdaik08Kg&senderid=TESTIN&channel=2&DCS=0&flashsms=0&number="+phoneno+"&text="+otpcontent+"&route=1"

console.log(smsurl);
request({
uri:smsurl,
method:"GET",
timeout:10000,
followRedirect:false},
function(error,response,body){
console.log(body);
		
	});
		
		
		
	
	
}

module.exports = appsms;
