import { Circle } from '/imports/FluidCircle.js';

function Canvas2D()
{
    this.docElt = null;
    this.shapeA = [];
}

Canvas2D.prototype.init = function( iID )
{
    this.docElt = document.getElementById( iID );
    this.docElt.style.width = "100%";
    this.docElt.style.height = "100%";

    this.docElt.width = this.docElt.clientWidth;
    this.docElt.height = this.docElt.clientHeight;
    this.docElt.onclick = this.onClick.bind(this); //Tout est moche hein
};

Canvas2D.prototype.onClick = function( iEvent )
{
    var centerX = iEvent.clientX;
    var centerY = iEvent.clientY;
    var circle = new Circle();
    circle.fillColor = "#"+((1<<24)*Math.random()|0).toString(16);
    circle.center.x = centerX;
    circle.center.y = centerY;
    this.shapeA.push( circle );
};

Canvas2D.prototype.resize = function( iWidth, iHeight )
{
    this.docElt.width = iWidth;
    this.docElt.height = iHeight;
};

Canvas2D.prototype.addCircle = function ( iCenterX, iCenterY, iColor )
{
    var circle = new Circle();
    circle.fillColor = iColor;
    circle.center.x = iCenterX;
    circle.center.y = iCenterY;
    this.shapeA.push( circle );
};

//Methode appelée à chaque frame
Canvas2D.prototype.draw = function()
{
    var context = this.docElt.getContext("2d");
    var shapeCount = this.shapeA.length;
    var eltToRemoveA = [];

    context.clearRect(0,0,this.docElt.width, this.docElt.height);
    context.fillStyle = ("#000000");
    context.fillRect(0,0,this.docElt.width, this.docElt.height);
    for ( var i = 0; i < shapeCount; i++ )
    {
        var cShape = this.shapeA[i];
        cShape.draw( context );

        //Ici on modifie le modele pour faire l'animation
        if ( cShape.radius > 10 )
        {
            cShape.radius -= 10;
        }
        else
        {
            //Pour supprimer la shape des elements à dessiner
            eltToRemoveA.push( this.shapeA[i] );
        }
    }


    for ( var i = 0; i < eltToRemoveA.length; i++)
    {
        var idx = this.shapeA.indexOf( eltToRemoveA[i] );
        this.shapeA.splice( idx, 1 );
    }
};

export {Canvas2D};
