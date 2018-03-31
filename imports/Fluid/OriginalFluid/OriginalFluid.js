/**
 * Created by ghassaei on 2/20/16.
 */
import {Canvas2D} from '../Canvas2D/FluidCanvas2D.js';
import {createProgramFromScripts} from './FluidGlBoilerplate.js';

var gl;
var canvas;
var canvas2D = new Canvas2D();
var lastState;
var currentState;
var lastStateColorRed;
var lastStateColorGreen;
var lastStateColorBlue;
var currentStateColorRed;
var currentStateColorGreen;
var currentStateColorBlue;
var frameBuffer;
var colorFrameBufferRed;
var colorFrameBufferGreen;
var colorFrameBufferBlue;
var resizedLastState;
var resizedCurrentState;
var resizedLastStateColorRed;
var resizedCurrentStateColorRed;
var resizedLastStateColorGreen;
var resizedCurrentStateColorGreen;
var resizedLastStateColorBlue;
var resizedCurrentStateColorBlue;
var canvas2DState;

var width;
var height;

var flipYLocation;
var renderFlagLocation;
var colorFlagLocation;
var textureSizeLocation;

var mouseCoordLocation;
var mouseEnableLocation;

var paused = false;//while window is resizing

var ext;

export function Run() {

    // Get A WebGL context
    canvas = document.getElementById("glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    canvas2D.init( "2dcanvas" );

    canvas.onmousemove = onMouseMove;
    canvas.onmouseout = onMouseOut;
    canvas.onmouseover = onMouseIn;
    canvas.ontouchmove = onTouchMove;
    canvas.ontouchend = onMouseOut;
    canvas.ontouchstart = onTouchMove;
    canvas.onclick = onClick;

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

    var textureRedColorLocation = gl.getUniformLocation( program, "u_colorRed" );
    gl.uniform1i( textureRedColorLocation, 2 );

    var textureGreenColorLocation = gl.getUniformLocation( program, "u_colorGreen" );
    gl.uniform1i( textureGreenColorLocation, 3 );

    var textureBlueColorLocation = gl.getUniformLocation( program, "u_colorBlue" );
    gl.uniform1i( textureBlueColorLocation, 4 );

    //constants
    var kSpringLocation = gl.getUniformLocation(program, "u_kSpring");
    gl.uniform1f(kSpringLocation, 2.0);
    var dSpringLocation = gl.getUniformLocation(program, "u_dSpring");
    gl.uniform1f(dSpringLocation, 0.1);
    var massLocation = gl.getUniformLocation(program, "u_mass");
    gl.uniform1f(massLocation, 10.0);
    var dtLocation = gl.getUniformLocation(program, "u_dt");
    gl.uniform1f(dtLocation, 1.0);

    //flip y
    flipYLocation = gl.getUniformLocation(program, "u_flipY");

    //renderflag
    renderFlagLocation = gl.getUniformLocation(program, "u_renderFlag");
    colorFlagLocation = gl.getUniformLocation(program, "u_colorFlag");

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

    lastStateColorRed = resizedLastStateColorRed;
    currentStateColorRed = resizedCurrentStateColorRed;
    lastStateColorGreen = resizedLastStateColorGreen;
    currentStateColorGreen = resizedCurrentStateColorGreen;
    lastStateColorBlue = resizedLastStateColorBlue;
    currentStateColorBlue = resizedCurrentStateColorBlue;
    lastState = resizedLastState;
    currentState = resizedCurrentState;
    resizedLastState = null;
    resizedCurrentState = null;
    resizedLastStateColorRed = null;
    resizedCurrentStateColorRed = null;
    resizedLastStateColorGreen = null;
    resizedCurrentStateColorGreen = null;
    resizedLastStateColorBlue = null;
    resizedCurrentStateColorBlue = null;

    frameBuffer = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, lastState);//original texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);

    colorFrameBufferRed = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, lastStateColorRed);//original texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFrameBufferRed);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorRed, 0);

    colorFrameBufferGreen = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, lastStateColorGreen);//original texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFrameBufferGreen);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorGreen, 0);

    colorFrameBufferBlue = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, lastStateColorBlue);//original texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorFrameBufferBlue);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorBlue, 0);

    var check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check != gl.FRAMEBUFFER_COMPLETE){
        notSupported();
    }

    onMouseIn();
    render();
}

function makeTexture(gl){

    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function render(){

    if (!paused) {

        if (resizedLastState) {
            lastState = resizedLastState;
            lastStateColorRed = resizedLastStateColorRed;
            lastStateColorGreen= resizedLastStateColorGreen;
            lastStateColorBlue= resizedLastStateColorBlue;
            resizedLastState = null;
            resizedLastStateColorRed = null;
            resizedLastStateColorGreen = null;
            resizedLastStateColorBlue = null;
        }
        if (resizedCurrentState) {
            currentState = resizedCurrentState;
            currentStateColorRed = resizedCurrentStateColorRed;
            currentStateColorGreen = resizedCurrentStateColorGreen;
            currentStateColorBlue = resizedCurrentStateColorBlue;
            resizedCurrentState = null;
            resizedCurrentStateColorRed = null;
            resizedCurrentStateColorGreen = null;
            resizedCurrentStateColorBlue = null;
        }

        gl.uniform1f(flipYLocation, 1);// don't y flip images while drawing to the textures
        gl.uniform1f(renderFlagLocation, 0);

        canvas2D.draw(); //@TODO ici la grosse methode que vous pouvez modifiez. On peut calculer le deltaTime ici si vous voulez un temps physique

        step();


        gl.uniform1f(flipYLocation, -1);  // need to y flip for canvas
        gl.uniform1f(renderFlagLocation, 1);//only plot position on render


        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.uniform1f(colorFlagLocation, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, lastState);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); //
        gl.activeTexture(gl.TEXTURE0+2);
        gl.bindTexture(gl.TEXTURE_2D, lastStateColorRed);
        gl.activeTexture(gl.TEXTURE0+3);
        gl.bindTexture(gl.TEXTURE_2D, lastStateColorGreen);
        gl.activeTexture(gl.TEXTURE0+4);
        gl.bindTexture(gl.TEXTURE_2D, lastStateColorBlue);
        // gl.activeTexture(gl.TEXTURE0+2 );
        // gl.bindTexture(gl.TEXTURE_2D, lastStateColor);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }



    window.requestAnimationFrame(render);
}

function step(){
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentState, 0);
    gl.uniform1f(colorFlagLocation, 0);
    gl.activeTexture(gl.TEXTURE0+1);
    gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); // This is the important line!
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastState);

    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

    //Red
    gl.bindFramebuffer( gl.FRAMEBUFFER, colorFrameBufferRed );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorRed, 0);
    gl.uniform1f(colorFlagLocation, 1);
    gl.activeTexture(gl.TEXTURE0+1);
    gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); // This is the important line!
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture( gl.TEXTURE_2D, lastStateColorRed );
    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastState);
    //Green
    gl.bindFramebuffer( gl.FRAMEBUFFER, colorFrameBufferGreen );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorGreen, 0);
    gl.uniform1f(colorFlagLocation, 2);
    gl.activeTexture(gl.TEXTURE0+1);
    gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); // This is the important line!
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture( gl.TEXTURE_2D, lastStateColorGreen );
    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastState);
    //Blue
    gl.bindFramebuffer( gl.FRAMEBUFFER, colorFrameBufferBlue );
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, currentStateColorBlue, 0);
    gl.uniform1f(colorFlagLocation, 3);
    gl.activeTexture(gl.TEXTURE0+1);
    gl.bindTexture(gl.TEXTURE_2D, canvas2DState);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2D.docElt); // This is the important line!
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture( gl.TEXTURE_2D, lastStateColorBlue );
    gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lastState);

    var temp = lastState;
    lastState = currentState;
    currentState = temp;

    temp = lastStateColorRed;
    lastStateColorRed = currentStateColorRed;
    currentStateColorRed = temp;

    temp = lastStateColorGreen;
    lastStateColorGreen = currentStateColorGreen;
    currentStateColorGreen = temp;

    temp = lastStateColorBlue;
    lastStateColorBlue = currentStateColorBlue;
    currentStateColorBlue = temp;
}

function onResize(){
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
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedCurrentStateColorRed = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedCurrentStateColorGreen = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedCurrentStateColorBlue = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedLastStateColorRed = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedLastStateColorGreen = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    resizedLastStateColorBlue = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);
    //canvas2d texture
    canvas2DState = makeTexture(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);

    paused = false;
}

function onMouseMove(e){
    gl.uniform1f(mouseEnableLocation, 1);
    gl.uniform2f(mouseCoordLocation, e.clientX/width, e.clientY/height);
}
function onTouchMove(e){
    e.preventDefault();
    gl.uniform1f(mouseEnableLocation, 1);
    var touch = e.touches[0];
    gl.uniform2f(mouseCoordLocation, touch.pageX/width, touch.pageY/height);
}

export function onClick(e)
{
    if ( !canvas2D )
    {
        return;
    }
    canvas2D.onClick( e );
}

export function handleEvents( iCenterX, iCenterY, iColor )
{
    if ( !canvas2D )
    {
        return;
    }
    canvas2D.addRandomShape( iCenterX, iCenterY, iColor );
}

function onMouseOut(){
    gl.uniform1f(mouseEnableLocation, 0);
}

function onMouseIn(){
    gl.uniform1f(mouseEnableLocation, 1);
}

function notSupported(){
    console.warn("floating point textures are not supported on your system");
}