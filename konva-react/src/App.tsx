/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow, Line, Rect } from "react-konva";
import { Simulator, IInteractableLink } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Interactable } from "./Model";
import { CopyLinkButton, DeleteButton, IDragNewInteractableDragEventArgs, LoadFromFileButton, LogicGateButton, PaintButton, PutOnLiftButton, ReloadButton, SaveToFileButton, SingleStepButton, StartStopButton, TakeOffLiftButton, ExportBlueprintButton, ImportBlueprintButton } from "./Buttons";
import { Vector2d } from "konva/lib/types";
import { KonvaEventObject } from "konva/lib/Node";

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
    const maximumButtonsPerRow = 10;
    const content = document.getElementById('content');
    const canvasHeight = window.innerHeight*.9;
    const canvasWidth = content!.clientWidth; // Would love to know where the 57 comes from, but with the current styles, it seems to work.
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
        const contentDiv = document.getElementById('content')!;
        const o = new ResizeObserver(handleResize);
        o.observe(contentDiv)
        return () => o.disconnect();
    }, []);

    React.useEffect(() => {
        function handleKeyPress(e: KeyboardEvent): void {
            const xy: Vector2d | null | undefined = stageRef.current?.getPointerPosition();
            if (!xy) {
                throw new Error("stage was not set?");
            }

            function doLogicGateKey(kind: Model.LogicGateTypes, xy: Vector2d): void {
                const newInteractable = new Model.LogicGate({
                    kind: kind,
                    x: xy.x,
                    y: xy.y,
                    savedState: false
                });
                props.simulator.add(newInteractable);
                setSelected(newInteractable);
            }
    
            if (e.key === "g") {
                props.simulator.startRunning();
            } else if (e.key === "s") {
                props.simulator.stopRunning();
            } else if (e.key === "n") {
                props.simulator.advanceOne();
            } else if (e.key === "a") {
                doLogicGateKey('and', xy);
            } else if (e.key === "o") {
                doLogicGateKey('or', xy);
            } else if (e.key === "x") {
                doLogicGateKey('xor', xy);
            } else if (e.key === "A") {
                doLogicGateKey('nand', xy);
            } else if (e.key === "O") {
                doLogicGateKey('nor', xy);
            } else if (e.key === "X") {
                doLogicGateKey('xnor', xy);
            } else if (e.key === "i") {
                const newInteractable = new Model.Input({
                    kind: 'input',
                    x: xy.x,
                    y: xy.y,
                    savedState: false
                });
                props.simulator.add(newInteractable);
                setSelected(newInteractable);
            } else if (e.key === "t") {
                const newInteractable = new Model.Timer({
                    kind: 'timer',
                    x: xy.x,
                    y: xy.y,
                    tickStorage: new Array<boolean>(10).fill(false)
                });
                props.simulator.add(newInteractable);
                setSelected(newInteractable);
            } else if (selected && e.key === ' ') {
                selected.toggle();
                e.preventDefault();
            } else if (e.key === '4') {
                props.simulator.gameReload();
            } else if (e.key === 'l') {
                props.simulator.putOnLift();
            } else if (e.key === 'L') {
                props.simulator.takeOffLift();
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
    
    React.useEffect(() => {
        function handleRemoveMenuItem(): void {
            if (selected) {
                props.simulator.remove(selected);
            }
        };

        const menuItemDelete = document.getElementById('menuItemDelete');
        menuItemDelete!.onclick = handleRemoveMenuItem;
        return () => { menuItemDelete!.onclick = null };
    }, [props.simulator, selected]);

    
    React.useEffect(() => {
        function handleKeyDown(e: KeyboardEvent): void {
            const xy: Vector2d | null | undefined = stageRef.current?.getPointerPosition();
            if (!xy) {
                throw new Error("stage was not set?");
            }
    
            if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
                props.simulator.remove(selected);
            }
        };

        if (stageRef.current) {
            const container = stageRef.current.container();
            container.tabIndex = 1;
            container.focus();
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [props.simulator, selected]);

    function handleInteractableClicked(e: ViewModel.IEventArgsInteractable): void {
        if (e.evt.ctrlKey && e.model instanceof Model.Input) {
            e.model.toggle();
        }
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

    const toolTipEditor = document.getElementById('tooltipEditor')!;

    function handleOkInToolTipEditor() {
        const m: Model.Interactable = (toolTipEditor as any).model;
        m.description = (document.getElementById('tooltipText') as HTMLTextAreaElement)!.value ?? undefined;
        toolTipEditor.classList.remove('visible');
    }

    function handleCancelInToolTipEditor() {
        toolTipEditor.classList.remove('visible');
    }

    function handleKeyDownInTooltipEditor(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            handleCancelInToolTipEditor();
        }
        else if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
            handleOkInToolTipEditor();
        }
    }

    const tooltipText = document.getElementById('tooltipText')!;
    tooltipText.onkeydown = handleKeyDownInTooltipEditor;
    document.getElementById('tooltipEditorOk')!.onclick = handleOkInToolTipEditor;
    document.getElementById('tooltipEditorCancel')!.onclick = handleCancelInToolTipEditor;

    toolTipEditor.onkeydown = (e) => {
        e.stopPropagation();
    };
    toolTipEditor.onkeyup = (e) => { e.stopPropagation(); };
    toolTipEditor.onkeypress = (e) => { e.stopPropagation(); };

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
                <PaintButton x={screenLayout.buttonRowX(9)} y={screenLayout.buttonRowY(9)} selected={selected}/>
                <StartStopButton x={screenLayout.buttonRowX(10)} y={screenLayout.buttonRowY(10)} model={props.simulator}/>
                <SingleStepButton x={screenLayout.buttonRowX(11)} y={screenLayout.buttonRowY(11)} model={props.simulator}/>
                <ReloadButton x={screenLayout.buttonRowX(12)} y={screenLayout.buttonRowY(12)} simulator={props.simulator}/>
                <PutOnLiftButton x={screenLayout.buttonRowX(13)} y={screenLayout.buttonRowY(13)} simulator={props.simulator}/>
                <TakeOffLiftButton x={screenLayout.buttonRowX(14)} y={screenLayout.buttonRowY(14)} simulator={props.simulator}/>
                <CopyLinkButton x={screenLayout.buttonRowX(15)} y={screenLayout.buttonRowY(15)} simulator={props.simulator}/>
                <LoadFromFileButton x={screenLayout.buttonRowX(16)} y={screenLayout.buttonRowY(16)} simulator={props.simulator}/>
                <SaveToFileButton x={screenLayout.buttonRowX(17)} y={screenLayout.buttonRowY(17)} simulator={props.simulator}/>
                <ExportBlueprintButton x={screenLayout.buttonRowX(18)} y={screenLayout.buttonRowY(18)} simulator={props.simulator}/>
                <ImportBlueprintButton x={screenLayout.buttonRowX(19)} y={screenLayout.buttonRowY(19)} simulator={props.simulator}/>
            </Layer>
        </Stage>
    );
}

function onWindowClick(): void {
    const menu = document.getElementById("interactableMenu");
    if (!menu) {
        throw(Error("Missing div with id: interactableMenu"));
    }
    menu.style.display = 'none'
}

function toggleHelp(): void {
    const helpButton = document.getElementById('helpButton')!;
    const contentDiv = document.getElementById('content')!;
    const sidebarDiv = document.getElementById('sidebar')!;
    if (helpButton.innerText === "Help >>") {
        helpButton.innerText = "Help <<";
        contentDiv.classList.add('content-full');
        sidebarDiv.classList.add('sidebar-none');
    }
    else {
        helpButton.innerText = "Help >>";
        contentDiv.classList.remove('content-full');
        sidebarDiv.classList.remove('sidebar-none');
    }
}

function closeBraveBrowserWarning(): void {
    const braveWarning = document.getElementById('braveWarning')!;
    braveWarning.style.visibility = 'collapsed';

    const d = new Date();
    d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000)); // 90 days
    braveWarning.classList.add('braveHidden');
    document.cookie = "gotBraveWarning=1;expires="+d.toUTCString()+";path=/"
}

interface BraveChecker {
    isBrave(): Promise<boolean>;
}

interface BraveNavigator {
    brave?: BraveChecker;
}

async function checkIfShouldShowBraveBrowserWarning(): Promise<void> {
    const bn = (navigator as BraveNavigator);
    const isBrave = bn.brave && await bn.brave.isBrave() || false;

    if (!isBrave) {
        return;
    }

    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        const c = ca[i].trimStart();
        if (c.startsWith("gotBraveWarning=")) {
            return;
        }
    }

    const braveWarning = document.getElementById('braveWarning')!;
    const gotBraveMessageButton = document.getElementById('gotBraveMessageButton')!;
    
    braveWarning.classList.remove('braveHidden');
    gotBraveMessageButton.onclick = closeBraveBrowserWarning;
}


function autoSave(simulator: Simulator): void {
    simulator.storeInCookie();
    setTimeout(autoSave, 3000, simulator);
}

export function makeItSo(): void {
    checkIfShouldShowBraveBrowserWarning();
    window.addEventListener('click', onWindowClick);
    const helpButton = document.getElementById('helpButton')!;
    helpButton.onclick = toggleHelp;

    // TODO - get rid of this.  One way to go would be to find a way to convert all the PNG's to SVG's.

    ViewModel.loadAssets(() => {
        const simulator= new Simulator();
        try {
            simulator.loadFromQsAndCookie();
        }
        catch (err) {
            alert(err);
        }
        setTimeout(autoSave, 3, simulator);
        render(<App simulator={simulator} />, document.getElementById("root"));
    });
}

