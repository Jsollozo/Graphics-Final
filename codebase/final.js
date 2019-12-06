var gl;
var a_coords_loc;
var a_normal_loc;
var a_normal_buffer;
var index_buffer;
var u_diffuseColor;
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;

var projection = mat4.create();
var modelview = mat4.create();
var normalMatrix = mat3.create();

function draw() {
  gl.clearColor(0.15, 0.15, 0, 3, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat4.perspective(projection, Math.PI/5,1,10,20);
  //installModel(objects[0]);
  //currentModelNumber = 0;
}

function instalModel(modelData){
  }


