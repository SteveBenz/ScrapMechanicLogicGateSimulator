import { EventEmitter } from 'events';


export interface ISerializedInteractable {
    x: number;
    y: number;
    kind: LogicGateTypes | 'input' | 'timer';
};

export interface IEventArgsInteractable {
    source: Interactable;
};

export interface IEventArgsInteractableMoved extends IEventArgsInteractable {
    x: number;
    y: number;
}

export class Interactable {
    private _x: number;
    private _y: number;
    private readonly events: EventEmitter;
    private _inputs: Array<Interactable>;

    private _prevState: boolean;
    private _currentState: boolean;

    constructor(props: ISerializedInteractable) {
        this.events = new EventEmitter();
        this._prevState = false;
        this._currentState = false;
        this._inputs = [];
        this._x = props.x;
        this._y = props.y;
    }

    static deserialize(serialized: ISerializedInteractable): Interactable {
        switch (serialized.kind) {
            case 'input':
                return new Input(serialized as ISerializedInput);
            case 'timer':
                throw "not implemented";
            default:
                return new LogicGate(serialized as ISerializedLogicGate);
        }
    }

    public getPosition(): { x: number, y: number } {
        return { x: this._x, y: this._y };
    }

    public get x() { return this._x; }
    public get y() { return this._y; }

    public setPosition(x: number, y: number) {
        this._x = x;
        this._y = y;
        this._emitMoved(x, y);
    }

    public get currentState(): boolean { return this._currentState; }

    protected setCurrentState(newValue: boolean): void {
        this._currentState = newValue;
        this._emitStateChanged();
    }

    public get prevState(): boolean { return this._prevState; }
    protected setPrevState(newValue: boolean): void {
        this._prevState = newValue;
        this._emitStateChanged();
    }

    public export(): ISerializedInteractable {
        return {
            x: this._x,
            y: this._y,
            kind: 'input'
        }
    }

    addInput(newInput: Interactable): boolean {
        // TODO: Discriminate this better.
        this._inputs.push(newInput);
        this.calculate();
        return true;
    }

    get inputs(): Array<Interactable> {
        return [...this._inputs];
    }

    setInputs(inputs: Array<Interactable>) {
        this._inputs = [...inputs];
    }

    twiddle(direction: -1 | 1) {}

    /** Causes the calculated state to become the state that other interactables will see. */
    public apply() {
        this._prevState = this.currentState;
    }

    /** Sets currentState based on the previous state of its inputs. */
    public calculate() {}

    public onMoved(handler: (eventArgs: IEventArgsInteractableMoved) => void) {
        this.events.on('moved', handler);
    }

    public onStateChanged(handler: (eventArgs: IEventArgsInteractable) => void) {
        this.events.on('stateChanged', handler);
    }

    protected _emitMoved(x: number, y: number): void {
        this.events.emit('moved', <IEventArgsInteractableMoved>{ source: this, x, y } );
    }

    protected _emitStateChanged(): void {
        this.events.emit('stateChanged', <IEventArgsInteractable>{ source: this } );
    }
}

export interface ISerializedInteractableWithSingleBitSavedState extends ISerializedInteractable {
    savedState: boolean;
};


export class InteractableWithSingleBitSavedState extends Interactable {
    private _savedState: boolean;

    constructor(props: ISerializedInteractableWithSingleBitSavedState) {
        super(props);

        this._savedState = props.savedState;
    }
}

type LogicGateTypes = 'and' | 'or' | 'xor' | 'nand' | 'nor' | 'xnor';

const LogicGateKindSequence: Array<LogicGateTypes> = ['and', 'or', 'xor', 'nand', 'nor', 'xnor'];

export interface ISerializedLogicGate extends ISerializedInteractableWithSingleBitSavedState {
}

export class LogicGate extends InteractableWithSingleBitSavedState {
    private _kind: LogicGateTypes;

    constructor(props: ISerializedLogicGate) {
        super(props);
        if (props.kind === 'timer' || props.kind === 'input') {
            throw "Caller should prevent this";
        }

        this._kind = props.kind;
    }

    get kind(): LogicGateTypes {
        return this._kind;
    }

    set kind(newValue: LogicGateTypes) {
        this._kind = newValue;
        this._emitStateChanged();
    }

    preTick() {

    }

    tick() {

    }

    twiddle(direction: -1 | 1) {
        let index = LogicGateKindSequence.indexOf(this._kind);
        index = index + direction;
        if (index < 0) {
            index += LogicGateKindSequence.length;
        }
        else if (index >= LogicGateKindSequence.length) {
            index -= LogicGateKindSequence.length;
        }

        this.kind = LogicGateKindSequence[index];
        this.calculate();
    }

    public calculate() {
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

    export() {
        return {
            ...super.export(),
            kind: this._kind
        };
    }
}

interface ISerializedInput extends ISerializedInteractableWithSingleBitSavedState {
};

export class Input extends InteractableWithSingleBitSavedState {
    constructor(props: ISerializedInput) {
        super(props);
    }

    twiddle(direction: -1 | 1) {
        this.setCurrentState(!this.currentState);
    }
}

interface ISerializedTimer extends ISerializedInteractable {
    tickStorage: Array<boolean>
};

export class Timer extends Interactable {
    private readonly _tickStorage: Array<boolean>;

    public constructor(props: ISerializedTimer) {
        super(props);
        this._tickStorage = [ ... props.tickStorage ];
    }

    public get tickStorage(): Array<boolean> {
        return [... this._tickStorage];
    }

    public export(): ISerializedTimer {
        return {
            ...super.export(),
            kind: 'timer',
            tickStorage: this._tickStorage,
        };
    }

    public calculate(): void {
        this.setCurrentState(this._tickStorage[this._tickStorage.length-1]);
        this._tickStorage[0] = this.inputs.length > 0 && this.inputs[0].prevState;
    }

    public apply(): void {
        this.setPrevState(this.currentState);
        // Advance everything in the array
        for (let i = 0; i < this._tickStorage.length-1; ++i) {
            this._tickStorage[this._tickStorage.length-1-i] = this._tickStorage[this._tickStorage.length-2-i];
        }
        this.setCurrentState(this._tickStorage[this._tickStorage.length]);
        // tickStorage[0] will be set by calculate - it's not possible to set it here because
        // it has to come from its input, which hasn't finished its apply cycle yet.
    }
}

