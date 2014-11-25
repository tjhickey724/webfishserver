/**
The user model stores all information about the user 
and it goes to the server to get the info if it is not available locally
**/

var userModel = (function(){
    var userProfile = null;
    
    function getUserInfo(){
        //console.log("calling getUserInfo");
        $.ajax({
               type: "GET",
               url: "/api/user",
               contentType: "application/json; charset=utf-8",
               dataType: "json"
           }).done(function(userInfo) {
               //console.log("upload complete"+JSON.stringify(userInfo));
               userProfile = userInfo.profile;
               //console.log("just got user info!!");
           });

    }
    //console.log("getting user info");
    getUserInfo();

    
    
    return {
        getUserID: function(){return userProfile.id;}, 
        getUserName: function(){return userProfile==null?"": userProfile.displayName;},
        getUserInfo: getUserInfo
    }
}())
