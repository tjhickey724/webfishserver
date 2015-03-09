/**
The user model stores all information about the user 
and it goes to the server to get the info if it is not available locally
**/
console.log("load userModel");
var userModel = (function() {
	var userProfile = null;
	var visualStats=null;
	var auditoryStats=null;
	var leaders = {visual:[], auditory:[]};
	var userState = {mode:"visual",level:"level",consentStatus:"no",nickname:"anon", age: -1};
	
	function printInfo(){
		console.log("userState is '"+JSON.stringify(userState)+",");
	}
	
	function getUserState(){
		$.ajax({
			type: "GET",
			url: "/api/userState",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(newUserState) {
			userState = newUserState;
			console.log("just got user info!!"+JSON.stringify(userState));
			gameControl.checkConsent();
		});
	}
	
	function updateUserState(){
		console.log("updating User State to "+JSON.stringify(userState));
		$.ajax({
			type: "PUT",
			url: "/api/userState",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			data: JSON.stringify(userState)
		}).done(function(userInfo) {
			console.log("updated UserState: "+userInfo);
		});		
	}

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
			//gameControl.checkConsent();
			//console.log("just got user info!!");
		});

	}
	
	function setNewUserNum(){
		console.log("calling setNewUsernum");
		$.ajax({
			type: "GET",
			url: "/newUserNum",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(userInfo) {
			console.log("userInfo="+JSON.stringify(userInfo));
			userState.nickname = userState.nickname+"-"+userInfo;
			console.log("nickname="+userState.nickname);
			
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
		
		for(var level=0; level<=10; level++){
			console.log("level = "+level);
			for(var mode in leaders){
				console.log("trying level "+level+" and mode "+mode);
				console.log("with the url = '"+"/leaderboard/"+mode+"/"+level+"'");
				$.ajax({
					type: "GET",
					url: "/leaderboard/"+mode+"/"+level, 
					contentType: "application/json; charset=utf-8",
					dataType: "json"
				}).done(function(leaderInfo) {
					//console.log("download complete"+JSON.stringify(leaderInfo));
					leaders[leaderInfo.mode][leaderInfo.level]=leaderInfo.leaders;
					//console.log("leader info for level" +level+" and mode "+mode+" is "+ JSON.stringify(leaderInfo));
					//console.log("leaders = "+leaderInfo.mode+" "+leaderInfo.level+" "+JSON.stringify(leaders));
					//console.log("just got user info!!");
				});	
			}
		}
	}
	
	
	//console.log("getting user info");
	//getUserInfo();
	//getUserState();
	loadGameStats();



	return {
		getUserID: function() {
			return userProfile.id;
		},
		getUserName: function() {
			return userState.nickname;
		},
		getUserProfile: function(){ 
			return userProfile
		},

		getUserInfo: getUserInfo,
		getUserState: getUserState,
		loadGameStats: loadGameStats,
		
		getGameStats: function(){ return {visual:visualStats, auditory:auditoryStats, leaders:leaders};},
		
		getLevel: function() { return userState.level;},
		getMode: function() { return userState.mode;},
		getAge: function() { return userState.age;},
		getConsent: function() { return userState.consent;},
		getNickname: function() {return userState.nickname;},
		setLevel: function(x) { userState.level = x; $("#level").html(x); updateUserState();},
		setMode: function(x) { userState.mode = x;$("#gameMode").html(x); gameView.updateInstr(userState.mode); updateUserState();},
		setAge: function(x) { userState.age = x;updateUserState();},
		setConsent: function(x) { userState.consent = x;updateUserState();},
		setNickname: function(x) {userState.nickname = x; setNewUserNum();updateUserState();},
		printInfo: printInfo
		
		
	}
}())

console.log("user model loaded");
