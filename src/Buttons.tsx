import * as React from "react";
import { Image, Line, Rect, Group, Circle, Text } from "react-konva";
import { Simulator, ISerializedSimulator } from "./Simulator";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import { Interactable } from "./Model";
import { KonvaEventObject } from "konva/types/Node";
import FileSaver from 'file-saver';

interface IToolBarButtonProps {
    x: number;
    y: number;
}

interface IToolBarButtonState {
    isHovering: boolean;
    isEnabled: boolean; //  <- todo: get rid of bad state-derived-from-props
    isPressed: boolean;
}

const buttonWidth = 64;
const buttonHeight = 64;
const pressedScalingFactor = 1.05;

abstract class ToolBarButton<TProps extends IToolBarButtonProps,TState extends IToolBarButtonState> extends React.Component<TProps, TState> {
    public constructor(props: TProps) {
        super(props);
    }

    render(): React.ReactNode {
        return <Group x={this.props.x - (this.state.isPressed ? buttonWidth*((pressedScalingFactor - 1)/2) : 0)}
                      y={this.props.y - (this.state.isPressed ? buttonHeight*((pressedScalingFactor - 1)/2) : 0)}
                      onMouseEnter={this._handleMouseEnter}
                      onMouseLeave={this._handleMouseLeave}
                      onMouseDown={this._handleMouseDown}
                      onMouseUp={this._handleMouseUp}
                      scaleX={this.state.isPressed ? pressedScalingFactor : 1}
                      scaleY={this.state.isPressed ? pressedScalingFactor : 1}>
                {this.getContent()}
                <Rect x={0} y={0} height={64} width={64}
                      strokeWidth={2} stroke={this.state.isHovering ? 'black' : 'grey'}
                      fill={this.state.isEnabled ? 'transparent' : '#80808080'} />
            </Group>;
    }

    protected abstract getContent(): JSX.Element | Array<JSX.Element>;
    protected abstract handleClick(): void;

    protected handleDragStart: ((eventArgs: KonvaEventObject<MouseEvent>) => void) | undefined = undefined;

    private _handleMouseEnter: () => void = () => {
        this.setState({ isHovering: true });
    }

    private _handleMouseLeave: (_: KonvaEventObject<MouseEvent>) => void = (eventArgs) => {
        // If the cursor is moving roughly upward, call it a drag.
        if (this.handleDragStart && this.state.isPressed && eventArgs.evt.offsetY < this.props.y+32) {
            this.handleDragStart(eventArgs);
        }

        this.setState({ isHovering: false, isPressed: false });
    }

    private _handleMouseDown: () => void = () => {
        this.setState({ isPressed: true });
    }

    private _handleMouseUp: () => void = () => {
        this.setState({ isPressed: false });
        this.handleClick();
    }
}

interface IStartStopButtonProps extends IToolBarButtonProps {
    model: Simulator,
}

interface IStartStopButtonState extends IToolBarButtonState {
    isRunning: boolean,
}

export class StartStopButton extends ToolBarButton<IStartStopButtonProps, IStartStopButtonState> {
    public constructor(props: IStartStopButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
            isEnabled: true,
            isPressed: false,
            isRunning: this.props.model.isRunning,
        }

        this.props.model.onRunStateChanged(this.handleRunStateChanged.bind(this));
    }

    private handleRunStateChanged(): void {
        this.setState({ isRunning: this.props.model.isRunning });
    }

    protected getContent(): JSX.Element | Array<JSX.Element> {
        return this.props.model.isRunning ?
                [
                    <Line key='1' points={[32-5, 32-12, 32-5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>,
                    <Line key='2' points={[32+5, 32-12, 32+5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>
                ] : [   <Line key='3'  points={[32-16, 32-16, 32+12, 32, 32-16, 32+16]}
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
}

export class SingleStepButton extends ToolBarButton<ISingleStepButtonProps, IToolBarButtonState> {
    public constructor(props: ISingleStepButtonProps) {
        super(props);
        this.state = {
            isHovering: false,
            isEnabled: true,
            isPressed: false,
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
}

interface ILogicGateButtonProps extends IToolBarButtonProps {
    kind: Model.LogicGateTypes | 'timer' | 'input';
    selected: Model.Interactable | undefined;
    onBeginDrag: (eventArgs: IDragNewInteractableDragEventArgs) => void;
}

export class LogicGateButton extends ToolBarButton<ILogicGateButtonProps, IToolBarButtonState> {
    constructor(props: ILogicGateButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        };
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        switch(this.props.kind) {
            case 'input':
                return <Circle radius={22} x={32} y={32} strokeWidth={8} stroke={this.state.isEnabled ? 'black' : '#00000080'} />;
            case 'timer':
                const drawingHeight = 64;
                const drawingWidth = 64;
                const horizontalOffset = 12;
                const verticalOffset = 6;
                const tickStorage = [true, true, true, true, true, false, false, false, false, false];
                const rectHeight = (drawingHeight - 2*verticalOffset) / tickStorage.length;

                return tickStorage.map((value: boolean, index: number) =>
                <Rect key={index}
                      x={horizontalOffset}
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

        if (this.props.kind === 'input' && this.props.selected instanceof Model.Input) {
            this.props.selected.twiddle(1);
        } else if (this.props.kind === 'timer' && this.props.selected instanceof Model.Timer) {
            // no action
        } else if (this.props.kind !== 'timer' && this.props.kind !== 'input' && this.props.selected instanceof Model.LogicGate) {
            this.props.selected.kind = this.props.kind;
        } else {
            // TODO: Convert the interactable
        }
    }

    protected handleDragStart = (eventArgs: KonvaEventObject<MouseEvent>): void => {
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
}

interface IPaintButtonProps extends IToolBarButtonProps {
    selected: Model.Interactable | undefined;
}

export class PaintButton extends ToolBarButton<IPaintButtonProps, IToolBarButtonState> {
    constructor(props: IPaintButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
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
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return [ <Line key='base'
                       points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
                       strokeWidth={4}
                       stroke='black'
                       closed={true}/>,
                <Line key='arrow'
                      points = {[18, 42,  32, 32,  46, 42,  18, 42]}
                      strokeWidth={1}
                      stroke='blue'
                      closed={true}
                      fill='blue'/>];
    }

    protected handleClick(): void {
        for (const i of this.props.simulator.interactables) {
            i.reload();
        }
    }
}


export class TakeOffLiftButton extends ToolBarButton<ILiftButtonProps, IToolBarButtonState> {
    constructor(props: ILiftButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return [ <Line key='base'
                       points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
                       strokeWidth={4}
                       stroke='black'
                       closed={true}/>,
                  <Line key='arrow'
                        points = {[18, 32,  32, 42,  46, 32,  18, 32]}
                        strokeWidth={1}
                        stroke='blue'
                        closed={true}
                        fill='blue'/>];
    }

    protected handleClick(): void {
        for (const i of this.props.simulator.interactables) {
            i.paint();
        }
    }
}


interface IDeleteButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
    selected: Interactable | undefined;
}

export class DeleteButton extends ToolBarButton<IDeleteButtonProps, IToolBarButtonState> {
    constructor(props: IDeleteButtonProps) {
        super(props);
        this.state = {
            isEnabled: this.props.selected !== undefined,
            isHovering: false,
            isPressed: false
        }
    }

    static getDerivedStateFromProps(props: IDeleteButtonProps, state: IToolBarButtonState): IToolBarButtonState {
        return {
            isEnabled: props.selected !== undefined,
            isHovering: state.isHovering,
            isPressed: state.isPressed,
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

interface ICopyLinkButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
}

export class CopyLinkButton extends ToolBarButton<ICopyLinkButtonProps, IToolBarButtonState> {
    constructor(props: ICopyLinkButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Text text="&#128279;" x={6} y={14} fontSize={42} fill='black'/>;
    }

    protected handleClick(): void {

        // TODO: Doing this for-real seems to require being served by HTTPS, so re-test it then.  This is certainly
        //   bad because it keeps recreating the textarea.  But it also is probably useless as there's a
        //   navigator.clipboard function that would do this more easily.
        //
        // https://stackoverflow.com/questions/400212/how-do-i-copy-to-the-clipboard-in-javascript
        const box = document.createElement("textarea");
        if (!box) {
            throw new Error("textarea is missing in index.html");
        }

        // Avoid scrolling to bottom
        box.style.top = "0";
        box.style.left = "0";
        box.style.position = "fixed";

        box.value = window.location.origin + window.location.pathname + '?' + this.props.simulator.serializeToCompressedQueryStringFragment();
        box.focus();
        box.select();
        try {
            const successful = document.execCommand('copy');
            const msg = successful ? 'successful' : 'unsuccessful';
            alert('Fallback: Copying text command was ' + msg);
        } catch (err) {
            console.error('Fallback: Oops, unable to copy', err);
        }
    }
}


interface ISaveToFileButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
}

export class SaveToFileButton extends ToolBarButton<ISaveToFileButtonProps, IToolBarButtonState> {
    constructor(props: ISaveToFileButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Text text="&#128190;" x={6} y={14} fontSize={42} fill='black'/>;
    }

    protected handleClick(): void {
        const file = new File([JSON.stringify(this.props.simulator.serialize(), null, 4)], "logicgatesim.json", {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(file);
    }
}

interface ILoadFromFileButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
}

export class LoadFromFileButton extends ToolBarButton<ILoadFromFileButtonProps, IToolBarButtonState> {
    private readonly fileInputElement: HTMLInputElement;

    constructor(props: ILoadFromFileButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }

        const fileElem = document.getElementById("fileElem") as HTMLInputElement;
        if (!fileElem) {
            throw new Error("index.html is busted - fileElem <input> is missing");
        }

        this.fileInputElement = fileElem;

        this.fileInputElement.addEventListener('change', this.handleFileGiven.bind(this), false)
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Text text="&#128193;" x={6} y={14} fontSize={42} fill='black'/>;
    }

    protected handleClick(): void {
        const fileElem = document.getElementById("fileElem");
        if (!fileElem) {
            throw new Error("fileElem is missing in index.html");
        }
        fileElem.click();
    }

    // This function tied to the 'change' event of the file dialog in index.html
    handleFileGiven(): void {
        if (!this.fileInputElement.files || this.fileInputElement.files.length === 0) {
            return;
        }

        // hacky - no message when file load fails.
        const reader = new FileReader();
        reader.onload = () => {
            const json: string = reader.result as string;
            const serialized: ISerializedSimulator = JSON.parse(json) as ISerializedSimulator;
            this.props.simulator.load(serialized);
        };
        reader.readAsText(this.fileInputElement.files[0]);
    }
}


interface IReloadButtonProps extends IToolBarButtonProps {
    simulator: Simulator;
}

export class ReloadButton extends ToolBarButton<IReloadButtonProps, IToolBarButtonState> {
    constructor(props: IReloadButtonProps) {
        super(props);
        this.state = {
            isEnabled: true,
            isHovering: false,
            isPressed: false,
        }
    }

    protected getContent(): JSX.Element | JSX.Element[] {
        return <Text text="&#8645;" x={16} y={14} fontSize={42} fill='black'/>;
    }

    protected handleClick(): void {
        this.props.simulator.gameReload();
    }
}
