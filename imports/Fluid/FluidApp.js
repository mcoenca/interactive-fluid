import { Run as RunOriginalFluid, handleEvents as OriginalFluidHandleEvents } from './OriginalFluid/OriginalFluid.js'
import { default as NewFluidSimulation } from './NewFluid/NewFluid.js'

const FLUID_SIMULATION_APPS = {
    ORIGINAL_APP : 1,
    NEW_APP      : 2
};

export default class FluidApp
{
    constructor()
    {
        this.id             = 0;
        this.webglCanvas    = null;
        this.fluidSimu      = null;
    }

    init()
    {
        this.webglCanvas = document.getElementById("glcanvas");
        this.webglCanvas.width = this.webglCanvas.clientWidth;
        this.webglCanvas.height = this.webglCanvas.clientHeight;
    }

    static get FLUID_SIMULATION_APPS_KEY ()
    {
        return FLUID_SIMULATION_APPS;
    }

    run( iAppID )
    {
        switch (iAppID)
        {
            case FLUID_SIMULATION_APPS.ORIGINAL_APP:
                RunOriginalFluid();
                break;
            case FLUID_SIMULATION_APPS.NEW_APP:
                this.fluidSimu= new NewFluidSimulation( this.webglCanvas );
                this.fluidSimu.init();
                this.fluidSimu.run();
                break;
            default:
                throw new Error("Fluid.FluidApp [Run] Expecting iAppID to be a value of FLUID_SIMULATION_APPS_KEY");
        }
        this.id = iAppID;
    }

    handleEvents( x, y, color, eventType )
    {
        switch (this.id)
        {
            case FLUID_SIMULATION_APPS.ORIGINAL_APP:
                OriginalFluidHandleEvents( x, y, color, eventType );
                break;
            case FLUID_SIMULATION_APPS.NEW_APP:
                this.fluidSimu.handleEvents(x, y, color, eventType);
                break;
            default:
                throw new Error("Fluid.FluidApp [Run] Expecting iAppID to be a value of FLUID_SIMULATION_APPS_KEY");
        }
    }
}