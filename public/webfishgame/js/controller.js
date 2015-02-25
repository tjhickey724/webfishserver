/**
The game controller handles all user input, including clicking on checkboxes,
pressing keys, starting and ending the game, etc.
**/
var gameControl = (function() {
	debugPrint("loading controller");

	//Event handling ..

	document.onmouseover = function() {
		//User's mouse is inside the page.
		window.innerDocClick = true;
	}

	document.onmouseleave = function() {
		//User's mouse has left the page.
		window.innerDocClick = false;
	}

	window.onhashchange = function() {
		if (window.innerDocClick) {
			showView(window.location.hash.substring(1));

		} else {
			//Browser back button was clicked
			gameLoop.stop();
			location.reload();
		}
	}


	window.addEventListener('popstate', function(event) {
		console.log("Inside startGame popstate handler");
		if (gameOn && !window.innerDocCLick) {
			gameOn = false;
			location.reload();
			//gameLoop.stop();
			//endGame();
		}

	});
	
	window.addEventListener("keydown", function(event){return keyDownHandler(event)} , false);



	var showView = function(selected) {
		if (selected == "dashboard") {
			gameModel.updateParameters();
			userModel.loadGameStats();
			gameView.updateInstr(userModel.getMode());
		} else if (selected == "profile") {
			gameView.showLevels();

		}
		console.log("Username = " + userModel.getUserName());

		//$('#userName').text(userModel.getUserName());
		window.location.hash = '#' + selected;
		$('.view').hide();
		$('#' + selected + '-view').show();

		/* if (selected=="game"){
            $('#header').hide();
            $("#canvas").css("display","block");
            $('#canvas').show();
        }else {
            $('#header').show();
        }
		   */
		console.log("showing " + '#' + selected + '-view')


	};

	var goodFishKey = "U";
	var badFishKey = "I";
	var oddballKey = "O";

	var gameOn = false;
	var log = [];
	var gameStart = (new Date()).getTime();
	var allStats = {};
	var allSummaryStats = {};

	function initStat(name) {
		return ({
			name: name,
			tries: 0,
			correct: 0,
			incorrect: 0,
			missed: 0,
			time: 0,
			reaction: 0,
			missing: 0,
			wrong: 0,
			accuracy: 0
		});
	};

	function initGameStats() {
		return ({
			fast: {
				fast: initStat("ff"),
				slow: initStat("fs"),
				none: initStat("fn")
			},
			slow: {
				fast: initStat("sf"),
				slow: initStat("ss"),
				none: initStat("sn")
			},
			none: {
				fast: initStat("nf"),
				slow: initStat("ns"),
				none: initStat("nn")
			}
		});
	};

	function getSummaryStats() {
		//console.log(JSON.stringify(gameStats));
		var correct = gameStats.fast.fast.correct + gameStats.fast.slow.correct + gameStats.slow.fast.correct + gameStats.slow.slow.correct +
			gameStats.none.fast.correct + gameStats.none.slow.correct + gameStats.slow.none.correct + gameStats.fast.none.correct;
		var tries = gameStats.fast.fast.tries + gameStats.fast.slow.tries + gameStats.slow.fast.tries + gameStats.slow.slow.tries +
			gameStats.none.fast.tries + gameStats.none.slow.tries + gameStats.slow.none.tries + gameStats.fast.none.tries;
		var totalTime = gameStats.fast.fast.time + gameStats.fast.slow.time + gameStats.slow.fast.time + gameStats.slow.slow.time +
			gameStats.none.fast.time + gameStats.none.slow.time + gameStats.slow.none.time + gameStats.fast.none.time;
		var reactionTime = totalTime / correct;
		var percentCorrect = correct * 100 / tries;
		//console.log("totalTime="+totalTime+" tries="+tries+" correct="+correct);
		return {
			reactionTime: reactionTime,
			percentCorrect: percentCorrect,
			tries: tries,
			correct: correct,
			totalTime: totalTime
		};
	}

	var gameStats = initGameStats();

	// this is called after a "game event" has occurred

	function pushLog(data) {
		debugPrint("pushing " + data);
		log.push(data);
		updateStats(data);
		//console.log("stats = "+JSON.stringify(gameStats));
	}

	// here is where we update the current stats for this players game
	// at the end we will show it to the player and send this data to the server...

	function updateStats(event) {
		debugPrint("updateStat:" + event.visual + " " + event.audio);
		var stats = gameStats[event.visual][event.audio];
		if (event.action == "keypress") {
			stats.tries++;
			if (event.correct) {
				stats.correct++;
				stats.time += event.reaction;
			} else {
				stats.incorrect++;
			}
		} else if (event.action == "missed") {
			stats.missed++;
			stats.tries++;

		}
		if (stats.tries > 0) {
			if (event.visual == 'none' || event.audio == 'none') {
				// in oddball cases the player is supposed to miss!
				stats.missing = Math.round(stats.missed / stats.tries * 100) + "%";
				stats.accuracy = Math.round(stats.missed / stats.tries * 100) + "%";
				stats.wrong = Math.round(stats.incorrect / stats.tries * 100) + "%";
			} else {
				stats.missing = Math.round(stats.missed / stats.tries * 100) + "%";
				stats.accuracy = Math.round(stats.correct / stats.tries * 100) + "%";
				stats.wrong = Math.round(stats.incorrect / stats.tries * 100) + "%";
			}
		}
		if (stats.correct > 0) {
			stats.reaction = Math.round(stats.time / stats.correct);
		}
		debugPrint("stats are " + JSON.stringify(stats));
	}



	/** handle a key press. We only recognize P and L for now.
	 **/

	function keyDownHandler(event) {
		console.log("keyDownHandler:");
		if (window.location.hash != "#game") return;

		var now = (new Date()).getTime();
		var keyPressed = String.fromCharCode(event.keyCode);

		// this is the case where there was no fish visible
		// and they pressed the key. It doesn't count as correct
		// or incorrect 
		if (!gameModel.getFishVisible()) {
			gameModel.logKeyPress('nofish', keyPressed, 'incorrect', now);
			gameView.playBad(now);
			return;
		}


		//debugPrint("keydown = "+keyPressed);
		// here is the case where they saw and/or heard a fish
		// and pressed a key classifying it as good or bad
		if (keyPressed == goodFishKey) {
			goodKeyPress(now);
		} else if (keyPressed == badFishKey) {
			badKeyPress(now);
		} else if (keyPressed == oddballKey) {
			oddKeyPress(now);
		}
	}




	function goodKeyPress(now) {

		debugPrint("pressed P");

		// if there is not visual or audio any keypresses are wrong!
		// these are the oddball cases ...
		if (gameModel.getFishVisual() == 'none') {
			gameModel.logKeyPress('novis', goodFishKey, 'incorrect', now);
			gameView.playBad(now);
			debugPrint("goodKeyPress: goodkey no visual");
			gameModel.killFish();
			return;
		}
		if (gameModel.getFishAudio() == 'none') {
			gameModel.logKeyPress('noaud', goodFishKey, 'incorrect', now);
			gameView.playBad(now);
			debugPrint("goodKeyPress: goodkey no audio");
			gameModel.killFish();
			return;
		}

		if (gameModel.getFishVisible()) {
			gameModel.killFish();


			if (gameModel.isGoodFish()) {
				gameModel.logKeyPress('good', goodFishKey, 'correct', now);
				gameView.playGood(now);
			} else {
				gameModel.logKeyPress('bad', goodFishKey, 'incorrect', now);
				gameView.playBad(now);

			}
		}


	}

	function badKeyPress(now) {
		debugPrint("pressed L");

		// if there is not visual or audio any keypresses are wrong!
		// these are the oddball cases ...
		if (gameModel.getFishVisual() == 'none') {
			gameModel.logKeyPress('novis', badFishKey, 'incorrect', now);
			gameView.playBad(now);
			gameModel.killFish();
			return;
		}
		if (gameModel.getFishAudio() == 'none') {
			gameModel.logKeyPress('noaud', badFishKey, 'incorrect', now);
			gameView.playBad(now);
			gameModel.killFish();
			return;
		}


		// this is the case where they saw and heard a fish
		//  and pushed the "L" key        
		if (gameModel.getFishVisible()) {
			gameModel.killFish();

			if (gameModel.isGoodFish()) {
				gameModel.logKeyPress('good', badFishKey, 'incorrect', now);
				gameView.playBad();
			} else {
				gameModel.logKeyPress('bad', badFishKey, 'correct', now);
				gameView.playGood();
			}
		}

	}


	function oddKeyPress(now) {
		debugPrint("pressed O");

		// if there is not visual or audio any keypresses are wrong!
		// these are the oddball cases ...
		if (gameModel.getFishVisual() == 'none') {
			gameModel.logKeyPress('novis', oddballKey, 'correct', now);
			gameView.playGood(now);
			gameModel.killFish();
			return;
		}
		if (gameModel.getFishAudio() == 'none') {
			gameModel.logKeyPress('noaud', oddballKey, 'correct', now);
			gameView.playGood(now);
			gameModel.killFish();
			return;
		}


		// this is the case where they saw and heard a fish
		//  and pushed the "O" key        
		if (gameModel.getFishVisible()) {
			gameModel.killFish();
			if (gameModel.isGoodFish()) {
				gameModel.logKeyPress('good', oddballKey, 'incorrect', now);
				gameView.playBad();
			} else {
				gameModel.logKeyPress('bad', oddballKey, 'incorrect', now);
				gameView.playBad();
			}
		}

	}


	function getPercentCorrect() {
		var totalCongTries = gameStats.fast.fast.tries + gameStats.slow.slow.tries;
		var totalCongCorrect = gameStats.fast.fast.correct + gameStats.slow.slow.correct;
		var totalIncongTries = gameStats.fast.slow.tries + gameStats.slow.fast.tries;
		var totalIncongCorrect = gameStats.fast.slow.correct + gameStats.slow.fast.correct;
		var totalOddballTries = gameStats.none.fast.tries + gameStats.none.slow.tries + gameStats.fast.none.tries + gameStats.slow.none.tries;
		var totalOddballCorrect =
			gameStats.none.fast.correct + gameStats.none.slow.correct + gameStats.fast.none.correct + gameStats.slow.none.correct;

		var reactionCong = (totalCongTries == 0) ? 0 : (gameStats.fast.fast.time + gameStats.slow.slow.time) / totalCongTries;
		var reactionIncong = (totalIncongTries == 0) ? 0 : (gameStats.fast.slow.time + gameStats.slow.fast.time) / totalIncongTries;
		var reactionOddball = (totalOddballTries == 0) ? 0 : (gameStats.none.slow.time + gameStats.none.fast.time + gameStats.slow.none.time + gameStats.fast.none.time) / totalOddballTries;

		var totalTries = totalCongTries + totalIncongTries;
		var totalCorrect = totalCongCorrect + totalIncongCorrect;




		totalAllTries = totalTries + totalOddballTries;
		totalAllCorrect = totalCorrect + totalOddballCorrect;

		var Allpercent = (totalAllTries == 0) ? 0 : totalAllCorrect * 100 / totalAllTries;
		var CongPercent = (totalCongTries == 0) ? 0 : totalCongCorrect * 100 / totalCongTries;
		var IncongPercent = (totalIncongTries == 0) ? 0 : totalIncongCorrect * 100 / totalIncongTries;
		var OddballPercent = (totalOddballTries == 0) ? 0 : totalOddballCorrect * 100 / totalOddballTries;
		return [Allpercent, CongPercent, IncongPercent, OddballPercent, reactionCong, reactionIncong, totalCongTries, totalIncongTries, reactionOddball, totalOddballTries];
	}

	function endGame() {
		console.log("endGame!!");
		gameLoop.stop();
		gameOn = false;
		var logelt = document.getElementById('log');
		var stats = getPercentCorrect();
		var percentCorrect = stats[0];
		var msgString = "Sorry you did not advance to the next level...";
		var userLevel = userModel.getLevel();
		var originalLevel = userLevel;
		uploadStats(gameStats);
		summaryStats = getSummaryStats()
		uploadLogAndSummary(log, summaryStats)



		//console.log("Summary Stats ="+JSON.stringify(allSummaryStats));

		if (percentCorrect > 80) {
			userModel.setLevel(userModel.getLevel() + 1);
			userLevel = userModel.getLevel();

			levelInfo = "<h2>Congratulations!  You have advanced to level " + userLevel + "!</h2>";

			//alert("new level is "+userLevel);
			msgString = "Congrats!!! You have advanced to level " + userLevel;
		} else {
			userLevel = userModel.getLevel();
			levelInfo = "<h2>Level " + userLevel + "</h2>";
		}

		//logelt.textContent = JSON.stringify(gameStats)+"\n\n\n"+(JSON.stringify(log));
		var statString;
		if (allSummaryStats.count == undefined) {
			statString =
				"<h2>Percent Correct: " + Math.round(summaryStats.percentCorrect) + "%" +
				" </h2>" + "\n" +
				"<h2>Reaction Time: " + Math.round(summaryStats.reactionTime) + "ms" +
				" </h2>" +
				"<h2>Yay!! You are the first person to play level " + originalLevel + "</h2>";
		} else {
			statString =
				"<h2>Percent Correct: " + Math.round(summaryStats.percentCorrect) + "%" +
				" (avg for all level " + originalLevel + " players is " + Math.round(allSummaryStats.correct * 100 / allSummaryStats.tries) + "%" + ")" +
				" </h2>" + "\n" +
				"<h2>Reaction Time: " + Math.round(summaryStats.reactionTime) + "ms" +
				" (avg for all level " + originalLevel + "  players is " + Math.round(allSummaryStats.time / allSummaryStats.correct) + "ms" + ")" +
				" </h2>";
		}


		$("#log").html(levelInfo + "\n" + statString + "<\hr>");
		console.log(">>>>>>>>>>>    " + levelInfo + "\n" + statString + "<\hr>");
		showView("log");
		//gameLoop.stop();
	}

	function getAllStats() {
		$.ajax({
			type: "GET",
			url: "/allstats",
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(stats) {
			stats = stats[0];
			// {"_id":"total","ff":41,"ss":42,"fs":37,"sf":27,"ffc":13,"ssc":20,"fsc":15,"sfc":12}
			//console.log("just go the stats"+JSON.stringify(stats));
			allStats = {
				cong: Math.round((stats.ffc + stats.ssc) * 100 / (stats.ff + stats.ss)),
				incong: Math.round((stats.fsc + stats.sfc) * 100 / (stats.fs + stats.sf)),
				congt: Math.round((stats.fft + stats.sst) / (stats.ff + stats.ss)),
				incongt: Math.round((stats.fst + stats.sft) / (stats.fs + stats.sf))
			};
			//console.log("just go the allstats"+JSON.stringify(allStats));
		});
	}



	function getAllSummaryStats(mode, level) {
		$.ajax({
			type: "GET",
			url: "/summarystats/" + mode + "/" + level,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(stats) {
			if (stats.length == 0) {
				allSummaryStats = {};
			} else {
				stats = stats[0];
				//console.log("allSummaryStats"+JSON.stringify(stats));
				allSummaryStats = stats;
				//console.log("just got the allSummaryStats "+JSON.stringify(allSummaryStats));
			}
		});
		return allSummaryStats;
	}

	function uploadStats(gameStats) {
		//console.log("uploading stats!!");
		var userID = userModel.getUserID();
		$.ajax({
			type: "POST",
			url: "/model/gamestats",
			data: JSON.stringify({
				user: userID,
				stats: gameStats
			}), // also upload the avmode and the level and date and other info (gameid?)
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(items) {
			//console.log("upload complete"+JSON.stringify(items));
		});
	}



	function uploadLogAndSummary(log, summaryStats) {
		//console.log("uploading log");
		var userID = userModel.getUserID();
		var userLevel = userModel.getLevel();
		var age = userModel.getAge();
		var mode = userModel.getMode();
		var theTime = new Date().getTime();
		var nickname = userModel.getNickname();
		var deviceInfo = [$('body').innerWidth(), $('body').innerHeight(), WURFL, {
			appVersion: window.navigator.appVersion,
			platform: window.navigator.platform,
			userAgent: window.navigator.userAgent
		}];
		var logItem = {
			userID: userID,
			level: userLevel,
			age: age,
			mode: mode,
			time: theTime,
			deviceInfo: deviceInfo,
			log: log
		};
		//console.log("log element is \n"+log+"\n");
		$.ajax({
			type: "POST",
			url: "/model/gamelog",
			data: JSON.stringify(logItem), // also upload the avmode and the level and date and other info (gameid?)
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(items) {
			//console.log("log upload complete"); //+JSON.stringify(items));
		});

		var summaryStats = getSummaryStats();
		var summaryItem = {
			userID: userID,
			nickname: nickname,
			level: userLevel,
			age: age,
			mode: mode,
			time: theTime,
			summary: summaryStats
		};
		//console.log("log element is \n"+JSON.stringify(log)+"\n");
		$.ajax({
			type: "POST",
			url: "/model/gamesummary",
			data: JSON.stringify(summaryItem), // also upload the avmode and the level and date and other info (gameid?)
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function(items) {
			//console.log("summary upload complete "+JSON.stringify(items));
		});



	}

	function runGame() {
		if (userModel.getMode() == "visual") {
			runVisual();
		} else {
			runAural();
		}
	}

	function runVisual() {
		console.log("In runVisual");
		setSkin();
		showView("game");
		userModel.setMode("visual");
		startGame();
	}

	function runAural() {
		setSkin();
		showView("game");
		userModel.setMode("auditory");
		startGame();
	}

	function consent() {
		userModel.setConsent("consented");
		userModel.setLevel(0);
		userModel.setAge($("#age").val());
		userModel.setMode((Math.random() > 0.5) ? "visual" : "auditory");
		userModel.setNickname($("#nickname").val());

		$("#gameMode").text(userModel.getMode());
		gameView.updateInstr(userModel.getMode());
		$("#level").text(userModel.getLevel());

		showView("dashboard");
	}


	function deviceOK() {
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		return (WURFL.form_factor == "Desktop") && (!isSafari);
	}

	function start() {
		if (!deviceOK()) {
			// show warning page
			showView("warning");
		} else {
			showView("start");
			userModel.getUserInfo();
			setTimeout(checkConsent, 2000);
		}
	}

	function checkConsent() {
		userModel.printInfo();
		console.log("inside start method");

		if (userModel.getConsent() != "consented")
			showView("consent");
		else {
			$("#gameMode").text(userModel.getMode());
			if (window.location.hash == "")
				showView("start");
			else {
				//console.log("showing "+window.location.hash);
				showView(window.location.hash.substring(1));
			}
		}
	}

	function setSkin() {
		var skinsel = $("#skin option:selected");
		var a = skinsel.text();
		gameView.setSkin(a);
	}

	function startGame() {
		console.log("inside startGame");
		// force game to end when clicking on back button
		gameOn = true;


		//getAllStats();
		log = [];
		gameStats = initGameStats();
		getAllSummaryStats(userModel.getMode(), userModel.getLevel());

		gameLoop.start();
		gameModel.start();
	}

	function changeLevelMode(level, mode) {
		userModel.setLevel(level);
		userModel.setMode(mode);
		showView("dashboard");
	}

	function showInstructions() {
		if (userModel.getMode() == "visual") {
			$("#visualInstrBody").show();
			$("#auditoryInstrBody").hide();
		} else {
			$("#visualInstrBody").hide();
			$("#auditoryInstrBody").show();
		}

	}


	return ({
		showView: showView,

		start: start,
		runVisual: runVisual,
		runAural: runAural,
		runGame: runGame,
		pushLog: pushLog,
		endGame: endGame,
		consent: consent,
		setSkin: setSkin,
		getAllSummaryStats: getAllSummaryStats,
		changeLevelMode: changeLevelMode,
		showView: showView,
		showInstructions: showInstructions
	})

}())
