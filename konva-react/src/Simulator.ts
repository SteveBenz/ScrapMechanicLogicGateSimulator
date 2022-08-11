import { EventEmitter } from 'events';
import pako from 'pako';
import { hasOwnProperty, Interactable, ISerializedInteractable } from './Model';
import { Buffer } from 'buffer';


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

export type ISerializedSimulator = Array<ISerializedInteractable>

export class Simulator {
    private _nextTickTimeoutId: NodeJS.Timeout | undefined;
    private _pauseInterval: number;
    private readonly _events: EventEmitter;

    public currentTick: number; // TODO: make it readonly to outside callers
    public isRunning: boolean; // TODO: make it readonly to outside callers
    public interactables: Array<Interactable>;

    constructor() {
        this._events = new EventEmitter();
        this.currentTick = 0;
        this.isRunning = false;
        this._nextTickTimeoutId = undefined;
        this._pauseInterval = 250;
        this.interactables = [];
    }

    public serialize(): ISerializedSimulator {
        function buildSerializedWithInputs(interactable: Interactable, allInteractables: Array<Interactable>): ISerializedInteractable {
            const serialized: ISerializedInteractable = interactable.export();
            serialized.inputs = interactable.inputs.map(i => allInteractables.indexOf(i));
            return serialized;
        }
        return this.interactables.map(i => buildSerializedWithInputs(i, this.interactables));
    }

    public load(serialized: unknown): void {
        if (!Array.isArray(serialized)) {
            throw new Error("Bad format - expected an array at the top level");
        }

        // interactables that we get here have empty input lists
        const interactables: Array<Interactable> = serialized.map(i => Interactable.validateAndDeserialize(i));
        for (let i = 0; i < interactables.length; ++i) {
            const serializedInteractable:unknown = serialized[i];
            const deserializedInteractable: Interactable = interactables[i];

            if (typeof(serializedInteractable) !== 'object' || serializedInteractable === null) {
                throw new Error("Bad format - expected an array of objects at the top level");
            }

            if (!hasOwnProperty(serializedInteractable, 'inputs')) {
                throw new Error("Interactable is missing an 'inputs' array");
            }

            if (!Array.isArray(serializedInteractable.inputs)) {
                throw new Error("Interactable 'inputs' field should be an array of indices");
            }

            for (const serializedInputIndex of serializedInteractable.inputs) {
                if (typeof(serializedInputIndex) !== 'number') {
                    throw new Error("'inputs' should consist of numbers");
                }

                if (serializedInputIndex < 0 || serializedInputIndex >= interactables.length) {
                    throw new Error("'inputs' has an index that is out of range");
                }

                deserializedInteractable.addInput(interactables[serializedInputIndex]);
            }
        }

        this.setInteractables(interactables);
    }

    public setInteractables(newInteractables: Interactable[]): void {
        const oldInteractables = this.interactables;
        this.interactables = newInteractables;
        this._emitInteractablesReset( { simulator: this, oldInteractables: oldInteractables });

        this.stopRunning();
    }

    private static _hashCode(s: string): number {
        return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
    }

    public loadFromQsAndCookie(): void {
        const queryString: string | undefined = window.location.search;

        const ca = document.cookie.split(';');
        let cookieState: string | undefined;
        let cookieIsForThisQueryString = false;
        for(let i = 0; i < ca.length; i++) {
            const c = ca[i].trimStart();
            if (c.startsWith("state=")) {
                cookieState = c.substring(6, c.length);
            }
            if (c.startsWith("hash=") && queryString !== '') {
                cookieIsForThisQueryString = Simulator._hashCode(queryString).toString() === c.substring(5, c.length);
            }
        }

        let loadFrom: string | undefined;
        if ((cookieIsForThisQueryString && cookieState !== undefined) || queryString === '') {
            loadFrom = cookieState;
        }
        else if (queryString !== '') {
            loadFrom = queryString;
        }

        let serialized: unknown | undefined = [];
        if (loadFrom) {
            try
            {
                serialized = Simulator.decompressQueryStringFragment(loadFrom);
            }
            catch {
                throw Error("The query string doesn't seem to be something created by this app - was it perhaps truncated?");
            }
        }
        this.load(serialized);
    }

    public storeInCookie(): void {
        // ISSUE - once you get over 4k, this will certainly fail.  As far as I can see, it'd be possible
        //   to break this into multiple strings.  See:
        //  https://www.thoughtco.com/cookie-limit-per-domain-3466809#:~:text=Chrome%20and%20Safari%20appear%20to,50%20maximum%20cookies%20per%20domain.
        //   Although it appears that some browsers will not support more than a total of 4k in cookie data total.
        const d = new Date();
        d.setTime(d.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days
        const extraSlag = ";expires="+d.toUTCString()+";path=/";
        document.cookie = "state=" + this.serializeToCompressedQueryStringFragment() + extraSlag;
        const queryString: string | undefined = window.location.search;
        if (queryString) {
            document.cookie = "hash=" + Simulator._hashCode(queryString) + extraSlag;
        }
    }

    public fitToSize(width: number, height: number, padX: number, padY: number): void {
        if (this.interactables.every(i => i.x >= 0 && i.x < width-64 && i.y >= 0 && i.y < height-64)) {
            // Seems to fit reasonably well already
            return;
        }

        const maxX: number = this.interactables.reduce((previousValue, currentValue) => Math.max(previousValue, currentValue.x), 0);
        const maxY: number = this.interactables.reduce((previousValue, currentValue) => Math.max(previousValue, currentValue.y), 0);
        const minX: number = this.interactables.reduce((previousValue, currentValue) => Math.min(previousValue, currentValue.x), 999999);
        const minY: number = this.interactables.reduce((previousValue, currentValue) => Math.min(previousValue, currentValue.y), 999999);

        for (const i of this.interactables) {
            const newX = padX + (i.x - minX) * (width - 2*padX - 64) / maxX;
            const newY = padY + (i.y - minY) * (height - 2*padY - 64) / maxY;
            i.setPosition(newX, newY);
        }
    }

    public gameReload(): void {
        for (const i of this.interactables) {
            i.reload();
        }

        this.currentTick = 0;
        this._emitTick();
    }

    public putOnLift(): void {
        for (const i of this.interactables) {
            i.putOnLift();
        }
    }

    public takeOffLift(): void {
        for (const i of this.interactables) {
            i.paint();
        }
    }

    public serializeToCompressedQueryStringFragment(): string {
        const jsonSerialized: string = JSON.stringify(this.serialize());
        const compressed: Uint8Array = pako.deflate(jsonSerialized);
        const sharableString: string = Buffer.from(compressed).toString('base64');
        return encodeURIComponent(sharableString);
    }

    public static decompressQueryStringFragment(queryString: string): unknown {
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
            this.stopRunning();
        }
        else {
            this._advanceOne();
        }
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
    // This is emitted whenever the clock is actually advanced.
    tick: 'tick',

    // A new component has been added to the model (argument is the new item)
    interactableAdded: 'interactableAdded',

    // A component has been removed from the model (argument is the removed item)
    interactableRemoved: 'interactableRemoved',
};
