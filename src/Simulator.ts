import { EventEmitter } from 'events';
import { Interactable, ISerializedInteractable } from './Model';


export interface IEventArgsSimulator {
    simulator: Simulator;
};

export interface IEventArgsTick extends IEventArgsSimulator {
    tick: number;
};

export interface IEventArgsInteractableAdded extends IEventArgsSimulator {
    interactable: Interactable;
}

export interface IEventArgsInteractableRemoved extends IEventArgsSimulator {
    interactable: Interactable;
}

export interface IInteractableLink {
    source: Interactable;
    target: Interactable;
}

export interface ISerializedSimulator {
    interactables: Array<ISerializedInteractable>;
    links: Array<{source: number, target: number}>;
}

export class Simulator {
    private _nextTickTimeoutId: NodeJS.Timeout | undefined;
    private _pauseInterval: number;
    private readonly _events: EventEmitter;

    public currentTick: number; // TODO: make it readonly to outside callers
    public isRunning: boolean; // TODO: make it readonly to outside callers
    public readonly interactables: Array<Interactable>;

    constructor(serialized?: ISerializedSimulator | undefined) {
        this._events = new EventEmitter();
        this.currentTick = 0;
        this.isRunning = false;
        this._nextTickTimeoutId = undefined;
        this._pauseInterval = 250;
        if (serialized) {
            this.interactables = serialized.interactables.map(i => Interactable.deserialize(i));
            const interactablesInputs = new Array<Array<Interactable>>(this.interactables.length);
            for (let i = 0; i < this.interactables.length; ++i) {
                interactablesInputs[i] = new Array<Interactable>();
            }
            for (let pair of serialized.links) {
                interactablesInputs[pair.target].push(this.interactables[pair.source]);
            }
            for (let i = 0; i < this.interactables.length; ++i) {
                this.interactables[i].setInputs(interactablesInputs[i]);
            }
        }
        else {
            this.interactables = [];
        }
    }

    public serialize(): ISerializedSimulator {
        const links: Array<IInteractableLink> = this.getLinks();
        return {
            interactables: this.interactables.map(i => i.export()),
            links: links.map(i => { return {
                source: this.interactables.indexOf(i.source),
                target: this.interactables.indexOf(i.target)
            }})
        }
    }

    public startRunning(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this._nextTickTimeoutId = setTimeout(this._handleTickTimeout.bind(this), this._pauseInterval);
    }

    public onTick(handler: (eventArgs: IEventArgsTick) => void) {
        this._events.on(EventNames.tick, handler);
    }

    public offTick(handler: (eventArgs: IEventArgsTick) => void) {
        this._events.off(EventNames.tick, handler);
    }

    public onInteractableAdded(handler: (EventTarget: IEventArgsInteractableAdded) => void) {
        this._events.on(EventNames.interactableAdded, handler);
    }

    public offInteractableAdded(handler: (EventTarget: IEventArgsInteractableAdded) => void) {
        this._events.off(EventNames.interactableAdded, handler);
    }

    public onInteractableRemoved(handler: (EventTarget: IEventArgsInteractableRemoved) => void) {
        this._events.on(EventNames.interactableRemoved, handler);
    }

    public offInteractableRemoved(handler: (EventTarget: IEventArgsInteractableRemoved) => void) {
        this._events.off(EventNames.interactableRemoved, handler);
    }

    public stopRunning(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this._nextTickTimeoutId) {
            clearTimeout(this._nextTickTimeoutId);
        }

        this._nextTickTimeoutId = undefined;
    }

    public advanceOne(): void {
        if (this.isRunning) {
            return;
        }

        this._advanceOne();
    }

    public add(interactable: Interactable) {
        this.interactables.push(interactable);
        this._events.emit(EventNames.interactableAdded, <IEventArgsInteractableAdded>{ simulator: this, interactable: interactable });
    }

    public remove(interactable: Interactable): boolean {
        let didRemove = false;
        for (var i = this.interactables.length-1; i >= 0; --i) {
            if (this.interactables[i] === interactable) {
                didRemove = true;
                this.interactables.splice(i ,1);
            }
        }

        if (didRemove)
        {
            this._events.emit(EventNames.interactableRemoved, <IEventArgsInteractableRemoved>{ simulator: this, interactable: interactable });
        }

        return didRemove;
    }

    public getLinks(): Array<IInteractableLink> {
        return this.interactables
            .map(target => target.inputs
                .map(function(source) {return {source: source, target: target}}))
            .reduce((a,b) => a.concat(b), []);
    }

    private _advanceOne(): void {
        ++this.currentTick;
        this._events.emit(EventNames.tick, <IEventArgsTick>{ simulator: this, tick: this.currentTick });

        for (let i of this.interactables) {
            i.apply();
        }
        for (let i of this.interactables) {
            i.calculate();
        }
    }

    private _handleTickTimeout(): void {
        this._advanceOne();
        this._nextTickTimeoutId = setTimeout(this._handleTickTimeout.bind(this), this._pauseInterval);
    }
}

const EventNames = {
    // This is emitted whenever the clock is actually advanced.  State calculated in
    // 'pretick' should now become the current state.
    tick: 'tick',

    // A new component has been added to the model (argument is the new item)
    interactableAdded: 'interactableAdded',

    // A component has been removed from the model (argument is the removed item)
    interactableRemoved: 'interactableRemoved',
};
