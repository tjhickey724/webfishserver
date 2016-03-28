This is the EEG version of the FishPolice game.

It has been designed for in-lab experiments where the subject's EEGs are being recorded using the MuseBand.

The key differences are
* Each fish is on screen for 2 seconds, followed by a 1 second IFI
* Each game is 90 seconds long and has 30 fish. There are five fish of each of the six types:
	* FF, FS, SF, SS, FN, SN
  but their order is a random permutation seeded by the game number.
* The first 20 games are non-leveled and used to study learning


Notes:
All of these changes take place in the js/model.js file
except possibly the fact that the fish stay on the screen for two seconds....

My approach will be to use a 3 second timer to spawn the fish
and a two second timer to make the fish disappear from the screen,
but to leave the other logic as it is.. so "FishVisible" will be false
after the user clicks on a key even though the fish will still be on the
screen....  I should really rename it to "FishAlive" but perhaps later...

Also, the way fish are spawned in the original version is that a random number generator 
is used to pick the audio and visual speeds of the fish and the side it appears.
In this case, we will generate a permutation of the six cases
FF,FS,FN, SF,SS,SN

Goals:
DONE * change fishlifetime to 2000ms and IFI to 1000ms
DONE * change model so fish are created every 3000ms and killed after 2000ms
DONE * change model so that fish stay on the screen making their sound until 2000ms expires
DONE * change model so that each game is 90 seconds and all six kinds of fish appear exactly five times
* change level screen so that it shows the user's performance in the past N games

