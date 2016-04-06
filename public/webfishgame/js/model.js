/*
The game model is a scrolling background where fish come out from the left or right, one at a time,
and their are three options for the visual and auditory oscillations (fast, slow, none).

The fish appear on the screen for at most 2 seconds.
If the user presses a key, then they disappear, otherwise they disappear after 2 seconds.
Once a fish disappears, a timer is started for when the next fish will appear.
When a fish is spawned, the visual and auditory oscillations are selected as are the side (left/right)

*/


var gameModel = (function() {
    debugPrint("creating gameModel");
    
    function getFishLifetime(level){ // 2000 -> 500ms in 10 steps
		if (level<20)
			return 2000; //-level*150;
		else
			return 1000-(level-20)*50;
    }
    
    function getMinFishSpawn(level){ // 1000 -> 250
        	return 1000;// - level*75;

    }
    
    function getMaxFishSpawn(level){ // 2000 -> 500
        return 1000; // 2000 - level*150;
    }
    
    function getOddBallRate(level){
        return level<3?0:25;
    }

    var fishLifetime = getFishLifetime(userModel.getLevel()); // how long fish stays on the screen in ms
    var minFishSpawn = getMinFishSpawn(userModel.getLevel()); // minimum time before new fish appears
    var maxFishSpawn = getMaxFishSpawn(userModel.getLevel()); // maximum time before new fish appears
    var oddBallRate = getOddBallRate(userModel.getLevel()); // percent


    // record the start time of the game and set the end time, all games are the same length
    var gameStart = (new Date()).getTime();
    var gameDuration = 90; // in seconds
	var gameDelay = 5000; // in ms
    var endTime = gameStart + gameDuration * 1000;


    var correct = 0
    var incorrect = 0;
    var missed = 0;
    var timeRemaining = gameDuration;
    var totalReactionTime = 1;
    var lastReactionTime = 1;

    function resetTrialStats(){
        correct=0;
        incorrect=0;
        missed=0;
        timeRemaining = gameDuration;
        totalReactionTime = 1;
        lastReactionTime = 1;
    }

    // specify the size of the gameboard in the model (having nothing to do with pixels!!)
    var width = height = 100;


    // state of scrolling background
    var imageOffset = 0; // this varies from -100 to 100
    var imageSpeed = 10; // this is in percent of height per second
    // state of timing
    var lastTime = (new Date()).getTime();


    // state of the fish
    // we ought to use a model for the fish... maybe in the next version... but there is only one fish at a time...
    var fishPos = [0, 50];
    var fishXVelocity = 10;
    var fishYVelocity = 0;
    var fishVisible = true;
	var fishAlive = true;
    var fishVisual = 'fast';
    var fishAudio = 'fast';
    var fishSide = 'left';
    var fishCount = 0;
    var fishBirth = 0;
    var fishSizePercent = 20;
    
    function updateParameters(){
        $("#level").html(userModel.getLevel());
		$("#gameMode").html(userModel.getMode()); 
		//gameView.updateInstr(userModel.getModel());
        $("#gameDuration").attr('value',gameDuration);
        $("#minIFI").attr('value',getMinFishSpawn(userModel.getLevel()));
        $("#maxIFI").attr('value',getMaxFishSpawn(userModel.getLevel()));
        $("#lifetime").attr('value',getFishLifetime(userModel.getLevel()));
        $("#oddBallRate").attr('value',getOddBallRate(userModel.getLevel()));
        
        
        
        
        
    }

    function shuffle(o) { //v1.0
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };

    function isGoodFish() {
        if (userModel.getMode() == "visual") {
            return fishVisual == 'slow';
        } else {
            return fishAudio == 'slow';
        }
    }

    function getFishVisible() {
        return fishVisible;
    }
	
    function getFishAlive() {
        return fishAlive;
    }

    function setFishVisible(val) {
        fishVisible = val;
    }
	
    function setFishAlive(val) {
        fishAlive = val;
    }

    function randInt(N) {
        return Math.round(N * Math.random());
    }

    function spawnFish() {
        debugPrint("\n\n\n************\n\n new fish\n\n");
        var now = (new Date()).getTime();
        if (now > endTime) {
            gameControl.endGame();
            return;
        }
        fishPos = [0, 50];
        fishVisible = true;
		fishAlive = true;
		

        fishSide = (randBool()) ? 'left' : 'right';
        fishXVelocity = (fishSide == 'left') ? 20 : -20;
        fishYVelocity = 0;
        fishPos[0] = (fishSide == 'left') ? 0 : 100;
        newFish = true;

		// fishVisual and fishAudio need to be selected from an array
        //fishVisual = (randBool()) ? 'fast' : 'slow';
        //fishAudio = (randBool()) ? 'fast' : 'slow';
        //if (randInt(100) < oddBallRate) {

          //  if (randBool()) {
           //     debugPrint("spawnFish: novis oddball!");
            //    fishVisual = 'none';
          //  } else {
           //     debugPrint("spawnFish: noaud oddball!");
            //    fishAudio = 'none';
           // }
       // }
		switch (fishTypes[fishCount]) {
			case 3: fishVisual='slow'; fishAudio='none'; break;
			case 4: fishVisual='slow'; fishAudio='slow'; break;
			case 5: fishVisual='slow'; fishAudio='fast'; break;
			case 6: fishVisual='fast'; fishAudio='none'; break;
			case 7: fishVisual='fast'; fishAudio='slow'; break;
			case 8: fishVisual='fast'; fishAudio='fast'; break;
		}


        fishCount++;
        debugPrint("spawnFish: spawned fish #" + fishCount + " at time " + (new Date()).getTime());
        debugPrint("spawnFish:"+JSON.stringify([fishVisual, fishAudio, fishSide, fishXVelocity]));
        setTimeout(killFishIfVisible(fishCount), 2000); // HARDCODED :()
		setTimeout(function(){spawnFish()}, 3000); // HARDCODED
		//setTimeout(function(){killFish();}, fishLifetime);

        fishBirth = (new Date()).getTime();
        debugPrint("spawnFish: about to push birth!");
        var entry = {
            time: fishBirth - gameStart,
            action: 'birth',
            id: fishCount,
            visual: fishVisual,
            audio: fishAudio,
            side: fishSide,
			timestamp: now
        };
        gameControl.pushLog(entry);
        debugPrint("spawnFish: just pushed birth" + JSON.stringify(entry));
        gameView.playFishAudio();
    }


    function killFishIfVisible(n) {
        return (function() {
			fishVisible = false;
			gameView.stopFishAudio();
            if (fishAlive && (fishCount == n)) {
                debugPrint("KFIV: Times up!"+fishAlive+" "+fishCount+" "+n);
                var now = (new Date()).getTime();
                var entry = {
                    time: now - gameStart,
                    action: "missed",
                    visual: fishVisual,
                    audio: fishAudio,
                    side: fishSide,
					timestamp:now
                };
                gameControl.pushLog(entry);
                debugPrint("KFIV:"+entry);
				fishAlive = false;
                killFish();
                lastReactionTime = 0;
                
                missed++;
                gameView.playBad();
                
            }

        });
    }

    function killFish() {

        //var delay = minFishSpawn + randInt(maxFishSpawn - minFishSpawn);
        //debugPrint("minFS:"+minFishSpawn+" maxFS:"+maxFishSpawn);
        //debugPrint("killFish: fish killed... new fish will spawn in " + delay + " ms");
		fishAlive = false;
        //setTimeout(spawnFish, 1000ms); //delay);
        

    }

	function startTimerBar(numDelay){
         console.log("starting timer bar! "+numDelay+" -- "+userModel.getMode() +" gameDuration="+gameDuration);
         $("#timer").animate({width:"95%"},5000);
         $("#timer").show().delay(numDelay).animate({width: "0px"}, gameDuration*1000);
	}

	var fishTypes = [];

    function start() {
		
		
		console.log("******* STARTING GAME  ********")
/*
        fishLifetime = parseInt($("#lifetime").val());
        minFishSpawn = parseInt($("#minIFI").val());
        maxFishSpawn = parseInt($("#maxIFI").val());
        gameDuration = parseInt($("#gameDuration").val());
        oddBallRate = parseInt($("#oddBallRate").val());
		*/
        
        resetTrialStats();
        
        fishVisible = false;
		fishAlive=false;
		gameDelay = 5000;
        gameStart = (new Date()).getTime()+gameDelay;
        endTime = gameStart + gameDuration * 1000;
        fishCount = 0;

        var delay = 1000 + randInt(1000)+gameDelay;
        debugPrint("start: game started... new fish will spawn in " + delay + " ms");
        debugPrint("minFS:"+minFishSpawn+" maxFS:"+maxFishSpawn);
        
        setTimeout(spawnFish, delay);

        setCanvasSize();
        window.onresize = setCanvasSize;
		startTimerBar(gameDelay)
		
		// create a random permutation of the fishTypes array
		fishTypes=[];
		var j=0;
		for(var i=3; i<=8; i++){
			for(var k=0; k<5; k++){
				fishTypes[j++] = i;
			}
		}
		fishTypes = _.shuffle(fishTypes);
		console.log("fishtypes="+JSON.stringify(fishTypes));
    };

    function setCanvasSize() {
        var canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth; //Math.min(1000, window.innerWidth);
        canvas.height = window.innerHeight; //Math.min(1000, window.innerHeight);
    };

    function logKeyPress(fishType, key, isCorrect, now) {
        var entry = {
            time: (now - gameStart),
            action: 'keypress',
            fishType: fishType,
            key: key,
            correct: (isCorrect == 'correct'),
            consistent: fishAudio == fishVisual,
            reaction: (now - fishBirth),
            visual: fishVisual,
            audio: fishAudio,
            side: fishSide,
			timestamp:now
        };
        gameControl.pushLog(entry);
        debugPrint("logKeyPress"+JSON.stringify(entry));
        //console.log(isCorrect+" --> "+JSON.stringify(entry));
        //console.log(JSON.stringify({correct:correct, incorrect:incorrect}));
        if (isCorrect == "correct") {
            correct++;
            lastReactionTime = (now - fishBirth);
            totalReactionTime += lastReactionTime;
        } else {
            incorrect++;
            lastReactionTime = 0;
        }
    }

    function randBool() {
        return (Math.random() > 0.5);
    }


    function update(now) {
        var dt = (now - lastTime) / 1000.0;
        var theTime = (now - gameStart);
        imageOffset += imageSpeed * dt;
        timeRemaining = gameDuration - theTime / 1000;

        lastTime = now;

        if (imageOffset > 2 * height) {
            imageOffset -= 2 * height;
        }

        if (!fishVisible) return;

        fishPos[0] += fishXVelocity * dt;
        //debugPrint("fishpos = "+JSON.stringify([fishPos,fishXVelocity,dt,fishXVelocity*dt]));
        if (fishPos[0] > 100) {
            fishXVelocity *= -1;
        } else if (fishPos[0] < 0) {
            fishXVelocity *= -1;
        }
    }


    function analyzeLog(log) {
        var slowSlow = 0;
    }

    function getStatus() {
		//console.log(timeRemaining - gameDuration);
        return ({
            correct: correct,
            incorrect: incorrect,
            missed: missed,
            totalReactionTime: totalReactionTime,
            lastReactionTime: lastReactionTime,
            timeRemaining: timeRemaining,
			countdown: timeRemaining - gameDuration
        });
    }

    return {
        width: width,
        height: height,
        getFishPos: function() {
            return fishPos;
        },
        getFishVisible: getFishVisible,
        setFishVisible: setFishVisible,
        getFishAlive: getFishAlive,
        setFishAlive: setFishAlive,

        getImageOffset: function() {
            return (imageOffset)
        },
        getFishAudio: function() {
            return fishAudio;
        },
        getFishVisual: function() {
            return fishVisual;
        },
        getFishSide: function() {
            return fishSide;
        },
        getFishSizePercent: function(){
            return $("#fishSizePercent").val();
        },
        killFish: killFish,
        isGoodFish: isGoodFish,
        start: start,
        logKeyPress: logKeyPress,
        update: update,
        getStatus: getStatus,
        updateParameters: updateParameters

    }
}());
