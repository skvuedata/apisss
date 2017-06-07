var FCM = require('fcm-push');

var appRouterPushNotification =  function(app)
{

    app.get('/push',function (res,req) {

        try {
            var serverkey = 'AAAAMB0qqhE:APA91bF9UT_OraRTm9O7feImpYL2oV23N6niHnlCuwPjfsE_lSgtyAth3esRTDRTcUw0EnBKBoGGFrS4h2UwB-7VCYP35HYlcml7n5XYivnmuhLd56gpC_6NUnnCBh0yH3rrpr_LlmLu';
            var fcm = new FCM(serverkey);
            var message = {
                to: 'cJZs6-6YGeg:APA91bEdCjWCLOztYQ06VQDT3XjHsWJfygG5t_VQJcvgrLKSUtZNSSShetWxwpUBX-ZJmLkd7wdqTDZqG-1uSeIBOTzKzJFXuRyGdwY9onGFIHZVyL-45R72fXYmVagJSn691KB6JfMV', // required fill with device token or topics
                notification: {
                    title: 'Title of your push notification',
                    body: 'Body of your push notification'
                }
            };


            fcm.send(message, function(err,response){
                console.log(message);
                if(err) {
                    console.log("Something has gone wrong !");
                } else {
                    console.log("Successfully sent with resposne :",response);
                }
            });
        }
        catch (ex)
        {
            console.error("Internal error:" + "**ERROR!!! Error in Posting ** " +ex);
        }
        
    });
}
module.exports = appRouterPushNotification;