import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/ban-types
export function hasOwnProperty<X extends {}, Y extends PropertyKey>
  (obj: X, prop: Y): obj is X & Record<Y, unknown> {
    // source: https://fettblog.eu/typescript-hasownproperty/
    //
    // Seems okay except for having to use the eslint rule on it.
    return obj.hasOwnProperty(prop)
}


export interface ISerializedInteractable {
    x: number;
    y: number;
    kind: LogicGateTypes | 'input' | 'timer';
    inputs: Array<number>;
    description?: string | undefined;
}

export interface IEventArgsInteractable {
    source: Interactable;
}

export interface IEventArgsInteractableMoved extends IEventArgsInteractable {
    x: number;
    y: number;
}

function deserializeInteractable(serialized: Record<string,unknown>, kind: LogicGateTypes | 'input' | 'timer'): ISerializedInteractable {
    if (!hasOwnProperty(serialized, 'x') || typeof(serialized.x) !== 'number') {
        throw new Error("Missing 'x' property or 'x' is not a number");
    }

    if (!hasOwnProperty(serialized, 'y') || typeof(serialized.y) !== 'number') {
        throw new Error("Missing 'x' property or 'x' is not a number");
    }

    if (!hasOwnProperty(serialized, 'y') || typeof(serialized.y) !== 'number') {
        throw new Error("Missing 'x' property or 'x' is not a number");
    }

    const description = (hasOwnProperty(serialized, 'description') && typeof(serialized.description) === 'string') ? serialized.description : undefined;

    return {
        kind: kind,
        x: serialized.x,
        y: serialized.y,
        description: description,
        inputs: []
    }
}

export class Interactable {
    private _x: number;
    private _y: number;
    private readonly _events: EventEmitter;
    private _inputs: Array<Interactable>;
    private _description: string | undefined;

    private _prevState: boolean;
    private _currentState: boolean;

    public readonly id: number;

    static idCounter = 0;

    constructor(props: Omit<ISerializedInteractable, 'inputs'>) {
        this._events = new EventEmitter();
        this._prevState = false;
        this._currentState = false;
        this._inputs = [];
        this._x = props.x;
        this._y = props.y;
        this._description = props.description;

        this.id = ++Interactable.idCounter;
    }

    public static validateAndDeserialize(serialized: unknown): Interactable {
        if (typeof(serialized) !== 'object' || serialized === null) {
            throw new Error("Bad format - expected an array of objects at the top level");
        }

        if (!hasOwnProperty(serialized, 'kind')) {
            throw new Error("Interactable is missing an 'inputs' array");
        }

        switch (serialized.kind) {
            case 'input':
            case 'input-on':
            case 'input-off':
                return new Input(validateAndNormalizeInput(serialized, serialized.kind));
            case 'timer':
            case 'timer10':
                return new Timer(validateAndNormalizeTimer(serialized));
            case 'and':
            case 'or':
            case 'xor':
            case 'nand':
            case 'nor':
            case 'xnor':
                return new LogicGate(deserializeLogicGate(serialized, serialized.kind));
            default:
                throw new Error("Interactable has unknown 'kind': " + serialized.kind);
        }
    }

    public getPosition(): { x: number, y: number } {
        return { x: this._x, y: this._y };
    }

    public get x(): number { return this._x; }
    public get y(): number { return this._y; }

    public get description(): string | undefined { return this._description; }
    public set description(text: string | undefined) { this._description = text; }

    public get generatedDescription(): string | undefined { return undefined; }

    public setPosition(x: number, y: number): void {
        this._x = x;
        this._y = y;
        this._emitMoved(x, y);
    }

    public get currentState(): boolean { return this._currentState; }

    protected setCurrentState(newValue: boolean): void {
        if (this._currentState !== newValue) {
            this._currentState = newValue;
            this._emitStateChanged();
        }
    }

    public get prevState(): boolean { return this._prevState; }
    protected setPrevState(newValue: boolean): void {
        if (this._prevState !== newValue) {
            this._prevState = newValue;
            this._emitStateChanged();
        }
    }

    public export(): ISerializedInteractable {
        return {
            x: this._x,
            y: this._y,
            kind: 'input', // base classes will overwrite this.
            description: this._description,
            inputs: []
        }
    }

    addInput(newInput: Interactable): boolean {
        if (this.inputLimit === 0) {
            // Can't draw a connection *to* an input.
            return false;
        }

        const existingIndex: number = this.inputs.indexOf(newInput);
        if (existingIndex >= 0) {
            // if the connection is already there - undo it
            this._inputs.splice(existingIndex, 1);
        } else {
            // If the connection already goes the other way, reverse it (this part just deletes the old arrow)
            const indexInTarget: number = newInput.inputs.indexOf(this);
            if (indexInTarget >= 0) {
                newInput._inputs.splice(indexInTarget, 1);
                newInput.calculate();
            }

            // If we allow only one input and we already have an input, toss it.
            if (this.inputLimit === 1) {
                this._inputs = [];
            }

            // Add the new link
            this._inputs.push(newInput);
        }

        this.calculate();
        this.paint();
        newInput.paint();
        return true;
    }

    removeInput(deadInput: Interactable): boolean {
        const index: number = this.inputs.indexOf(deadInput);
        if (index < 0) {
            return false;
        } else {
            this._inputs.splice(index, 1);
            this.calculate();
            this.paint();
            return true;
        }
    }

    get inputs(): Array<Interactable> {
        return [...this._inputs];
    }

    setInputs(inputs: Array<Interactable>): void {
        this._inputs = [...inputs];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggle(): void {
        // No action by default
    }

    /** Causes the calculated state to become the state that other interactables will see. */
    public apply(): void {
        this.setPrevState(this.currentState);
    }

    /** Sets currentState based on the previous state of its inputs. */
    public calculate(): void {/* no action */}

    public reload(): void {/* no action */}

    public putOnLift(): void {/* no action */}

    public paint(): void {/* no action */}

    public onMoved(handler: (eventArgs: IEventArgsInteractableMoved) => void): void {
        this._events.on('moved', handler);
    }

    public offMoved(handler: (eventArgs: IEventArgsInteractableMoved) => void): void {
        this._events.off('moved', handler);
    }

    public onStateChanged(handler: (eventArgs: IEventArgsInteractable) => void): void {
        this._events.on('stateChanged', handler);
    }

    public offStateChanged(handler: (eventArgs: IEventArgsInteractable) => void): void {
        this._events.off('stateChanged', handler);
    }

    protected get inputLimit(): 1 | 0 | 'unlimited' {
        return 'unlimited';
    }

    protected _emitMoved(x: number, y: number): void {
        this._events.emit('moved', { source: this, x, y } as IEventArgsInteractableMoved);
    }

    protected _emitStateChanged(): void {
        this._events.emit('stateChanged', { source: this } as IEventArgsInteractable);
    }
}

export interface ISerializedInteractableWithSingleBitSavedState extends ISerializedInteractable {
    savedState: boolean;
}

function validateAndDeserializeInteractableWithSavedState(serialized: Record<string,unknown>, kind: LogicGateTypes | 'input', defaultSavedState: boolean): ISerializedInteractableWithSingleBitSavedState {
    let savedState: boolean = defaultSavedState;

    if (hasOwnProperty(serialized, 'savedState')) {
        if (typeof(serialized.savedState) !== 'boolean') {
            throw new Error("Interactables of kind '" + kind + "' should have a 'savedState' property of type boolean");
        }
        savedState = serialized.savedState;
    }

    return {
        ...deserializeInteractable(serialized, kind),
        savedState: savedState
    };
}


export class InteractableWithSingleBitSavedState extends Interactable {
    private _savedState: boolean;

    constructor(props: Omit<ISerializedInteractableWithSingleBitSavedState, 'inputs'>) {
        super(props);

        this._savedState = props.savedState;
    }

    public export(): ISerializedInteractableWithSingleBitSavedState {
        return {
            ...super.export(),
            savedState: this._savedState
        };
    }

    public get savedState(): boolean {
        return this._savedState;
    }

    public paint(): void {
        if (this._savedState !== this.currentState) {
            this._savedState = this.currentState;
            super._emitStateChanged();
        }
    }

    public reload(): void {
        this.setCurrentState(this.savedState);
        this.setPrevState(false);
    }
}

export type LogicGateTypes = 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor';

export type ISerializedLogicGate = ISerializedInteractableWithSingleBitSavedState

function deserializeLogicGate(serialized: Record<string,unknown>, kind: LogicGateTypes): ISerializedLogicGate {
    return validateAndDeserializeInteractableWithSavedState(serialized, kind, false);
}

export class LogicGate extends InteractableWithSingleBitSavedState {
    private _kind: LogicGateTypes;

    constructor(props: Omit<ISerializedLogicGate, 'inputs'>) {
        super(props);
        if (props.kind === 'timer' || props.kind === 'input') {
            throw new Error("Caller should prevent this");
        }

        this._kind = props.kind;
    }

    public get kind(): LogicGateTypes {
        return this._kind;
    }

    public set kind(newValue: LogicGateTypes) {
        this._kind = newValue;
        this._emitStateChanged();
        this.paint();
    }

    public calculate(): void {
        // This becomes the sum of all the inputs where the previous state is true
        const numActivatedInputs = this.inputs.reduce((a, b) => a + (b.prevState ? 1 : 0), 0);
        let calculatedState: boolean;
        switch(this.kind) {
            case 'and':
                calculatedState = this.inputs.length > 0 && numActivatedInputs === this.inputs.length;
                break;
            case 'or':
                calculatedState = this.inputs.length > 0 && numActivatedInputs > 0;
                break;
            case 'xor':
                calculatedState = numActivatedInputs % 2 === 1;
                break;
            case 'nand':
                calculatedState = this.inputs.length > 0 && numActivatedInputs !== this.inputs.length;
                break;
            case 'nor':
                calculatedState = this.inputs.length > 0 && numActivatedInputs === 0;
                break;
            case 'xnor':
                calculatedState = this.inputs.length > 0 && numActivatedInputs % 2 === 0;
                break;
        }
        this.setCurrentState(calculatedState);
    }

    public putOnLift(): void {
        this.setCurrentState(this.inputs.length > 0 && (this.kind === 'nand' || this.kind === 'nor' || this.kind === 'xnor'));
        this.setPrevState(false);
        this.paint();
    }

    protected get inputLimit(): 1 | 0 | 'unlimited' {
        return 'unlimited';
    }

    export(): ISerializedLogicGate {
        return {
            ...super.export(),
            kind: this._kind
        };
    }
}

export type ISerializedInput = ISerializedInteractableWithSingleBitSavedState;

function validateAndNormalizeInput(serialized: Record<string,unknown>, kind: 'input' | 'input-on' | 'input-off'): ISerializedLogicGate {
    return validateAndDeserializeInteractableWithSavedState(serialized, 'input', kind === 'input-on');
}

export class Input extends InteractableWithSingleBitSavedState {
    _savedToggles: number[] | undefined = undefined;
    _tickCount = 0;

    public constructor(props: Omit<ISerializedInteractableWithSingleBitSavedState, 'inputs'>) {
        // Note that we intentionally don't serialize _savedToggles, as it's a debugging aid, not really
        // a part of the model.
        super(props);
    }

    public get isRecording(): boolean {
        return this._savedToggles !== undefined;
    }

    public set isRecording(isRecording: boolean) {
        this._savedToggles = (this._savedToggles === undefined) ? [] : undefined;
    }

    public get generatedDescription(): string | undefined {
        if (this._savedToggles === undefined || this._savedToggles.length === 0) {
            return undefined;
        }

        let text = 'on at tick ' + this._savedToggles[0];
        let toggle = 'off'
        for (let i = 1; i < this._savedToggles.length; ++i) {
            text += '; ' + toggle + ' at ' + this._savedToggles[i];
            toggle = toggle === 'off' ? 'on' : 'off';
        }
        return text;
    }

    toggle(): void {
        this.setCurrentState(!this.currentState);
        if (this._savedToggles !== undefined) {
            while (this._savedToggles.length > 0 && this._savedToggles[this._savedToggles.length-1] > this._tickCount) {
                this._savedToggles.splice(this._savedToggles.length-1, 1);
            }

            if (this._savedToggles.length > 0 && this._savedToggles[this._savedToggles.length-1] === this._tickCount) {
                this._savedToggles.splice(this._savedToggles.length-1, 1);
            }
            else {
                this._savedToggles.push(this._tickCount);
            }
        }
    }

    protected get inputLimit(): 1 | 0 | 'unlimited' {
        return 0;
    }

    public putOnLift(): void {
        this.setCurrentState(false);
        this.setPrevState(false);
        this.paint();
    }

    public apply(): void {
        super.apply();
        this._tickCount += 1;
    }

    public calculate(): void {
        if (this._savedToggles !== undefined && this._savedToggles.indexOf(this._tickCount) >= 0) {
            this.setCurrentState(!this.currentState);
        }
    }

    public reload(): void {
        this._tickCount = 0;
        super.reload();
        if (this._savedToggles !== undefined && this._savedToggles.length > 0 && this._savedToggles[0] === 0) {
            this.setCurrentState(!this.currentState);
        }
    }
}

export interface ISerializedTimer extends ISerializedInteractable {
    tickStorage: Array<boolean>;
}

function validateAndNormalizeTimer(serialized: Record<string,unknown>): ISerializedTimer {
    let rawTickStorage: unknown;
    if (hasOwnProperty(serialized, 'tickStorage')) {
        rawTickStorage = serialized.tickStorage;
    }

    if (hasOwnProperty(serialized, 'timerTickStorage')) {
        rawTickStorage = serialized.timerTickStorage;
    }

    if (rawTickStorage === undefined || !Array.isArray(rawTickStorage) || !rawTickStorage.every(i => typeof(i) === 'boolean')) {
        throw new Error("Timer interactables should have a boolean array named 'tickStorage'");
    }

    return {
        ...deserializeInteractable(serialized, 'timer'),
        tickStorage: rawTickStorage
    };
}

export class Timer extends Interactable {
    private readonly _tickStorage: Array<boolean>;

    public constructor(serialized: Omit<ISerializedTimer, 'inputs'>) {
        super(serialized);
        this._tickStorage = [ ...serialized.tickStorage ];
    }

    public get generatedDescription(): string | undefined {
        return this._tickStorage.length-1 + '-tick timer (' + this._tickStorage.length + ' ticks of actual saved state)';
    }

    public changeSize(delta: number): void {
        if (delta < 0) {
            const actualDeletes = Math.min(-delta, this._tickStorage.length-1);
            if (actualDeletes > 0) {
                this._tickStorage.splice(this._tickStorage.length-actualDeletes, actualDeletes);
            }
        }
        else {
            let actualAdds = Math.min(delta, 30 - this._tickStorage.length);
            while (actualAdds > 0) {
                this._tickStorage.push(false);
                actualAdds -= 1
            }
        }
        this._emitStateChanged()
    }

    public get tickStorage(): Array<boolean> {
        return [...this._tickStorage];
    }

    /** Gets the duration of the timer in Scrap Mechanic's parlance - which is 1 minus the actual delay. **/
    public get scrapMechanicTickCount(): number {
        return this._tickStorage.length-1;
    }

    public export(): ISerializedTimer {
        return {
            ...super.export(),
            kind: 'timer',
            tickStorage: this._tickStorage,
        };
    }

    public calculate(): void {
        // Advance everything in the array
        for (let i = 0; i < this._tickStorage.length-1; ++i) {
            this._tickStorage[this._tickStorage.length-1-i] = this._tickStorage[this._tickStorage.length-2-i];
        }
        this._tickStorage[0] = this.inputs.length > 0 && this.inputs[0].prevState;
        this.setCurrentState(this._tickStorage[this._tickStorage.length-1]);

        // Might be nice to compare the old array with the new one and only do this if it actually changed.
        this._emitStateChanged();
    }

    public putOnLift(): void {
        for (let i = 0; i < this._tickStorage.length; ++i) {
            this._tickStorage[i] = false;
        }
        this.setCurrentState(false);
        this.setPrevState(false);
        this._emitStateChanged();
    }

    protected get inputLimit(): 1 | 0 | 'unlimited' {
        return 1;
    }
}

