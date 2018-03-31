
export function CreateFBO (gl, texId, w, h, internalFormat, format, type, param)
{
    gl.activeTexture(gl.TEXTURE0 + texId);
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    let fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, w, h);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return [texture, fbo, texId];
}

export function CreateDoubleFBO (gl, texId, w, h, internalFormat, format, type, param) {
    let fbo1 = CreateFBO(gl, texId    , w, h, internalFormat, format, type, param);
    let fbo2 = CreateFBO(gl, texId + 1, w, h, internalFormat, format, type, param);

    return {
        get read () {
            return fbo1;
        },
        get write () {
            return fbo2;
        },
        swap () {
            let temp = fbo1;
            fbo1 = fbo2;
            fbo2 = temp;
        }
    }
}
