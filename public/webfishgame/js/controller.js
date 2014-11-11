/**
The game controller handles all user input, including clicking on checkboxes,
pressing keys, starting and ending the game, etc.
**/
var gameControl = (function() {
    debugPrint("loading controller");

    var showView = function(selected) {
            $('#userName').text(userModel.getUserName());
            window.location.hash = '#' + selected;
            $('.view').hide();
            $('#'+selected+'-view').show();
            
            if (selected=="game"){
                $('#header').hide();
                $("#canvas").css("display","block");
            }else {
                $('#header').show();
            }
            debugPrint("showing "+'#'+selected+'-view')
            if (selected=="dashboard"){
                gameModel.updateParameters();
            }
            
        };


    var log = [];
    var gameStart = (new Date()).getTime();
    
    function initStat(name){
        return( {name:name, tries:0,correct:0,incorrect:0,missed:0,time:0,reaction:0,missing:0,wrong:0,accuracy:0} );
        };
        
    function initGameStats(){
      return (     
       {
           fast:{fast:initStat("ff"), slow:initStat("fs"), none:initStat("fn")},
           slow:{fast:initStat("sf"), slow:initStat("ss"), none:initStat("sn")},
           none:{fast:initStat("nf"), slow:initStat("ns"), none:initStat("nn")}
       });
     };
     
     var gameStats = initGameStats();
    
    // this is called after a "game event" has occurred
    function pushLog(data){
        debugPrint("pushing "+data);
        log.push(data);
        updateStats(data);
    }
    
    // here is where we update the current stats for this players game
    // at the end we will show it to the player and send this data to the server...
    function updateStats(event){
         debugPrint("updateStat:"+event.visual+" "+event.audio);
         var stats = gameStats[event.visual][event.audio];
         if (event.action=="keypress"){
             stats.tries++;
             if (event.correct) {
                 stats.correct++;
                 stats.time += event.reaction;
             } else {
                 stats.incorrect++;
             }
         } else if (event.action=="missed"){
             stats.missed ++;
             stats.tries++;

         }
         if (stats.tries>0){
            if (event.visual=='none' || event.audio=='none'){
                // in oddball cases the player is supposed to miss!
                stats.missing = Math.round(stats.missed/stats.tries*100)+"%";
                stats.accuracy = Math.round(stats.missed/stats.tries*100)+"%";
                stats.wrong = Math.round(stats.incorrect/stats.tries*100)+"%";  
            }
         else 
           {
             stats.missing = Math.round(stats.missed/stats.tries*100)+"%";
             stats.accuracy = Math.round(stats.correct/stats.tries*100)+"%";
             stats.wrong = Math.round(stats.incorrect/stats.tries*100)+"%";
         }}
         if (stats.correct>0) {
             stats.reaction = Math.round(stats.time/stats.correct);           
         }
         debugPrint("stats are "+JSON.stringify(stats));
     }
     
    window.addEventListener("keydown", keyDownHandler, false);

    /** handle a key press. We only recognize P and L for now.
    **/
    function keyDownHandler(event) {
        if (window.location.hash != "#game") return;
        
        var now = (new Date()).getTime();
        var keyPressed = String.fromCharCode(event.keyCode);
                
        // this is the case where there was no fish visible
        // and they pressed the key. It doesn't count as correct
        // or incorrect 
        if (!gameModel.getFishVisible()) {
            gameModel.logKeyPress('nofish',keyPressed,'incorrect',now);
            gameView.playBad(now);
            return;
        }


        //debugPrint("keydown = "+keyPressed);
        // here is the case where they saw and/or heard a fish
        // and pressed a key classifying it as good or bad
        if (keyPressed == "P") {
            goodKeyPress(now);
        } else if (keyPressed == "L") {
            badKeyPress(now);
        }
    }
    
 

    function goodKeyPress(now) {

        debugPrint("pressed P");

        // if there is not visual or audio any keypresses are wrong!
        // these are the oddball cases ...
        if (gameModel.getFishVisual()=='none' ){
            gameModel.logKeyPress('novis','P','incorrect',now);
            gameView.playBad(now);
            debugPrint("goodKeyPress: goodkey no visual");
            gameModel.killFish();
            return;
        }
        if (gameModel.getFishAudio()=='none'){
            gameModel.logKeyPress('noaud','P','incorrect',now);
            gameView.playBad(now);
            debugPrint("goodKeyPress: goodkey no audio");
            gameModel.killFish();
            return;
        }

        if (gameModel.getFishVisible()) {
            gameModel.killFish();


            if (gameModel.isGoodFish()) {
                gameModel.logKeyPress('good', 'P', 'correct', now);
                gameView.playGood(now);
            } else {
                gameModel.logKeyPress('bad', 'P', 'incorrect', now);
                gameView.playBad(now);
                
            }
        }


    }

    function badKeyPress(now) {
        debugPrint("pressed L");
        
        // if there is not visual or audio any keypresses are wrong!
        // these are the oddball cases ...
        if (gameModel.getFishVisual()=='none' ){
            gameModel.logKeyPress('novis','L','incorrect',now);
            gameView.playBad(now);
            gameModel.killFish();
            return;
        }
        if (gameModel.getFishAudio()=='none'){
            gameModel.logKeyPress('noaud','L','incorrect',now);
            gameView.playBad(now);
            gameModel.killFish();
            return;
        }


        // this is the case where they saw and heard a fish
        //  and pushed the "L" key        
        if (gameModel.getFishVisible()) {
            gameModel.killFish();

            if (gameModel.isGoodFish()) {
                gameModel.logKeyPress('good', 'L', 'incorrect', now);
                gameView.playBad();
            } else {
                gameModel.logKeyPress('bad', 'L', 'correct', now);
                gameView.playGood();
            }
        }

    }
    
    function getPercentCorrect(){
        var totalCongTries = gameStats.fast.fast.tries + gameStats.slow.slow.tries;
        var totalCongCorrect = gameStats.fast.fast.correct  + gameStats.slow.slow.correct;
        var totalIncongTries =  gameStats.fast.slow.tries + gameStats.slow.fast.tries ;
        var totalIncongCorrect =  gameStats.fast.slow.correct + gameStats.slow.fast.correct ;
        
        var reactionCong = (totalCongTries==0)?0:(gameStats.fast.fast.time + gameStats.slow.slow.time)/totalCongTries;
        var reactionIncong = (totalIncongTries==0)?0:(gameStats.fast.slow.time + gameStats.slow.fast.time)/totalIncongTries;
        
        var totalTries = totalCongTries+totalIncongTries;
        var totalCorrect = totalCongCorrect+totalIncongCorrect;
        
        var totalOddballTries = gameStats.none.fast.tries+gameStats.none.slow.tries+gameStats.fast.none.tries+gameStats.slow.none.tries;
        var totalOddballCorrect = 
            gameStats.none.fast.missed+gameStats.none.slow.missed+gameStats.fast.none.missed+gameStats.slow.none.missed;

            
        totalAllTries = totalTries + totalOddballTries;
        totalAllCorrect = totalCorrect+ totalOddballCorrect;
        
        var Allpercent = (totalAllTries==0)? 0: totalAllCorrect*100/totalAllTries;
        var CongPercent = (totalCongTries==0)? 0: totalCongCorrect*100/totalCongTries;
        var IncongPercent = (totalIncongTries==0)? 0: totalIncongCorrect*100/totalIncongTries;
        var OddballPercent = (totalOddballTries==0)? 0: totalOddballCorrect*100/totalOddballTries;
        return [Allpercent,CongPercent,IncongPercent,OddballPercent,reactionCong,reactionIncong,totalCongTries,totalIncongTries];
    }
    
    function endGame(){
        var logelt = document.getElementById('log');
        var stats = getPercentCorrect();
        var percentCorrect = stats[0];
        var msgString = "Sorry you did not advance to the next level...";
        uploadStats(gameStats);

        if (percentCorrect > 90) {
            var userLevel = gameModel.incrementUserLevel();

            alert("new level is "+userLevel);
            msgString = "Congrats!!! You have advanced to level "+ userLevel;
        }
        //logelt.textContent = JSON.stringify(gameStats)+"\n\n\n"+(JSON.stringify(log));
        var statString = "<h2> Percent correct: "+Math.round(stats[0]) + "<br/>"+msgString+"</h2>"+
          "<h2>Congruent: " + stats[6]+" tries "+ Math.round(stats[4])+"ms/correct "+Math.round(stats[1])+"% correct"+ "</h2>"+ 
          "<ul><li>"
           +JSON.stringify(gameStats.fast.fast)+"</li><li>"
           +JSON.stringify(gameStats.slow.slow)+"</li></ul><h2>Incongruent " + stats[7]+" tries "+Math.round(stats[5])+"ms/correct "+Math.round(stats[2])+"% correct"+ "</h2><ul><li>"
           +JSON.stringify(gameStats.fast.slow)+"</li><li>"
           +JSON.stringify(gameStats.slow.fast)+"</li></ul><br/><h2>OddBall " +Math.round(stats[3])+"% correct"+ "</h2><ul><li>"
           +JSON.stringify(gameStats.none.fast)+"</li><li>"
           +JSON.stringify(gameStats.none.slow)+"</li><li>"
           +JSON.stringify(gameStats.fast.none)+"</li><li>"
           +JSON.stringify(gameStats.slow.none)+
           "</li></ul><br/><h2>Log</h2>"
           ;
        $("#log").html( statString+"<\hr>"+(JSON.stringify(log)))
        showView("log");
        gameLoop.stop();
    }
    
    function uploadStats(gameStats){
        console.log("uploading stats!!");
        var userID = userModel.getUserID();
        $.ajax({
               type: "POST",
               url: "/model/gamestats",
               data: JSON.stringify({user:userID,stats:gameStats}),
               contentType: "application/json; charset=utf-8",
               dataType: "json"
           }).done(function(items) {
               console.log("upload complete"+JSON.stringify(items));
           });
    }
    
    function runVisual(){
        setSkin();
        showView("game");
        gameModel.setAVMode("visual");
        startGame();
    }
    
    function runAural(){
        setSkin();
        showView("game");
        gameModel.setAVMode("audio");
        startGame();
    }
    
    function consent(){
        window.localStorage.consentStatus = "consented";
        showView("dashboard");
    }
    
    
    function start(){
        userModel.getUserInfo();
        if (window.localStorage.consentStatus != "consented")
            showView("consent");
        else 
            showView("dashboard");
    }
    
    function setSkin(){
        var skinsel = $("#skin option:selected");
        var a = skinsel.text();
        gameView.setSkin(a);
    }
    
    function startGame(){
        gameLoop.start(); 
        gameModel.start();   
    }
    
    return({
        showView:showView,

        start:start,
        runVisual:runVisual,
        runAural:runAural,
        pushLog:pushLog,
        endGame:endGame,
        consent:consent,
        setSkin: setSkin
    })

}())
