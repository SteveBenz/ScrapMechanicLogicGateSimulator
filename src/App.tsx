import * as React from "react";
import { render } from "react-dom";
import { Stage, Layer, Arrow } from "react-konva";
import { Simulator, IEventArgsInteractableAdded, IEventArgsInteractableRemoved, IInteractableLink, ISerializedSimulator } from "./Simulator";
import * as TC from "./TickCounter";
import * as ViewModel from "./ViewModel";
import * as Model from "./Model";
import Konva from 'konva';
import { Vector2d } from "konva/types/types";
import { Interactable } from "./Model";
import * as pako from 'pako';

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

        this.props.simulator.onInteractableAdded( this.handleInteractableAdded );
    }

    handleInteractableAdded = (e: IEventArgsInteractableAdded) => {
        e.interactable.onMoved(this.handleInteractableMoved.bind(this));
        this.setState({
            interactables: this.props.simulator.interactables,
            selected: e.interactable,
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

    handleMouseMove(e: any) {
        if (this.state.linkSource) {
            this.setState({
                linkTargetX: e.evt.x,
                linkTargetY: e.evt.y
            })
        }
    }

    getViewModelForModel(model: any, id: string) {
        if (model.constructor.name === "LogicGate") {
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
        else if (model.constructor.name === 'Input') {
                return <ViewModel.Input
                    model={model}
                    id={id}
                    isSelected={model === this.state.selected}
                    onMouseUp={this.handleMouseUpInInteractable.bind(this)}
                    onLinkStart={this.handleLinkStart.bind(this)}
                    onClick={this.handleInteractableClicked.bind(this)}/>
        }
        //     else if (model.constructor.name === 'Timer') {
        //             // TODO:
        //             console.debug("Timer not implemented in ViewModel.getViewModelForModel");
        //             return undefined;
        //     }
    }

    drawArrow(pair: any) {
        var sourceX = pair.source.x+32;
        var sourceY = pair.source.y+32;
        var targetX = pair.target.x+32;
        var targetY = pair.target.y+32;

        if (Math.abs(targetY-sourceY) < Math.abs(targetX-sourceX)) {
            // The line is less than 45 degrees up, so we'll trim the x's and scale the y's
            const sign = (targetX > sourceX) ? 1 : -1;
            const yTrim = 32*(targetY - sourceY)/(targetX-sourceX);
            sourceX += sign*32;
            targetX -= sign*32;
            sourceY += sign*yTrim;
            targetY -= sign*yTrim;
        }
        else {
            const sign = (targetY > sourceY) ? 1 : -1;
            const xTrim = 32*(targetX - sourceX)/(targetY-sourceY);
            sourceX += sign*xTrim;
            targetX -= sign*xTrim;
            sourceY += sign*32;
            targetY -= sign*32;
        }

        return <Arrow
            x={sourceX}
            y={sourceY}
            points={[0,0, targetX-sourceX, targetY-sourceY]}
            fill='black'
            stroke='black'
            strokeWidth={4}
            pointerLength={10}
            pointerWidth={10}/>;
    }

    render() {
        let pointer: any = [];
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
                width={window.innerWidth}
                height={window.innerHeight}
                ref="stage"
                onMouseUp={this.handleMouseUpInStage.bind(this)}
                onMouseMove={this.handleMouseMove.bind(this)}
            >
                <Layer>
                    <TC.TickCounter simulator={this.props.simulator} />
                    {this.state.interactables.map((model: any, index: any) =>
                        this.getViewModelForModel(model, index)
                    )}
                    {pointer}
                    {this.state.links.map((link: any) => this.drawArrow(link))}
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
