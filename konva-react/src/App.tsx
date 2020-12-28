/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow, Line, Rect } from "react-konva";
import { Simulator, IEventArgsInteractableAdded, IEventArgsInteractableRemoved, IInteractableLink, IEventArgsInteractablesReset } from "./Simulator";
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

interface AppState {
    interactables: Array<Interactable>;
    links: Array<IInteractableLink>;
    selected?: Interactable;
    linkSource?: Interactable;
    linkTargetX?: number;
    linkTargetY?: number;
    createByDragPrototype?: Interactable;
    windowInnerHeight: number;
    windowInnerWidth: number;
}

export class App extends React.Component<AppProps, AppState> {
    private stage: Konva.Stage | undefined;
    private maxSensibleDropY = 0; // Set in render
    private maxSensibleDropX = 0;
    private considerResizeOnNextRender = true;

    constructor(props: AppProps) {
        super(props);
        this.state = {
            interactables: props.simulator.interactables,
            links: props.simulator.getLinks(),
            selected: undefined,
            linkSource: undefined,
            windowInnerHeight: window.innerHeight,
            windowInnerWidth: window.innerWidth
        };

        for (const i of this.props.simulator.interactables) {
            i.onMoved(this.handleInteractableMoved);
        }

        this.props.simulator.onInteractableAdded( this.handleInteractableAdded );
        this.props.simulator.onInteractableRemoved( this.handleInteractableRemoved );
        this.props.simulator.onInteractablesReset( this.handleInteractablesReset );
    }

    handleInteractablesReset = (e: IEventArgsInteractablesReset): void => {
        for (const i of e.oldInteractables) {
            i.offMoved(this.handleInteractableMoved);
        }

        const links: Array<IInteractableLink> = [];
        for (const i of this.props.simulator.interactables) {
            i.onMoved(this.handleInteractableMoved);
            for (const j of i.inputs) {
                links.push({source: j, target: i});
            }
        }        

        this.setState({
            interactables: this.props.simulator.interactables,
            selected: undefined,
            links: links
        });
        this.considerResizeOnNextRender = true;
    }

    handleInteractableAdded = (e: IEventArgsInteractableAdded): void => {
        e.interactable.onMoved(this.handleInteractableMoved.bind(this));
        this.setState({
            interactables: this.props.simulator.interactables,
            selected: e.interactable,
        });
    };

    handleInteractableRemoved = (e: IEventArgsInteractableRemoved): void => {
        e.interactable.offMoved(this.handleInteractableMoved.bind(this));
        this.setState({
            interactables: this.props.simulator.interactables,
            selected: undefined,
            links: this.state.links.filter(l => l.target !== e.interactable && l.source !== e.interactable)
        });
    };

    handleInteractableMoved = (): void => {
        this.setState({interactables: this.props.simulator.interactables});
    }

    public componentDidMount(): void {
        if (!this.stage) {
            throw new Error("stage was not set?");
        }

        const container = this.stage.container();
        container.tabIndex = 1;
        container.focus();
        container.addEventListener("keypress", this.handleKeyPress);
        window.addEventListener('resize', this.handleResize);
    }

    handleResize = ():void => {
        this.setState({
            windowInnerWidth: window.innerWidth,
            windowInnerHeight: window.innerHeight
        });
        this.considerResizeOnNextRender = true;
    }

    handleKeyPress = (e: KeyboardEvent):void => {
        const xy: Vector2d | null | undefined = this.stage?.getPointerPosition();
        if (!xy) {
            throw new Error("stage was not set?");
        }

        if (e.key === "g") {
            this.props.simulator.startRunning();
        } else if (e.key === "s") {
            this.props.simulator.stopRunning();
        } else if (e.key === "n") {
            this.props.simulator.advanceOne();
        } else if (e.key === "l") {
            const newInteractable = new Model.LogicGate({
                kind: 'and',
                x: xy.x,
                y: xy.y,
                savedState: false
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === "i") {
            const newInteractable = new Model.Input({
                kind: 'input',
                x: xy.x,
                y: xy.y,
                savedState: false
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === "t") {
            const newInteractable = new Model.Timer({
                kind: 'timer',
                x: xy.x,
                y: xy.y,
                tickStorage: new Array<boolean>(10).fill(false)
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === '[' && this.state.selected) {
            this.state.selected.twiddle(-1);
        } else if (e.key === ']' && this.state.selected) {
            this.state.selected.twiddle(1);
        } else if (e.key === 'x' && this.state.selected) {
            this.props.simulator.remove(this.state.selected);
        } else if (e.key === '4') {
            this.props.simulator.gameReload();
        } else if (e.key === '$') {
            this.props.simulator.putOnLift();
        } else if (e.key === 'p' && this.state.selected) {
            this.state.selected.paint();
        }

        console.debug("App.handleKeyPress(" + e.key + ")");
    };

    handleInteractableClicked(e: ViewModel.IEventArgsInteractable): void {
        this.setState({
            selected: e.model,
        });
    }

    handleLinkStart(e: ViewModel.IEventArgsInteractable): void {
        const model = e.model;
        this.setState({
            linkSource: model,
            linkTargetX: e.evt.x,
            linkTargetY: e.evt.y
        })
    }

    handleMouseUpInStage(e: KonvaEventObject<MouseEvent>): void {
        // This handles mouseUp events from the field, 
        if (this.state.linkSource) {
            let target = undefined;
            for (const i of this.state.interactables) {
                // TODO: the Interactable viewmodel should decide the in-bounds calculation
                if (i.x <= e.evt.offsetX && e.evt.offsetX < i.x+64
                 && i.y <= e.evt.offsetY && e.evt.offsetY < i.y+64) {
                     target = i;
                     break;
                 }
            }

            if (target && target !== this.state.linkSource && target.addInput(this.state.linkSource)) {
                this.setState({links: this.props.simulator.getLinks(), linkSource: undefined, createByDragPrototype: undefined});
            }
        }
        else if (this.state.createByDragPrototype && this.state.createByDragPrototype.y < this.maxSensibleDropY) {
            this.props.simulator.add(this.state.createByDragPrototype);
        }
        this.setState({linkSource: undefined, createByDragPrototype: undefined});
    }

    handleMouseMove(e: KonvaEventObject<MouseEvent>): void {
        // console.debug("mouseMove: x=" + e.evt.x + " pageX=" + e.evt.pageX + " clientX=" + e.evt.clientX + " offsetX=" + e.evt.offsetX + " screenX=" + e.evt.screenX + " movementX=" + e.evt.movementX);
        if (this.state.linkSource) {
            this.setState({
                linkTargetX: e.evt.offsetX,
                linkTargetY: e.evt.offsetY
            })
        }
        else if (this.state.createByDragPrototype) {
            this.state.createByDragPrototype.setPosition(e.evt.offsetX, e.evt.offsetY);

            this.setState({ createByDragPrototype: this.state.createByDragPrototype });
        }
    }

    handleMouseDown(e: KonvaEventObject<MouseEvent>): void {
        if (!(e.target instanceof ViewModel.Interactable) && this.state.selected) {
            this.setState({selected: undefined});
        }
    }

    handleNewInteractableDrag(e: IDragNewInteractableDragEventArgs): void {
        this.setState({
            createByDragPrototype: e.prototype
        })
    }

    private handleMouseLeave(): void {
        this.setState({linkSource: undefined, createByDragPrototype: undefined});
    }

    private handleMoveCompleted = (e: ViewModel.IEventArgsInteractable):void => {
        const buttonWidth = 64;
        const buttonHeight = 64;
        if (e.model.x < - buttonWidth*.75 || e.model.y < -buttonHeight*.75 || e.model.x > this.maxSensibleDropX || e.model.y > this.maxSensibleDropY) {
            this.props.simulator.remove(e.model);
        }
    }

    getViewModelForModel(model: Model.Interactable): JSX.Element {
        if (model instanceof Model.LogicGate) {
            return (
                <ViewModel.LogicGate
                    model={model}
                    key={model.id.toString()}
                    isSelected={model === this.state.selected}
                    onLinkStart={this.handleLinkStart.bind(this)}
                    onClick={this.handleInteractableClicked.bind(this)}
                    onMoveCompleted={this.handleMoveCompleted.bind(this)}
                />
            );
        }
        else if (model instanceof Model.Input) {
                return <ViewModel.Input
                    model={model}
                    key={model.id.toString()}
                    isSelected={model === this.state.selected}
                    onMoveCompleted={this.handleMoveCompleted.bind(this)}
                    onLinkStart={this.handleLinkStart.bind(this)}
                    onClick={this.handleInteractableClicked.bind(this)}/>
        }
        else if (model instanceof Model.Timer) {
            return <ViewModel.Timer
                model={model}
                key={model.id.toString()}
                isSelected={model === this.state.selected}
                onMoveCompleted={this.handleMoveCompleted.bind(this)}
                onLinkStart={this.handleLinkStart.bind(this)}
                onClick={this.handleInteractableClicked.bind(this)}/>
        }
        else {
            throw new Error("unexpected model object type");
        }
    }

    render(): JSX.Element {
        let pointer: Array<JSX.Element> | JSX.Element = [];
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

        this.maxSensibleDropY = buttonRowY(0)-32;
        this.maxSensibleDropX = canvasWidth - buttonWidth * .25;

        if (this.considerResizeOnNextRender) {
            this.props.simulator.fitToSize(canvasWidth, buttonRowY(0), 20, 20);
            this.considerResizeOnNextRender = false;
        }

        if (this.state.linkSource) {
            pointer = <Arrow
                x={this.state.linkSource.x+32}
                y={this.state.linkSource.y+32}
                points={[0,0, this.state.linkTargetX!-(this.state.linkSource.x+32), this.state.linkTargetY!-(this.state.linkSource.y+32)]}
                fill='lightgrey'
                stroke='lightgrey'
                strokeWidth={4}
                pointerLength={10}
                pointerWidth={10}/>;
        }
        return (
            <Stage
                width={canvasWidth-4}
                height={canvasHeight}
                ref={(c: Konva.Stage) => {this.stage = c;}}
                onMouseUp={this.handleMouseUpInStage.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
                onMouseLeave={this.handleMouseLeave.bind(this)}
            >
                <Layer>
                    <Rect id='background' x={0} y={0} width={canvasWidth} height={canvasHeight - buttonRowHeight} onMouseDown={this.handleMouseDown.bind(this)} strokeWidth={0} fill='GhostWhite' />
                    <TC.TickCounter simulator={this.props.simulator} right={canvasWidth - 20} top={5} />
                    {this.state.interactables.map((model: Interactable) =>
                        this.getViewModelForModel(model)
                    )}
                    {this.state.createByDragPrototype
                        ? this.getViewModelForModel(this.state.createByDragPrototype)
                        : []}
                    {pointer}
                    {this.state.links.map((link: IInteractableLink) => <ViewModel.LinkArrow key={link.source.id.toString()+ "-" + link.target.id.toString()} source={link.source} target={link.target}/>)}
                </Layer>
                <Layer>
                    <Rect x={0} y={canvasHeight-buttonRowHeight} height={buttonRowHeight} width={canvasWidth} fill='papayawhip' />
                    <Line points={[0, canvasHeight-buttonRowHeight, canvasWidth, canvasHeight-buttonRowHeight]} stroke='grey' strokeWidth={3}/>
                    <LogicGateButton x={buttonRowX(0)} y={buttonRowY(0)} selected={this.state.selected} kind='and' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(1)} y={buttonRowY(1)} selected={this.state.selected} kind='or' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(2)} y={buttonRowY(2)} selected={this.state.selected} kind='xor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(3)} y={buttonRowY(3)} selected={this.state.selected} kind='nand' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(4)} y={buttonRowY(4)} selected={this.state.selected} kind='nor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(5)} y={buttonRowY(5)} selected={this.state.selected} kind='xnor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(6)} y={buttonRowY(6)} selected={this.state.selected} kind='input' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(7)} y={buttonRowY(7)} selected={this.state.selected} kind='timer' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <DeleteButton x={buttonRowX(8)} y={buttonRowY(8)} simulator={this.props.simulator} selected={this.state.selected}/>
                    <StartStopButton x={buttonRowX(9)} y={buttonRowY(9)} model={this.props.simulator}/>
                    <SingleStepButton x={buttonRowX(10)} y={buttonRowY(10)} model={this.props.simulator}/>
                    <ReloadButton x={buttonRowX(11)} y={buttonRowY(11)} simulator={this.props.simulator}/>
                    <PaintButton x={buttonRowX(12)} y={buttonRowY(12)} selected={this.state.selected}/>
                    <PutOnLiftButton x={buttonRowX(13)} y={buttonRowY(13)} simulator={this.props.simulator}/>
                    <TakeOffLiftButton x={buttonRowX(14)} y={buttonRowY(14)} simulator={this.props.simulator}/>
                    <CopyLinkButton x={buttonRowX(15)} y={buttonRowY(15)} simulator={this.props.simulator}/>
                    <LoadFromFileButton x={buttonRowX(16)} y={buttonRowY(16)} simulator={this.props.simulator}/>
                    <SaveToFileButton x={buttonRowX(17)} y={buttonRowY(17)} simulator={this.props.simulator}/>
                </Layer>
            </Stage>
        );
    }
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

