/**
 * Created by ghassaei on 2/20/16.
 */
import {Canvas2D} from '/imports/FluidCanvas2D.js';
import {createProgramFromScripts} from '/imports/FluidGlBoilerplate.js';

var gl;
var canvas;
var canvas2D = new Canvas2D();
var lastState;
var currentState;
var frameBuffer;

var resizedLastState;
var resizedCurrentState;
var canvas2DState;

var width;
var height;

var flipYLocation;
var renderFlagLocation;
var textureSizeLocation;

var mouseCoordLocation;
var mouseEnableLocation;

var paused = false;//while window is resizing

var ext;

// window.onload = initGL;



const makeFlatArray = function(rgba){
    var numPixels = rgba.length/4;
    for (var i=0;i<numPixels;i++) {
        rgba[i * 4 + 3] = 1;
    }
    return rgba;
}

const makeRandomArray = function(rgba){
    for (var x=width/2-100;x<width/2+100;x++) {
        for (var y=height/2-100;y<height/2+100;y++) {
            var ii = (y*width + x) * 4;
            //rgba[ii] = 30;
        }
    }
    return rgba;
}

const makeTexture = function(gl){

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

const render = function(){

    if (!paused) {

        if (resizedLastState) {
            lastState = resizedLastState;
            resizedLastState = null;
        }
        if (resizedCurrentState) {
            currentState = resizedCurrentState;
            resizedCurrentState = null;
        }

        gl.uniform1f(flipYLocation, 1);// don't y flip images while drawing to the textures
        gl.uniform1f(renderFlagLocation, 0);

        canvas2D.draw(); //@TODO ici la grosse methode que vous pouvez modifiez. On peut calculer le deltaTime ici si vous voulez un temps physique

        step();


        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        gl.uniform1f(renderFlagLocation, 1);//only plot position on render
        gl.bindTexture(gl.TEXTURE_2D, lastState);


        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lastState);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
        //@TODO fill texture with data
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); //

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }



    window.requestAnimationFrame(render);
}

const step = function(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastState);
    gl.activeTexture(gl.TEXTURE0+1);
    gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
    //@TODO fill texture with data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); // This is the important line!


    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

    var temp = lastState;
    lastState = currentState;
    currentState = temp;
}

const onResize = function(){
    paused = true;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    gl.viewport(0, 0, width, height);

    // set the size of the texture
    gl.uniform2f(textureSizeLocation, width, height);

    //texture for saving output from frag shader
    resizedCurrentState = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedLastState = makeTexture(gl);
    //fill with random pixels
    var rgba = new Float32Array(width*height*4);
    rgba = makeFlatArray(rgba);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    //canvas2d texture
    canvas2DState = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    paused = false;
}

const onMouseMove = function(e){
    console.log('mouse move');
    gl.uniform1f(mouseEnableLocation, 1);
    gl.uniform2f(mouseCoordLocation, e.clientX/width, e.clientY/height);
}

const onTouchMove = function(e){
    e.preventDefault();
    gl.uniform1f(mouseEnableLocation, 1);
    var touch = e.touches[0];
    gl.uniform2f(mouseCoordLocation, touch.pageX/width, touch.pageY/height);
}

export const onClick = function(e)
{
    canvas2D.onClick( e );
}

const onMouseOut = function(){
    gl.uniform1f(mouseEnableLocation, 0);
}

const onMouseIn = function(){
    gl.uniform1f(mouseEnableLocation, 1);
}

const notSupported = function(){
    var elm = '<div id="coverImg" ' +
      'style="background: url(massspringdamper.gif) no-repeat center center fixed;' +
        '-webkit-background-size: cover;' +
        '-moz-background-size: cover;' +
        '-o-background-size: cover;' +
        'background-size: cover;">'+
      '</div>';
    $(elm).appendTo(document.getElementsByTagName("body")[0]);
    $("#noSupportModal").modal("show");
   console.warn("floating point textures are not supported on your system");
}

export const initGL = function({canvasGlId, canvas2dId}) {
    // Get A WebGL context
    canvas = document.getElementById(canvasGlId);
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas2D.init(canvas2dId);

    canvas.onmousemove = onMouseMove;
    canvas.onmouseout = onMouseOut;
    canvas.onmouseover = onMouseIn;
    canvas.ontouchmove = onTouchMove;
    canvas.ontouchend = onMouseOut;
    canvas.ontouchstart = onTouchMove;

    // to reactivate on click behaviour
    // canvas.onclick = onClick;

    window.onresize = onResize;

    gl = canvas.getContext("webgl", { antialias: false}) || canvas.getContext("experimental-webgl", { antialias: false});
    if (!gl) {
        notSupported();
        return;
    }

    gl.disable(gl.DEPTH_TEST);
    ext = gl.getExtension('OES_texture_half_float') || gl.getExtension("EXT_color_buffer_half_float");
    if (!ext) {
        notSupported();
    }

    // setup a GLSL program
    var program = createProgramFromScripts(gl, "2d-vertex-shader", "2d-fragment-shader");

    gl.useProgram(program);

    // look up where the vertex data needs to go.
    var positionLocation = gl.getAttribLocation(program, "a_position");

    // Create a buffer for positions
    var bufferPos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0]
        ), gl.STATIC_DRAW);

    //Texture
    var texture0Location = gl.getUniformLocation( program, "u_image" );
    gl.uniform1i( texture0Location, 0 );

    var textureCanvasLocation = gl.getUniformLocation( program, "u_canvas" );
    gl.uniform1i( textureCanvasLocation, 1 );

    //constants
    var kSpringLocation = gl.getUniformLocation(program, "u_kSpring");
    gl.uniform1f(kSpringLocation, 2.0);
    var dSpringLocation = gl.getUniformLocation(program, "u_dSpring");
    gl.uniform1f(dSpringLocation, 1.0);
    var massLocation = gl.getUniformLocation(program, "u_mass");
    gl.uniform1f(massLocation, 10.0);
    var dtLocation = gl.getUniformLocation(program, "u_dt");
    gl.uniform1f(dtLocation, 1.0);

    //flip y
    flipYLocation = gl.getUniformLocation(program, "u_flipY");

    //renderflag
    renderFlagLocation = gl.getUniformLocation(program, "u_renderFlag");

    //set texture location
    var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");
    // provide texture coordinates for the rectangle.
    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        1.0, 1.0]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");
    mouseCoordLocation = gl.getUniformLocation(program, "u_mouseCoord");
    mouseEnableLocation = gl.getUniformLocation(program, "u_mouseEnable");



    onResize();

    lastState = resizedLastState;
    currentState = resizedCurrentState;
    resizedLastState = null;
    resizedCurrentState = null;

    frameBuffer = gl.createFramebuffer();

    gl.bindTexture(gl.TEXTURE_2D, lastState);//original texture

    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    var check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check != gl.FRAMEBUFFER_COMPLETE){
        notSupported();
    }

    onMouseIn();
    render();

    return canvas;
}

export default { initGL, onClick };
