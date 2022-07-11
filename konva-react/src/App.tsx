/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow, Line, Rect } from "react-konva";
import { Simulator, IInteractableLink } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Vector2d } from "konva/types/types";
import { Interactable } from "./Model";
import { CopyLinkButton, DeleteButton, IDragNewInteractableDragEventArgs, LoadFromFileButton, LogicGateButton, PaintButton, PutOnLiftButton, ReloadButton, SaveToFileButton, SingleStepButton, StartStopButton, TakeOffLiftButton } from "./Buttons";
import { KonvaEventObject } from "konva/types/Node";

interface AppProps {
    simulator: Simulator;
}

interface IScreenLayout {
    canvasWidth: number;
    canvasHeight: number;
    buttonRowHeight: number;
    maxSensibleDropX: number;
    maxSensibleDropY: number;
    buttonRowX: (n: number) => number;
    buttonRowY: (n: number) => number;
}

function getScreenLayout(): IScreenLayout {
    const hSpaceBetweenButtons = 15; // the horizontal between each button (and the edges)
    const vSpaceBetweenButtons = 8;
    const buttonWidth = 64;
    const buttonHeight = 64;
    const maximumButtonsPerRow = 9;
    const canvasHeight = window.innerHeight*.9;
    const canvasWidth = window.innerWidth-57; // Would love to know where the 57 comes from, but with the current styles, it seems to work.
    const numRows = canvasWidth < hSpaceBetweenButtons + 2*maximumButtonsPerRow*(buttonWidth+hSpaceBetweenButtons) ? 2 : 1;
    const buttonRowHeight = numRows*(buttonWidth+vSpaceBetweenButtons) + vSpaceBetweenButtons;
    const buttonRowY = (n: number) => canvasHeight - buttonRowHeight + vSpaceBetweenButtons + (n >= maximumButtonsPerRow && numRows > 1 ? (vSpaceBetweenButtons + buttonHeight) : 0);
    const buttonRowX = (n: number) => hSpaceBetweenButtons + (hSpaceBetweenButtons + buttonWidth) * (n >= maximumButtonsPerRow && numRows > 1 ? n - maximumButtonsPerRow : n);

    return {
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight,
        buttonRowHeight: buttonRowHeight,
        maxSensibleDropX: canvasWidth - buttonWidth * .25,
        maxSensibleDropY: buttonRowY(0)-32,
        buttonRowX: buttonRowX,
        buttonRowY: buttonRowY
    };
}

export function App(props: AppProps): JSX.Element {
    const [interactables, setInteractables] = React.useState(props.simulator.interactables);
    const [links, setLinks] = React.useState(props.simulator.getLinks());
    const [selected, setSelected] = React.useState<Interactable | undefined>(undefined);
    const [linkSource, setLinkSource] = React.useState<Interactable | undefined>(undefined);
    const [[linkTargetX, linkTargetY], setLinkTarget] = React.useState<Array<number | undefined>>([undefined, undefined]);
    const [createByDragPrototype, setCreateByDragPrototype] = React.useState<Interactable | undefined>(undefined);
    const [screenLayout, setScreenLayout] = React.useState(getScreenLayout());
    const [considerResizeOnNextRender, setConsiderResizeOnNextRender] = React.useState(false);

    const stageRef: React.RefObject<Konva.Stage> = React.useRef<Konva.Stage>(null);


    // Track changes in the model's list of interactables
    React.useEffect(() => {
        function handleInteractablesChanged(): void {
            if (selected && props.simulator.interactables.indexOf(selected) < 0 ) {
                setSelected(undefined);
            }
            setInteractables([...props.simulator.interactables]);
            setLinks(props.simulator.getLinks());
            setLinkSource(undefined);
            setCreateByDragPrototype(undefined);
        };
        function handleInteractablesReset(): void {
            handleInteractablesChanged();
            setConsiderResizeOnNextRender(true);
        };
        // Perhaps onInteractableAdded should make that interactable selected?

        props.simulator.onInteractableAdded(handleInteractablesChanged);
        props.simulator.onInteractableRemoved(handleInteractablesChanged);
        props.simulator.onInteractablesReset(handleInteractablesReset);

        return () => {
            props.simulator.offInteractableAdded(handleInteractablesChanged);
            props.simulator.offInteractableRemoved(handleInteractablesChanged);
            props.simulator.offInteractablesReset(handleInteractablesReset)
        };

    }, [props.simulator, selected]);

    // Track window resize
    React.useEffect(() => {
        function handleResize(): void {
            setScreenLayout(getScreenLayout());
            setConsiderResizeOnNextRender(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        function handleKeyPress(e: KeyboardEvent): void {
            const xy: Vector2d | null | undefined = stageRef.current?.getPointerPosition();
            if (!xy) {
                throw new Error("stage was not set?");
            }
    
            if (e.key === "g") {
                props.simulator.startRunning();
            } else if (e.key === "s") {
                props.simulator.stopRunning();
            } else if (e.key === "n") {
                props.simulator.advanceOne();
            } else if (e.key === "l") {
                const newInteractable = new Model.LogicGate({
                    kind: 'and',
                    x: xy.x,
                    y: xy.y,
                    savedState: false
                });
                props.simulator.add(newInteractable);
            } else if (e.key === "i") {
                const newInteractable = new Model.Input({
                    kind: 'input',
                    x: xy.x,
                    y: xy.y,
                    savedState: false
                });
                props.simulator.add(newInteractable);
            } else if (e.key === "t") {
                const newInteractable = new Model.Timer({
                    kind: 'timer',
                    x: xy.x,
                    y: xy.y,
                    tickStorage: new Array<boolean>(10).fill(false)
                });
                props.simulator.add(newInteractable);
            } else if (e.key === '[' && selected) {
                selected.twiddle(-1);
            } else if ((e.key === ']' || e.key === ' ') && selected) {
                selected.twiddle(1);
                e.preventDefault();
            } else if (e.key === 'x' && selected) {
                props.simulator.remove(selected);
            } else if (e.key === '4') {
                props.simulator.gameReload();
            } else if (e.key === '$') {
                props.simulator.putOnLift();
            } else if (e.key === 'p' && selected) {
                selected.paint();
            }
    
            console.debug("App.handleKeyPress(" + e.key + ")");
        };

        if (stageRef.current) {
            const container = stageRef.current.container();
            container.tabIndex = 1;
            container.focus();
        }
        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [props.simulator, selected]);
    
    function handleInteractableClicked(e: ViewModel.IEventArgsInteractable): void {
        setSelected( e.model );
    }

    function handleLinkStart(e: ViewModel.IEventArgsInteractable): void {
        setLinkSource(e.model);
        setLinkTarget([e.evt.x, e.evt.y]);
    }

    function handleMouseUpInStage(e: KonvaEventObject<MouseEvent>): void {
        // This handles mouseUp events from the field, 
        if (linkSource) {
            let target = undefined;
            for (const i of interactables) {
                // TODO: the Interactable viewmodel should decide the in-bounds calculation
                if (i.x <= e.evt.offsetX && e.evt.offsetX < i.x+64
                 && i.y <= e.evt.offsetY && e.evt.offsetY < i.y+64) {
                     target = i;
                     break;
                 }
            }

            if (target && target !== linkSource && target.addInput(linkSource)) {
                // TODO: This line breaks the model/viewmodel pattern really an event
                // should come out of the model that tells us that stuff has changed.
                setLinks(props.simulator.getLinks());

                setLinkSource(undefined);
                setCreateByDragPrototype(undefined);
            }
        }
        else if (createByDragPrototype && createByDragPrototype.y < screenLayout.maxSensibleDropY) {
            props.simulator.add(createByDragPrototype);
        }

        setLinkSource(undefined);
        setCreateByDragPrototype(undefined);
    }

    function handleMouseMove(e: KonvaEventObject<MouseEvent>): void {
        // console.debug("mouseMove: x=" + e.evt.x + " pageX=" + e.evt.pageX + " clientX=" + e.evt.clientX + " offsetX=" + e.evt.offsetX + " screenX=" + e.evt.screenX + " movementX=" + e.evt.movementX);
        if (linkSource) {
            setLinkTarget([e.evt.offsetX, e.evt.offsetY]);
        }
        else if (createByDragPrototype) {
            createByDragPrototype.setPosition(e.evt.offsetX, e.evt.offsetY);
        }
    }

    function handleMouseDown(e: KonvaEventObject<MouseEvent>): void {
        if (!(e.target instanceof ViewModel.Interactable) && selected) {
            setSelected(undefined);
        }
    }

    function handleNewInteractableDrag(e: IDragNewInteractableDragEventArgs): void {
        setCreateByDragPrototype(e.prototype);
    }

    function handleMouseLeave(): void {
        setLinkSource(undefined);
        setCreateByDragPrototype(undefined);
    }

    function handleMoveCompleted(e: ViewModel.IEventArgsInteractable): void {
        const buttonWidth = 64;
        const buttonHeight = 64;
        if (e.model.x < - buttonWidth*.75 || e.model.y < -buttonHeight*.75 || e.model.x > screenLayout.maxSensibleDropX || e.model.y > screenLayout.maxSensibleDropY) {
            props.simulator.remove(e.model);
        }
    }

    let pointer: Array<JSX.Element> | JSX.Element = [];

    if (considerResizeOnNextRender) {
        props.simulator.fitToSize(screenLayout.canvasWidth, screenLayout.buttonRowY(0), 20, 20);
        setConsiderResizeOnNextRender(false);
    }

    if (linkSource) {
        pointer = <Arrow
            x={linkSource.x+32}
            y={linkSource.y+32}
            points={[0,0, linkTargetX!-(linkSource.x+32), linkTargetY!-(linkSource.y+32)]}
            fill='lightgrey'
            stroke='lightgrey'
            strokeWidth={4}
            pointerLength={10}
            pointerWidth={10}/>;
    }
    
    return (
        <Stage
            width={screenLayout.canvasWidth-4}
            height={screenLayout.canvasHeight}
            ref={stageRef}
            onMouseUp={handleMouseUpInStage}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <Layer>
                <Rect id='background'
                      x={0} y={0}
                      width={screenLayout.canvasWidth}
                      height={screenLayout.canvasHeight - screenLayout.buttonRowHeight}
                      onMouseDown={handleMouseDown}
                      strokeWidth={0}
                      fill='GhostWhite' />
                <TC.TickCounter simulator={props.simulator} right={screenLayout.canvasWidth - 20} top={5} />
                {interactables.map((model: Interactable) =>
                    <ViewModel.Interactable
                    model={model}
                    key={model.id.toString()}
                    isSelected={model === selected}
                    onLinkStart={handleLinkStart}
                    onClick={handleInteractableClicked}
                    onMoveCompleted={handleMoveCompleted}
                />
                )}
                {createByDragPrototype
                    ? <ViewModel.Interactable model={createByDragPrototype} key={createByDragPrototype.id.toString()} isSelected={false}/>
                    : []}
                {pointer}
                {links.map((link: IInteractableLink) => <ViewModel.LinkArrow key={link.source.id.toString()+ "-" + link.target.id.toString()} source={link.source} target={link.target}/>)}
            </Layer>
            <Layer>
                <Rect x={0} y={screenLayout.canvasHeight-screenLayout.buttonRowHeight} height={screenLayout.buttonRowHeight} width={screenLayout.canvasWidth} fill='papayawhip' />
                <Line points={[0, screenLayout.canvasHeight-screenLayout.buttonRowHeight, screenLayout.canvasWidth, screenLayout.canvasHeight-screenLayout.buttonRowHeight]} stroke='grey' strokeWidth={3}/>
                <LogicGateButton x={screenLayout.buttonRowX(0)} y={screenLayout.buttonRowY(0)} selected={selected} kind='and' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(1)} y={screenLayout.buttonRowY(1)} selected={selected} kind='or' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(2)} y={screenLayout.buttonRowY(2)} selected={selected} kind='xor' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(3)} y={screenLayout.buttonRowY(3)} selected={selected} kind='nand' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(4)} y={screenLayout.buttonRowY(4)} selected={selected} kind='nor' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(5)} y={screenLayout.buttonRowY(5)} selected={selected} kind='xnor' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(6)} y={screenLayout.buttonRowY(6)} selected={selected} kind='input' onBeginDrag={handleNewInteractableDrag}/>
                <LogicGateButton x={screenLayout.buttonRowX(7)} y={screenLayout.buttonRowY(7)} selected={selected} kind='timer' onBeginDrag={handleNewInteractableDrag}/>
                <DeleteButton x={screenLayout.buttonRowX(8)} y={screenLayout.buttonRowY(8)} simulator={props.simulator} selected={selected}/>
                <StartStopButton x={screenLayout.buttonRowX(9)} y={screenLayout.buttonRowY(9)} model={props.simulator}/>
                <SingleStepButton x={screenLayout.buttonRowX(10)} y={screenLayout.buttonRowY(10)} model={props.simulator}/>
                <ReloadButton x={screenLayout.buttonRowX(11)} y={screenLayout.buttonRowY(11)} simulator={props.simulator}/>
                <PaintButton x={screenLayout.buttonRowX(12)} y={screenLayout.buttonRowY(12)} selected={selected}/>
                <PutOnLiftButton x={screenLayout.buttonRowX(13)} y={screenLayout.buttonRowY(13)} simulator={props.simulator}/>
                <TakeOffLiftButton x={screenLayout.buttonRowX(14)} y={screenLayout.buttonRowY(14)} simulator={props.simulator}/>
                <CopyLinkButton x={screenLayout.buttonRowX(15)} y={screenLayout.buttonRowY(15)} simulator={props.simulator}/>
                <LoadFromFileButton x={screenLayout.buttonRowX(16)} y={screenLayout.buttonRowY(16)} simulator={props.simulator}/>
                <SaveToFileButton x={screenLayout.buttonRowX(17)} y={screenLayout.buttonRowY(17)} simulator={props.simulator}/>
            </Layer>
        </Stage>
    );
}


export function makeItSo(): void {
    // TODO - get rid of this.  One way to go would be to find a way to convert all the PNG's to SVG's.
    const queryString: string | undefined = window.location.search;
    let serialized: unknown | undefined = undefined;
    if (queryString) {
        try
        {
            serialized = Simulator.decompressQueryStringFragment(queryString);
        }
        catch {
            alert("The query string doesn't seem to be something created by this app - was it perhaps truncated?");
        }
    }

    ViewModel.loadAssets(() => {
        let simulator: Simulator | undefined;
        try {
            simulator = new Simulator(serialized);
        }
        catch (err) {
            alert(err);
            simulator = new Simulator();
        }
        render(<App simulator={simulator} />, document.getElementById("root"));
    });
}

