let ws;
let currentIndex = 0;
let tiles = [];

var bpm=60;
let gameSpeed = Math.round((60/bpm)*1000)+300; //magasabb bpm=alacsonyabb gamespeed, emiatt a gameInterval gyorsabban lefut
var tileFallSpeed =bpm/30; // ennyi pixelt esik minden frisiítéskor

let score = 0;

let winInfo=document.getElementById('win');
let loseInfo=document.getElementById('lose');
let endInfo=document.getElementById('end');
let gameSpaceHeight=document.getElementById('gameContainer').offsetHeight;

let gameOver=false;


class Note {
    constructor(key,color, duration, lane) {
        this.key = key;              //melyik hangjegyet üsse le az esp32
        this.color=color;           //milyen szinu legyen a tile
        this.duration = duration;  //milyen hang legyen pl. 0.5=félhang, 0.25=negyedhang, stb.
        this.lane = lane;         // melyik oszlopban essen le a tile (1-4)
    }
}
let boci = [
    new Note("C4","red",0.5,1), //piros szinu tile ay egyes oszlopban, ami egy félhang (Dó)
    new Note("E4","black",0.5,2), 
    new Note("C4","black",0.5,1), 
    new Note("E4","black",0.5,2), 
    new Note("G4","black",1,3), 
    new Note("G4","black",1,3), 
    new Note("C4","black",0.5,1), 
    new Note("E4","black",0.5,2), 
    new Note("C4","black",0.5,1), 
    new Note("E4","black",0.5,2), 
    new Note("G4","black",1,3), 
    new Note("G4","black",1,3), 
    new Note("C5","black",0.5,4), 
    new Note("B4","black",0.5,3), 
    new Note("A4","black",0.5,2), 
    new Note("G4","black",0.5,1), 
    new Note("F4","black",1,1), 
    new Note("A4","black",1,3), 
    new Note("G4","black",0.5,4), 
    new Note("F4","black",0.5,3), 
    new Note("E4","black",0.5,2), 
    new Note("D4","black",0.5,1), 
    new Note("C4","black",1,1), 
    new Note("C4","black",1,1),


    new Note("","white",1,1), //ez e 4 nem tudom miért kell, de ha nincs, akkor nem működik a score system xd
    new Note("","white",0.1,1), // ne kérdezd... spagetti...
    new Note("","white",0.1,1), 
    new Note("","white",0.5,1),
  
  ]



   
class Tile {
    constructor(note) { 
        this.note = note.key;
        this.column = document.getElementById("col"+note.lane);
        this.element = document.createElement('div');
        this.element.className = 'tile';
        this.element.style.top = '-100px';
        this.column.appendChild(this.element);
        this.exists=true
        this.element.style.backgroundColor=note.color;

        this.element.addEventListener('click', () => {
            if(this===tiles[0]){ 
            this.sendNoteToESP32();
            this.column.removeChild(this.element); //torli htmlbol
            this.exists=false;
            tiles.shift();  //törli az arraybol
                
            }
            else{
                isGameOver(); //ha a lenyomott tile nem a legalsó, gameover
            }
        });
    }

    sendNoteToESP32() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(this.note);
        }
        score++;
        isGameWon();
        document.getElementById('scoreDisplay').innerText = `Score: ${score}`;
    }
    

    moveTile() {
        let topPosition = parseInt(this.element.style.top);
        this.element.style.top = (topPosition + tileFallSpeed) + 'px';

        
        if (topPosition < gameSpaceHeight) {                //ha a tile teteje magasabban van a gamecontainer aljanal, mozog lefele
            requestAnimationFrame(this.moveTile.bind(this));
        } else {                                           //ha a tile egyvonalba kerul a gamecontainer aljával, gameover
            if(this.exists==true){
            console.log("leesett egy tile")
       isGameOver()  ;  }  }
    }
}


function initWebSocket() {
    ws = new WebSocket('ws://192.168.82.74:81');       //esp32 ip cime alapján letreoz egy ws szervert

    ws.onopen = function() {
        console.log('WebSocket connection established');
        startGame();
    };

    ws.onmessage = function(event) {
        console.log('Message from ESP32: ' + event.data);
    };

    ws.onclose = function() {
        console.log('WebSocket connection closed');
    };

    ws.onerror = function(error) {
        console.log('WebSocket error: ' + error);
    };
}
let level=1;

function whichLevel(){
    switch(level){
        case 1:
            gameSpeed = 1800 ;
            tileFallSpeed =2;
            break;
        case 2:
            gameSpeed = 1200; 
            tileFallSpeed =3;
            break;
        case 3:
            gameSpeed =  1000;
            tileFallSpeed =4;
            break;
        case 4:
            gameSpeed =  800;
             tileFallSpeed =5;
            break;
        case 5:
            gameSpeed =  600;
            tileFallSpeed =6;
            break;
    }
}
function isGameWon(){
    if(score==24 || score==49 || score==74 || score==99 || score==124){
        tiles.forEach(tile => {
            if (tile.column.contains(tile.element)) {
                tile.column.removeChild(tile.element);
                tile.exists=false;
               
            }
        });
        winInfo.style.visibility=('visible');

      }
      if(score==149){
        tiles.forEach(tile => {
            if (tile.column.contains(tile.element)) {
                tile.column.removeChild(tile.element);
                tile.exists=false;
               
            }
        });
    tiles = []; 
    gameOver=false;

  endInfo.style.visibility=('visible');
}
}
function isGameOver(){
    tiles.forEach(tile => {                         //egyesével végigmegy minden oszlop minden tilején és törli őket
        if (tile.column.contains(tile.element)) {
            tile.column.removeChild(tile.element)
            tile.exists=false;
        }
    });
    gameOver=true;

    loseInfo.style.visibility=('visible');      //megjeleníti a gameover screent
}
let gameInterval;


    function startGame() {
           whichLevel();
        function createTile() {
            if (currentIndex < boci.length && !gameOver) {
                let note = boci[currentIndex];
                let tile = new Tile(note);
                tile.moveTile(); 
                tiles.push(tile);
                currentIndex++;
    
                
             
                isGameWon();
                if (currentIndex < boci.length) {
                    gameInterval = setTimeout(createTile, gameSpeed * boci[currentIndex-1].duration);
                }
            }
            console.log(bpm+' '+ gameSpeed+' '+ tileFallSpeed);
        }
    
        createTile();
    }

function restartGame() {
      level=1;
      score = 0;
      document.getElementById('scoreDisplay').innerText =`Score: ${score}`;

      clearInterval(gameInterval); 

      currentIndex = 0;
  
      tiles.forEach(tile => {
          if (tile.column.contains(tile.element)) {
              tile.column.removeChild(tile.element);
              tile.exists=false;
              
          }
      });
      tiles = [];

      gameOver=false;
  
      winInfo.style.visibility=('hidden');
      loseInfo.style.visibility=('hidden');

      startGame();
    
}

function nextLevel(){
      score++;
      document.getElementById('scoreDisplay').innerText =` Score: ${score}`;

      level++;
      currentIndex = 0;
  
      tiles.forEach(tile => {
        if (tile.column.contains(tile.element)) {
            tile.column.removeChild(tile.element);
            tile.exists=false;
        }});
      tiles = []; 
        clearTimeout(gameInterval);
      gameOver=false;
      winInfo.style.visibility=('hidden');
        whichLevel();
      startGame();

}
window.onload = function() {
    initWebSocket();
   // if (ws && ws.readyState === WebSocket.OPEN) {
    startGame();
//}
}


document.getElementById('gameContainer').addEventListener('click', function (event) {
        let clickedElement = event.target;
    
        if (clickedElement.classList.contains('tile')) { //ha a klikkelt ponton nincs tile, gameover

        } else {
            isGameOver();
        }
    });