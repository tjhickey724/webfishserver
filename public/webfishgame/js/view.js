/**
the gameView object is responsible for updating the user's view,
both in gameview mode and when visiting other pages...
We might want to separate this out later into multiple objects,
especially if we have multiple games!!  
Ideally the games will be relatively independent of each other
and we shouldn't use a SinglePageApp model for the games...
**/

var gameView = (function() {
	debugPrint("creating gameView");


	var canvas = document.getElementById('canvas'),
		cw = canvas.width,
		ch = canvas.height,
		cx = null;

	// Here we load up the background images to be used in the game!
	var imgStream = new Image();
	imgStream.src = 'images/stream.jpg';

	var imgSpace = new Image();
	imgSpace.src = 'images/o-HUBBLE-UV-900.jpg';

	var img1 = imgStream;

	// next the "Fish" images
	var imgFishL = new Image();
	imgFishL.src = 'images/fish/fishL.png';

	var imgFishR = new Image();
	imgFishR.src = 'images/fish/fishR.png';

	var imgSpaceshipL = new Image();
	imgSpaceshipL.src = 'images/spaceship/SpaceShipNormalL.png';

	var imgSpaceshipR = new Image();
	imgSpaceshipR.src = 'images/spaceship/SpaceShipNormalR.png'

	var imgTargetL = imgFishL;
	var imgTargetR = imgFishR;

	// Here we load up the sounds to be used ..

	var audioFastFish = new Audio('sounds/8hz/fish.wav'); //document.getElementById('fastFish');
	audioFastFish.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	}, false);
	//audioFastFish.loop = true;
	//audioFastFish.play();

	var fishSound = audioFastFish;


	var audioGood = new Audio('sounds/good.wav');
	var audioBad = new Audio('sounds/bad.wav');


	var soundFast = new Audio('sounds/8hz/fish.wav');
	var soundSlow = new Audio('sounds/5hz/fish.wav');
	var soundVerySlow = new Audio('sounds/3hz/fish.wav');
	var soundOddball = new Audio('sounds/5hzHigh/fish.wav');

	function setSkin(skin) {
		if (skin == "fish") {
			imgTargetL = imgFishL;
			imgTargetR = imgFishR;
			img1 = imgStream;
		} else if (skin == "space") {
			imgTargetL = imgSpaceshipL;
			imgTargetR = imgSpaceshipR;
			img1 = imgSpace;
		}
	}


	function playGood() {
		audioGood.play();
	}

	function playBad() {
		audioBad.play();
	}

	function playFishAudio() {
		//fishSound = (gameModel.getFishAudio() == 'fast') ? soundFast : soundSlow;
		if (gameModel.getFishAudio() == 'fast') {
			fishSound = soundFast;
		} else if (gameModel.getFishAudio() == 'slow'){
			if (userModel.getLevel()==0){
				fishSound = soundVerySlow;
			} else {
				fishSound = soundSlow;
			}
		}

		//if (gameModel.getFishVisual() == 'none'){
		//    fishSound = soundOddball; 
		//} 

		if (gameModel.getFishAudio() != 'none')
			fishSound.play();
	}

	function stopFishAudio() {
		fishSound.pause();
		fishSound.currentTime = 0;
	}


	function drawLevels(){
		$("#game_data_l").html("Mode: "+ userModel.getMode()+"   Level: "+userModel.getLevel());
	}


	function update(now) {


		drawBackground2(img1); // draw the background flowing by in a seamless way...
		drawLevels();
		debugPrint(gameModel.getFishVisible());
		//var hz = (gameModel.getFishVisual() == 'fast') ? 8 : 5;
		var hz;
		if (gameModel.getFishVisual()=='fast') {
			hz=8;
		}else if (userModel.getLevel() ==0) {
			hz=3;
		} else {
			hz=5;
		}
	

		drawStats();
		if (gameModel.getFishVisual() == 'none') {
			return;
		}
		if (gameModel.getFishVisible()) {
			drawFish([imgTargetL, imgTargetR], hz);
		}


	}

	function drawStats() {
		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var cw = canvas.width;
		var ch = canvas.height;
		ctx.font = "40pt monospace"
		ctx.fillStyle = '#FFAA33';
		var status = gameModel.getStatus();
		if (status.countdown < 0) return;
		var correctness = Math.round(100 * status.correct / (status.correct + status.incorrect + status.missed));
		//ctx.fillText("" + correctness + "%", cw / 2 - 30, ch / 2);
		//ctx.fillText("" + Math.round(status.lastReactionTime) + " ms", cw / 2 - 30, ch / 2 + 20);
		ctx.fillText("T - " + Math.round(status.countdown), cw / 2 - 30, ch / 2 + 40);
		//ctx.fillText(" " + gameLoop.getLastStepTime() + "ms " + Math.round(1000 / gameLoop.getLastStepTime()) + "fps", cw / 2 - 10, ch - 20);
	}



	function drawFish(img, hz) {
		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var cw = canvas.width;
		var ch = canvas.height;
		var fishPos = gameModel.getFishPos();
		var fishImage = (gameModel.getFishSide() == 'left') ? img[0] : img[1];
		var w = cw * gameModel.getFishSizePercent() / 100;
		var h = w * fishImage.height / fishImage.width;
		var sec = ((new Date()).getTime() % 1000) / 1000.0;
		var scale = 1 + (1 - Math.cos(Math.PI * 2 * hz * sec)) / 2 * 1.0;

		var hscale = (gameModel.getFishSide() == 'left') ? 1 : -1;

		var x = fishPos[0] * cw / 100 - w / 2;
		var y = fishPos[1] * ch / 100 - h / 2 * scale;
		ctx.drawImage(fishImage, x, y, w, h * scale);

		//debugPrint("in drawFish:"+JSON.stringify([fishImage==imgFishL, fishImage==imgFishR,fishPos]));
		/*
    ctx.save();
    ctx.translate((fishPos[0])*cw/100,(fishPos[1])*ch/100);
    ctx.scale(hscale,scale);
    ctx.drawImage(img,-w/2,-h/2,w,h);
    ctx.restore();
  */

		//ctx.drawImage(img,(fishPos[0])*cw/100-w/2,(fishPos[1])*ch/100-h/2,w,h);
	}

	/*
to draw a vertically flipped image whose upper-left corner is at position (x,y) and whose dimensions are (w,h) and offset is (x',y')
on a canvas of dimension (W,H)
one can flip the canvas vertically, then translate y'+h from the bottom and draw the image ...
*/

	/* this version tries to use CSS but it needs the image to be handled by CSS too */

	function drawBackground1(img) {
		var canvas = document.getElementById('canvas');
		var yValue = gameModel.getImageOffset() * 5;
		document.getElementById('canvas').style.backgroundPosition = '0px ' + yValue + 'px';

	}

	/* this image draws the background using the canvas API */

	function drawBackground2(img) {
		var canvas = document.getElementById('canvas');
		var ctx = canvas.getContext('2d');
		var cw = canvas.width;
		var ch = canvas.height;
		var yoff = gameModel.getImageOffset();

		drawFlippedImage(img, 0, yoff * ch / 100, cw, ch);
		if (yoff > 100)
			yoff -= 200;
		ctx.drawImage(img, 0, yoff * ch / 100, cw, ch);

	}

	function drawFlippedImage(img, xoff, yoff, w, h) {
		var ctx = document.getElementById('canvas').getContext('2d');

		ctx.save();
		ctx.scale(1, -1);
		ctx.drawImage(img, 0, -yoff, w, h);
		ctx.restore();
		//console.log(document.getElementById('canvas'));
	}

	function showLevels() {
		var gameStats = userModel.getGameStats();
		var levels;
		var rows;
		levels = gameStats.visual || [undefined, undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined ];
		rows = "";
		for (var x = 0; x <= 10; x++) {
			//console.log(JSON.stringify(levels[x]));
			var y = levels[x];
			var leaders = gameStats.leaders.visual[x] || [];
			var leader = {
				accuracy: 0,
				reaction: 2000,
				"_id": {
					nickname: "--"
				}
			};
			if (leaders != null && leaders.length > 0) {
				leader = leaders[0];
			}
			
			if (y == undefined) {
				var allowed = "no";
				var numLeaders = leaders.length;
				var active = "class='btn btn-sm btn-default'";
				
				if (x == 0 || levels[x - 1] != undefined && levels[x - 1].accuracy > 0.8) {
					allowed = "yes";
					active = "class='btn btn-sm btn-success'";
					
				}
				
				rows += "<tr><td><button "+active+" data-toggle='modal' data-target='#statModal' onclick='gameView.genLeaderData(\""+allowed+"\",\"visual\"," + x 
				           + ")'> Level " + x + " </button> "+
					"<td>--/"+numLeaders + "</td>" +
					" </td><td>--</td>" +
					"<td>" + Math.round(100 * leader["accuracy"]) + "% (" +
					Math.round(leader["reaction"]) + "ms) </td>" +
					
					"<td>" + leader["_id"].nickname +

				"</td>" +
					"</tr>";
			} else {
				
				var level = y["_id"].level;
				var allowed = "trying";
				var numLeaders = leaders.length;
				var userRank;
				var counter=1;
				for(var nns in leaders){
					if (leaders[nns]["_id"].nickname == userModel.getNickname()){
						userRank = counter;
						break;
					}
					counter++;
				}
				
				console.log("leaders = " + JSON.stringify(leaders));
				console.log("******* level = "+level);
				console.log("y="+JSON.stringify(y));

				rows += "<tr><td><button class='btn btn-sm btn-primary' data-toggle='modal' data-target='#statModal' onclick='gameView.genLeaderData(\""+allowed+"\", \"visual\"," + level + ")'" + " >Level " + y["_id"].level + "</button></td>" +
					"<td>"+userRank+"/"+numLeaders+"</td>"+
					"<td>" + Math.round(y.accuracy * 100) + "% (" + Math.round(y.reaction) + "ms)</td>" +
					"<td>" + Math.round(100 * leader["accuracy"]) + "% (" +
					Math.round(leader["reaction"]) + "ms) </td>" +
					
					"<td>" + leader["_id"].nickname +
					"</td>" +
					"</tr>";
			}

		}
		//console.log(rows);
		var z1 = document.getElementById("visualList");
		var header = "<thead><tr><th>Play</th><th>My Rank</th><th>My Score</th><th>Top Score</th><th>Top User</th></tr></thead>";
		z1.innerHTML = header + rows;


		levels = gameStats.auditory || [undefined, undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined ];
		rows = "";
		for (var x = 0; x <= 10; x++) {
			//console.log(JSON.stringify(levels[x]));
			var y = levels[x];

			var leaders = gameStats.leaders.auditory[x] || [];
			var leader = {
				accuracy: 0,
				reaction: 2000,
				"_id": {
					nickname: "--"
				}
			};
			if (leaders != null && leaders.length > 0) {
				leader = leaders[0];
			}
			
			if (y == undefined) {
			
				var allowed = "no";
				var active = "class='btn btn-sm btn-default'";
				var numLeaders = leaders.length;
				
							
				if (x == 0 || levels[x - 1] != undefined && levels[x - 1].accuracy > 0.8) {
					allowed = "yes";
					active = "class='btn btn-sm btn-success'";
					
				}
				
				rows += "<tr><td><button "+active+" data-toggle='modal' data-target='#statModal' onclick='gameView.genLeaderData(\""+allowed+"\",\"auditory\"," + x + ")'> Level " + x + " </button>  </td>"+
					"<td> --/"+numLeaders+"</td>"+
					"<td>--</td>" +
					"<td>" + Math.round(100 * leader["accuracy"]) + "% (" + Math.round(leader["reaction"]) + "ms) </td>" +
					
					"<td>" + leader["_id"].nickname +
					"</td>" +
					"</tr>";
			} else {
				var level = y["_id"].level;
				
					
					
					var allowed = "trying";
					var numLeaders = leaders.length;
					var userRank;
					var counter=1;
					for(var nns in leaders){
						if (leaders[nns]["_id"].nickname == userModel.getNickname()){
							userRank = counter;
							break;
						}
						counter++;
					}
					
					
					rows += "<tr><td><button class='btn btn-sm btn-primary' data-toggle='modal' data-target='#statModal' onclick='gameView.genLeaderData(\""+allowed+"\", \"auditory\"," + level + ")'" + " >Level " + y["_id"].level + "</button></td>" +

					"<td>"+userRank+"/"+numLeaders+"</td>"+
					"<td>" + Math.round(y.accuracy * 100) + "% (" + Math.round(y.reaction) + "ms) </td>" +
					"<td>" + Math.round(100 * leader["accuracy"]) + "% (" + Math.round(leader["reaction"]) + "ms) </td>" +
					"<td>" + leader["_id"].nickname +
					"</td>" +
				//"<td>"+JSON.stringify(leader)+"</td>"+			
				"</tr>";
			}

		}
		//console.log(rows);		
		var z2 = document.getElementById("auditoryList");

		z2.innerHTML = header + rows;
	}

	function genLeaderData(allowed, mode, level) {
	
		$("#leaderboardBody").html("");
		
		console.log("in genLeaderData(" + mode + "," + level + ")");
		//gameControl.changeLevelMode(level,mode);

		if (allowed == "no") {
			//$("#popupPlayButton").prop("disabled", true);
			$("#playGame").attr("class", "btn btn-default");
			$("#playGame").unbind("click");
			$("#playGame").attr("disabled", "true");


		} else {
			$("#playGame").removeAttr("disabled");
			gameControl.changeLevelMode(level, mode);
			gameModel.updateParameters();
			
			var title = mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase() + " Mode (Level " + level + ")";
			$("#leaderboardTitle").html(title);
			
			if (allowed == "yes") {
				$("#playGame").attr("class", "btn btn-success");
			} else {
				$("#playGame").attr("class", "btn btn-primary");
				//$("#playGame").unbind("click");
				//$("#popupPlayButton").prop("disabled", false);
				//$("#playGame").click(function() {
					
					//});
			}
		}


		gameControl.logActivity("leaderboard", [mode, level]);
		console.log("gld-level=" + level);
		//document.getElementById("leaderboard").innerHTML = "You are the leader!!!";
		// fancey title for popup


		//level = 0;
		var leadersFound = 0;
		var output = "";

		$.ajax({
			type: "GET",
			url: "/leaderboard/" + mode + "/" + level,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(list) {

			var leaders = list["leaders"];

			for (var i = 0; i < leaders.length; i++) {

				var nickname = list["leaders"][i]["_id"]["nickname"];
				var accuracy = list["leaders"][i]["accuracy"];
				var reaction = list["leaders"][i]["reaction"];
				var counter = i + 1;

				output += "<tr><td>" + i + "</td><td>" + nickname + "</td><td>" + Math.round(accuracy * 100) + "</td><td>" + Math.round(reaction) + "</td></tr>";

				leadersFound++;
			}


			if (leadersFound == 0)
				output = "<tr><td colspan='4'>No Leaders Found</td></tr>";


			$("#leaderboardBody").html(
				'<table class="table table-striped">' +
				'<tr><th>#</th><th>Nickname</th><th>Accuracy</th><th>Reaction</th></tr>' +
				output +
				"</table>"
			);

		});
	}

	function updateDataSummary(){
        $.ajax({
               type: "GET",
               url: "/allstats",
               contentType: "application/json; charset=utf-8",
               dataType: "json"
           }).done(function(statarray) {
			   var stats = statarray[0];
			   var congTotal = stats.ff+stats.ss;
			   var incongTotal = stats.fs + stats.sf;
			   var congCorrect = stats.ffc + stats.ssc;
			   var incongCorrect = stats.fsc + stats.sfc;
			   var congTime = stats.fft + stats.sst;
			   var incongTime = stats.fst + stats.sft;
			   console.log("stats.ff type= "+stats.ff);
			   console.log("stats = "+JSON.stringify(stats));
			   console.log("stats = "+JSON.stringify({ct:congTotal,it:incongTotal}));
			   $("#correct-cong").html(Math.round(100*congCorrect/congTotal)+"% (N="+congTotal+")");
			   $("#reaction-cong").html(Math.round(congTime/congCorrect)+"ms");
			   $("#correct-incong").html(Math.round(100*incongCorrect/incongTotal)+"% (N="+incongTotal+")");
			   $("#reaction-incong").html(Math.round(incongTime/incongCorrect)+"ms");
			   
		   })
	   };
	
	function updateInstr(mode){
		console.log("updating "+mode);
		if (mode=="visual"){
			$(".visualInstructions").show();
			$(".auditoryInstructions").hide();
		} else {
			$(".visualInstructions").hide();
			$(".auditoryInstructions").show();			
		}
	}

	return ({
		update: update,
		playGood: playGood,
		playBad: playBad,
		playFishAudio: playFishAudio,
		stopFishAudio: stopFishAudio,
		setSkin: setSkin,
		showLevels: showLevels,
		updateInstr: updateInstr,
		genLeaderData: genLeaderData,
		updateDataSummary:updateDataSummary
	})
}())
