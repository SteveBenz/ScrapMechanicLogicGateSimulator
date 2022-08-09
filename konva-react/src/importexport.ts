import { Input, Interactable, LogicGate, Timer } from "./Model";

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

    export interface LogicGate extends BaseElement {
        controller: LogicGateController
    }

    export interface Timer extends BaseElement {
        controller: TimerController
    }

    export interface Button extends BaseElement {
        controller: ButtonController
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
