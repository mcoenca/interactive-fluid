import { default as FluidShape } from './FluidShape'

var FILL_COLOR_CIRCLE="#ff0000";
var DEFAULT_LINE_WIDTH = 5;

export default class FluidLine extends FluidShape
{

    constructor( iWidth, iFillColor )
    {
        super();
        this.lineWidth  = iWidth || DEFAULT_LINE_WIDTH;
        this.points     = [];
        this.fillColor  = iFillColor || FILL_COLOR_CIRCLE;
    }

    draw( iContext )
    {
        if ( !this.isValid() )
        {
            return;
        }
        iContext.beginPath();
        iContext.strokeStyle = this.fillColor;
        iContext.lineWidth = this.lineWidth;
        iContext.moveTo( this.points[0].x, this.points[0].y );
        let pointCount = this.points.length;
        for ( let i = 1; i < pointCount; i++ )
        {
            iContext.lineTo( this.points[i].x, this.points[i].y );
        }
        iContext.stroke();
    }

    destroy()
    {
        this.points.length = 0;
    }

    animate()
    {
        this.width -= 10;
        this.height -= 10;
    }

    isValid()
    {
        return !!this.points.length;
    }
}
