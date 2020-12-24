import { EventEmitter } from 'events';
import pako from 'pako';
import { Interactable, ISerializedInteractable } from './Model';


export interface IEventArgsSimulator {
    simulator: Simulator;
}

export interface IEventArgsTick extends IEventArgsSimulator {
    tick: number;
}

export interface IEventArgsInteractableAdded extends IEventArgsSimulator {
    interactable: Interactable;
}

export interface IEventArgsInteractableRemoved extends IEventArgsSimulator {
    interactable: Interactable;
}

export interface IEventArgsInteractablesReset extends IEventArgsSimulator {
    oldInteractables: Array<Interactable>;
}

export interface IEventArgsSimulatorRunStateChanged extends IEventArgsSimulator {
    newRunState: boolean;
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
    public interactables: Array<Interactable>;

    constructor(serialized?: ISerializedSimulator | undefined) {
        this._events = new EventEmitter();
        this.currentTick = 0;
        this.isRunning = false;
        this._nextTickTimeoutId = undefined;
        this._pauseInterval = 250;
        this.interactables = [];
        if (serialized) {
            this.load(serialized);
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

    public load(serialized: ISerializedSimulator): void {
        const oldInteractables = this.interactables;
        this.interactables = serialized.interactables.map(i => Interactable.deserialize(i));
        const interactablesInputs = new Array<Array<Interactable>>(this.interactables.length);
        for (let i = 0; i < this.interactables.length; ++i) {
            interactablesInputs[i] = new Array<Interactable>();
        }
        for (const pair of serialized.links) {
            interactablesInputs[pair.target].push(this.interactables[pair.source]);
        }
        for (let i = 0; i < this.interactables.length; ++i) {
            this.interactables[i].setInputs(interactablesInputs[i]);
        }

        this._emitInteractablesReset( { simulator: this, oldInteractables: oldInteractables });

        this.stopRunning();
    }

    public gameReload(): void {
        for (const i of this.interactables) {
            i.reload();
        }

        this.currentTick = 0;
        this._emitTick();
    }

    public serializeToCompressedQueryStringFragment(): string {
        const jsonSerialized: string = JSON.stringify(this.serialize());
        const compressed: Uint8Array = pako.deflate(jsonSerialized);
        const sharableString: string = Buffer.from(compressed).toString('base64');
        return encodeURIComponent(sharableString);
    }

    public static decompressQueryStringFragment(queryString: string): ISerializedSimulator {
        const base64: string = decodeURIComponent(queryString);
        const compressedData: Uint8Array = Buffer.from(base64, 'base64');

        const serializedString: string = pako.inflate(compressedData, { to: 'string' });
        return JSON.parse(serializedString);
    }

    public startRunning(): void {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this._nextTickTimeoutId = setTimeout(this._handleTickTimeout.bind(this), this._pauseInterval);

        this._events.emit('runStateChanged', { simulator: this, newRunState: this.isRunning });
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

        this._events.emit('runStateChanged', { simulator: this, newRunState: this.isRunning });
    }

    public advanceOne(): void {
        if (this.isRunning) {
            return;
        }

        this._advanceOne();
    }

    public add(interactable: Interactable): void {
        this.interactables.push(interactable);
        this._events.emit(EventNames.interactableAdded, { simulator: this, interactable: interactable } as IEventArgsInteractableAdded);
    }

    public remove(interactable: Interactable): boolean {
        let didRemove = false;
        for (let i = this.interactables.length-1; i >= 0; --i) {
            if (this.interactables[i] === interactable) {
                didRemove = true;
                this.interactables.splice(i ,1);
            }
        }
        for (const i of this.interactables) {
            i.removeInput(interactable);
        }

        if (didRemove)
        {
            this._events.emit(EventNames.interactableRemoved, { simulator: this, interactable: interactable } as IEventArgsInteractableRemoved);
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
        this._emitTick();

        for (const i of this.interactables) {
            i.apply();
        }
        for (const i of this.interactables) {
            i.calculate();
        }
    }

    public onTick(handler: (eventArgs: IEventArgsTick) => void): void {
        this._events.on(EventNames.tick, handler);
    }

    public offTick(handler: (eventArgs: IEventArgsTick) => void): void {
        this._events.off(EventNames.tick, handler);
    }

    private _emitTick() {
        this._events.emit(EventNames.tick, { simulator: this, tick: this.currentTick } as IEventArgsTick);
    }

    public onInteractableAdded(handler: (EventTarget: IEventArgsInteractableAdded) => void): void {
        this._events.on(EventNames.interactableAdded, handler);
    }

    public offInteractableAdded(handler: (EventTarget: IEventArgsInteractableAdded) => void): void {
        this._events.off(EventNames.interactableAdded, handler);
    }

    public onInteractableRemoved(handler: (EventTarget: IEventArgsInteractableRemoved) => void): void {
        this._events.on(EventNames.interactableRemoved, handler);
    }

    public offInteractableRemoved(handler: (EventTarget: IEventArgsInteractableRemoved) => void): void {
        this._events.off(EventNames.interactableRemoved, handler);
    }

    public onRunStateChanged(handler: (EventTarget: IEventArgsSimulatorRunStateChanged) => void): void {
        this._events.on('runStateChanged', handler);
    }

    public offRunStateChanged(handler: (EventTarget: IEventArgsSimulatorRunStateChanged) => void): void {
        this._events.off('runStateChanged', handler);
    }

    public onInteractablesReset(handler: (EventTarget: IEventArgsInteractablesReset) => void): void {
        this._events.on('interactablesReset', handler);
    }

    public offInteractablesReset(handler: (EventTarget: IEventArgsInteractablesReset) => void): void {
        this._events.off('interactablesReset', handler);
    }

    private _emitInteractablesReset(eventArgs: IEventArgsInteractablesReset )
    {
        this._events.emit('interactablesReset', eventArgs);
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
