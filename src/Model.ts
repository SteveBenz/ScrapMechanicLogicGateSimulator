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

    private prevState: boolean;
    private _currentState: boolean;

    constructor(props: ISerializedInteractable) {
        this.events = new EventEmitter();
        this.prevState = false;
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
        return true;
    }

    get inputs(): Array<Interactable> {
        return [...this._inputs];
    }

    setInputs(inputs: Array<Interactable>) {
        this._inputs = [...inputs];
    }

    twiddle(direction: -1 | 1) {}

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