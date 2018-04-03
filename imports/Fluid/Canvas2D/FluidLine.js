import { default as FluidShape } from './FluidShape'
import { bezierCurveThrough } from "./BezierCurvHelper";

var FILL_COLOR_CIRCLE="#ff0000";
var DEFAULT_LINE_WIDTH = 20;

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
        bezierCurveThrough( iContext, this.points )
        // iContext.moveTo( this.points[0].x, this.points[0].y );
        // for(var i = 0; i < this.points.length-1; i ++)
        // {
        //
        //     var x_mid = (this.points[i].x + this.points[i+1].x) / 2;
        //     var y_mid = (this.points[i].y + this.points[i+1].y) / 2;
        //     var cp_x1 = (x_mid + this.points[i].x) / 2;
        //     var cp_y1 = (y_mid + this.points[i].y) / 2;
        //     var cp_x2 = (x_mid + this.points[i+1].x) / 2;
        //     var cp_y2 = (y_mid + this.points[i+1].y) / 2;
        //     iContext.quadraticCurveTo(cp_x1,this.points[i].y ,x_mid, y_mid);
        //     iContext.quadraticCurveTo(cp_x2,this.points[i+1].y ,this.points[i+1].x,this.points[i+1].y);
        // }
        // iContext.stroke();
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
