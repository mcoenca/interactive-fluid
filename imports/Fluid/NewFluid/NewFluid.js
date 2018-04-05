import { default as BaseFluid }         from '../BaseFluid.js'
import { default as GLProgram }         from '../ShaderHelpers/GlProgram.js'
import { default as ShaderCompiler }    from '../ShaderHelpers/ShaderCompiler.js'
import { CreateFBO, CreateDoubleFBO}    from "../ShaderHelpers/FrameBuffer";
import { GetWebGLContext}               from "../ShaderHelpers/WebGL.js";
import { hexToRGB}                      from "../../utils";
import * as SHADERS                     from './Shaders';

// const canvas = document.getElementById('glcanvas');
// canvas.width = canvas.clientWidth;
// canvas.height = canvas.clientHeight;

let config = {
    TEXTURE_DOWNSAMPLE: 1,
    DENSITY_DISSIPATION: 0.98,
    VELOCITY_DISSIPATION: 0.99,
    PRESSURE_DISSIPATION: 0.8,
    PRESSURE_ITERATIONS: 25,
    CURL: 30,
    SPLAT_RADIUS: 0.005
}

let gl = null;
let ext = null;
let pointers = [];
let splatStack = [];

let colorPointerCache = {};

export default class NewFluid extends BaseFluid
{
    constructor( iCanvas )
    {
        super( iCanvas );

        this.textureWidth   = 0;
        this.textureHeight  = 0;
        this.lastTime       = new Date();

        this.density    = null;
        this.velocity   = null;
        this.divergence = null;
        this.curl       = null;
        this.pressure   = null;

        this.clearProgram               = null;
        this.displayProgram             = null;
        this.splatProgram               = null;
        this.advectionProgram           = null;
        this.divergenceProgram          = null;
        this.curlProgram                = null;
        this.vorticityProgram           = null;
        this.pressureProgram            = null;
        this.gradienSubtractProgram     = null;
    }

    run()
    {
        this.lastTime = Date.now();
        this._multipleSplat(parseInt(Math.random() * 20) + 5);
        this.update();
    }

    update()
    {
        this.resize();
        const blit = (() => {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);

            return (destination) => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            }
        })();

        const dt = Math.min((Date.now() - this.lastTime) / 1000, 0.016);
        this.lastTime = Date.now();

        gl.viewport(0, 0, this.textureWidth, this.textureHeight);

        if (splatStack.length > 0)
            this._multipleSplat(splatStack.pop());

        this.advectionProgram.bind();
        gl.uniform2f(this.advectionProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read[2]);
        gl.uniform1i(this.advectionProgram.uniforms.uSource, this.velocity.read[2]);
        gl.uniform1f(this.advectionProgram.uniforms.dt, dt);
        gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
        blit(this.velocity.write[1]);
        this.velocity.swap();

        gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read[2]);
        gl.uniform1i(this.advectionProgram.uniforms.uSource, this.density.read[2]);
        gl.uniform1f(this.advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
        blit(this.density.write[1]);
        this.density.swap();

        for (let i = 0; i < pointers.length; i++) {
            const pointer = pointers[i];
            if (pointer.moved) {
                this._splat(pointer.x, pointer.y, pointer.dx, pointer.dy, pointer.color);
                pointer.moved = false;
            }
        }

        this.curlProgram.bind();
        gl.uniform2f(this.curlProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.velocity.read[2]);
        blit(this.curl[1]);

        this.vorticityProgram.bind();
        gl.uniform2f(this.vorticityProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.velocity.read[2]);
        gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl[2]);
        gl.uniform1f(this.vorticityProgram.uniforms.curl, config.CURL);
        gl.uniform1f(this.vorticityProgram.uniforms.dt, dt);
        blit(this.velocity.write[1]);
        this.velocity.swap();

        this.divergenceProgram.bind();
        gl.uniform2f(this.divergenceProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.velocity.read[2]);
        blit(this.divergence[1]);

        this.clearProgram.bind();
        let pressureTexId = this.pressure.read[2];
        gl.activeTexture(gl.TEXTURE0 + pressureTexId);
        gl.bindTexture(gl.TEXTURE_2D, this.pressure.read[0]);
        gl.uniform1i(this.clearProgram.uniforms.uTexture, pressureTexId);
        gl.uniform1f(this.clearProgram.uniforms.value, config.PRESSURE_DISSIPATION);
        blit(this.pressure.write[1]);
        this.pressure.swap();

        this.pressureProgram.bind();
        gl.uniform2f(this.pressureProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.divergence[2]);
        pressureTexId = this.pressure.read[2];
        gl.uniform1i(this.pressureProgram.uniforms.uPressure, pressureTexId);
        gl.activeTexture(gl.TEXTURE0 + pressureTexId);
        for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
            gl.bindTexture(gl.TEXTURE_2D, this.pressure.read[0]);
            blit(this.pressure.write[1]);
            this.pressure.swap();
        }

        this.gradienSubtractProgram.bind();
        gl.uniform2f(this.gradienSubtractProgram.uniforms.texelSize, 1.0 / this.textureWidth, 1.0 / this.textureHeight);
        gl.uniform1i(this.gradienSubtractProgram.uniforms.uPressure, this.pressure.read[2]);
        gl.uniform1i(this.gradienSubtractProgram.uniforms.uVelocity, this.velocity.read[2]);
        blit(this.velocity.write[1]);
        this.velocity.swap();

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.displayProgram.bind();
        gl.uniform1i(this.displayProgram.uniforms.uTexture, this.density.read[2]);
        blit(null);

        super.update.call( this );
    }

    _splat(x, y, dx, dy, color)
    {
        const blit = (() => {
            gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);

            return (destination) => {
                gl.bindFramebuffer(gl.FRAMEBUFFER, destination);
                gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            }
        })();

        this.splatProgram.bind();
        gl.uniform1i(this.splatProgram.uniforms.uTarget, this.velocity.read[2]);
        gl.uniform1f(this.splatProgram.uniforms.aspectRatio, this.canvas.width / this.canvas.height);
        gl.uniform2f(this.splatProgram.uniforms.point, x / this.canvas.width, 1.0 - y / this.canvas.height);
        gl.uniform3f(this.splatProgram.uniforms.color, dx, -dy, 1.0);
        gl.uniform1f(this.splatProgram.uniforms.radius, config.SPLAT_RADIUS);
        blit( this.velocity.write[1]);
        this.velocity.swap();

        gl.uniform1i(this.splatProgram.uniforms.uTarget, this.density.read[2]);
        gl.uniform3f(this.splatProgram.uniforms.color, color[0] * 0.3, color[1] * 0.3, color[2] * 0.3);
        blit(this.density.write[1]);
        this.density.swap();
    }

    _multipleSplat( amount )
    {
        for (let i = 0; i < amount; i++)
        {
            const color = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
            const x = this.canvas.width * Math.random();
            const y = this.canvas.height * Math.random();
            const dx = 1000 * (Math.random() - 0.5);
            const dy = 1000 * (Math.random() - 0.5);
            this._splat(x, y, dx, dy, color);
        }
    }

    _initWebGl()
    {
        let context = GetWebGLContext( this.canvas );
        gl = context.gl ;
        ext = context.ext;
    }
    _createAllProgram()
    {

        const shaderCompiler = new ShaderCompiler( gl );

        const baseVertexShader                  = shaderCompiler.compileShader(gl.VERTEX_SHADER  , SHADERS.BASE_VERTEX);
        const clearShader                       = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.CLEAR);
        const displayShader                     = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.DISPLAY );
        const splatShader                       = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.SPLAT );
        const advectionManualFilteringShader    = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.ADVECTION_MANUAL_FILTERING );
        const advectionShader                   = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.ADVECTION);
        const divergenceShader                  = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.DIVERGENCE );
        const curlShader                        = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.CURL );
        const vorticityShader                   = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.VORTICITY );
        const pressureShader                    = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.PRESSURE );
        const gradientSubtractShader            = shaderCompiler.compileShader(gl.FRAGMENT_SHADER, SHADERS.GRADIENT );

        this.clearProgram               = new GLProgram( gl, baseVertexShader, clearShader);
        this.displayProgram             = new GLProgram( gl, baseVertexShader, displayShader);
        this.splatProgram               = new GLProgram( gl, baseVertexShader, splatShader);
        this.advectionProgram           = new GLProgram( gl, baseVertexShader, ext.supportLinearFiltering ? advectionShader : advectionManualFilteringShader);
        this.divergenceProgram          = new GLProgram( gl, baseVertexShader, divergenceShader);
        this.curlProgram                = new GLProgram( gl, baseVertexShader, curlShader);
        this.vorticityProgram           = new GLProgram( gl, baseVertexShader, vorticityShader);
        this.pressureProgram            = new GLProgram( gl, baseVertexShader, pressureShader);
        this.gradienSubtractProgram     = new GLProgram( gl, baseVertexShader, gradientSubtractShader);
    }

    _initFramebuffers ()
    {
        this.textureWidth = gl.drawingBufferWidth >> config.TEXTURE_DOWNSAMPLE;
        this.textureHeight = gl.drawingBufferHeight >> config.TEXTURE_DOWNSAMPLE;

        this.texType = ext.halfFloatTexType;
        this.rgba = ext.formatRGBA;
        this.rg   = ext.formatRG;
        this.r    = ext.formatR;

        this.density    = CreateDoubleFBO(gl, 2, this.textureWidth, this.textureHeight, this.rgba.internalFormat, this.rgba.format, this.texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
        this.velocity   = CreateDoubleFBO(gl, 0, this.textureWidth, this.textureHeight, this.rg.internalFormat, this.rg.format, this.texType, ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST);
        this.divergence = CreateFBO      (gl, 4, this.textureWidth, this.textureHeight, this.r.internalFormat, this.r.format, this.texType, gl.NEAREST);
        this.curl       = CreateFBO      (gl, 5, this.textureWidth, this.textureHeight, this.r.internalFormat, this.r.format, this.texType, gl.NEAREST);
        this.pressure   = CreateDoubleFBO(gl, 6, this.textureWidth, this.textureHeight, this.r.internalFormat, this.r.format, this.texType, gl.NEAREST);
    }

    _onEventClick( x, y, color, iUUID )
    {
        let cPointer = _GetCreatePointers(iUUID);
        let rgb = hexToRGB(color);
        let colorRGB = [rgb.red/255, rgb.green/255, rgb.blue/255];
        cPointer.down = true;
        cPointer.moved = cPointer.down;
        cPointer.dx = 10.0;
        cPointer.dy = 10.0;
        cPointer.y  = y;
        cPointer.x  = x;
        cPointer.color = colorRGB;
    }

    _onEventStart(x, y, color, iUUID )
    {
        let cPointer = _GetCreatePointers(iUUID);
        let rgb = hexToRGB(color);
        let colorRGB = [rgb.red/255, rgb.green/255, rgb.blue/255];
        cPointer.down = true;
        cPointer.moved = cPointer.down;
        cPointer.dx = 10.0;
        cPointer.dy = 10.0;
        cPointer.y  = y;
        cPointer.x  = x;
        cPointer.color = colorRGB;
    }

    _onEventMove( x, y, color, iUUID )
    {
        let cPointer = _GetCreatePointers(iUUID);
        cPointer.moved = cPointer.down;
        cPointer.dx = (x - cPointer.x) * 10.0;
        cPointer.dy = (y - cPointer.y) * 10.0;
        cPointer.x = x;
        cPointer.y = y;
    }

    _onEventEnd( x, y, color, iUUID )
    {
        let cPointer = _GetCreatePointers(iUUID);
        cPointer.down = false;
        cPointer.moved = cPointer.down;
        cPointer.dx = 0;
        cPointer.dy = 0;
        cPointer.x = 0;
        cPointer.y = 0;
        delete colorPointerCache[iUUID];
    }

    _onButtonClick(e)
    {
        this.setBackgroundColor( Math.random(), Math.random(), Math.random());
    }

    setBackgroundColor( iRed, iGreen, iBlue )
    {
        gl.uniform4f(this.displayProgram.uniforms.u_colorBackground, iRed, iGreen, iBlue, 1);
    }

    _onMouseMove(e)
    {
        pointers[0].moved = pointers[0].down;
        pointers[0].dx = (e.offsetX - pointers[0].x) * 10.0;
        pointers[0].dy = (e.offsetY - pointers[0].y) * 10.0;
        pointers[0].x = e.offsetX;
        pointers[0].y = e.offsetY;
    }

    _onMouseDown(e)
    {
        pointers[0].down = true;
        pointers[0].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
    }

    _onTouchMove(e)
    {
        e.preventDefault();
        const touches = e.targetTouches;
        for (let i = 0; i < touches.length; i++) {
            let pointer = pointers[i];
            pointer.moved = pointer.down;
            pointer.dx = (touches[i].pageX - pointer.x) * 10.0;
            pointer.dy = (touches[i].pageY - pointer.y) * 10.0;
            pointer.x = touches[i].pageX;
            pointer.y = touches[i].pageY;
        }
    }

    _onTouchStart(e)
    {
        e.preventDefault();
        const touches = e.targetTouches;
        for (let i = 0; i < touches.length; i++)
        {
            if (i >= pointers.length)
                pointers.push(new pointerPrototype());

            pointers[i].id = touches[i].identifier;
            pointers[i].down = true;
            pointers[i].x = touches[i].pageX;
            pointers[i].y = touches[i].pageY;
            pointers[i].color = [Math.random() + 0.2, Math.random() + 0.2, Math.random() + 0.2];
        }
    }

    _onTouchEnd(e)
    {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++)
            for (let j = 0; j < pointers.length; j++)
                if ( touches[i].identifier == pointers[j].id )
                    pointers[j].down = false;
    }

    _onMouseUp(e)
    {
        pointers[0].down = false;
    }
}


function _GetCreatePointers( iID )
{
    if ( !colorPointerCache[iID] )
    {
        colorPointerCache[iID] = new pointerPrototype();
        pointers.push( colorPointerCache[iID] );
    }
    return colorPointerCache[iID];
}

// const  { gl, ext } = getWebGLContext(canvas);


function pointerPrototype () {
    this.id = -1;
    this.x = 0;
    this.y = 0;
    this.dx = 0;
    this.dy = 0;
    this.down = false;
    this.moved = false;
    this.color = [30, 0, 300];
}

pointers.push(new pointerPrototype());