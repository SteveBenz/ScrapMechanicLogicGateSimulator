import * as React from "react";
import { Image, Line, Rect, Group, Circle, Text } from "react-konva";
import { Simulator } from "./Simulator";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import { Interactable } from "./Model";
import FileSaver from 'file-saver';
import * as FloatingErrorMessage from "./FloatingErrorMessage";
import { KonvaEventObject } from "konva/lib/Node";
import { exportModel, importModel } from "./importexport";

interface IToolBarButtonProps {
    x: number;
    y: number;
    isEnabled: boolean;
    children: Array<JSX.Element> | JSX.Element;
    onDragStart?: ((eventArgs: KonvaEventObject<MouseEvent>) => void) | undefined;
    onClicked: (eventArgs: KonvaEventObject<MouseEvent>) => void;
    toolTipId: string;
}

const buttonWidth = 64;
const buttonHeight = 64;
const pressedScalingFactor = 1.05;

export class ToolTip {
    private timeoutHandle: NodeJS.Timeout | undefined;

    constructor(private readonly toolTipId: string, public x: number, public y: number)
    {
    }

    /**  Starts a timer that, if it expires and not cleared, will show the tooltip. */
    public startTimer(): void {
        if (!this.timeoutHandle && document.getElementById(this.toolTipId)) {
            this.timeoutHandle = setTimeout(this._handleTimeout, 1000);
        }        
    }

    /** Hides the tooltip if it's shown and prevents it popping up if it hasn't. */
    public clearTimer(): void {
        if (this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            this.timeoutHandle = undefined;
        }

        const element: HTMLElement | null = document.getElementById(this.toolTipId);
        if (!element) {
            throw new Error("toolTipId is defined, but not in the document");
        }

        element.style.visibility = 'hidden';
    }
    
    private _handleTimeout: () => void = () => {
        this.timeoutHandle = undefined;
        if (!this.toolTipId) {
            return;
        }

        const element: HTMLElement | null = document.getElementById(this.toolTipId);
        if (!element) {
            throw new Error("toolTipId is defined, but not in the document");
        }

        element.style.visibility = 'visible';
        const left:number = Math.max(0, this.x + buttonWidth/2 - element.clientWidth/2);
        const top: number = Math.max(0, this.y - element.clientHeight - 5);
        element.style.top = top + 'px';
        element.style.left = left + 'px';
    }
}


function ToolBarButton(props: IToolBarButtonProps) {
    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovering, setIsHovering] = React.useState(false);
    const [tooltip] = React.useState(new ToolTip(props.toolTipId, props.x, props.y));

    // This destroys the tooltip and timer when the button is destroyed.
    React.useEffect(() => {
        return () => tooltip.clearTimer();
    }, [tooltip]); // TODO: I know this would work if the list were empty, but the closure includes tooltip...

    function handleMouseEnter(): void {
        setIsHovering(true);
        tooltip.startTimer();
    }

    function handleMouseLeave(eventArgs: KonvaEventObject<MouseEvent>): void {
        // If the cursor is moving roughly upward, call it a drag.
        if (props.onDragStart && isPressed && eventArgs.evt.offsetY < props.y+32) {
            props.onDragStart(eventArgs);
        }

        setIsHovering(false);
        setIsPressed(false);
        tooltip.clearTimer();
    }

    function handleMouseDown(): void {
        setIsPressed(true);
        tooltip.clearTimer();
    }

    function handleMouseUp(eventArgs: KonvaEventObject<MouseEvent>): void {
        setIsPressed(false);
        if (props.onClicked) {
            props.onClicked(eventArgs);
        }
        tooltip.startTimer();
    }

    return <Group x={props.x - (isPressed ? buttonWidth*((pressedScalingFactor - 1)/2) : 0)}
                      y={props.y - (isPressed ? buttonHeight*((pressedScalingFactor - 1)/2) : 0)}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onMouseDown={handleMouseDown}
                      onMouseUp={handleMouseUp}
                      scaleX={isPressed ? pressedScalingFactor : 1}
                      scaleY={isPressed ? pressedScalingFactor : 1} >
                {props.children}
                <Rect x={0} y={0} height={64} width={64}
                      strokeWidth={2} stroke={isHovering ? 'black' : 'grey'}
                      fill={props.isEnabled ? 'transparent' : '#80808080'} />
            </Group>;
}


interface IStartStopButtonProps {
    x: number;
    y: number;
    model: Simulator,
}

function useIsRunning(model: Simulator) {
    const [isRunning, setIsRunning] = React.useState(model.isRunning);

    React.useEffect(() => {
        function handleRunStateChanged() {
            setIsRunning(model.isRunning);
        }
        model.onRunStateChanged(handleRunStateChanged);
        return () => model.offRunStateChanged(handleRunStateChanged);
    }, [model]);

    return isRunning;
}

export function StartStopButton(props: IStartStopButtonProps): JSX.Element {
    const isRunning = useIsRunning(props.model);

    const content: JSX.Element | Array<JSX.Element> = isRunning ?
    [
        <Line key='1' points={[32-5, 32-12, 32-5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>,
        <Line key='2' points={[32+5, 32-12, 32+5, 32+12]} lineCap='butt' strokeWidth={5} stroke='red'/>
    ] : <Line key='3'  points={[32-16, 32-16, 32+12, 32, 32-16, 32+16]}
          strokeWidth={4}
          stroke='green'
          fill='green'
          closed={true}/>;

    function handleClick(): void {
        if (props.model.isRunning) {
            props.model.stopRunning();
        } else {
            props.model.startRunning();
        }
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='playPauseTip' isEnabled={true} onClicked={handleClick}>
        {content}
    </ToolBarButton>;
}


export interface ISingleStepButtonProps {
    x: number;
    y: number;
    model: Simulator,
}

export function SingleStepButton(props: ISingleStepButtonProps): JSX.Element {
    const isRunning = useIsRunning(props.model);

    function handleClick(): void {
        props.model.advanceOne();
    }
    
    return <ToolBarButton x={props.x} y={props.y} toolTipId='singleStepTip' isEnabled={true} onClicked={handleClick}>
        <Line points={[32+12, 32, 32-16, 32+16, 32-16, 32-16, 32+12, 32, 32+12, 32-16, 32+12, 32+16]}
        strokeWidth={4}
        stroke={isRunning ? '#305030ff' : '#008000ff'}
        closed={false}/>
    </ToolBarButton>;
}


export interface IDragNewInteractableDragEventArgs {
    prototype: Model.Interactable;
    event: KonvaEventObject<MouseEvent>;
}

interface ILogicGateButtonProps {
    x: number;
    y: number;
    kind: Model.LogicGateTypes | 'timer' | 'input';
    selected: Model.Interactable | undefined;
    onBeginDrag: (eventArgs: IDragNewInteractableDragEventArgs) => void;
}

export function LogicGateButton(props: ILogicGateButtonProps): JSX.Element {

    const toolTipId = props.kind === 'input'
        ? 'inputTip'
        : (props.kind === 'timer' 
            ? 'timerTip'
            : 'logicGateTip');

    function handleClick(): void {
        if (!props.selected) {
            FloatingErrorMessage.show("No logic gate is selected (click on one in the field).")
            return;
        }

        if (props.kind === 'input' && props.selected instanceof Model.Input) {
            props.selected.toggle();
        } else if (props.kind === 'timer' && props.selected instanceof Model.Timer) {
            FloatingErrorMessage.show("Timers can't be changed like this.");
            // no action
        } else if (props.kind !== 'timer' && props.kind !== 'input' && props.selected instanceof Model.LogicGate) {
            props.selected.kind = props.kind;
        } else {
            FloatingErrorMessage.show("Can't convert between inputs, timers and gates.  (You have to delete and recreate them).");
        }
    }

    function handleDragStart(eventArgs: KonvaEventObject<MouseEvent>): void {
        let prototype: Model.Interactable;
        switch (props.kind) {
            case 'timer':
                prototype = new Model.Timer({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, kind: props.kind, tickStorage: new Array<boolean>(10).fill(false) });
                break;
            case 'input':
                prototype = new Model.Input({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, savedState: false, kind: props.kind});
                break;
            default:
                prototype = new Model.LogicGate({ x:eventArgs.evt.offsetX, y:eventArgs.evt.offsetY, savedState: false, kind: props.kind});
                break;
        }

        props.onBeginDrag({
            prototype: prototype,
            event: eventArgs});
    }

    let content: JSX.Element | Array<JSX.Element> | undefined;
    const tickStorage = [true, true, true, true, true, true, true, false, false, false];
    function hourglassDelta(index: number): number {
        const l = tickStorage.length;
        const fromEnd = index < tickStorage.length/2 ? index : tickStorage.length-1-index;
        if (fromEnd < l * .2) {
            return 0;
        }
        else if (fromEnd > l * .4) {
            return 6;
        }
        else {
            return 6*(fromEnd - l*.2)/(l*.2);
        }
    }
    switch(props.kind) {
        case 'input':
            content = <Circle radius={22} x={32} y={32} strokeWidth={8} stroke='black'/>;
            break;
        case 'timer':
            const drawingHeight = 64;
            const drawingWidth = 64;
            const horizontalOffset = 12;
            const verticalOffset = 6;
            const rectHeight = (drawingHeight - 2*verticalOffset) / tickStorage.length;
        
            content = tickStorage.map((value: boolean, index: number) =>
            <Rect key={index.toString()}
                            x={horizontalOffset + hourglassDelta(index) }
                            width={drawingWidth - 2*horizontalOffset - 2*hourglassDelta(index)}
                            y={drawingHeight - verticalOffset - rectHeight - index*(drawingHeight-2*verticalOffset)/tickStorage.length}
                            height={rectHeight}
                            strokeWidth={1}
                            stroke='darkgrey'
                            fill={value ? 'blue' : 'white'}/>);
            break;
        default:
            content = <Image x={0} y={0} image={ViewModel._assets[props.kind].image()} />;
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId={toolTipId} isEnabled={true} onClicked={handleClick} onDragStart={handleDragStart}>{content}</ToolBarButton>;
}


interface IPaintButtonProps {
    x: number;
    y: number;
    selected: Model.Interactable | undefined;
}

export function PaintButton(props: IPaintButtonProps): JSX.Element {
    function handleClick(): void {
        if (props.selected instanceof Model.InteractableWithSingleBitSavedState) {
            props.selected.paint();
        }
        else {
            FloatingErrorMessage.show("Timers always save their current state on reload, so painting them has no effect on its behavior");
        }
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='paintTip' isEnabled={true} onClicked={handleClick}>
        <Image x={0} y={0} image={ViewModel._assets['paint'].image()} />
    </ToolBarButton>
}


interface ILiftButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
}


export function PutOnLiftButton(props: ILiftButtonProps): JSX.Element {
    return <ToolBarButton x={props.x} y={props.y} toolTipId='putOnLiftTip' isEnabled={true} onClicked={() => props.simulator.putOnLift()}>
        <Line key='base'
              points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
              strokeWidth={4}
              stroke='black'
              closed={true}/>
        <Line key='arrow'
              points = {[18, 42,  32, 32,  46, 42,  18, 42]}
              strokeWidth={1}
              stroke='blue'
              closed={true}
              fill='blue'/>
    </ToolBarButton>
}

export function TakeOffLiftButton(props: ILiftButtonProps): JSX.Element {
    return <ToolBarButton x={props.x} y={props.y} toolTipId='takeOffLiftTip' isEnabled={true} onClicked={() => props.simulator.takeOffLift()}>
        <Line key='base'
              points={[52, 48,  12, 48,  12, 28,  32, 28,  32, 12,  16, 12,  48, 12,  32,12,  32, 28,  52, 28,  52, 48 ]}
              strokeWidth={4}
              stroke='black'
              closed={true}/>
        <Line key='arrow'
              points = {[18, 32,  32, 42,  46, 32,  18, 32]}
              strokeWidth={1}
              stroke='blue'
              closed={true}
              fill='blue'/>
    </ToolBarButton>
}

interface IDeleteButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
    selected: Interactable | undefined;
}

export function DeleteButton(props: IDeleteButtonProps): JSX.Element {
    function handleClick(): void {
        if (props.selected) {
            props.simulator.remove(props.selected);
        } else {
            FloatingErrorMessage.show("Nothing is selected (click on a logic gate in the field to specify what should be deleted).")
        }
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='deleteTip' isEnabled={props.selected !== undefined} onClicked={handleClick}>
        <Text text="&#128465;" x={10} y={8} fontSize={64} fill='black'/>
    </ToolBarButton>
}

interface ICopyLinkButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
}

export function CopyLinkButton(props: ICopyLinkButtonProps): JSX.Element {
    async function handleClick(): Promise<void> {
        if (!navigator.clipboard) {
            alert("Can't copy to clipboard - navigator.clipboard doesn't exist.  Perhaps you're using an older browser?");
            return;
        }

        const url: string = window.location.origin + window.location.pathname + '?' + props.simulator.serializeToCompressedQueryStringFragment();
        try {
            await navigator.clipboard.writeText(url);
            alert("Copied the following URL to the clipboard:\n\n" + url);
        } catch (err) {
            alert('navigator.clipboard.writeText failed!\n\n' + err);
        }
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='shareLinkTip' isEnabled={true} onClicked={handleClick}>
        <Text text="&#128279;" x={6} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}

interface ISaveToFileButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
}

export function SaveToFileButton(props: ISaveToFileButtonProps): JSX.Element {
    function handleClick(): void {
        const file = new File([JSON.stringify(props.simulator.serialize(), null, 4)], "logicgatesim.json", {type: "text/plain;charset=utf-8"});
        FileSaver.saveAs(file);
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='saveTip' isEnabled={true} onClicked={handleClick}>
        <Text text="&#128190;" x={6} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}

export function ExportBlueprintButton(props: ISaveToFileButtonProps): JSX.Element {
    function handleClick(): void {
        try {
            const file = new File([exportModel(props.simulator.interactables)], "blueprint.json", {type: "text/plain;charset=utf-8"});
            FileSaver.saveAs(file);
        }
        catch(err) {
            alert(err);
        }
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='exportTip' isEnabled={true} onClicked={handleClick}>
        <Text text="&#8659;" x={19} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}


interface ILoadFromFileButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
}

export function LoadFromFileButton(props: ILoadFromFileButtonProps): JSX.Element {
    const fileInput = document.getElementById("loadFileInput") as HTMLInputElement;
    if (!fileInput) {
        throw new Error("index.html is busted - loadFileInput <input> is missing");
    }

    React.useEffect(() => {
        function handleFileGiven(): void {
            if (!fileInput.files || fileInput.files.length === 0) {
                return;
            }
    
            // hacky - no message when file load fails.
            const reader = new FileReader();
            reader.onload = () => {
                const fileContents: string = reader.result as string;
                fileInput.value = '';
                let jsonContent: unknown;
                try
                {
                    jsonContent = JSON.parse(fileContents);
                }
                catch(err) {
                    alert("Failed to load the file - are you sure this is a file generated from this app?  " + err);
                    return;
                }
    
                try
                {
                    props.simulator.load(jsonContent);
                }
                catch(err) {
                    alert(err);
                }
            };
            reader.readAsText(fileInput.files[0]);
        }
    
        fileInput.addEventListener('change', handleFileGiven, false);

        return () => fileInput.removeEventListener('change', handleFileGiven);
    }, [props.simulator, fileInput]);

    function handleClick(): void {
        fileInput.click();
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='loadTip' isEnabled={true} onClicked={handleClick}>
        <Text text="&#128193;" x={6} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}

export function ImportBlueprintButton(props: ILoadFromFileButtonProps): JSX.Element {
    const fileInput = document.getElementById("importFileInput") as HTMLInputElement;
    if (!fileInput) {
        throw new Error("index.html is busted - importFileInput <input> is missing");
    }

    React.useEffect(() => {
        function handleFileGiven(): void {
            if (!fileInput.files || fileInput.files.length === 0) {
                return;
            }
    
            // hacky - no message when file load fails.
            const reader = new FileReader();
            reader.onload = () => {
                const fileContents: string = reader.result as string;
                fileInput.value = '';
                let jsonContent: unknown;
                try
                {
                    jsonContent = JSON.parse(fileContents);
                }
                catch(err) {
                    alert("Failed to load the file - are you sure this is a file generated from this app?  " + err);
                    return;
                }
    
                let imported: Model.Interactable[] | undefined;
                try
                {
                    imported = importModel(1000, 1000, jsonContent);
                }
                catch(err) {
                    alert(err);
                    return;
                }

                if (imported.length === 0) {
                    alert("The blueprint doesn't appear to contain any non-trivial logic circuits - are you sure you have the right blueprint?");
                    return;
                }

                props.simulator.setInteractables(imported);
            };
            reader.readAsText(fileInput.files[0]);
        }
    
        fileInput.addEventListener('change', handleFileGiven, false);

        return () => fileInput.removeEventListener('change', handleFileGiven);
    }, [props.simulator, fileInput]);

    function handleClick(): void {
        fileInput.click();
    }

    return <ToolBarButton x={props.x} y={props.y} toolTipId='importTip' isEnabled={true} onClicked={handleClick}>
        <Text text="&#8657;" x={19} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}

interface IReloadButtonProps {
    x: number;
    y: number;
    simulator: Simulator;
}

export function ReloadButton(props: IReloadButtonProps): JSX.Element {

    return <ToolBarButton x={props.x} y={props.y} toolTipId='reloadTip' isEnabled={true} onClicked={() => props.simulator.gameReload()}>
        <Text text="&#8645;" x={16} y={14} fontSize={42} fill='black'/>
    </ToolBarButton>
}
