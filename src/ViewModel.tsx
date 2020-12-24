import Konva from 'konva';
import { KonvaEventObject } from 'konva/types/Node';
import React from 'react';
import { Image, Group, Rect, Circle, Line, Arrow} from 'react-konva';
import * as Model from './Model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _assets: any = {};

// https://www.cssscript.com/lightweight-context-menu-javascript-library-justcontext-js/
// might automate the context menu for me.

export interface IEventArgsInteractable {
    model: Model.Interactable;
    evt: MouseEvent;
}

interface IInteractableProps {
    model: Model.Interactable;
    onClick?: (eventArgs: IEventArgsInteractable) => void;
    onLinkStart?: (eventArgs: IEventArgsInteractable) => void;
    onMouseUp?: (eventArgs: IEventArgsInteractable) => void;
    id: string;
    isSelected: boolean;
}

// In somebody's mind, Record<string,never> is better than interface{}... Takes all kinds I guess.

type IInteractableState = Record<string,never>

export class Interactable<TProps extends IInteractableProps, TState extends IInteractableState> extends React.Component<TProps, TState> {
    /**
     * @summary This is the model (which we get from props) that was last attached to (listening for events, such
     * as the state changing).  It has to be handled really carefully, at least if you want to abide by the rules
     * set forth.  It generally reflects the state of the prop the last time the render() method was run.  Note that
     * on the first render this is not set, and instead we wait for the componentDidMount event.  After that, it gets
     * updated at render time.  The difference is because we can't accept any setState calls until the component is
     * mounted.
     * 
     * @see https://blog.bitsrc.io/react-16-lifecycle-methods-how-and-when-to-use-them-f4ad31fb2282
     */
    private attachedModel: Model.Interactable | undefined;

    private group: Konva.Group | null | undefined;

    public componentDidMount(): void {
        // after this point, the model is drawn and is reacting to events.
        if (!this.attachedModel) {
            this.attachedModel = this.props.model;
            this.attachedModel.onStateChanged(this.handleStateChanged);
        }
    }

    public componentWillUnmount(): void {
        console.debug("componentDidUnmount("+this.constructor.name+")");
        if (this.attachedModel) {
            this.attachedModel.offStateChanged(this.handleStateChanged);
            this.attachedModel = undefined;
        }
    }

    private handleOnClick(eventArgs: KonvaEventObject<MouseEvent>): void {
        if (this.props.onClick) {
            this.props.onClick({
                evt: eventArgs.evt,
                model: this.props.model,
            });
        }
    }

    private handleStateChanged = (): void => {
        this.setState({});
    }

    private handleDragStart(e: KonvaEventObject<MouseEvent>): void {
        // The gesture for dragging is left mouse button, and there seems no way to
        // argue with Konva about it, except this.  We want to use left-mouse-button
        // dragging to move a pointer, so if we see the shift key is not down, we
        // cancel the drag and tell our parent about the link-start event.  We can't
        // help anymore from here, as we don't get useful events.
        if (!e.evt.shiftKey) {
            if (!this.group) {
                throw new Error('group did not get set in render');
            }

            this.group.stopDrag();

            if (this.props.onLinkStart) {
                this.props.onLinkStart({
                    evt: e.evt,
                    model: this.props.model
                });
            }
        }
        // Else it's a real drag event, let that go.
    }

    private handleOnMouseUp(e: KonvaEventObject<MouseEvent>): void {
        if (this.props.onMouseUp) {
            this.props.onMouseUp({
                evt: e.evt,
                model: this.props.model
            });
        }
    }

    private handleDragEnd(): void {
        // Since we change the model during the dragMove, we don't really need
        // this event, but if we don't have it, Konva gets nervous.
    }

    private handleDragMove(e: KonvaEventObject<MouseEvent>) {
        // The documentation gives no clue at all how to do this.  But there's a comment later:
        // var scale = stage.scaleX();
        // var new_pos = event.target.absolutePosition();
        // new_pos.x = (new_pos.x - stage.x()) / scale;
        // new_pos.y = (new_pos.y - stage.y()) / scale;
        // draggedNode.move_to(new_pos);
        //
        // Gonna assume the stage isn't scaled.  (And might you be subject to the layer being scaled as well?)

        const pos = e.target.absolutePosition();
        this.props.model.setPosition(pos.x, pos.y);
    }

    public render(): JSX.Element {
        if (this.props.model !== this.attachedModel && this.attachedModel !== undefined) {
            // the property has changed and this isn't the first time we're redering (so the DOM exists)
            this.attachedModel.offStateChanged(this.handleStateChanged);
            this.attachedModel = this.props.model;
            this.attachedModel.onStateChanged(this.handleStateChanged);
        }

        // onContextMenu={this.handleContextMenu}
        return <Group onClick={this.handleOnClick.bind(this)}
                      vonMouseUp={this.handleOnMouseUp.bind(this)}
                      ref={(c) => this.group = c}
                      draggable
                      x={this.props.model.x}
                      y={this.props.model.y}
                      onDragStart={this.handleDragStart.bind(this)}
                      onDragMove={this.handleDragMove.bind(this)}
                      onDragEnd={this.handleDragEnd.bind(this)}>
                {this.groupContent()}
            </Group>
    }

    protected groupContent(): Array<JSX.Element> {
        return [<Rect key='surround' height={64} width={64} strokeWidth={3} stroke={this.props.isSelected ? 'green' : 'blue'} fill={this.props.model.currentState ? 'white' : 'grey'} />]
    }
}

export class InteractableWithSingleBitSavedState<TProps extends IInteractableProps, TState extends IInteractableState> extends Interactable<TProps, TState> {
    protected groupContent(): Array<JSX.Element> {
        if (this.props.model instanceof Model.InteractableWithSingleBitSavedState) {
            const size=16;
            return super.groupContent()
                .concat(
                <Line key='saveStateIndicator'
                      points={[63-size, 0, 63, 0, 63, size]}
                      fill={this.props.model.savedState ? 'blue' : 'transparent'}
                      stroke='blue'
                      strokeWidth={3}
                      closed={true} />);
        }
        else {
            return super.groupContent();
        }
    }
}

interface ILogicGateProps extends IInteractableProps {
    model: Model.LogicGate;
}

export class LogicGate extends InteractableWithSingleBitSavedState<ILogicGateProps, IInteractableState> {
    constructor(props: ILogicGateProps) {
        super(props);
        console.debug("constructor(LogicGate)");
    }

    protected groupContent(): Array<JSX.Element> {
        return super.groupContent().concat([
            <Image key='image' x={0} y={0} image={_assets[this.props.model.kind].image()} />]);
    }
}

interface IInputProps extends IInteractableProps {
    model: Model.Input;
}

export class Input extends InteractableWithSingleBitSavedState<IInputProps, IInteractableState> {
    constructor(props: IInputProps) {
        super(props);
        console.debug("constructor(Input)");
    }

    protected groupContent(): Array<JSX.Element> {
        return super.groupContent().concat([
            <Circle key='image' radius={22} x={32} y={32} strokeWidth={8} stroke='black' />]);
    }
}

export interface ITimerProps extends IInteractableProps {
    model: Model.Timer;
}

type ITimerState = IInteractableState

export class Timer extends Interactable<ITimerProps, ITimerState> {
    constructor(props: ITimerProps) {
        super(props);
        console.debug("constructor(Timer)");
    }

    groupContent(): Array<JSX.Element> {
        const drawingHeight = 64;
        const drawingWidth = 64;
        const horizontalOffset = 12;
        const verticalOffset = 6;
        const rectHeight = (drawingHeight - 2*verticalOffset) / this.props.model.tickStorage.length;

        return super.groupContent().concat(
            this.props.model.tickStorage.map((value: boolean, index: number) =>
            <Rect key='image'
                  x={horizontalOffset}
                  width={drawingWidth - 2*horizontalOffset}
                  y={drawingHeight - verticalOffset - rectHeight - index*(drawingHeight-2*verticalOffset)/this.props.model.tickStorage.length}
                  height={rectHeight}
                  strokeWidth={1}
                  stroke='darkgrey'
                  fill={value ? 'blue' : 'white'}
                   />));
    }
}

export interface ILinkArrowProps {
    source: Model.Interactable;
    target: Model.Interactable;
}

export class LinkArrow extends React.Component<ILinkArrowProps> {
    private attachedModel: Model.Interactable | undefined;

    public constructor(props: ILinkArrowProps) {
        super(props);
        this.state = {};
    }

    public componentDidMount(): void {
        // after this point, the model is drawn and is reacting to events.
        if (!this.attachedModel) {
            this.attachedModel = this.props.source;
            this.attachedModel.onStateChanged(this._handleStateChanged);
        }
    }

    public componentWillUnmount(): void {
        this.props.source.offStateChanged(this._handleStateChanged);
        this.attachedModel = undefined;
    }

    private _handleStateChanged = (): void => {
        this.setState({});
    }

    public render(): JSX.Element {
        if (this.props.source !== this.attachedModel && this.attachedModel !== undefined) {
            // the property has changed and this isn't the first time we're redering (so the DOM exists)
            this.attachedModel.offStateChanged(this._handleStateChanged);
            this.attachedModel = this.props.source;
            this.attachedModel.onStateChanged(this._handleStateChanged);
        }

        let sourceX = this.props.source.x+32;
        let sourceY = this.props.source.y+32;
        let targetX = this.props.target.x+32;
        let targetY = this.props.target.y+32;

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
            fill={this.props.source.prevState ? 'darkblue' : 'teal'}
            stroke={this.props.source.prevState ? 'darkblue' : 'teal'}
            strokeWidth={4}
            pointerLength={10}
            pointerWidth={10}/>;
    }
}

export function loadAssets(onComplete: () => void): void
{
    for (const kind of ['and', 'or', 'xor', 'nand', 'nor', 'xnor', 'paint']) {
        Konva.Image.fromURL('/' + kind + '-black.png', (img: string) => {
            _assets[kind] = img;
            if (Object.keys(_assets).length === 7) {
                onComplete();
            }
          });
    }
}