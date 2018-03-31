
export default class ShaderCompiler
{
    constructor( iGlContext )
    {
        this.glContext = iGlContext;
    }

    compileShader(type, source)
    {
        const shader = this.glContext.createShader(type);
        this.glContext.shaderSource(shader, source);
        this.glContext.compileShader(shader);

        if ( !this.glContext.getShaderParameter(shader, this.glContext.COMPILE_STATUS) )
        {
            throw this.glContext.getShaderInfoLog(shader);
        }

        return shader;
    };
}