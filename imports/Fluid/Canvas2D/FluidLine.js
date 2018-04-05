import { default as FluidShape } from './FluidShape'
import { bezierCurveThrough } from "./BezierCurvHelper";

var FILL_COLOR_CIRCLE="#ff0000";
var DEFAULT_LINE_WIDTH = 12;
var RANDOM_LINE_AMP = 5
var RANDOM_LINE_WIDTH = true;
var MAX_WIDTH = 1200;
var MAX_HEIGHT = 800;
var MAX_VIBRATO_AMP = 10;


export default class FluidLine extends FluidShape
{

    constructor( iWidth, iFillColor )
    {
        super();

        if (!iWidth && RANDOM_LINE_WIDTH) {
            this.lineWidth = Math.floor(Math.random() * RANDOM_LINE_AMP) + DEFAULT_LINE_WIDTH;
        } else {
            this.lineWidth  = iWidth || DEFAULT_LINE_WIDTH;
        }
        
        this.points     = [];
        this.fillColor  = iFillColor || FILL_COLOR_CIRCLE;

        // vibrato control
        this.vibratoAmplitude = 0;
        this.vibratoType = 'random';
        this.vibratoData = {};
        this.previousiContextLineWidth = null;
    }

    draw( iContext )
    {
        if ( !this.isValid() )
        {
            return;
        }
        iContext.beginPath();
        iContext.strokeStyle = this.fillColor;

        if (this.vibratoAmplitude === 0) {
            iContext.lineWidth = this.lineWidth;
        } else {
            iContext.lineWidth = this._vibrateLineWidth();
        }

        this.previousiContextLineWidth = iContext.lineWidth;
        
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

    changeInternalParams( x, y, fluidControl = {}) {
        const {
            lineVibratoType
        } = fluidControl;

        const pc = ((x / MAX_WIDTH) + (MAX_HEIGHT - y) / MAX_HEIGHT) / 2;

        console.log(pc);

        if (pc > 0.1){
            this._setVibrato( pc * MAX_VIBRATO_AMP, lineVibratoType); 
        } else {
            this._setVibrato(0);
        }
    }

    _setVibrato( amplitude, type = null) {
        if (type && type !== this.vibratoType) {
            this.vibratoType = type;
        }

        this.vibratoAmplitude = amplitude;
    }

    _vibrateLineWidth() {
        if (this.vibratoType === 'random') {
            return this.lineWidth + Math.floor(Math.random() * this.vibratoAmplitude);
        } else if (this.vibratoType === 'pulse') {
            const min = this.lineWidth - this.vibratoAmplitude;
            const max = this.lineWidth + this.vibratoAmplitude;
            const growing = this.vibratoData.growing;
            const lastWidth = this.previousiContextLineWidth;

            if (growing) {
                const nextLineWidth = lastWidth + 1;
                if (nextLineWidth >= max) {
                    this.vibratoData.growing = false;
                }

                return nextLineWidth;
            } else {
                const nextLineWidth = lastWidth - 1;

                if (nextLineWidth <= min) {
                    this.vibratoData.growing = true;
                }

                return nextLineWidth;
            }
        }
    }


}
