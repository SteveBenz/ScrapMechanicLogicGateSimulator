import * as React from "react";
import { Simulator } from "./Simulator";
import { Text } from 'react-konva';
import Konva from 'konva';

export interface TickCounterProps {
    simulator: Simulator;
    right: number;
    top: number;
}

/**
 * Implements the tick counter, the trickiest bit being that it wants to render it in the top-right.
 * This isn't done in a very react-like way because we need to set the 'x' position relative to the
 * width of the text, and we don't know the width of the text until the DOM renders it.  What we really
 * want, in any case, is a text element that's right-aligned, and that's just not in Konva as far as I
 * can see.  Probably because Konva can do it easily enough.  See the code in @see _handleTick.
 */
export function TickCounter(props: TickCounterProps): JSX.Element {
    const [currentTick, setCurrentTick] = React.useState(0);
    const [width, setWidth] = React.useState(20);;
    const textRef: React.RefObject<Konva.Text> = React.useRef<Konva.Text>(null);

    // Set up the tick listener
    React.useEffect(() => {
        function handleTick() {
            setCurrentTick(props.simulator.currentTick);

            if (textRef.current === null) {
                // Shouldn't happen
                return;
            }
    
            // Somehow, setting the text changes width(), but somehow actually
            // doesn't change the screen.  (That is, without setting the text
            // in the render, it has no effect).
            textRef.current.text(props.simulator.currentTick.toString());
            setWidth(textRef.current.width());
        }
    
        props.simulator.onTick(handleTick);
        handleTick();

        return () => {props.simulator.offTick(handleTick);}
    }, [props.simulator]);

    return (
        <Text y={props.top}
              x={props.right - width}
              ref={textRef}
              fill='red'
              text={currentTick.toString()}
              fontSize={30}/>
    );
}