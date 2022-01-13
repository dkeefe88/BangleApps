const pages = 4;
const interval = 5;  // record GPS every 5 sec
const error = 0.002; // 2m filter to reduce GPS errors
var page = 0;
var started = false;
var elapsed = 0;
var distance = 0;
var pace = 0;
var km = 1; // 1km elapsed counter
var oldfix = {lat:0,lon:0};


// create log file
const datetime = new Date().toISOString().replace(/[-:]/g, '');
const date = datetime.substr(2, 6);
const time = datetime.substr(9, 6);
const filename = `dkrun_${date}_${time}`;
var file = require("Storage").open(filename,"a");


// GPS On and LCD Bright
Bangle.setGPSPower(1);
Bangle.setLCDBrightness(1);
g.clear();
g.setColor(1,0,0);
g.fillRect(120, 200, 240, 240);


// Calculate distance in km from 2 lat/lon points
function calcDist(lat1,lon1,lat2,lon2) {
  rlat1 = lat1*Math.PI/180;
  rlon1 = lon1*Math.PI/180;
  rlat2 = lat2*Math.PI/180;
  rlon2 = lon2*Math.PI/180;
  theta = (lon1-lon2)*Math.PI/180;
  dist1 = Math.sin(rlat1)*Math.sin(rlat2);
  dist2 = Math.cos(rlat1)*Math.cos(rlat2)*Math.cos(theta);
  dist = Math.acos(dist1+dist2)*180*60*1.852/Math.PI;
  if (dist < error || isNaN(dist)) {dist = 0;}
  return dist;
}


// write to log file
function writeLog(fix,dist) {
  file.write(fix.time+","+
             fix.lat+","+
             fix.lon+","+
             fix.alt+","+
             fix.speed+","+
             fix.course+","+
             fix.satellites+","+
             fix.hdop+","+
             dist+"\n");
}


// update display
function updateDisplay() {
  switch(page%pages) {

  case 0: // stopwatch page
    g.setColor(1,1,1);
    g.clearRect(64, 16, 240, 62);
    g.setFont("Vector",46);
    g.drawString("Stopwatch",4,16,true);
    ed = Date(0,0,0,0,0,elapsed,0);
    eh = ed.getHours();
    eh = ("0"+eh).substr(-2);
    em = ed.getMinutes();
    em = ("0"+em).substr(-2);
    es = ed.getSeconds();
    es = ("0"+es).substr(-2);
    g.clearRect(2, 100, 240, 180);
    g.setFont("Vector",58);
    g.drawString(eh+":"+em+":"+es,2,100);
    break;

  case 1: // distance page
    g.setColor(1,1,1);
    g.clearRect(4, 16, 240, 66);
    g.setFont("Vector",46);
    g.drawString("Distance",26,16,true);
    g.clearRect(2, 100, 240, 180);
    g.setFont("Vector",88);
    g.drawString(distance.toFixed(2),4,100);
    break;

  case 2: // average pace page
    g.setColor(1,1,1);
    g.clearRect(4, 16, 240, 66);
    g.setFont("Vector",46);
    g.drawString("Av Pace",26,16,true);
    g.clearRect(2, 100, 240, 180);
    g.setFont("Vector",88);
    pm = pace.toFixed(0);
    ps = Math.round((pace-pm)*60);
    ps = ("0"+ps).substr(-2);
    g.drawString(pm+":"+ps,4,100);
    break;

  case 3: // time page
    g.setColor(1,1,1);
    g.clearRect(26, 16, 240, 62);
    g.setFont("Vector",46);
    g.drawString("Time",64,16,true);
    cd = Date();
    ch = cd.getHours();
    ch = ("0"+ch).substr(-2);
    cm = cd.getMinutes();
    cm = ("0"+cm).substr(-2);
    cs = cd.getSeconds();
    cs = ("0"+cs).substr(-2);
    g.clearRect(4, 100, 240, 180);
    g.setFont("Vector",58);
    g.drawString(ch+":"+cm+":"+cs,2,100);
    break;
  }
}


function onGPS(fix) {
  if (fix.fix) {
    g.setColor(0,1,0);
    g.fillRect(0, 200, 120, 240);

    if (!started) {
      oldfix=fix;
    }

    if (started && elapsed%interval==0) {
      dist = calcDist(oldfix.lat,oldfix.lon,fix.lat,fix.lon);
      writeLog(fix,dist);
      distance += dist;
      if (distance >= km) {
        Bangle.buzz();
        Bangle.beep();
        km++;
      }
      pace = elapsed/(60*distance);
      oldfix=fix;
    }
  }

  else {
    g.setColor(1,0,0);
    g.fillRect(0, 200, 120, 240);
  }
}


// BTN1 to start/stop recording
setWatch(function() {
  started = !started;
  if (started) g.setColor(0,1,1); else g.setColor(1,0,0);
  g.fillRect(120, 200, 240, 240);
  //Bangle.buzz();
  Bangle.beep();
}, BTN1, {repeat:true});


// BTN3 to scroll through display pages
setWatch(function() {
  page++;
  updateDisplay();
}, BTN3, {repeat:true});


// update every second
setInterval(function() {
  if (started) elapsed++;
  updateDisplay();
}, 1000);


// call GPS read function
Bangle.on('GPS',onGPS);
