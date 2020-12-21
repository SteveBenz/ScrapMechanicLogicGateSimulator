import * as React from "react";
import { render } from "react-dom";
import { Image, Stage, Layer, Arrow, Line, Rect, Group } from "react-konva";
import { Simulator, IEventArgsInteractableAdded, IEventArgsInteractableRemoved, IInteractableLink, ISerializedSimulator, IEventArgsSimulatorRunStateChanged } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Vector2d } from "konva/types/types";
import { Interactable } from "./Model";
import * as pako from 'pako';
import { KonvaEventObject } from "konva/types/Node";
import { JsxElement } from "typescript";


interface IToolBarButtonProps {
    x: number;
    y: number;
};


interface IToolBarButtonState {
    isHovering: boolean;
    isEnabled: boolean;
};

abstract class ToolBarButton<TProps extends IToolBarButtonProps,TState extends IToolBarButtonState> extends React.Component<TProps, TState> {
    public constructor(props: TProps) {
        super(props);
    }

    render(): React.ReactNode {
        return <Group x={this.props.x} y={this.props.y}
                   onMouseEnter={() => {this.setState({ isHovering: true })}}
                   onMouseLeave={() => {this.setState({ isHovering: false })}}
                   onClick={this.handleClick.bind(this)}>
                {this.getContent()}
                <Rect x={0} y={0} height={64} width={64}
                      strokeWidth={2} stroke={this.state.isHovering ? 'black' : 'grey'}
                      fill={this.state.isEnabled ? 'transparent' : '#80808080'} />
            </Group>;
    }

    protected abstract getContent(): JSX.Element | Array<JSX.Element>;
    private _handleClick(): void {
        if (this.state.isEnabled) {
            this.handleClick();
        }
    }

    protected abstract handleClick(): void;
};

interface IStartStopButtonProps extends IToolBarButtonProps {
    model: Simulator,
};

interface IStartStopButtonState extends IToolBarButtonState {
    isRunning: boolean,
}

export class StartStopButton extends ToolBarButton<IStartStopButtonProps, IStartStopButtonState> {
    public constructor(props: IStartStopButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
            isEnabled: true,
            isRunning: this.props.model.isRunning,
        }

        this.props.model.onRunStateChanged(this.handleRunStateChanged.bind(this));
    }

    private handleRunStateChanged(eventArgs: IEventArgsSimulatorRunStateChanged): void {
        this.setState({ isRunning: this.props.model.isRunning });
    }

    protected getContent(): JSX.Element | Array<JSX.Element> {
        return this.props.model.isRunning ?
                [
                    <Line points={[32-5, 32-12, 32-5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>,
                    <Line points={[32+5, 32-12, 32+5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>
                ] : [   <Line points={[32-16, 32-16, 32+12, 32, 32-16, 32+16]}
                      strokeWidth={4}
                      stroke='green'
                      fill='green'
                      closed={true}/>
                ];
    }

    protected handleClick(): void {
        if (this.props.model.isRunning) {
            this.props.model.stopRunning();
        } else {
            this.props.model.startRunning();
        }
    }
}

interface ISingleStepButtonProps extends IToolBarButtonProps {
    model: Simulator,
};

export class SingleStepButton extends ToolBarButton<ISingleStepButtonProps, IToolBarButtonState> {
    public constructor(props: ISingleStepButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
            isEnabled: true,
        }

        this.props.model.onRunStateChanged(() => this.setState({ isEnabled: !this.props.model.isRunning }));
    }

    protected getContent(): JSX.Element | Array<JSX.Element> {
        return <Line points={[32+12, 32, 32-16, 32+16, 32-16, 32-16, 32+12, 32, 32+12, 32-16, 32+12, 32+16]}
        strokeWidth={4}
        stroke={this.state.isEnabled ? '#008000ff' : '#305030ff'}
        closed={false}/>
    }

    protected handleClick(): void {
        this.props.model.advanceOne();
    }
}


interface ILogicGateButtonProps extends IToolBarButtonProps {
    kind: Model.LogicGateTypes;
    selected: Model.Interactable | undefined;
};

interface ILogicGateButtonState extends IToolBarButtonState {
}

export class LogicGateButton extends ToolBarButton<ILogicGateButtonProps, ILogicGateButtonState> {
    constructor(props: ILogicGateButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false
        };
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Image x={0} y={0} image={ViewModel._assets[this.props.kind].image()} />;
    }

    protected handleClick(): void {
        if (!this.props.selected || !(this.props.selected instanceof Model.LogicGate)) {
            return;
        }

        this.props.selected.kind = this.props.kind;
    }
};