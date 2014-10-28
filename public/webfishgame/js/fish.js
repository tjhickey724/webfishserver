/**
  This defines the fish object, but I'm not yet using it....
**/
function Fish(now,side,visual,audio){
    var birth=now;
    var y=50;
    var x = (side=='left')?0:100;
    var vy=0;
    var vx= (side=='left')?10:-10;
    var lastUpdate=birth;
}

Fish.prototype.update = function(now){
    var age=(now-birth);
    var delta = (now-lastUpdate);
    lastUpdate = now;
    x += vx*delta/1000.0;
    if ((x>100)||(x<0))
        vx *= -1;
}