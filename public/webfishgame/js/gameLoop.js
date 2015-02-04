/**
The gameloop repeatedly updates the model and redraws the screen.
You can stop it with gameLoop.stop() and (re)start it with gameLoop.start();
It also generates an array of stepTimes showing the length of time in milliseconds
between successive frames...
**/


var gameLoop = (function(){
    debugPrint("creating gameLoop");
    
    var stepTimes = [];
    var lastStepTime=0;
    
    var lastTime = currentTime();
    var count=0;
    var fps=60;
    var interval = 1000/fps;
    var gameOver=false;
    
    function stopGame(){
        gameOver=true;
    }
    
    function startGame(){
        gameOver=false;
        gameLoop();
    }
    
    
    function gameLoop() {
        //console.log("updating "+Date());
        if (gameOver) return;
        count++;
        
        window.requestAnimationFrame(gameLoop);

        var now = currentTime();
        var delta = (now-lastTime);
        lastStepTime=delta;
        stepTimes[delta] = stepTimes[delta]+1 | 1;
        lastTime=now;
        //    debugPrint("time="+currentTime);

        if(true) { //delta > interval) {
            //debugPrint("delta="+ delta);
            
            gameModel.update(now);
            gameView.update(now);
        }
    }
    
    function getStepTimes(){
        return stepTimes;
    }
    
    function getLastStepTime(){
        return lastStepTime;
    }
    
    function currentTime(){
        return( (new Date()).getTime()  );
    }
    
    gameLoopObj = {
        start: startGame,
        stop: stopGame,
        getStepTimes: getStepTimes,
        getLastStepTime: getLastStepTime
    };
    
    return(gameLoopObj);
} ())