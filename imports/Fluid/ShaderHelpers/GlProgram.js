export default class GLProgram
{
    constructor ( glContext, vertexShader, fragmentShader)
    {
        this.glContext = glContext;

        this.uniforms = {};
        this.program = this.glContext.createProgram();

        this.glContext.attachShader(this.program, vertexShader);
        this.glContext.attachShader(this.program, fragmentShader);
        this.glContext.linkProgram(this.program);

        if (!this.glContext.getProgramParameter(this.program, this.glContext.LINK_STATUS))
            throw this.glContext.getProgramInfoLog(this.program);

        const uniformCount = this.glContext.getProgramParameter(this.program, this.glContext.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++)
        {
            const uniformName = this.glContext.getActiveUniform(this.program, i).name;
            this.uniforms[uniformName] = this.glContext.getUniformLocation(this.program, uniformName);
        }
    }

    bind ()
    {
        this.glContext.useProgram(this.program);
    }
}