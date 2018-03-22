var FILL_COLOR_CIRCLE="#ff0000";
var CIRCLE_DEFAULT_SIZE = 100;

function Circle( iRadius, iFillColor, iStrokeColor )
{
    this.radius = iRadius || CIRCLE_DEFAULT_SIZE;
    this.center     = {x:0.0,y:0.0};
    this.fillColor  = iFillColor || FILL_COLOR_CIRCLE; //L'intérieur du cercle
}

Circle.prototype.draw = function( iContext )
{
    iContext.beginPath();
    iContext.arc(this.center.x, this.center.y, this.radius, 0, 2 * Math.PI, false);
    iContext.fillStyle = this.fillColor;
    iContext.fill();
};

export { Circle };
