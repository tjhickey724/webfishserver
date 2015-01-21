/**
the gameView object is responsible for updating the user's view,
both in gameview mode and when visiting other pages...
We might want to separate this out later into multiple objects,
especially if we have multiple games!!  
Ideally the games will be relatively independent of each other
and we shouldn't use a SinglePageApp model for the games...
**/

var gameView = (function(){
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
    var soundOddball = new Audio('sounds/5hzHigh/fish.wav');

    function setSkin(skin){
        if (skin=="fish"){
            imgTargetL = imgFishL;
            imgTargetR = imgFishR;
            img1 = imgStream;
        }else if (skin=="space"){
            imgTargetL = imgSpaceshipL;
            imgTargetR = imgSpaceshipR;
            img1 = imgSpace;
        }
    }
    
    
    function playGood(){
        audioGood.play();
    }
    
    function playBad(){
        audioBad.play();
    }
    
    function playFishAudio(){
        fishSound = (gameModel.getFishAudio()=='fast')?soundFast:soundSlow;
        
        //if (gameModel.getFishVisual() == 'none'){
        //    fishSound = soundOddball; 
        //} 
        
        if (gameModel.getFishAudio()!='none')
            fishSound.play();
    }
    
    function stopFishAudio(){
        fishSound.pause();
        fishSound.currentTime=0;
    }


    function update(now){


        drawBackground2(img1); // draw the background flowing by in a seamless way...
        debugPrint(gameModel.getFishVisible());
        var hz = (gameModel.getFishVisual()=='fast')?8:5;
        
        drawStats();
        if (gameModel.getFishVisual()=='none'){
            return;
        }
        if (gameModel.getFishVisible()){
            drawFish([imgTargetL,imgTargetR],hz);
        }

        
    }
   
function drawStats(){
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var cw = canvas.width;
    var ch = canvas.height;
    ctx.font = "10pt monospace"
    ctx.fillStyle='#FFAA33';
    var status  =gameModel.getStatus();
    var correctness = Math.round(100*status.correct/(status.correct+status.incorrect+status.missed));
    ctx.fillText(""+correctness+"%",cw/2-30, ch/2);
    ctx.fillText(""+  Math.round(status.lastReactionTime)+" ms",cw/2-30,ch/2+20);
    ctx.fillText("T - " +Math.round(status.timeRemaining)+" sec",cw/2-30,ch/2+40);
    ctx.fillText(" "+gameLoop.getLastStepTime()+"ms "+Math.round(1000/gameLoop.getLastStepTime())+"fps",cw/2-10,ch-20);
} 

   

function drawFish(img,hz){
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var cw = canvas.width;
    var ch = canvas.height;
    var fishPos = gameModel.getFishPos();
    var fishImage = (gameModel.getFishSide()=='left')?img[0]:img[1];
    var w = cw*gameModel.getFishSizePercent()/100;
    var h = w*fishImage.height/fishImage.width;
    var sec = ((new Date()).getTime() % 1000)/1000.0;
    var scale = 1+(1-Math.cos(Math.PI*2*hz*sec))/2*1.0;

    var hscale = (gameModel.getFishSide()=='left')?1:-1;

    var x = fishPos[0]*cw/100-w/2;
    var y = fishPos[1]*ch/100-h/2*scale;
    ctx.drawImage(fishImage,x,y,w,h*scale);

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
        var yValue = gameModel.getImageOffset()*5;
        document.getElementById('canvas').style.backgroundPosition = '0px ' + yValue + 'px';
        
    }

    /* this image draws the background using the canvas API */
    function drawBackground2(img) {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');
        var cw = canvas.width;
        var ch = canvas.height;
        var yoff = gameModel.getImageOffset();

        drawFlippedImage(img,0,yoff*ch/100   ,cw,ch);
        if (yoff > 100)
          yoff -= 200;
        ctx.drawImage(img,0,yoff*ch/100,cw,ch);
 
    }
    
    function drawFlippedImage(img,xoff,yoff,w,h){
        var ctx = document.getElementById('canvas').getContext('2d');

        ctx.save();
        ctx.scale(1,-1);
        ctx.drawImage(img,0,-yoff,w,h);
        ctx.restore();
		//console.log(document.getElementById('canvas'));
    }
	
	function showLevels(){
		var gameStats = userModel.getGameStats();
		var levels;
		var rows;
		levels =gameStats.visual;
		rows="";
		for(var x=0; x<=10; x++){
			//console.log(JSON.stringify(levels[x]));
			var y = levels[x];
			var leaders = gameStats.leaders.visual[x];
			var leader={accuracy:0,reaction:2000};
			if (leaders!=null && leaders.length>0) {leader = leaders[0];}
			
			if (y==undefined){
				var active = "class='btn btn-sm btn-default' disabled";
				if (x==0 || levels[x-1]!= undefined  && levels[x-1].accuracy > 0.8) {active = "class='btn btn-sm btn-success' onclick='gameControl.changeLevelMode("+x+",\"visual\")'";}
				rows += "<tr><td><button  "+active+"> Level "+x+" </button>  </td><td>--</td>"+
				"<td>"+Math.round(100*leader["accuracy"])+"% ("+
				      Math.round(leader["reaction"])+"ms) </td>"+
				"</tr>";
			} else {
				var level = y["_id"].level;
			
				console.log("leaders = "+JSON.stringify(leaders));
				
				rows += "<tr><td><button class='btn btn-sm btn-primary' onclick='gameControl.changeLevelMode("+level+",\"visual\")'"+ " >Level "+ y["_id"].level +"</button></td>"+
				"<td>"+Math.round(y.accuracy*100)+"% ("+Math.round(y.reaction)+"ms)</td>"+
				"<td>"+Math.round(100*leader["accuracy"])+"% ("+
				       Math.round(leader["reaction"])+"ms) </td>"+
				"</tr>";
			}
			
		}
		//console.log(rows);
		var z1 = document.getElementById("visualList");
		var header="<thead><tr><th>level</th><th>my score</th><th>best score</th><th>best user</th></tr></thead>";
		z1.innerHTML = header+rows;
		
		
		levels =gameStats.auditory;
		rows="";
		for(var x=0;x<=10;x++){
			//console.log(JSON.stringify(levels[x]));
			var y = levels[x];
			
			var leaders = gameStats.leaders.auditory[x];
			var leader={accuracy:0,reaction:2000};
			if (leaders!=null && leaders.length>0) {leader = leaders[0];}
			if (y==undefined){
				var active = "class='btn btn-sm btn-default' disabled";
				if (x==0 || levels[x-1]!= undefined  && levels[x-1].accuracy > 0.8) {active = "class='btn btn-sm btn-success' onclick='gameControl.changeLevelMode("+x+",\"auditory\")'";}
				rows += "<tr><td><button "+active+ "> Level "+x+" </button>  </td><td>--</td><td>--</td>"+
				"<td>"+Math.round(100*leader["accuracy"])+"% </td>"+
				"<td>"+Math.round(leader["reaction"])+"ms </td>"+
				"</tr>";
			}else {
				var level = y["_id"].level;
			
				rows += "<tr><td><button  class='btn btn-sm btn-primary' onclick='gameControl.changeLevelMode("+level+",\"auditory\")'"+ " >Level "+ y["_id"].level +"</button></td>"+
				"<td>"+Math.round(y.accuracy*100)+"% </td><td>"+Math.round(y.reaction)+"ms </td>"+
				"<td>"+Math.round(100*leader["accuracy"])+"% </td>"+
				"<td>"+Math.round(leader["reaction"])+"ms </td>"+
				//"<td>"+JSON.stringify(leader)+"</td>"+			
				"</tr>";
			}
			
		}
		//console.log(rows);		
		var z2 = document.getElementById("auditoryList");
		
		z2.innerHTML = header+rows;
	}
    
    return({
        update: update,
        playGood: playGood,
        playBad: playBad,
        playFishAudio: playFishAudio,
        stopFishAudio: stopFishAudio,
        setSkin: setSkin,
		showLevels: showLevels
    })
}())