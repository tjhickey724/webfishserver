/**
The user model stores all information about the user 
and it goes to the server to get the info if it is not available locally
**/

var userModel = (function() {
	var userProfile = null;
	var fullProfile = null;
	var mode = "visual";
	var level = "0";
	var visualStats=null;
	var auditoryStats=null;

	function getUserInfo() {
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
	
	function getUserLevel(){
		$.ajax({
			type: "GET",
			url: "/api/user/level",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(level) {
			//console.log("upload complete"+JSON.stringify(userInfo));
			level=level;
			//console.log("just got user info!!");
		});		
	}
	
	function loadFullProfile(){
		$.ajax({
			type: "GET",
			url: "/model/user",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(userInfo) {
			//console.log("upload complete"+JSON.stringify(userInfo));
			fullProfile = userInfo
			//console.log("just got user info!!");
		});		
		
	}
	
	function loadGameStats(){
		$.ajax({
			type: "GET",
			url: "/mybeststats/visual",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(userInfo) {
			//console.log("upload complete"+JSON.stringify(userInfo));
			visualStats = userInfo
			//console.log("just got user info!!");
		});		
		
		$.ajax({
			type: "GET",
			url: "/mybeststats/auditory",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(userInfo) {
			//console.log("upload complete"+JSON.stringify(userInfo));
			auditoryStats = userInfo
			//console.log("just got user info!!");
		});	
	}
	
	
	// sets the local mode to be visual or auditory
	function setmode(newMode) {
		mode = newMode;
	}
	
	// sets the new level (e.g. from beating an old level)
	function setlevel(newLevel) {
		level = newLevel;
	};
	
	function updateUserModel(){
		fullProfile.level = level;
		fullProfile.mode = mode;
		$.ajax({
			type: "PUT",
			url: "/model/user",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(fullProfile)
		}).done(function(userInfo) {
			//console.log("upload complete"+JSON.stringify(userInfo));
			console.log("updated User Model: "+userInfo);
			//console.log("just got user info!!");
		});		
	}
	
	//console.log("getting user info");
	getUserInfo();
	loadFullProfile();



	return {
		getUserID: function() {
			return userProfile.id;
		},
		getUserName: function() {
			return userProfile == null ? "" : userProfile.displayName;
		},
		getUserProfile: function(){ 
			return userProfile
		},

		getFullProfile: function(){ 
			return fullProfile
		},
		loadFullProfile: loadFullProfile,
		updateUserModel: updateUserModel,
		getUserInfo: getUserInfo,
		loadGameStats: loadGameStats,
		getGameStats: function(){ return {visual:visualStats, auditory:auditoryStats};}
	}
}())
