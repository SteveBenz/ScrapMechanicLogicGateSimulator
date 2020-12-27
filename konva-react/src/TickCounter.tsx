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
export class TickCounter extends React.Component<TickCounterProps> {
    private textRef: Konva.Text | undefined;
    private lastWidthUsed: number;

    constructor(props: TickCounterProps) {
        super(props);

        this.state = {
            currentTick: props.simulator.currentTick,
        };

        // This value really doesn't matter, if it's ever visible, it's for a blink and no more.
        // The property itself is here to handle resize when the simulator is not ticking.
        // In that case, props.right gets updated by React, causing a render to happen, but
        // in that case, componentDidMount does not get called -- it only gets called once when
        // the object gets first drawn, not every time it renders.
        this.lastWidthUsed = 20;
    }

    componentDidMount(): void {
        this.props.simulator.onTick(this._handleTick);
        this._handleTick();
    }

    componentWillUnmount(): void {
        this.props.simulator.offTick(this._handleTick);
    }

    private _handleTick = (): void => {
        if (this.textRef) {
            this.textRef.text(this.props.simulator.currentTick.toString());
            this.lastWidthUsed = this.textRef.width();
            this.textRef.x(this.props.right - this.textRef.width());
        }
    }

    render(): JSX.Element {
        return (
            <Text y={this.props.top}
                  x={this.props.right - this.lastWidthUsed}
                  ref={(t: Konva.Text): void => { this.textRef = t; }}
                  fill='red'
                  fontSize={30}/>
        );
    }
}
