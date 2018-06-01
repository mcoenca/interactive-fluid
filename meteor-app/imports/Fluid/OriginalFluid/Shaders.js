

export const BASE_VERTEX = `        
    attribute vec2 a_position;
    uniform float u_flipY;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position.x, u_flipY*a_position.y, 0, 1);
        v_texCoord = a_texCoord;
    }
`;

export const FRAGMENT = `
    precision mediump float;

    //texture arrays
    //uniform sampler2D u_position;
    uniform sampler2D u_image;//pos, velocity, acceleration = r, g, b
    uniform sampler2D u_canvas;
    uniform sampler2D u_colorRed;
    uniform sampler2D u_colorGreen;
    uniform sampler2D u_colorBlue;
    uniform vec4 u_colorBackground;

    varying vec2 v_texCoord;
    uniform vec2 u_textureSize;

    uniform vec2 u_mouseCoord;
    uniform float u_mouseEnable;

    uniform float u_kSpring;
    uniform float u_dSpring;
    uniform float u_mass;
    uniform float u_dt;

    uniform float u_renderFlag;
    uniform float u_colorFlag;

    void main()
    {

        vec2 onePixel = vec2(1.0, 1.0)/u_textureSize;

        vec4 currentState = texture2D(u_image, v_texCoord);
        vec4 canvas2DState = texture2D(u_canvas, v_texCoord);
        vec4 colorRedState = texture2D(u_colorRed, v_texCoord);
        vec4 colorGreenState = texture2D(u_colorGreen, v_texCoord);
        vec4 colorBlueState = texture2D(u_colorBlue, v_texCoord);

        gl_FragColor = vec4(0.0,0.0,0.0,0.0);
        if (u_renderFlag == 1.0)
        {
            float position = currentState.r/20.0;
            position += 0.5;
            if (position > 1.0) position = 1.0;
            if (position < 0.0) position = 0.0;


//                if ( canvas2DState.r >= 0.01 || canvas2DState.g >= 0.01 || canvas2DState.b >= 0.01 )
//                {
//                    gl_FragColor = canvas2DState * vec4( colorRedState.r, colorGreenState.r, colorBlueState.r,1.0 );
//                    return;
//                }

            if (position < 0.5)
            {
                position *= 2.0;
                //position = 0 -> blue
                //position = 1 -> magenta
                float r = ( 49.0 * position + 56.0 ) / 255.0;
                float g = ( 49.0 * position + 56.0 ) / 255.0;
                float b = ( 49.0 * position + 56.0 ) / 255.0;
                vec4 temp = mix( vec4(r,g,b,1.0) , vec4( colorRedState.r, colorGreenState.r, colorBlueState.r, 1.0), 0.8 );
                gl_FragColor = mix( temp, u_colorBackground, 0.2 );
            }
            else
            {
                position -= 0.5;
                position *= 2.0;
                //position = 0 -> magenta
                //position = 1 -> white
                float r = ( 85.0 * position + 105.0 ) / 255.0;
                float g = ( 85.0 * position + 105.0 ) / 255.0;
                float b = ( 85.0 * position + 105.0 ) / 255.0;
                vec4 temp = mix( vec4(r,g,b,1.0) , vec4( colorRedState.r, colorGreenState.r, colorBlueState.r, 1.0), 0.8 );
                gl_FragColor = mix( temp, u_colorBackground, 0.2 );
            }

            return;
        }

        float fTotal = 0.0;

//            if ( u_mouseEnable == 1.0 )
//            {
//                vec2 pxDistFromMouse = (v_texCoord - u_mouseCoord)*(v_texCoord - u_mouseCoord)/onePixel;
//                float tol = 0.005;
//                if (pxDistFromMouse.x < tol && pxDistFromMouse.y < tol)
//                {
//                    fTotal -= 10.0;//upward force from mouse
//                }
//            }

        float colorIdx = 1.0;
        if ( u_colorFlag == 0.0 && (canvas2DState.r >= 0.01 || canvas2DState.g >= 0.01 || canvas2DState.b >= 0.01) )
        {
            gl_FragColor = currentState;
            return;
        }
        else if ( u_colorFlag == 1.0 && (canvas2DState.r >= 0.01 || canvas2DState.g >= 0.01 || canvas2DState.b >= 0.01) )
        {
            gl_FragColor = vec4(canvas2DState.r, 0.0,0.0, 1.0);
            return;
        }
        else if ( u_colorFlag == 2.0 && (canvas2DState.r >= 0.01 || canvas2DState.g >= 0.01 || canvas2DState.b >= 0.01) )
        {
            gl_FragColor = vec4(canvas2DState.g, 0.0,0.0, 1.0);
            return;
        }
        else if ( u_colorFlag == 3.0 && (canvas2DState.r >= 0.01 || canvas2DState.g >= 0.01 || canvas2DState.b >= 0.01) )
        {
            gl_FragColor = vec4(canvas2DState.b, 0.0,0.0, 1.0);
            return;
        }

        vec3 color=vec3(0.0,0.0,0.0);
        for (int i=-1;i<=1;i+=2)
        {
            for (int j=-1;j<=1;j+=2)
            {
                if (i == 0 && j == 0 ) continue;
                vec2 neighborCoord = v_texCoord + vec2(onePixel.x*float(i), onePixel.y*float(j));
                vec4 neighborColor = texture2D(u_canvas, neighborCoord);
                vec4 neighborState;
                if (neighborCoord.x < 0.0 || neighborCoord.y < 0.0 || neighborCoord.x >= 1.0 || neighborCoord.y >= 1.0)
                {
                    neighborState = vec4(0.0,0.0,0.0,1.0);
                }
//                    else if ( neighborColor.r > 0.0 || neighborColor.g > 0.0 || neighborColor.b > 0.0 )
//                    {
//                        neighborState = vec4(0.0,0.0,0.0,1.0);
//                    }
                else
                {
                    neighborState = texture2D(u_image, neighborCoord);
                }

                float deltaP =  neighborState.r - currentState.r;
                float deltaV = neighborState.g - currentState.g;

                fTotal += u_kSpring*deltaP + u_dSpring*deltaV;
            }
        }

        float acceleration = fTotal/u_mass;
        float velocity = acceleration*u_dt + currentState.g;
        float position = velocity*u_dt + currentState.r;

        gl_FragColor = vec4(position,velocity,acceleration,colorIdx);
    }
`;