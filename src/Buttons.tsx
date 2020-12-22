import * as React from "react";
import { render } from "react-dom";
import { Image, Stage, Layer, Arrow, Line, Rect, Group, Circle, Text } from "react-konva";
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
    kind: Model.LogicGateTypes | 'timer' | 'input';
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
        switch(this.props.kind) {
            case 'input':
                return <Circle radius={22} x={32} y={32} strokeWidth={8} stroke={this.state.isEnabled ? 'black' : '#00000080'} />;
            case 'timer':
                const drawingHeight: number = 64;
                const drawingWidth: number = 64;
                const horizontalOffset: number = 12;
                const verticalOffset: number = 6;
                const tickStorage = [true, true, true, true, true, false, false, false, false, false];
                const rectHeight = (drawingHeight - 2*verticalOffset) / tickStorage.length;

                return tickStorage.map((value: boolean, index: number) =>
                <Rect x={horizontalOffset}
                      width={drawingWidth - 2*horizontalOffset}
                      y={drawingHeight - verticalOffset - rectHeight - index*(drawingHeight-2*verticalOffset)/tickStorage.length}
                      height={rectHeight}
                      strokeWidth={1}
                      stroke='darkgrey'
                      fill={value ? 'blue' : 'white'}
                       />);
            default:
                return <Image x={0} y={0} image={ViewModel._assets[this.props.kind].image()} />;
        }
    }

    protected handleClick(): void {
        if (!this.props.selected) {
            return;
        }

        if (this.props.kind == 'input' && this.props.selected instanceof Model.Input) {
            this.props.selected.twiddle(1);
        } else if (this.props.kind == 'timer' && this.props.selected instanceof Model.Timer) {
            // no action
        } else if (this.props.kind != 'timer' && this.props.kind != 'input' && this.props.selected instanceof Model.LogicGate) {
            this.props.selected.kind = this.props.kind;
        } else {
            // TODO: Convert the interactable
        }
    }

    protected handleDragStart(eventArgs: KonvaEventObject<MouseEvent>): void {
        let prototype: Model.Interactable;
        switch(this.props.kind) {
            case 'timer':
                prototype = new Model.Timer({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, kind: this.props.kind, tickStorage: new Array<boolean>(10).fill(false) });
                break;
            case 'input':
                prototype = new Model.Input({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, savedState: false, kind: this.props.kind});
                break;
            default:
                prototype = new Model.LogicGate({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, savedState: false, kind: this.props.kind});
                break;
        }

        this.props.onBeginDrag({
            prototype: prototype,
            event: eventArgs});
    }
};

interface IPaintButtonProps extends IToolBarButtonProps {
    selected: Model.Interactable | undefined;
}

export class PaintButton extends ToolBarButton<IPaintButtonProps, IToolBarButtonState> {
    constructor(props: IPaintButtonProps) {
        super(props, false);
        this.state = {
            isEnabled: true,
            isHovering: false
        }
    }
    protected getContent(): JSX.Element | JSX.Element[] {
        return <Image x={0} y={0} image={ViewModel._assets['paint'].image()} />;
    }

    protected handleClick(): void {
        if (this.props.selected instanceof Model.InteractableWithSingleBitSavedState) {
            this.props.selected.paint();
        }
    }
}

interface ILiftButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
}

export class PutOnLiftButton extends ToolBarButton<ILiftButtonProps, IToolBarButtonState> {
    constructor(props: ILiftButtonProps) {
        super(props, false);
        this.state = {
            isEnabled: true,
            isHovering: false
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return [ <Line points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
                    strokeWidth={4}
                    stroke='black'
                    closed={true}/>,
                <Line points = {[18, 42,  32, 32,  46, 42,  18, 42]}
                    strokeWidth={1}
                    stroke='blue'
                    closed={true}
                    fill='blue'
                    />];
    }

    protected handleClick(): void {
        for (let i of this.props.simulator.interactables) {
            i.reload();
        }
    }
}


export class TakeOffLiftButton extends ToolBarButton<ILiftButtonProps, IToolBarButtonState> {
    constructor(props: ILiftButtonProps) {
        super(props, false);
        this.state = {
            isEnabled: true,
            isHovering: false
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return [ <Line points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
                    strokeWidth={4}
                    stroke='black'
                    closed={true}/>,
                <Line points = {[18, 32,  32, 42,  46, 32,  18, 32]}
                    strokeWidth={1}
                    stroke='blue'
                    closed={true}
                    fill='blue'
                    />];
    }

    protected handleClick(): void {
        for (let i of this.props.simulator.interactables) {
            i.paint();
        }
    }
}


interface IDeleteButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
    selected: Interactable | undefined;
};

export class DeleteButton extends ToolBarButton<IDeleteButtonProps, IToolBarButtonState> {
    constructor(props: IDeleteButtonProps) {
        super(props, false);
        this.state = {
            isEnabled: this.props.selected !== undefined,
            isHovering: false
        }
    }

    static getDerivedStateFromProps(props: IDeleteButtonProps, state: IToolBarButtonState): IToolBarButtonState {
        return {
            isEnabled: props.selected !== undefined,
            isHovering: state.isHovering
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Text text="&#128465;" x={10} y={8} fontSize={64} fill='black'/>;
    }

    protected handleClick(): void {
        if (this.props.selected) {
            this.props.simulator.remove(this.props.selected);
        }
    }
}
