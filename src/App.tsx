import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow, Line, Rect, Group } from "react-konva";
import { Simulator, IEventArgsInteractableAdded, IEventArgsInteractableRemoved, IInteractableLink, ISerializedSimulator } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Vector2d } from "konva/types/types";
import { Interactable } from "./Model";
import * as pako from 'pako';
import { IDragNewInteractableDragEventArgs, LogicGateButton, SingleStepButton, StartStopButton } from "./Buttons";
import { KonvaEventObject } from "konva/types/Node";
import { debug } from "console";

interface AppProps {
    simulator: Simulator;
};

interface AppState {
    interactables: Array<Interactable>;
    links: Array<IInteractableLink>;
    selected?: Interactable;
    linkSource?: Interactable;
    linkTargetX?: number;
    linkTargetY?: number;
    createByDragPrototype?: Interactable;
};

export class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            interactables: props.simulator.interactables,
            links: props.simulator.getLinks(),
            selected: undefined,
            linkSource: undefined,
        };
        // this.stageRef = React.useRef(undefined);

        for (let i of this.props.simulator.interactables) {
            i.onMoved(this.handleInteractableMoved.bind(this));
        }

        this.props.simulator.onInteractableAdded( this.handleInteractableAdded );
        this.props.simulator.onInteractableRemoved( this.handleInteractableRemoved );
    }

    handleInteractableAdded = (e: IEventArgsInteractableAdded) => {
        e.interactable.onMoved(this.handleInteractableMoved.bind(this));
        this.setState({
            interactables: this.props.simulator.interactables,
            selected: e.interactable,
        });
    };

    handleInteractableRemoved = (e: IEventArgsInteractableRemoved) => {
        e.interactable.onMoved(this.handleInteractableMoved.bind(this));
        this.setState({
            interactables: this.props.simulator.interactables,
            selected: undefined,
            links: this.state.links.filter(l => l.target !== e.interactable && l.source !== e.interactable)
        });
    };

    handleInteractableMoved = (e: any) => {
        this.setState({interactables: this.props.simulator.interactables});
    }

    // handleDragStart = (e) => {
    //     const id = e.target.id();
    //     console.log(this.refs.stage.getPointerPosition());
    //     this.setState({
    //         stars: this.state.stars.map((star) => {
    //             return {
    //                 ...star,
    //                 isDragging: star.id === id,
    //             };
    //         })
    //     });
    // };

    // handleDragEnd = (e) => {
    //     this.setState(
    //         {
    //             stars: this.state.stars.map((star) => {
    //                 return {
    //                     ...star,
    //                     isDragging: false,
    //                 };
    //             })
    //         }
    //     );
    // };

    componentDidMount() {
        const stage: Konva.Stage = (this.refs.stage as any) as Konva.Stage;
        const container = stage.container();
        container.tabIndex = 1;
        container.focus();
        container.addEventListener("keypress", this.handleKeyPress);
    }

    handleKeyPress = (e: any) => {
        const stage: Konva.Stage = (this.refs.stage as any) as Konva.Stage;
        const xy: Vector2d | null = stage.getPointerPosition();
        if (e.key === "g") {
            this.props.simulator.startRunning();
        } else if (e.key === "s") {
            this.props.simulator.stopRunning();
        } else if (e.key === "n") {
            this.props.simulator.advanceOne();
        } else if (e.key === "l") {
            const newInteractable = new Model.LogicGate({
                kind: 'and',
                x: xy!.x,
                y: xy!.y,
                savedState: false
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === "i") {
            const newInteractable = new Model.Input({
                kind: 'input',
                x: xy!.x,
                y: xy!.y,
                savedState: false
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === "t") {
            const newInteractable = new Model.Timer({
                kind: 'timer',
                x: xy!.x,
                y: xy!.y,
                tickStorage: new Array<boolean>(10).fill(false)
            });
            this.props.simulator.add(newInteractable);
        } else if (e.key === '[' && this.state.selected) {
            this.state.selected.twiddle(-1);
        } else if (e.key === ']' && this.state.selected) {
            this.state.selected.twiddle(1);
        } else if (e.key === 'c') {
            const jsonSerialized: string = JSON.stringify(this.props.simulator.serialize());
            const compressed: Uint8Array = pako.deflate(jsonSerialized);
            const sharableString: string = Buffer.from(compressed).toString('base64');
            const uriFragment: string = encodeURIComponent(sharableString);
            const box: any = document.getElementById('urlbox');
            box!.value = uriFragment;
        } else if (e.key === 'x' && this.state.selected) {
            this.props.simulator.remove(this.state.selected);
        } else if (e.key === '4') {
            for (let i of this.state.interactables) {
                i.reload();
            }
        } else if (e.key === '$') {
            for (let i of this.state.interactables) {
                i.putOnLift();
            }
        } else if (e.key === 'p' && this.state.selected) {
            this.state.selected.paint();
        }

        console.debug("App.handleKeyPress(" + e.key + ")");
    };

    handleInteractableClicked(e: any) {
        this.setState({
            selected: e.model,
        });
    }

    handleLinkStart(e: any) {
        const model = e.model;
        this.setState({
            linkSource: model,
            linkTargetX: e.evt.x,
            linkTargetY: e.evt.y
        })
    }

    handleMouseUpInStage(e: any) {
        // This handles mouseUp events from the field, 
        const source = this.state.linkSource;
        let wasChanged = false;
        if (source) {
            let target = undefined;
            for (let i of this.state.interactables) {
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

    handleMouseUpInInteractable(e: any) {
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

    getViewModelForModel(model: Model.Interactable, id: string) {
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
    }

    render() {
        let pointer: any = [];
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
                ref="stage"
                onMouseUp={this.handleMouseUpInStage.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
            >
                <Layer>
                    <Rect id='background' x={0} y={0} width={canvasWidth} height={canvasHeight - buttonRowHeight} onMouseDown={this.handleMouseDown.bind(this)} strokeWidth={0} fill='GhostWhite' />
                    <TC.TickCounter simulator={this.props.simulator} />
                    {this.state.interactables.map((model: any, index: any) =>
                        this.getViewModelForModel(model, index)
                    )}
                    {this.state.createByDragPrototype
                        ? this.getViewModelForModel(this.state.createByDragPrototype, 'dragproto')
                        : []}
                    {pointer}
                    {this.state.links.map((link: IInteractableLink) => <ViewModel.LinkArrow source={link.source} target={link.target}/>)}
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
                </Layer>
            </Stage>
        );
    }
}

// Konva.Image.fromURL('/and-black.png', (img) => {
//     andBlackImage = img;
//     render(<App simulator={new Simulator()} />, document.getElementById('root'));
// });

// These work to intercept all keys, (F5 included), but you have to handle them
// completely, here, or they don't go down to the dom-level objects...  Not sure if
// worth it.
// document.addEventListener('keydown', (e) => {
//     console.debug("keydown("+e.key+")");
//     e.preventDefault();
// });
// document.addEventListener('keyup', (e) => {
//     console.debug("keyup("+e.key+")");
//     e.preventDefault();
// });
// document.addEventListener('keypress', (e) => {
//     console.debug("keypress("+e.key+")");
//     e.preventDefault();
// });

export function makeItSo() {
    const queryString: string | undefined = window.location.search;
    let serialized: ISerializedSimulator | undefined = undefined;
    if (queryString) {
        const base64: string = decodeURIComponent(queryString);
        const compressedData: Uint8Array = Buffer.from(base64, 'base64');

        const serializedString: string = pako.inflate(compressedData, { to: 'string' });
        serialized = JSON.parse(serializedString);
    }

    ViewModel.loadAssets(() => {
        render(<App simulator={new Simulator(serialized)} />, document.getElementById("root"));
    });
}

// var stage = new Konva.Stage({
//     container: 'root',
//     width: window.innerWidth,
//     height: window.innerHeight,
// });

// var layer = new Konva.Layer();
// const star = new Konva.Star({
//     x: 50,
//     y: 50,
//     innerRadius: 20,
//     outerRadius: 40,
//     fill: "#89b717",
//     draggable: true,
// });
// layer.add(
//     star
// );
// stage.add(layer);

/*
                    {this.state.stars.map((star) => (
                        <Star
                            key={star.id}
                            id={star.id}
                            x={star.x}
                            y={star.y}
                            numPoints={5}
                            innerRadius={20}
                            outerRadius={40}
                            fill="#89b717"
                            opacity={0.8}
                            draggable
                            rotation={star.rotation}
                            shadowColor="black"
                            shadowBlur={10}
                            shadowOpacity={0.6}
                            shadowOffsetX={star.isDragging ? 10 : 5}
                            shadowOffsetY={star.isDragging ? 10 : 5}
                            scaleX={star.isDragging ? 1.2 : 1}
                            scaleY={star.isDragging ? 1.2 : 1}
                            onDragStart={this.handleDragStart}
                            onDragEnd={this.handleDragEnd}
                        />
                    ))}
*/
