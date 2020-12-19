import Konva from 'konva';
import React from 'react';
import { render } from 'react-dom';
import { Image, Group, Rect } from 'react-konva';
import { Simulator } from './Simulator'; 
import * as Model from './Model';

const _assets: any = {};

// https://www.cssscript.com/lightweight-context-menu-javascript-library-justcontext-js/
// might automate the context menu for me.

interface IEventArgsInteractable {
    model: Model.Interactable;
    evt: any; // TODO: See if we can find the actual event?
}

interface IInteractableProps {
    model: Model.Interactable;
    onClick?: (eventArgs: IEventArgsInteractable) => void;
    onLinkStart?: (eventArgs: IEventArgsInteractable) => void;
    onMouseUp?: (eventArgs: IEventArgsInteractable) => void;
    id: string;
    isSelected: boolean;
};

interface ILogicGateProps extends IInteractableProps {
    model: Model.LogicGate;
}

interface IInteractableState {
    isSelected: boolean;
}

export class Interactable<TProps extends IInteractableProps, TState extends IInteractableState> extends React.Component<TProps, TState> {
    constructor(props: TProps) {
        super(props);

        this.props.model.onStateChanged(this.handleStateChanged.bind(this))
    }

    static getDerivedStateFromProps(
        props: IInteractableProps,
        state: IInteractableState
    ): IInteractableState {
        return { isSelected: props.isSelected };
    }

    handleOnClick(e: any) {
        if (this.props.onClick) {
            this.props.onClick({
                evt: e,
                model: this.props.model,
            });
        }
    }

    private handleStateChanged(e: Model.IEventArgsInteractable): void {
        // TODO: Can this be {} ?
        this.setState({
            isSelected: this.state.isSelected
        });
    }

    handleDragStart(e: any) {
        // The gesture for dragging is left mouse button, and there seems no way to
        // argue with Konva about it, except this.  We want to use left-mouse-button
        // dragging to move a pointer, so if we see the shift key is not down, we
        // cancel the drag and tell our parent about the link-start event.  We can't
        // help anymore from here, as we don't get useful events.
        if (!e.evt.shiftKey) {
            (this.refs.group as any as Konva.Group).stopDrag();

            if (this.props.onLinkStart) {
                this.props.onLinkStart({
                    evt: e.evt,
                    model: this.props.model
                });
            }
        }
        // Else it's a real drag event, let that go.
    }

    handleOnMouseUp(e:any) {
        if (this.props.onMouseUp) {
            this.props.onMouseUp({
                evt: e.evt,
                model: this.props.model
            });
        }
    }

    handleDragEnd(e: any) {
        if (!e.evt) {
            // This comes from the cancellation of the drag
            return;
        }
        // Since we change the model during the dragMove, we don't really need
        // this event, but if we don't have it, Konva gets nervous.
    }

    handleDragMove(e: any) {
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

    render() {
        // onContextMenu={this.handleContextMenu}
        return <Group
            onClick={this.handleOnClick.bind(this)}
            onMouseUp={this.handleOnMouseUp.bind(this)}
            ref="group"
            draggable
            x={this.props.model.x}
            y={this.props.model.y}
            onDragStart={this.handleDragStart.bind(this)}
            onDragMove={this.handleDragMove.bind(this)}
            onDragEnd={this.handleDragEnd.bind(this)}>
                {this.groupContent()}
            </Group>
    }

    groupContent() {
        return [<Rect height={64} width={64} strokeWidth={3} stroke={this.state.isSelected ? 'green' : 'blue'} fill={this.props.model.currentState ? 'white' : 'grey'} ></Rect>]
    }

    // handleContextMenu(e) {
    //     const menuNode = document.getElementById('logicGateMenu');
    //     menuNode.style.display = 'initial';
    //     menuNode.style.top = e.evt.x + 'px';
    //     menuNode.style.left = e.evt.y + 'px';
    //     e.evt.preventDefault();
    // }

};

export class InteractableWithSingleBitSavedState<TProps extends IInteractableProps, TState extends IInteractableState> extends Interactable<TProps, TState> {
    constructor(props: TProps) {
        super(props);
    }

};

export class LogicGate extends InteractableWithSingleBitSavedState<ILogicGateProps, IInteractableState> {
    constructor(props: ILogicGateProps) {
        super(props);
    }

    static getDerivedStateFromProps(
        props: ILogicGateProps,
        state: IInteractableState
    ): IInteractableState {
        return super.getDerivedStateFromProps(props, state);
    }

    groupContent() {
        return super.groupContent().concat([
            <Image x={0} y={0} image={_assets[this.props.model.kind].image()} />]);
    }
};

export function loadAssets(onComplete: () => void)
{
    for (let kind of ['and', 'or', 'xor', 'nand', 'nor', 'xnor']) {
        Konva.Image.fromURL('/' + kind + '-black.png', (img: string) => {
            _assets[kind] = img;
            if (Object.keys(_assets).length === 6) {
                onComplete();
            }
          });
    }
}