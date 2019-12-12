"use strict";

var gl; //webgl context

var a_coords_loc; //location of the a_coords atrr in the shader program
var a_coords_buffer; //buffer to hold the values for a_coords

var a_normal_loc; //location of the normal attribute
var a_normal_buffer; //buffer for a_normal

var index_buffer; //Buffer to hold vertex indices from model


var u_diffuseColor; //Location of the uniform variables in the shader program
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;

var u_ambient;
var u_diffuse;
var u_specular;

var projection = mat4.create(); //projection matrix
var modelview; //modelview matrix
//var modelview = mat4.create(); //this or rotator??
var normalMatrix = mat3.create();
var rotator; //trackball rotator implemented as a mouse

var lastTime = 0;
var colors = [ [1,1,1] ]; //RGB color arrays for diffuse & specular color vals
//[0] sunlight [1] street light
var lightPositions = [ [0,0,0,1], [0,0,0,1]]; //vals for light pos
//var animate = false;

//for animation
var animateMe = false
var animationAngle = degToRad(15);
var then = 0;
var now = 0;
var sunAngle = Math.PI/2;
var day = true;
var frame = 0;
var mvMatrix = mat4.create();
var mvMatrixStack = [];

//cube(side), ring(innerRadius, innerRadius, slices), uvSphere(radius, slices, stacks), uvTorus(outerRadius, innerRadius, slices, stacks), uvCylinder(radius,height, slices, noTop, noBottom), uvCone(radius, height, slices, noBottom), 

//objs for display
var objects = [cube(),ring(), uvSphere(), uvTorus(.5,.5/2.5,32,16), uvCylinder(), uvCone()];
var currentModelNumber; //contains data for current obj


function degToRad(degrees){
  return degrees * Math.PI / 180;
}

function draw() {
  gl.clearColor(0.15, 0.15, 0.3, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  mat4.perspective(projection, Math.PI/5, 1, 10, 20);
  gl.uniformMatrix4fv(u_projection, false, projection);
  modelview = rotator.getViewMatrix();
  
  world();
}

function animate() {
    if (then==0)
    {
      then = Date.now();
    }
    else
    {
    now=Date.now();
    // Convert to seconds
    now *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = now - then;
    // Remember the current time for the next frame.
    then = now;

    sunAngle += Math.Pi/360;
    if(sunAngle > 2* Math.PI){
      sunAngle = 2* Math.PI;
    }  

    day = sunAngle < Math.PI;

    frame += 1;
    
    // Animate the Rotation
//    modelYRotationRadians += 0.01;
    }
}

function world(){
  sun();
  streetLight();
  /*World Plane*/
  //Road
  mvPushMatrix();
  installModel(objects[1]);
  currentModelNumber = 1;
  //gl.uniform4f(u_diffuseColor, 2, 0, 2, 1);

  mat4.translate(modelview, modelview, [0, 0.3, 0]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [5.5,5.5,5.5]);

  update_uniform(modelview, projection, 1);
  modelview = rotator.getViewMatrix();
  mvPopMatrix();

  //Grass
  mvPushMatrix();
  installModel(objects[4]);
  currentModelNumber = 4;
  gl.uniform4f(u_diffuseColor, 0, 1, 0, 1);

  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [7, 7, 0.5]);

  //currentColor = [0.8, 0.8, 1, 1];
  update_uniform(modelview, projection, 4);
  modelview = rotator.getViewMatrix();
  mvPopMatrix();

  mvPushMatrix();
  tree();
  mvPopMatrix();

  mvPushMatrix();
  mat4.rotate(modelview,modelview,(-frame)/180*Math.PI,[0,1,0]);
  car();

  //streetLight();
  mvPopMatrix();

}

function car(){

  //cockpit
  installModel(objects[0]);
  currentModelNumber = 0;
  gl.uniform4f(u_diffuseColor, 1, 0, 0, 1);

  mat4.translate(modelview, modelview, [1.85, .80, .85]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.80, .90, 0.15]);

  update_uniform(modelview, projection, 0);
  modelview = rotator.getViewMatrix();

  //body
  installModel(objects[0]);
  currentModelNumber = 0;

  mat4.translate(modelview, modelview, [1.85,.40, 1.1]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.90, 1.75, .35]);

  update_uniform(modelview, projection, 0);
  modelview =  rotator.getViewMatrix();

  //Front Axel
  installModel(objects[4]);
  currentModelNumber = 4;
  gl.uniform4f(u_diffuseColor, 0.5, 0.5, 0.5, 1);

  mat4.translate(modelview, modelview, [1.85, 0, 1.5]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.10, .10, 1.4]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Back Axel

  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.85, .55, .25]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.10, .10, 1.4]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Back Tire 1

  installModel(objects[3]);
  currentModelNumber = 3;
  gl.uniform4f(u_diffuseColor, 0.2, 0.2, 0.2, 1);

  mat4.translate(modelview, modelview, [2.45, 0.55, .25]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.65, .65, .65]);

  update_uniform(modelview, projection, 2);
  modelview = rotator.getViewMatrix();

  //Back Tire 2

  installModel(objects[3]);
  currentModelNumber = 3;

  mat4.translate(modelview, modelview, [1.25, .55, .25]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.65, .65, .65]);

  update_uniform(modelview, projection, 2);
  modelview = rotator.getViewMatrix();

  //Front Tire 1

  installModel(objects[3]);
  currentModelNumber = 3;

  mat4.translate(modelview, modelview, [1.25, 0, 1.5]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.65, .65, .65]);

  update_uniform(modelview, projection, 2);
  modelview = rotator.getViewMatrix();

  //Front Tire 2

  installModel(objects[3]);
  currentModelNumber = 3;

  mat4.translate(modelview, modelview, [2.45, 0, 1.5]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.rotate(modelview, modelview, 1.565, [0, 1, 0]);
  mat4.scale(modelview, modelview, [.65, .65, .65]);

  update_uniform(modelview, projection, 2);
  modelview = rotator.getViewMatrix();


  //Spoke(Front Wheel 2) 1

  installModel(objects[4]);
  currentModelNumber = 4;
  gl.uniform4f(u_diffuseColor, 1, 1, 0, 1);

  mat4.translate(modelview, modelview, [2.45, 0, 1.5]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 2(Front Wheel 2)

  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [2.45, 0, 1.5]);
  mat4.rotate(modelview, modelview, 3.57, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 3(Front Wheel 2)

  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [2.45, 0, 1.5]);
  mat4.rotate(modelview, modelview, 1.25, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 1(Front Wheel 1)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.25, 0, 1.5]);
  mat4.rotate(modelview, modelview, 1.25, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 2(Front Wheel 1)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.25, 0, 1.5]);
  mat4.rotate(modelview, modelview, 3.57, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 3(Front Wheel 1)
  installModel(objects[4]);

  mat4.translate(modelview, modelview, [1.25, 0, 1.5]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 1(Back Wheel 1)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [2.45, 0.56, 0.25]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 2(Back Wheel 1)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [2.45, .56, .25]);
  mat4.rotate(modelview, modelview, 1.25, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 3(Back Wheel 1)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [2.45, .56, .25]);
  mat4.rotate(modelview, modelview, 3.57, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 1(Back Wheel 2)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.25, .56, .25]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 2(Back Wheel 2)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.25, .56, .25]);
  mat4.rotate(modelview, modelview, 1.25, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();

  //Spoke 3(Back Wheel 2)
  installModel(objects[4]);
  currentModelNumber = 4;

  mat4.translate(modelview, modelview, [1.25, .56, .25]);
  mat4.rotate(modelview, modelview, 3.57, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.05, .05, .60]);

  update_uniform(modelview, projection,4);
  modelview = rotator.getViewMatrix();



  //Head light 1

  installModel(objects[2]);
  currentModelNumber = 2;

  mat4.translate(modelview, modelview, [2.14, 0, 1.9]);
  mat4.scale(modelview, modelview, [.14, .14, .14]);

  update_uniform(modelview, projection, 3);
  modelview = rotator.getViewMatrix();

  //Head light 2

  installModel(objects[2]);
  currentModelNumber = 2;

  mat4.translate(modelview, modelview, [1.56, 0, 1.9]);
  mat4.scale(modelview, modelview, [.14, .14, .14]);

  update_uniform(modelview, projection, 3);
  modelview = rotator.getViewMatrix();

}

function sun(){
  installModel(objects[2]);
  currentModelNumber = 2;
  mat4.translate(modelview, modelview, [1, 3, 1, 1]);
  
  var sunlight = [ modelview[12], modelview[13], modelview[14] ];
  lightPositions[0] = sunlight;
  if(day){
    gl.uniform4f(u_diffuseColor, 1 ,1, 0, 1);
    gl.uniform4f(u_lightPosition, sunlight[0], sunlight[1], sunlight[2]+2, 1);
  }
  else{
    //gl.uniform4fv(u_lightPosition, [0, 10, 0, 0]);
    gl.uniform4f(u_diffuseColor, 0.7 ,0.7, 0, 1);
  }
  update_uniform(modelview, projection, 2);
  modelview = rotator.getViewMatrix();

}

function tree(){
  //4cylinder //5 conei
  //Trunk
  installModel(objects[4]);
  currentModelNumber = 4;
  gl.uniform4f(u_diffuseColor, .96, .40, 0, 1);
  
  mat4.translate(modelview, modelview, [0.6, 0.6, 0]);
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [0.3, 0.3, 0.4]);
  
  update_uniform(modelview, projection, 4);
  modelview = rotator.getViewMatrix();

  //Leaves
  installModel(objects[5]);
  currentModelNumber = 5;
  gl.uniform4f(u_diffuseColor, 0, 1, 0, 1);

  mat4.translate(modelview, modelview, [0.6, 1.2, 0.3]);
  mat4.rotate(modelview, modelview, 5.14, [1, 0, 0]);
  //mat4.scale(modelview, modelview, [1, 1, 1.3]);

  update_uniform(modelview, projection, 5);

  update_uniform(modelview, projection,5);
  modelview = rotator.getViewMatrix();

}



function streetLight(){

  //pole
  installModel(objects[4]);
  currentModelNumber = 4;
  gl.uniform4f(u_diffuseColor, 0.5, 0.5, 0.5, 1);

  mat4.translate(modelview, modelview, [0, .80, .25]); 
  mat4.rotate(modelview, modelview, 2.0, [1, 0, 0]);
  mat4.scale(modelview, modelview, [.15, .15, 1.25]);

  update_uniform(modelview, projection, 4);
  modelview = rotator.getViewMatrix();

  //light
  installModel(objects[2]);
  currentModelNumber = 2;
  mat4.translate(modelview, modelview, [0, 1.40, .53]);
  mat4.scale(modelview, modelview, [.25, .25, .25]);
  
  var lampLight = [ modelview[12], modelview[13], modelview[14] ];
  
  if(!day){
    //set light pos for night time
    lightPositions[1] = lampLight;
    gl.uniform4f(u_lightPosition, lightPositions[1][0],lightPositions[1][1],lightPositions[1][2]+2, 1);
    gl.uniform4f(u_diffuseColor, 1, 1, 0, 1);
  }
  else{
    gl.uniform4f(u_diffuseColor, 0.5, 0.5, 0, 1);
  }

  update_uniform(modelview, projection, 3);
  modelview = rotator.getViewMatrix();
}


function setLightPos(){
}



function update_uniform(modelview, projection, currentModelNumber){
  //Get matrix for transforming normal vectors 
  //and send matrices to shader program
  mat3.normalFromMat4(normalMatrix, modelview);
  
  gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
  gl.uniformMatrix4fv(u_modelview, false, modelview);
  gl.uniformMatrix4fv(u_projection, false, projection);
  gl.drawElements(gl.TRIANGLES, objects[currentModelNumber].indices.length, gl.UNSIGNED_SHORT, 0);
}

//called and data for the model are copied into the approproate buffers,
//and the scene is drawn
function installModel(modelData){
  gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_coords_loc);
  gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
  gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_normal_loc);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
  }

//Init the webgl context called from init
function initGL(){
  var prog = createProgram(gl, "vshader-source", "fshader-source");
  gl.useProgram(prog);
  
  a_coords_loc = gl.getAttribLocation(prog, "a_coords");
  a_normal_loc = gl.getAttribLocation(prog, "a_normal");
  
  u_modelview = gl.getUniformLocation(prog, "modelview");
  u_projection = gl.getUniformLocation(prog, "projection");
  u_normalMatrix = gl.getUniformLocation(prog, "normalMatrix");
  u_lightPosition = gl.getUniformLocation(prog, "lightPosition");
  u_diffuseColor = gl.getUniformLocation(prog, "diffuseColor");
  u_specularColor = gl.getUniformLocation(prog, "specularColor");
  u_specularExponent = gl.getUniformLocation(prog, "speculatExponent");

  a_coords_buffer = gl.createBuffer();
  a_normal_buffer = gl.createBuffer();
  index_buffer = gl.createBuffer();
  gl.enable(gl.DEPTH_TEST);

  
  
  gl.uniform3f(u_specularColor, 0.5, 0.5, 0.5);
  gl.uniform4f(u_diffuseColor, 1, 1, 1, 1);
  gl.uniform1f(u_specularExponent, 10);
  //gl.uniform4f(u_lightPosition, lightPositions[1][0], lightPositions[1][1],lightPositions[0][2], lightPositions[1][3]);
  //gl.uniform4f(u_lightPosition, lightPositions[0][0], lightPositions[0][1], lightPositions[0][2], lightPositions[0][3]);
}

function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}


/* Creates a program for webgl context gl to use */

function createProgram(gl, vertexShaderID, fragmentShaderID){
  
  function getTextContent(elementID){
    //nested function. Used to get shader in html
    var element = document.getElementById(elementID);
    var node = element.firstChild;
    var str = "";
    while (node) {
      if (node.nodeType == 3) // text node
        str += node.textContent;
      node = node.nextSibling;
    }
    return str;
  }
  try {
    var vertexShaderSource = getTextContent(vertexShaderID);
    var fragmentShaderSource = getTextContent(fragmentShaderID);
  }
  catch (e) {
    throw "Error: Couldn't get shader source code form the script elements.";
  }
 
  var vsh = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vsh, vertexShaderSource);
  gl.compileShader(vsh);
  if( !gl.getShaderParameter(vsh, gl.COMPILE_STATUS)){
    throw "Error in vertex parameter: " + gl.getShaderInfoLog(vsh);
  }

  var fsh = gl.createShader( gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, fragmentShaderSource);
  gl.compileShader(fsh);
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)){
    throw "Error in fragment shader: " + gl.getShaderInfoLog(fsh);
  }

  var prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if( !gl.getProgramParameter(prog, gl.LINK_STATUS)){
    throw "Link error in program: " + gl.getProgramInfoLog(prog);
  }
  return prog;
}

//init called when page is loaded
function init(){
  try{
    var canvas = document.getElementById("myGLCanvas");
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if(! gl) {
      throw "Browser does not supprot webgl";
    }
  }
  catch (e) {
    document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
    return;
  }
  try {
    initGL(); //init the webglgraphics
  }
  catch (e) {
    document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context:" + e + "</p>";
    return;
  }
  //document.getElementById("animate").checked = false;
  rotator = new TrackballRotator(canvas, draw, 15);
  draw();

}

function tick(){
  requestAnimFrame(tick);
  draw()
  if(document.getElementById("Animate").checked){
    animate();
    animateMe = true;
  }
}
