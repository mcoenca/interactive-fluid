import { default as FluidShape } from './FluidShape'

var FILL_COLOR_CIRCLE="#ff0000";
var RECT_DEFAULT_WIDTH = 50;
var RECT_DEFAULT_HEIGHT = 50;

class Rect extends FluidShape
{

    constructor( iWidth, iHeight, iFillColor )
    {
        super();
        this.width      = iWidth || RECT_DEFAULT_WIDTH;
        this.height     = iHeight || RECT_DEFAULT_HEIGHT;
        this.center     = {x:0.0,y:0.0};
        this.fillColor  = iFillColor || FILL_COLOR_CIRCLE; //L'intérieur du cercle
    }

    draw( iContext )
    {
        if ( !this.isValid() )
        {
            return;
        }
        iContext.fillStyle = this.fillColor;
        iContext.fillRect( this.center.x - this.width / 2, this.center.y - this.height / 2, this.width, this.height );
    }

    animate()
    {
        this.width -= 10;
        this.height -= 10;
    }

    isValid()
    {
        return this.width > 0 && this.height > 0;
    }
}

export { Rect };
