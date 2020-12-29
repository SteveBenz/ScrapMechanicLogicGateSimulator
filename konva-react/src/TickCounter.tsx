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
        }
    
        props.simulator.onTick(handleTick);
        handleTick();

        return () => {props.simulator.offTick(handleTick);}
    }, [props.simulator]);

    // Ensure the text is right-justified
    React.useEffect(() => {
        if (textRef.current === null) {
            // Shouldn't happen
            return;
        }

        // while I would have thought we could just set textRef.current.x() in here, it turns
        // out that it doesn't actually take effect until render.  So instead we'll go ahead
        // and make width a part of state.  That means that (in theory) we could go through
        // two render passes on each tick - once to set the text and once to fix the position.
        // We'll moderate that a bit by ensuring we only re-adjust if there's been a substantial
        // change in the width.
        const w = textRef.current.width();
        if (w > width + 3 || w < width - 3) {
            setWidth(w);
        }
    });

    return (
        <Text y={props.top}
              x={props.right - width}
              ref={textRef}
              fill='red'
              text={currentTick.toString()}
              fontSize={30}/>
    );
}