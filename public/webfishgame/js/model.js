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
    
    var userLevel = parseInt(getUserLevel());
    
    function getUserLevel(){
        window.localStorage.level = window.localStorage.level || 0;
        return parseInt(window.localStorage.level);
    }
    
    function resetUserLevel(){
        window.localStorage.level = 0;
    }
    
    function getUserLevel(){
        return window.localStorage.level;
    }
    
    function incrementUserLevel(){
        userLevel += 1;
        window.localStorage.level = userLevel;
        
        return userLevel;
    }
    
    function getFishLifetime(level){ // 2000 -> 500ms in 10 steps
        return 2000-level*150;
    }
    
    function getMinFishSpawn(level){ // 1000 -> 750
        return 1000 - level*25;
    }
    
    function getMaxFishSpawn(level){ // 2000 -> 1500
        return 2000 - level*50;
    }
    
    function getOddBallRate(level){
        return level*5;
    }

    var fishLifetime = getFishLifetime(userLevel); // how long fish stays on the screen in ms
    var minFishSpawn = getMinFishSpawn(userLevel); // minimum time before new fish appears
    var maxFishSpawn = getMaxFishSpawn(userLevel); // maximum time before new fish appears
    var oddBallRate = getOddBallRate(userLevel); // percent
    
    
    var avmode = "visual"; // which mode determines whether a fish is "good"
    // two choices: visual or aural
    // this determines which feature the player should be attending to

    function setAVMode(mode) {
        avmode = mode;
    }


    // record the start time of the game and set the end time, all games are the same length
    var gameStart = (new Date()).getTime();
    var gameDuration = 20; // in seconds
    var endTime = gameStart + gameDuration * 1000;


    var correct = 0
    var incorrect = 0;
    var missed = 0;
    var timeRemaining = gameDuration;
    var totalReactionTime = 1;
    var lastReactionTime = 1;



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
    var fishVisual = 'fast';
    var fishAudio = 'fast';
    var fishSide = 'left';
    var fishCount = 0;
    var fishBirth = 0;
    var fishSizePercent = 20;
    
    function updateParameters(){
        $("#level").html(userLevel);
        $("#gameDuration").attr('value',gameDuration);
        $("#minIFI").attr('value',getMinFishSpawn(userLevel));
        $("#maxIFI").attr('value',getMaxFishSpawn(userLevel));
        $("#lifetime").attr('value',getFishLifetime(userLevel));
        $("#oddBallRate").attr('value',getOddBallRate(userLevel));
        
        
        
        
        
    }

    function shuffle(o) { //v1.0
        for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
        return o;
    };

    function isGoodFish() {
        if (avmode == "visual") {
            return fishVisual == 'slow';
        } else {
            return fishAudio == 'slow';
        }
    }

    function getFishVisible() {
        return fishVisible;
    }

    function setFishVisible(val) {
        fishVisible = val;
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
        fishVisual = (randBool()) ? 'fast' : 'slow';
        fishAudio = (randBool()) ? 'fast' : 'slow';
        fishSide = (randBool()) ? 'left' : 'right';
        fishXVelocity = (fishSide == 'left') ? 20 : -20;
        fishYVelocity = 0;
        fishPos[0] = (fishSide == 'left') ? 0 : 100;
        newFish = true;

        if (randInt(100) < oddBallRate) {

            if (randBool()) {
                debugPrint("spawnFish: novis oddball!");
                fishVisual = 'none';
            } else {
                debugPrint("spawnFish: noaud oddball!");
                fishAudio = 'none';
            }
        }


        fishCount++;
        debugPrint("spawnFish: spawned fish #" + fishCount + " at time " + (new Date()).getTime());
        debugPrint("spawnFish:"+JSON.stringify([fishVisual, fishAudio, fishSide, fishXVelocity]));
        setTimeout(killFishIfVisible(fishCount), fishLifetime);

        fishBirth = (new Date()).getTime();
        debugPrint("spawnFish: about to push birth!");
        var entry = {
            time: fishBirth - gameStart,
            action: 'birth',
            id: fishCount,
            visual: fishVisual,
            audio: fishAudio,
            side: fishSide
        };
        gameControl.pushLog(entry);
        debugPrint("spawnFish: just pushed birth" + JSON.stringify(entry));
        gameView.playFishAudio();
    }


    function killFishIfVisible(n) {
        return (function() {
            if (fishVisible && (fishCount == n)) {
                debugPrint("KFIV: Times up!"+fishVisible+" "+fishCount+" "+n);
                var now = (new Date()).getTime();
                fishVisible = false;
                var entry = {
                    time: now - gameStart,
                    action: "missed",
                    visual: fishVisual,
                    audio: fishAudio,
                    side: fishSide
                };
                gameControl.pushLog(entry);
                debugPrint("KFIV:"+entry);
                killFish();
                lastReactionTime = 0;
                if (fishVisual == 'none' || fishAudio == 'none') {
                    gameView.playGood();
                } else {
                    missed++;
                    gameView.playBad();
                }
            }
        });
    }

    function killFish() {

        fishVisible = false;
        var delay = minFishSpawn + randInt(maxFishSpawn - minFishSpawn);
        debugPrint("killFish: fish killed... new fish will spawn in " + delay + " ms");
        setTimeout(spawnFish, delay);
        gameView.stopFishAudio();

    }

    function start() {
        fishLifetime = parseInt($("#lifetime").val());
        minFishSpawn = parseInt($("#minIFI").val());
        maxFishSpawn = parseInt($("#maxIFI").val());
        gameDuration = parseInt($("#gameDuration").val());
        oddBallRate = parseInt($("#oddBallRate").val());
        
        fishVisible = false;
        gameStart = (new Date()).getTime();
        endTime = gameStart + gameDuration * 1000;
        fishCount = 0;

        var delay = 1000 + randInt(1000);
        debugPrint("start: game started... new fish will spawn in " + delay + " ms");
        setTimeout(spawnFish, delay);

        setCanvasSize();
        window.onresize = setCanvasSize;
    };

    function setCanvasSize() {
        var canvas = document.getElementById('canvas');
        canvas.width = Math.min(1000, window.innerWidth);
        canvas.height = Math.min(1000, window.innerHeight);
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
            side: fishSide
        };
        gameControl.pushLog(entry);
        debugPrint("logKeyPress"+JSON.stringify(entry));
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
        return ({
            correct: correct,
            incorrect: incorrect,
            missed: missed,
            totalReactionTime: totalReactionTime,
            lastReactionTime: lastReactionTime,
            timeRemaining: timeRemaining
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
        setAVMode: setAVMode,
        getStatus: getStatus,
        updateParameters: updateParameters,
        incrementUserLevel: incrementUserLevel,
        getUserLevel: getUserLevel,
        resetUserLevel: resetUserLevel
    }
}());
