import { Input, Interactable, LogicGate, LogicGateTypes, Timer } from "./Model";

interface LayoutInfo {
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    layoutSize: number
}

const PlasticBlockId = "628b2d61-5ceb-43e9-8334-a4135566df7a";
const LogicGateId = "9f0f56e8-2c31-4d83-996c-d00a9b296c3f";
const TimerId = "8f7fd0e7-c46e-4944-a414-7ce2437bb30f";
const ButtonId = "1e8d93a4-506b-470d-9ada-9c0a321e2db5";
const SwitchId = "7cf717d7-d167-4f2d-a6e7-6b2c70aa3986";
const Sensor1Id = "1d4793af-cb66-4628-804a-9d7404712643";
const Sensor2Id = "cf46678b-c947-4267-ba85-f66930f5faa4";
const Sensor3Id = "90fc3603-3544-4254-97ef-ea6723510961";
const Sensor4Id = "de018bc6-1db5-492c-bfec-045e63f9d64b";
const Sensor5Id = "20dcd41c-0a11-4668-9b00-97f278ce21af";

const PlasticColor = "046307";

interface PositionInfo {
    x: number,
    y: number,
    errX: number,
    errY: number,
    item: Interactable,
    itemId: number
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace GameData {
    export interface Position {
        x: number,
        y: number,
        z: number
    }

    export interface BaseElement {
        color: string,
        pos: Position;
        shapeId: "628b2d61-5ceb-43e9-8334-a4135566df7a" | "9f0f56e8-2c31-4d83-996c-d00a9b296c3f" | "8f7fd0e7-c46e-4944-a414-7ce2437bb30f" | "1e8d93a4-506b-470d-9ada-9c0a321e2db5";
        xaxis: 1 | -2 | 3,
        zaxis: -2 | 3,
    }

    export interface ControllerIdentifier {
        id: number
    }

    export interface Controller {
        controllers: Array<ControllerIdentifier> | null,
        id: number,
        joints: null,
    }

    export interface BaseElementWithController extends BaseElement {
        controller: Controller
    }

    export const AndGateMode = 0;
    export const OrGateMode = 1;
    export const XorGateMode = 2;
    export const NandGateMode = 3;
    export const NorGateMode = 4;
    export const XnorGateMode = 5;

    export interface LogicGateController extends Controller {
        active: false,
        mode: 0 | 1 | 2 | 3 | 4 | 5;
    }

    export interface TimerController extends Controller {
        active: false,
        seconds: number,
        ticks: number
    }

    export type ButtonController = Controller;

    export interface BuildingBlock extends BaseElement {
        bounds: Position, // Really a size, but whatever, same names and types.
    }

    export interface LogicGate extends BaseElementWithController {
        controller: LogicGateController
    }

    export interface Timer extends BaseElementWithController {
        controller: TimerController
    }

    export interface Button extends BaseElementWithController {
        controller: ButtonController
    }

    export type SensorController = Controller; // There's more to it, but we don't care about the rest.

    export interface Sensor extends BaseElement {
        controller: SensorController;
    }

    export interface BlueprintFile {
        bodies: {
            childs: BaseElement[]
        }[],
        version: 4
    }
}

const kindToModeMap:  { [id: string] : 0|1|2|3|4|5; } = {
    "and": 0,
    "or": 1,
    "xor": 2,
    "nand": 3,
    "nor": 4,
    "xnor": 5
}

function makePlasticRow(x: number, y: number, z: number, length: number): GameData.BuildingBlock {
    return {
        bounds: { x: length, y: 1, z: 1 },
        color: PlasticColor,
        pos: { x: x, y: -y-1, z: z }, // TODO: Why '-1'?  Maybe the axis properties are wrong?
        shapeId: PlasticBlockId,
        xaxis: 1,
        zaxis: 3
    };
}

function makeGameData(entry: PositionInfo, z: number, outputs: PositionInfo[]): GameData.BaseElement[] {
    const i = entry.item;
    const outputIds = outputs.length === 0 ? null : outputs.map(i => { return { id: i.itemId } });
    
    if (i instanceof LogicGate) {
        return [{
            color: 'DF7F01',
            controller: {
                active: false,
                controllers: outputIds,
                id: entry.itemId,
                joints: null,
                mode: kindToModeMap[i.kind]
            },
            pos: {
                x: entry.x,
                y: -entry.y,
                z: z
            },
            shapeId: LogicGateId,
            xaxis: 1,
            zaxis: -2,
        } as GameData.LogicGate];
    }
    else if (i instanceof Timer) {
        return [{
            color: 'DF7F01',
            controller: {
                active: false,
                controllers: outputIds,
                id: entry.itemId,
                joints: null,
                seconds: Math.trunc(i.scrapMechanicTickCount / 40),
                ticks: i.scrapMechanicTickCount % 40
            },
            pos: {
                x: entry.x,
                y: -entry.y,
                z: z
            },
            shapeId: TimerId,
            xaxis: 1,
            zaxis: -2,
        } as GameData.Timer];
    }
    else if (i instanceof Input) {
        return [{
            color: 'ffffff',
            controller: {
                active: false,
                controllers: outputIds,
                id: entry.itemId,
                joints: null,
                mode: GameData.OrGateMode // 'Or' to allow hooking to a variety of sources
            },
            pos: {
                x: entry.x,
                y: -entry.y,
                z: z
            },
            shapeId: LogicGateId,
            xaxis: 1,
            zaxis: -2,
        } as GameData.LogicGate,
        {
            color: 'ffffff',
            controller: {
                controllers: [ { id: entry.itemId } ],
                id: 1000+entry.itemId,
                joints: null
            },
            pos: {
                x: entry.x,
                y: -entry.y,
                z: z+1
            },
            shapeId: ButtonId,
            xaxis: 1,
            zaxis: -2
        } as GameData.Button
    ];
    }
    else {
        throw Error("Unexpected type thing");
    }
}

function getLayoutInfo(allInteractables: Array<Interactable>): LayoutInfo {
    return {
        minX: Math.min(...allInteractables.map(i => i.x)),
        minY: Math.min(...allInteractables.map(i => i.y)),
        maxX: Math.max(...allInteractables.map(i => i.x)),
        maxY: Math.max(...allInteractables.map(i => i.y)),
        layoutSize: 6
    };
}

function getPositionInfo(layoutInfo: LayoutInfo, i: Interactable, itemId: number): PositionInfo {
    const xInGrid = .5 + (i.x - layoutInfo.minX) * (layoutInfo.layoutSize-1) / (layoutInfo.maxX - layoutInfo.minX);
    const yInGrid = .5 + (i.y - layoutInfo.minY) * (layoutInfo.layoutSize-1) / (layoutInfo.maxY - layoutInfo.minY);
    return {
        x: Math.trunc(xInGrid),
        errX: xInGrid - Math.trunc(xInGrid) - .5,
        y: Math.trunc(yInGrid),
        errY: yInGrid - Math.trunc(yInGrid) - .5,
        item: i,
        itemId: itemId }
}

export function exportModel(allInteractables: Array<Interactable>): string {
    const layoutInfo = getLayoutInfo(allInteractables);
    let layout: Array<Array<Array<PositionInfo>>> = [];
    let hasOverlaps = true;
    while (hasOverlaps) {
        layoutInfo.layoutSize += Math.min(1, allInteractables.length >> 3);

        layout = [];
        for (let i = 0; i < layoutInfo.layoutSize; ++i) {
            const contents = [];
            for (let j = 0; j < layoutInfo.layoutSize; ++j) {
                contents.push([]);
            }
            layout.push(contents);
        }

        for (const i in allInteractables) {
            const li = getPositionInfo(layoutInfo, allInteractables[i], Number.parseInt(i)); // TODO: i should be an int, but...?
            layout[li.y][li.x].push(li);
        }

        // TODO: Try to unstack cases where they're piled up more than one deep.
        hasOverlaps = false;
        for (let y = 0; !hasOverlaps && y < layout.length; ++y) {
            for (let x = 0; !hasOverlaps && x < layout.length; ++x) {
                if (layout[y][x].length > 1) {
                    hasOverlaps = true;
                    if (layoutInfo.layoutSize >= 20 && allInteractables.length < 100) {
                        // Probably a case of user error.  If the map is huge, we're going to trust the user knows what they're doing.
                        // It'd be nice to actually return the offending thing, but seems like too much fancy.  You'd have to create a
                        // class that extends Error and all that jazz.
                        throw Error("Two components are too close to each other or are overlapping.  Spread them out a bit so a sensible layout can be made.");
                    }
                }
            }
        }
    }

    // Get rid of empty rows
    let y = 0;
    while (y < layout.length) {
        if (layout[y].every(a => a.length === 0)) {
            layout.splice(y, 1);
        }
        else {
            y += 1;
        }
    }

    // Get rid of empty columns
    let x = 0;
    while (x < layoutInfo.layoutSize) {
        if (layout.every(a => x < a.length && a[x].length === 0)) {
            for (const l of layout) {
                l.splice(x, 1);
            }
        }
        else {
            x += 1;
        }
    }

    const children: Array<GameData.BaseElement> = [];
    for (let y = 0; y < layout.length; ++y) {
        let lastNonEmpty = -1;
        for (let x = 0; x < layout[y].length; ++x) {
            if (layout[y][x].length !== 0) {
                if (lastNonEmpty < x - 1) {
                    children.push(makePlasticRow(lastNonEmpty+1, y, 1, x - 1 - lastNonEmpty));
                }
                lastNonEmpty = x;

                const outputs: Array<PositionInfo> = [];
                for (const a of layout) {
                    for (const b of a) {
                        for (const c of b) {
                            if (c.item.inputs.includes(layout[y][x][0].item)) {
                                outputs.push(c);
                            }
                        }
                    }
                }

                layout[y][x][0].x = x;
                layout[y][x][0].y = y;
                children.push(...makeGameData(layout[y][x][0], 1, outputs));
            }
        }
        if (lastNonEmpty < layout[y].length-1) {
            children.push(makePlasticRow(lastNonEmpty+1, y, 1, layout[y].length - 1 - lastNonEmpty));
        }
    }

    const file = {
        bodies: [
            {
                childs: children
            }
        ],
        version: 4
    } as GameData.BlueprintFile;

    return JSON.stringify(file, null, 4);
}

export function importModel(sizeX: number, sizeY: number, fileContents: unknown): Array<Interactable> {
    const blueprint = fileContents as GameData.BlueprintFile;
    // First build up a collection of the interactables we care about, mapped by the controller id.
    const idToInteractableMap: { [name: number]: Interactable } = {}
    for (const b of blueprint.bodies) {
        for (const child of b.childs) {
            if (child.shapeId === LogicGateId) {
                const kind = ['and','or','xor','nand','nor','xnor'][(child as GameData.LogicGate).controller.mode] as LogicGateTypes;
                idToInteractableMap[(child as GameData.LogicGate).controller.id]
                    = new LogicGate({ x: child.pos.x, y: child.pos.y, savedState: false, kind: kind });
            }
            else if (child.shapeId === TimerId) {
                const timerData = (child as GameData.Timer).controller;
                const tickData: boolean[] = Array(timerData.seconds*40+timerData.ticks).fill(false);
                idToInteractableMap[(child as GameData.Timer).controller.id]
                    = new Timer({ x: child.pos.x, y: child.pos.y, kind: 'timer', tickStorage: tickData });
            }
            else if ([ButtonId, SwitchId, Sensor1Id, Sensor2Id, Sensor3Id, Sensor4Id, Sensor5Id].includes(child.shapeId)) {
                idToInteractableMap[(child as GameData.BaseElementWithController).controller.id]
                    = new Input({ x: child.pos.x, y: child.pos.y, savedState: false, kind: 'input' });
            }
        }
    }

    // Now that we have the map, we can build the inputs list for all our stuff
    for (const b of blueprint.bodies) {
        for (const child of b.childs) {
            if ([LogicGateId, TimerId, ButtonId, SwitchId, Sensor1Id, Sensor2Id, Sensor3Id, Sensor4Id, Sensor5Id].includes(child.shapeId)) {
                const controller = (child as GameData.BaseElementWithController).controller;
                if (controller.controllers !== null) {
                    for (const idThing of controller.controllers) {
                        const targetId = idThing.id;
                        const source = idToInteractableMap[controller.id];
                        try
                        {
                            // targetId might be something outside of the circuit - like a motor or something.
                            idToInteractableMap[targetId].addInput(source);
                        }
                        catch {
                            // Consider adding a description that says it's an output of the circuit.
                        }
                    }
                }
            }
        }
    }

    const interactables = [...Object.values(idToInteractableMap)];

    // Simplification:
    //  If a logic gate's inputs are all inputs that don't have any other outputs,
    //  then the logic gate can be converted to an input and all the inputs can be deleted.
    for (const i of [...interactables]) {
        // It's a logic gate 
        if (i instanceof LogicGate
                // ... and all of its inputs are...
                && i.inputs.every(j =>
                    // ... 'Input' objects
                    j instanceof Input
                    // ... and none of those Inputs are consumed by anything but 'i'
                    && interactables.every(k => k === i || !k.inputs.includes(j)))) {
            
            // Delete i and all its inputs
            interactables.splice(interactables.indexOf(i), 1);
            for (const input of i.inputs) {
                interactables.splice(interactables.indexOf(input), 1);
            }

            // Replace it with an input
            const replacement = new Input({ kind: 'input', savedState: false, x: i.x, y: i.y });

            // Replace all the links to i, the logic gate we're combining into a single input, with the new guy
            for (const possibleConsumer of interactables) {
                if (possibleConsumer.inputs.includes(i)) {
                    possibleConsumer.removeInput(i);
                    possibleConsumer.addInput(replacement);
                }
            }

            interactables.push(replacement);
        }
    }

    // Delete any inputs that don't have any uses:
    for (const i of [...interactables]) {
        if (i instanceof Input && interactables.every(j => !j.inputs.includes(i))) {
            interactables.splice(interactables.indexOf(i), 1);
        }
    }


    // The x/y that we stuck into our interactables are in coordinates from the 
    const minX = Math.min(...interactables.map(i => i.x));
    const minY = Math.min(...interactables.map(i => i.y));
    const maxX = Math.max(...interactables.map(i => i.x));
    const maxY = Math.max(...interactables.map(i => i.y));
    function getSeenBeforeKey(x: number, y: number): number {
        return x + y*sizeX;
    }

    const seenBefore: number[] = [];
    for (const i of interactables) {
        let x = Math.floor((i.x - minX) * sizeX / Math.max(1, maxX - minX));
        let y = Math.floor((i.y - minY) * sizeY / Math.max(1, maxY - minY));
        while (seenBefore.includes(getSeenBeforeKey(x,y))) {
            x += 5;
            y += 5;
        }
        i.setPosition(x+50,y+50);
        seenBefore.push(getSeenBeforeKey(x,y));
    }

    return interactables;
}