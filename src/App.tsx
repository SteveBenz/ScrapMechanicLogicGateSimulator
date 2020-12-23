/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow, Line, Rect } from "react-konva";
import { Simulator, IEventArgsInteractableAdded, IEventArgsInteractableRemoved, IInteractableLink, ISerializedSimulator, IEventArgsInteractablesReset } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Vector2d } from "konva/types/types";
import { Interactable } from "./Model";
import { CopyLinkButton, DeleteButton, IDragNewInteractableDragEventArgs, LoadFromFileButton, LogicGateButton, PaintButton, PutOnLiftButton, SaveToFileButton, SingleStepButton, StartStopButton, TakeOffLiftButton } from "./Buttons";
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
}

export class App extends React.Component<AppProps, AppState> {
    private stage: Konva.Stage | undefined;

    constructor(props: AppProps) {
        super(props);
        this.state = {
            interactables: props.simulator.interactables,
            links: props.simulator.getLinks(),
            selected: undefined,
            linkSource: undefined,
        };
        // this.stageRef = React.useRef(undefined);

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
        if (!this.stage) throw 'stage was not set';
        const container = this.stage.container();
        container.tabIndex = 1;
        container.focus();
        container.addEventListener("keypress", this.handleKeyPress);
    }

    handleKeyPress = (e: KeyboardEvent):void => {
        const xy: Vector2d | null | undefined = this.stage?.getPointerPosition();
        if (!xy) {
            throw 'stage was not set?';
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
        } else if (e.key === 'c') {
            const box: HTMLInputElement = document.getElementById('urlbox') as HTMLInputElement;
            box.value = this.props.simulator.serializeToCompressedQueryStringFragment();
        } else if (e.key === 'x' && this.state.selected) {
            this.props.simulator.remove(this.state.selected);
        } else if (e.key === '4') {
            for (const i of this.state.interactables) {
                i.reload();
            }
        } else if (e.key === '$') {
            for (const i of this.state.interactables) {
                i.putOnLift();
            }
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
        const source = this.state.linkSource;
        let wasChanged = false;
        if (source) {
            let target = undefined;
            for (const i of this.state.interactables) {
                // TODO: the Interactable viewmodel should decide the in-bounds calculation
                if (i.x <= e.evt.x && e.evt.x < i.x+64
                 && i.y <= e.evt.y && e.evt.y < i.y+64) {
                     target = i;
                     break;
                 }
            }

            if (target && target !== source) {
                wasChanged = target.addInput(source);
            }
        }
        else if (this.state.createByDragPrototype) {
            this.props.simulator.add(this.state.createByDragPrototype);
            this.setState({
                createByDragPrototype: undefined
            });
        }
        if (wasChanged) {
            this.setState({links: this.props.simulator.getLinks(), linkSource: undefined});
        }
        else {
            this.setState({linkSource: undefined});
        }
    }

    handleMouseUpInInteractable(): void {
        // TODO: Why am I here??
        // // This handles mouseUp events from the field, 
        // if (this.state.linkSource) {
        //     const source = this.state.linkSource;
        //     const target = e.model;
        //     this.setState({linkSource: undefined});
        //     if (source !== target) {
        //         const wasChanged = target.addInput(source);
        //         this.setState({links: this.props.simulator.getLinks()});
        //     }
        // }
        console.debug("App.handleMouseUpInInteractable");
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

    getViewModelForModel(model: Model.Interactable, id: string): JSX.Element {
        if (model instanceof Model.LogicGate) {
            return (
                <ViewModel.LogicGate
                    model={model}
                    id={id}
                    isSelected={model === this.state.selected}
                    onMouseUp={this.handleMouseUpInInteractable.bind(this)}
                    onLinkStart={this.handleLinkStart.bind(this)}
                    onClick={this.handleInteractableClicked.bind(this)}
                />
            );
        }
        else if (model instanceof Model.Input) {
                return <ViewModel.Input
                    model={model}
                    id={id}
                    isSelected={model === this.state.selected}
                    onMouseUp={this.handleMouseUpInInteractable.bind(this)}
                    onLinkStart={this.handleLinkStart.bind(this)}
                    onClick={this.handleInteractableClicked.bind(this)}/>
        }
        else if (model instanceof Model.Timer) {
            return <ViewModel.Timer
                model={model}
                id={id}
                isSelected={model === this.state.selected}
                onMouseUp={this.handleMouseUpInInteractable.bind(this)}
                onLinkStart={this.handleLinkStart.bind(this)}
                onClick={this.handleInteractableClicked.bind(this)}/>
        }
        else {
            throw 'unexpected model object type';
        }
    }

    render(): JSX.Element {
        let pointer: Array<JSX.Element> | JSX.Element = [];
        const canvasHeight = window.innerHeight*.7;
        const canvasWidth = window.innerWidth-40;
        const buttonRowY: number = canvasHeight-80+(80-64)/2;
        const buttonRowX = (n: number) => 15+(15+64)*n;
        const buttonRowHeight = 75;
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
                width={canvasWidth}
                height={canvasHeight}
                ref={(c: Konva.Stage) => {this.stage = c;}}
                onMouseUp={this.handleMouseUpInStage.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
            >
                <Layer>
                    <Rect id='background' x={0} y={0} width={canvasWidth} height={canvasHeight - buttonRowHeight} onMouseDown={this.handleMouseDown.bind(this)} strokeWidth={0} fill='GhostWhite' />
                    <TC.TickCounter simulator={this.props.simulator} />
                    {this.state.interactables.map((model: Interactable, index: number) =>
                        this.getViewModelForModel(model, index.toString())
                    )}
                    {this.state.createByDragPrototype
                        ? this.getViewModelForModel(this.state.createByDragPrototype, 'dragproto')
                        : []}
                    {pointer}
                    {this.state.links.map((link: IInteractableLink, index:number) => <ViewModel.LinkArrow key={index} source={link.source} target={link.target}/>)}
                </Layer>
                <Layer>
                    <Rect x={5} y={canvasHeight-75} height={70} width={canvasWidth-10} fill='papayawhip' />
                    <Line points={[0, canvasHeight-80, window.innerWidth-40, canvasHeight-80]} stroke='grey' strokeWidth={3}/>
                    <StartStopButton x={buttonRowX(0)} y={buttonRowY} model={this.props.simulator}/>
                    <SingleStepButton x={buttonRowX(1)} y={buttonRowY} model={this.props.simulator}/>
                    <LogicGateButton x={buttonRowX(2)} y={buttonRowY} selected={this.state.selected} kind='and' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(3)} y={buttonRowY} selected={this.state.selected} kind='or' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(4)} y={buttonRowY} selected={this.state.selected} kind='xor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(5)} y={buttonRowY} selected={this.state.selected} kind='nand' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(6)} y={buttonRowY} selected={this.state.selected} kind='nor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(7)} y={buttonRowY} selected={this.state.selected} kind='xnor' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(8)} y={buttonRowY} selected={this.state.selected} kind='input' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <LogicGateButton x={buttonRowX(9)} y={buttonRowY} selected={this.state.selected} kind='timer' onBeginDrag={this.handleNewInteractableDrag.bind(this)}/>
                    <PaintButton x={buttonRowX(10)} y={buttonRowY} selected={this.state.selected}/>
                    <PutOnLiftButton x={buttonRowX(11)} y={buttonRowY} simulator={this.props.simulator}/>
                    <TakeOffLiftButton x={buttonRowX(12)} y={buttonRowY} simulator={this.props.simulator}/>
                    <DeleteButton x={buttonRowX(13)} y={buttonRowY} simulator={this.props.simulator} selected={this.state.selected}/>
                    <CopyLinkButton x={buttonRowX(14)} y={buttonRowY} simulator={this.props.simulator}/>
                    <LoadFromFileButton x={buttonRowX(15)} y={buttonRowY} simulator={this.props.simulator}/>
                    <SaveToFileButton x={buttonRowX(16)} y={buttonRowY} simulator={this.props.simulator}/>
                </Layer>
            </Stage>
        );
    }
}

export function makeItSo(): void {
    // TODO - get rid of this.  One way to go would be to find a way to convert all the PNG's to SVG's.
    const queryString: string | undefined = window.location.search;
    let serialized: ISerializedSimulator | undefined = undefined;
    if (queryString) {
        serialized = Simulator.decompressQueryStringFragment(queryString);
    }

    ViewModel.loadAssets(() => {
        render(<App simulator={new Simulator(serialized)} />, document.getElementById("root"));
    });
}
