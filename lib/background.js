// init tQuery
var world = tQuery.createWorld({
  renderW : 256,
  renderH : 256
}).start().addBoilerplate({
  windowResize  : false
});

world.tCamera().position.z  = 2;

// add an object
var object  = tQuery.createTorus().addTo(world).scaleBy(2);  

// ## The fog

// We had a fog to the scene.
// For that, we use ```tquery.world.createfog.js``` plugins.
// It allows to create the 2 types of fog from three.js
// : [fogexp2](https://github.com/mrdoob/three.js/blob/master/src/scenes/FogExp2.js)
// and
// [fog](https://github.com/mrdoob/three.js/blob/master/src/scenes/Fog.js).
// ```density``` is the density of the fog. 0.01 is very light, 0.9 is almost opaque.
// In general, fogs are a nice visual trick. It is rather cheap to compute
// and limits the depth of what you see.
// It is a nice trick to hide the "end of the world" :)
world.addFogExp2({density : 0.1});



// # The Ground

// We create a large checkerboard with ```tquery.checkerboard.js``` plugin.
// We scale the checkerboard to 100 per 100 units in the 3D world. Thus it is
// quite large and disappears into the fog. It gives the cheap impression of
// an infinite checkerboard.
tQuery.createCheckerboard({
  segmentsW : 50,  // number of segment in width
  segmentsH : 50 // number of segment in Height
}).addTo(world).scaleBy(100).translate(0,-2,0);

var sourceEl  = world.tRenderer().domElement;
var canvas  = fx.canvas();
var texture = canvas.texture(sourceEl);

canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top  = "0";
canvas.style.width  = "100%";
canvas.style.height = "100%";
document.body.appendChild(canvas);

var startTime = (new Date()).getTime();
world.loop().hook(function(){
  var dateTime = new Date();
  var timeDiff = dateTime.getTime() - startTime;
  var blurAmount = 1.0 - (timeDiff / 1000) / 8;
  if (blurAmount < 0.2) blurAmount = 0.2;
  texture.loadContentsOf(sourceEl);
  canvas.draw(texture)
    .swirl(canvas.width/2, canvas.height/2, 100, Math.sin(dateTime.getTime() / 3000) * 2.0)
    //.ink(0.3)
    .zoomBlur(canvas.width/2, canvas.height/2, blurAmount)
    //.dotScreen(canvas.width/2, canvas.height/2, 1.1, 3)
    //.lensBlur(5, 1.0, 0)
    //.tiltShift(123, 267, 495, 234, 15, 200)
    .vignette(0.5, 0.5)
    //.hexagonalPixelate(canvas.width/2, canvas.height/2, 5)
    .update();
});
