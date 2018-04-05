

export default class BaseFluid
{
    constructor( iCanvas )
    {
        this.canvas = iCanvas;
    }

    init()
    {
        this._initWebGl();
        this._createAllProgram();
        this._initFramebuffers();
        this._bindEvents();
    }

    shut()
    {
        //@TODO pour que ce soit clean
    }

    run()
    {
        this.lastTime = Date.now();
        this.update();
    }

    update()
    {
        requestAnimationFrame( this.update.bind( this ) );
    }

    resize()
    {
        if ( this.canvas.width === this.canvas.clientWidth && this.canvas.height === this.canvas.clientHeight)
        {
            return;
        }
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this._initFramebuffers();
    }

    _initWebGl()
    {
    }

    _createAllProgram()
    {
    }

    _initFramebuffers ()
    {
    }

    handleEvents(x, y, color, eventType, iUUID )
    {
        if ( eventType === "startPlaying" )
        {
            this._onEventStart( x, y, color, iUUID );
        }
        else if ( eventType === "stillPlaying" )
        {
            this._onEventMove( x, y, color, iUUID );
        }
        else if ( eventType === "stopPlaying" )
        {
            this._onEventEnd( x, y, color, iUUID );
        }
        else if ( eventType === "tap" )
        {
            this._onEventClick( x, y, color, iUUID );
        }
    }

    _onEventStart(x, y, color, iUUID )
    {
    }

    _onEventMove( x, y, color, iUUID )
    {
    }

    _onEventEnd( x, y, color, iUUID )
    {
    }

    _onEventClick( x, y, color, iUUID )
    {
    }

    _onClick(e)
    {

    }

    _onMouseOut(e)
    {

    }

    _onMouseMove(e)
    {
    }

    _onMouseDown(e)
    {
    }

    _onMouseOver(e)
    {
    }

    _onTouchMove(e)
    {
    }

    _onTouchStart(e)
    {
    }

    _onTouchEnd(e)
    {
    }

    _onMouseUp(e)
    {
    }

    _onButtonClick(e)
    {

    }

    _bindEvents()
    {
        this.canvas.addEventListener('mousemove', (e) => {
            this._onMouseMove(e);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            this._onTouchMove(e);
        }, false);

        this.canvas.addEventListener('mousedown', (e) => {
            this._onMouseDown(e);
        });

        this.canvas.addEventListener('touchstart', (e) => {
            this._onTouchStart(e);
        });

        this.canvas.addEventListener('click', (e) => {
            this._onClick(e);
        });

        this.canvas.addEventListener('onmouseover', (e) => {
            this._onMouseOver(e);
        });

        this.canvas.addEventListener('onmouseout', (e) => {
            this._onMouseOut(e);
        });
        window.addEventListener('mouseup', (e) => {
            this._onMouseUp(e);
        });

        window.addEventListener('touchend', (e) => {
            this._onTouchEnd(e);
        });
        window.addEventListener( 'onresize', (e) => {
            this.resize();
        })

        //Temp should be remove
        let button = document.getElementById("background-switch");
        button.addEventListener('click', (e) => {
            this._onButtonClick(e);
        });
    }
}