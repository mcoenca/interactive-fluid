import { default as FluidShape } from './FluidShape'

var FILL_COLOR_CIRCLE="#ff0000";
var CIRCLE_DEFAULT_SIZE = 100;


class Circle extends FluidShape
{
    constructor(iRadius, iFillColor, iStrokeColor)
    {
        super();
        this.radius = iRadius || CIRCLE_DEFAULT_SIZE;
        this.center     = {x:0.0,y:0.0};
        this.fillColor  = iFillColor || FILL_COLOR_CIRCLE; //L'intérieur du cercle
        this.isAnimated = true;
    }

    draw( iContext )
    {
        if ( !this.isValid() )
        {
            return;
        }
        iContext.beginPath();
        iContext.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false);
        iContext.fillStyle = this.fillColor;
        iContext.fill();
    }

    destroy()
    {
        this.radius = -100;
    }

    animate()
    {
        if ( !this.isAnimated )
        {
            return;
        }
        this.radius -= 10;
    }

    isValid()
    {
        return this.radius > 0;
    }
}


export { Circle };
