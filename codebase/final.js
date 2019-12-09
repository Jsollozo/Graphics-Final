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
//var u_ambient;
//var u_diffuse;
//var u_specular;

var projection = mat4.create(); //projection matrix
var modelview; //modelview matrix
//var modelview = mat4.create(); //this or rotator??
var normalMatrix = mat3.create();
var rotator; //trackball rotator implemented as a mouse

var lastTime = 0;
var colors = [ [1,1,1] ]; //RGB color arrays for diffuse & specular color vals
var lightPositions = [ [0,0,0,1] ]; //vals for light pos

//cube(side), ring(innerRadius, innerRadius, slices), uvSphere(radius, slices, stacks), uvTorus(outerRadius, innerRadius, slices, stacks), uvCylinder(radius,height, slices, noTop, noBottom), uvCone(radius, height, slices, noBottom), 

//objs for display
var objects = [cube(),ring(), uvSphere(), uvTorus(), uvCylinder(), uvCone()];

//var objects = [models.cube()];
var currentModelNumber; //contains data for current obj

function degToRad(degrees){
  return degrees * Math.PI / 180;
}

function draw() {
  gl.clearColor(0.15, 0.15, 0.3, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  mat4.perspective(projection, Math.PI/5, 1, 10, 20);
  modelview = rotator.getViewMatrix();
  
  //World
  
  installModel(objects[1]);
  currentModelNumber = 1;
  //translate -> scale -> rotate
  //mat4.scale(modelview, modelview, [5,10,20]);
  update_uniform(modelview,projection, 1);
  modelview = rotator.getViewMatrix();
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
  gl.uniform4f(u_lightPosition, 0, 0, 0, 1);
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
  
  rotator = new TrackballRotator(canvas, draw, 15);
  draw();
}
