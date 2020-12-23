import * as React from "react";
import { Simulator } from "./Simulator";
import { Text } from 'react-konva';

export interface TickCounterProps {
    simulator: Simulator;
}

interface TickCounterState {
    currentTick: number;
}

export class TickCounter extends React.Component<
    TickCounterProps,
    TickCounterState
> {
    constructor(props: TickCounterProps) {
        super(props);

        this.state = {
            currentTick: props.simulator.currentTick
        };
        
        props.simulator.onTick(() => {
            const newState: TickCounterState = {
                currentTick: props.simulator.currentTick
            };
            this.setState(newState);
        });
    }

    render(): JSX.Element {
        return (
            <Text
                stroke="#ff0000"
                fontSize={30}
                text={this.state.currentTick.toString()}
            />
        );
    }
}
