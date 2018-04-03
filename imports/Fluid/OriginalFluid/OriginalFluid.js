import {Canvas2D}                       from '../Canvas2D/FluidCanvas2D.js';
import { default as BaseFluid }         from '../BaseFluid.js'
import { default as GLProgram }         from '../ShaderHelpers/GlProgram.js'
import { default as ShaderCompiler }    from '../ShaderHelpers/ShaderCompiler.js'
import { GetWebGLContext}               from "../ShaderHelpers/WebGL.js";
import * as SHADERS                     from './Shaders.js'
import FluidLine                        from "../Canvas2D/FluidLine";

let gl  = null;
let ext = null;

let gShapeCache = {};

export default class OriginalFluid extends BaseFluid
{
    constructor( iCanvas )
    {
        super( iCanvas );

        this.canvas2D   = null;
        this.width      = 0;
        this.height     = 0;

        this.fluidProgram = null;

        //Texture
        this.currentState = null;
        this.lastState    = null;
        this.currentStateRed = null;
        this.lastStateRed = null;
        this.currentStateBlue = null;
        this.lastStateBlue = null;
        this.currentStateGreen = null;
        this.lastStateGreen = null;

        //FrameBuffer
        this.frameBuffer = null;
        this.frameBufferRed = null;
    }

    init()
    {
        super.init.call(this);
        this._initCanvas2D();
        this._initVertexShader();
    }

    _initWebGl()
    {
        let context = GetWebGLContext( this.canvas );
        gl = context.gl ;
        ext = context.ext;
    }

    _initCanvas2D()
    {
        this.canvas2D = new Canvas2D();
        this.canvas2D.init( "2dcanvas" );
    }

    _initVertexShader()
    {
        // look up where the vertex data needs to go.
        // Create a buffer for positions
        let bufferPos = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferPos);
        gl.enableVertexAttribArray(this.fluidProgram.attributes.a_position);
        gl.vertexAttribPointer(this.fluidProgram.attributes.a_position, 2, gl.FLOAT, false, 0, 0);

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
            1.0, -1.0,
            -1.0, 1.0,
            -1.0, 1.0,
            1.0, -1.0,
            1.0, 1.0]
        ), gl.STATIC_DRAW);

        //set texture location
        // provide texture coordinates for the rectangle.
        let texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.fluidProgram.attributes.a_texCoord);
        gl.vertexAttribPointer(this.fluidProgram.attributes.a_texCoord, 2, gl.FLOAT, false, 0, 0);
    }

    resize()
    {
        if ( this.canvas.width === this.canvas.clientWidth && this.canvas.height === this.canvas.clientHeight )
        {
            return;
        }

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this._initFramebuffers();
    }

    run()
    {

        gl.uniform1i( this.fluidProgram.uniforms.u_image, 0 );
        gl.uniform1i( this.fluidProgram.uniforms.u_canvas, 1 );
        gl.uniform1i( this.fluidProgram.uniforms.u_colorRed, 2 );
        gl.uniform1i( this.fluidProgram.uniforms.u_colorGreen, 3 );
        gl.uniform1i( this.fluidProgram.uniforms.u_colorBlue, 4 );

        //constants
        gl.uniform1f(this.fluidProgram.uniforms.u_kSpring, 2.0);
        gl.uniform1f(this.fluidProgram.uniforms.u_dSpring, 0.1);
        gl.uniform1f(this.fluidProgram.uniforms.u_mass, 10.0);
        gl.uniform1f(this.fluidProgram.uniforms.u_dt, 1.0);
        //
        this.resize();
        super.run.call(this);
    }

    _createAllProgram()
    {
        const shaderCompiler = new ShaderCompiler( gl );
        const baseVertexShader = shaderCompiler.compileShader(gl.VERTEX_SHADER  , SHADERS.BASE_VERTEX );
        const fluidShader      = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.FRAGMENT );

        this.fluidProgram = new GLProgram( gl, baseVertexShader, fluidShader);
    }

    _initFramebuffers()
    {
        this.fluidProgram.bind();

        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        // set the size of the texture
        gl.uniform2f( this.fluidProgram.uniforms.u_textureSize, this.canvas.width, this.canvas.height);

        //texture for saving output from frag shader
        this.currentState = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.lastState = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.currentStateRed = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.currentStateGreen = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.currentStateBlue = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.lastStateRed = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.lastStateGreen = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.lastStateBlue = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);
        //canvas2d texture
        this.canvas2DState = makeTexture(gl);
        gl.texImage2D(gl.TEXTURE_2D, 0, ext.formatRGBA.internalFormat, this.canvas.width, this.canvas.height, 0, ext.formatRGBA.format, ext.halfFloatTexType , null);

        this.frameBuffer = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, this.lastState);//original texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentState, 0);

        this.frameBufferRed = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateRed);//original texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferRed);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateRed, 0);

        this.frameBufferGreen = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateGreen);//original texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferGreen);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateGreen, 0);

        this.frameBufferBlue = gl.createFramebuffer();
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateBlue);//original texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferBlue);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateBlue, 0);
    }

    _step()
    {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentState, 0);
        gl.uniform1f( this.fluidProgram.uniforms.u_colorFlag, 0);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, this.canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D.docElt); // This is the important line!
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.lastState);
        gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

        //Red
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferRed);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateRed, 0);
        gl.uniform1f(this.fluidProgram.uniforms.u_colorFlag, 1);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, this.canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D.docElt); // This is the important line!
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture( gl.TEXTURE_2D, this.lastStateRed );
        gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

        //Green
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferGreen);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateGreen, 0);
        gl.uniform1f(this.fluidProgram.uniforms.u_colorFlag, 2);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, this.canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D.docElt); // This is the important line!
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture( gl.TEXTURE_2D, this.lastStateGreen );
        gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

        //Blue
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBufferBlue);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.currentStateBlue, 0);
        gl.uniform1f(this.fluidProgram.uniforms.u_colorFlag, 3);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, this.canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D.docElt); // This is the important line!
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture( gl.TEXTURE_2D, this.lastStateBlue );
        gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

        let temp = this.lastState;
        this.lastState = this.currentState;
        this.currentState = temp;

        temp = this.lastStateRed;
        this.lastStateRed = this.currentStateRed;
        this.currentStateRed = temp;

        temp = this.lastStateGreen;
        this.lastStateGreen = this.currentStateGreen;
        this.currentStateGreen = temp;

        temp = this.lastStateBlue;
        this.lastStateBlue = this.currentStateBlue;
        this.currentStateBlue = temp;
    }

    update()
    {
        this.resize();

        gl.uniform1f( this.fluidProgram.uniforms.u_flipY, 1);// don't y flip images while drawing to the textures
        gl.uniform1f( this.fluidProgram.uniforms.u_renderFlag, 0);

        this.canvas2D.draw();
        this._step();


        gl.uniform1f(this.fluidProgram.uniforms.u_flipY, -1);  // need to y flip for canvas
        gl.uniform1f(this.fluidProgram.uniforms.u_renderFlag, 1);//only plot position on render

        //draw to canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.uniform1f(this.fluidProgram.uniforms.u_colorFlag, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.lastState);
        gl.activeTexture(gl.TEXTURE0+1);
        gl.bindTexture(gl.TEXTURE_2D, this.canvas2DState);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.canvas2D.docElt); //
        gl.activeTexture(gl.TEXTURE0+2);
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateRed);
        gl.activeTexture(gl.TEXTURE0+3);
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateGreen);
        gl.activeTexture(gl.TEXTURE0+4);
        gl.bindTexture(gl.TEXTURE_2D, this.lastStateBlue);
        gl.drawArrays(gl.TRIANGLES, 0, 6);//draw to framebuffer

        return super.update.call(this);
    }

    _onEventStart( x, y, color )
    {
        let shape = _GetCreateShapeForColor( color );
        this.canvas2D.shapeA.push( shape );
        shape.points.push( {x: x, y:y } );
        shape.fillColor = color;
    }

    _onEventMove( x, y, color )
    {
        let shape = _GetCreateShapeForColor( color );
        shape.points.push( {x: x, y:y } );
        shape.fillColor = color;
    }

    _onEventEnd( x, y, color )
    {
        let shape = _GetCreateShapeForColor( color );
        shape.destroy();
        delete gShapeCache[color];
    }

    _onEventClick( x, y, color )
    {
        if ( !this.canvas2D )
        {
            return;
        }
        this.canvas2D.addRandomShape( x, y, color );
    }

    _onClick(e)
    {
        if ( !this.canvas2D )
        {
            return;
        }
        this.canvas2D.onClick( e );
    }

    _onMouseOut()
    {
        gl.uniform1f(this.fluidProgram.uniforms.u_mouseEnable, 0);
    }

    _onMouseMove(e)
    {
        gl.uniform1f(this.fluidProgram.uniforms.u_mouseEnable, 1);
        gl.uniform2f(this.fluidProgram.uniforms.u_mouseCoord, e.clientX/this.canvas.width, e.clientY/this.canvas.height);
    }

    _onTouchMove(e)
    {
        let touch = e.touches[0];
        e.preventDefault();
        gl.uniform1f(this.fluidProgram.uniforms.u_mouseEnable, 1);
        gl.uniform2f(this.fluidProgram.uniforms.u_mouseCoord, touch.pageX/this.canvas.width, touch.pageY/this.canvas.height);
    }

    _onTouchStart(e)
    {
        let touch = e.touches[0];
        e.preventDefault();
        gl.uniform1f(this.fluidProgram.uniforms.u_mouseEnable, 1);
        gl.uniform2f(this.fluidProgram.uniforms.u_mouseCoord, touch.pageX/this.canvas.width, touch.pageY/this.canvas.height);
    }

    _onTouchEnd(e)
    {
        gl.uniform1f(this.fluidProgram.uniforms.u_mouseEnable, 0);
    }
}

let _GetCreateShapeForColor = function( color )
{
    if ( !gShapeCache[color] )
    {
        gShapeCache[color] = new FluidLine()
    }
    return gShapeCache[color];
};

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
