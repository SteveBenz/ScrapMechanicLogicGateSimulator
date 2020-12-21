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
    public constructor(props: TProps, private readonly isDraggable: boolean) {
        super(props);
    }

    render(): React.ReactNode {
        return <Group x={this.props.x} y={this.props.y}
                      draggable={this.isDraggable}
                      onDragStart={this._handleDragStart.bind(this)}
                      onMouseEnter={() => {this.setState({ isHovering: true })}}
                      onMouseLeave={() => {this.setState({ isHovering: false })}}
                      onClick={this._handleClick.bind(this)}>
                {this.getContent()}
                <Rect x={0} y={0} height={64} width={64}
                      strokeWidth={2} stroke={this.state.isHovering ? 'black' : 'grey'}
                      fill={this.state.isEnabled ? 'transparent' : '#80808080'} />
            </Group>;
    }

    protected abstract getContent(): JSX.Element | Array<JSX.Element>;
    protected abstract handleClick(): void;
    protected handleDragStart(eventArgs: KonvaEventObject<MouseEvent>): void {}

    private _handleClick(): void {
        if (this.state.isEnabled) {
            this.handleClick();
        }
    }

    private _handleDragStart(eventArgs: KonvaEventObject<MouseEvent>): void {
        eventArgs.target.stopDrag(eventArgs);
        this.handleDragStart(eventArgs);
    }
};

interface IStartStopButtonProps extends IToolBarButtonProps {
    model: Simulator,
};

interface IStartStopButtonState extends IToolBarButtonState {
    isRunning: boolean,
}

export class StartStopButton extends ToolBarButton<IStartStopButtonProps, IStartStopButtonState> {
    public constructor(props: IStartStopButtonProps) {
        super(props, false);
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
        super(props, false);
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

export interface IDragNewInteractableDragEventArgs {
    prototype: Model.Interactable;
    event: KonvaEventObject<MouseEvent>;
};

interface ILogicGateButtonProps extends IToolBarButtonProps {
    kind: Model.LogicGateTypes;
    selected: Model.Interactable | undefined;
    onBeginDrag: (eventArgs: IDragNewInteractableDragEventArgs) => void;
};

interface ILogicGateButtonState extends IToolBarButtonState {
}

export class LogicGateButton extends ToolBarButton<ILogicGateButtonProps, ILogicGateButtonState> {
    constructor(props: ILogicGateButtonProps) {
        super(props, true);
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

    protected handleDragStart(eventArgs: KonvaEventObject<MouseEvent>): void {
        this.props.onBeginDrag({
            prototype: new Model.LogicGate({ x:eventArgs.evt.x, y:eventArgs.evt.y, savedState: false, kind: this.props.kind}),
            event: eventArgs});
    }
};