# Gotta do this first:
#  python3 -m pip install -U pygame --user

# import the pygame module, so you can use it
import pygame.display as display
import pygame.font as font
import pygame.draw as draw
import pygame.image as image
import pygame.transform as transform
import pygame.constants as constants
import pygame.color as color
import pygame.key as key
import pygame.mouse as mouse
import pygame as pygame
import math
import time
import json
import sys
from enum import Enum
from typing import TypeVar, Iterable, Tuple

BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
LIGHTBLUE = (128, 128, 255)
GRAY = (200, 200, 200)
DARKGRAY = (100, 100, 100)
YELLOW = (255,255,0)

class Assets:
    arrow = image.load("assets/arrow.png")

def static_init(cls):
    if getattr(cls, "static_init", None):
        cls.static_init()
    return cls

class Interactable:
    hotkeyToTypeMap: dict = {}
    kindToTypeMap: dict = {}

    def __init__(self, kind: str, pos: Tuple[float,float]):
        self.kind = kind
        self.currentState = False
        self.prevState = False
        self.inputs = []
        self.selected = False
        self.rect = pygame.Rect(0,0,64,64) # All the images are 64x64
        self.rect.move_ip((pos[0] - self.rect.width/2, pos[1] - self.rect.height/2)) # now it's the rect moved to the spot we want it
        self.maxInputCount = -1

    def toDictionary(self):
        return {
            'kind': self.kind,
            'x': self.rect.centerx,
            'y': self.rect.centery
        }

    def draw(self, screen: pygame.Surface):
        draw.rect(screen, GRAY if self.currentState else DARKGRAY, self.rect)
        if (self.selected):
            draw.rect(screen, GREEN, self.rect, 4)
        else:
            draw.rect(screen, BLUE, self.rect, 4)
        screen.blit(self.get_image(), self.rect.topleft)

    def get_image(self) -> pygame.Surface: pass

    # returns true if pos is inside the drawn area of this thing
    def containsPosition(self, pos):
        return self.rect.collidepoint(pos)

    def move(self, pos):
        self.rect.move_ip(pos[0], pos[1])

    def apply(self):
        self.prevState = self.currentState
    
    def swapGate(self, dir: int): pass
    def alternate(self): pass

    @staticmethod
    def buildFromDictionary(serialized: dict): pass

@static_init
class LogicGate(Interactable):
    gates = ["and", "or", "xor", "nand", "nor", "xnor"]
    images = {}

    # i = #inputs, a = #activatedInputs => bool
    functions = {
        "and": lambda i, a: i > 0 and i == a,
        "or": lambda i, a: a > 0,
        "xor": lambda i, a: a % 2 == 1,
        "nand": lambda i, a: i > 0 and i != a,
        "nor": lambda i, a: i > 0 and a == 0,
        "xnor": lambda i, a: i > 0 and a % 2 == 0
    }

    @classmethod
    def static_init(cls):
        for gate in cls.gates:
            Interactable.kindToTypeMap[gate] = cls
            cls.images[gate] = image.load("assets/" + gate + "-black.png")
        Interactable.hotkeyToTypeMap[constants.K_g] = lambda pos: LogicGate('and', pos)
        Interactable.hotkeyToTypeMap[constants.K_l] = lambda pos: LogicGate('and', pos)        

    #override
    def get_image(self) -> pygame.Surface:
        return LogicGate.images[self.kind]

    def __init__(self, kind: str, pos: Tuple[float,float]):
        super().__init__(kind, pos)
        self.maxInputCount = -1

    def calculate(self):
        activatedInputs = 0
        for input in self.inputs:
            if input.prevState:
                activatedInputs += 1
        self.currentState = LogicGate.functions[self.kind](len(self.inputs), activatedInputs)

    def reset(self, isFullReset: bool):
        self.currentState = False
        self.prevState = False
    
    #override
    def swapGate(self, dir: int):
        i = LogicGate.gates.index(self.kind)
        self.kind = LogicGate.gates[((i + dir) % 3) + (i - (i % 3))]
    
    #override
    def alternate(self):
        i = LogicGate.gates.index(self.kind)
        self.kind = LogicGate.gates[(i + 3) % 6]

@static_init
class Input(Interactable):
    image = None

    def __init__(self, kind: str, pos: Tuple[float,float]):
        super().__init__(kind, pos)
        self.maxInputCount = 0

    @classmethod
    def static_init(cls):
        Interactable.hotkeyToTypeMap[constants.K_i] = lambda pos: Input('input-off', pos)
        Interactable.kindToTypeMap['input-on'] = cls
        Interactable.kindToTypeMap['input-off'] = cls
        cls.image = pygame.Surface((64,64), constants.SRCALPHA, depth=32)
        draw.circle(cls.image, BLACK, (32,32), 24, 8)

    #override
    def get_image(self) -> pygame.Surface:
        return Input.image

    def calculate(self):
        self.currentState = (self.kind == "input-on")

    def reset(self, isFullReset: bool):
        self.currentState = (self.kind == "input-on")
        self.prevState = False

    #override
    def alternate(self):
        self.kind = "input-on" if self.kind == "input-off" else "input-off"

@static_init
class Timer(Interactable):
    def __init__(self, kind: str, pos: Tuple[float,float]):
        super().__init__(kind, pos)
        self.timerTickStorage = [False]*10
        self.maxInputCount = 1

    @classmethod
    def static_init(cls):
        Interactable.kindToTypeMap['timer10'] = cls
        Interactable.hotkeyToTypeMap[constants.K_t] = lambda pos: Timer('timer10', pos)

    #override
    def get_image(self):
        image = pygame.Surface((64,64), constants.SRCALPHA, depth=32)

        timerbox = pygame.Rect(6, 7, 64-12, 64-11)
        draw.rect(image, BLACK, timerbox, 2)
        for i in range(10):
            y = timerbox.bottom - 4 - i*5
            x_left = timerbox.left + 7
            x_right = timerbox.right - 7
            if self.timerTickStorage[i]:
                draw.line(image, LIGHTBLUE, (x_left, y), (x_right, y), 4)
        return image

    def calculate(self):
        self.currentState = self.timerTickStorage[9]
        self.timerTickStorage[0] = len(self.inputs) > 0 and self.inputs[0].prevState

    def reset(self, isFullReset: bool):
        if isFullReset:
            self.timerTickStorage = [False]*10
        self.prevState = False

    #override
    def apply(self):
        self.prevState = self.currentState
        for i in range(9):
            self.timerTickStorage[9-i] = self.timerTickStorage[8-i]
        self.currentState = self.timerTickStorage[9]

def drawLineWithArrows(screen: pygame.Surface, pos1: Tuple[float,float], pos2: Tuple[float,float], color: draw):
    draw.line(screen, color, pos1, pos2, 3)
    deltax = pos2[0] - pos1[0]
    deltay = pos2[1] - pos1[1]
    if (deltax == 0 and deltay > 0):
        angle = math.pi / 2
    elif (deltax == 0 and deltay < 0):
        angle = math.pi * 1.5
    else:
        angle = math.atan(deltay/deltax)

    angle = angle*180/math.pi # convert from radians to degrees
    angle = -angle # but we really want to rotate clockwise
    if deltax < 0:
        angle = angle + 180
    angle -= 180 # stupid image is already rotated 180 degrees
    
    arrow = Assets.arrow
    arrow = transform.rotate(arrow, angle)
    arrowRect = arrow.get_rect()
    arrow = transform.scale(arrow, (int(arrowRect.width * .03), int(arrowRect.height * .03)))
    arrowRect = arrow.get_rect()
    arrowRect.move_ip((pos2[0] + pos1[0] - arrowRect.width)/2, (pos2[1] + pos1[1] - arrowRect.height)/2)
    screen.blit(arrow, arrowRect)

def interactableFromDictionary(serialized: dict):
    interactableType = Interactable.kindToTypeMap[serialized['kind']]
    return interactableType(serialized['kind'], (serialized['x'], serialized['y']))

def findItem(interactables, pos):
    for i in interactables:
        if i.containsPosition(pos):
            return i
    return None

def singleStep(interactables: Iterable[Interactable]):
    for i in interactables:
        i.apply()
    for i in interactables:
        i.calculate()

def reset(interactables: Iterable[Interactable], isFullReset: bool):
    for i in interactables:
        i.reset(isFullReset)
    for i in interactables:
        if i.kind != "timer10":
            i.calculate()
    
def serialize(interactables: Iterable[Interactable]) -> str:
    dicts = []
    for i in interactables:
        serialized = i.toDictionary()
        inputIndices = []
        for x in i.inputs:
            inputIndices.append(interactables.index(x))
        serialized['inputs'] = inputIndices
        dicts.append(serialized)
    return json.dumps(dicts, indent=4)

def deserialize(jsonContent: str):
    listOfDicts = json.loads(jsonContent)
    iterables = []
    for i in listOfDicts:
        iterables.append(interactableFromDictionary(i))
    iterableIndex = 0
    for i in listOfDicts:
        inputIndices = i['inputs']
        for index in inputIndices:
            iterables[iterableIndex].inputs.append(iterables[index])
        iterableIndex += 1
    for i in iterables:
        i.calculate()
    return iterables

# define a main function
def main():

    # initialize the pygame module
    pygame.init()

    # load and set the logo
    logo = pygame.image.load(sys.path[0] + "/logo32x32.png")
    pygame.display.set_icon(logo)

    sysfont = font.SysFont(None, 24)

    screen = pygame.display.set_mode((700,700), constants.RESIZABLE)

    interactables = []
    filename = sys.argv[1] if len(sys.argv) > 1 else 'smlogicsim.json'
    try:
        jsonContent = ""
        with open(filename, 'r') as file:
            jsonContent = file.read()
        interactables = deserialize(jsonContent)
    except IOError:
        None

    pygame.display.set_caption("Scrap Mechanic Logic Gate Simulator - " + filename)

    # define a variable to control the main loop
    closing = False
    running = False

    
    selected = None
    isMoving = False
    isLinking = False
    posAtStart = (0,0)
    tick = 0
    lastTickTime = time.time()
     
    # main loop
    while not closing:
        # event handling, gets all event from the event queue
        for event in pygame.event.get():
            if event.type == constants.MOUSEBUTTONDOWN:
                if event.button == 1:
                    selectedNow = findItem(interactables, event.pos)
                    if selected is not None: selected.selected = False
                    if selectedNow is None:
                        selected = None
                    else:
                        selectedNow.selected = True
                        selected = selectedNow
                        posAtStart = event.pos
            elif event.type == constants.MOUSEBUTTONUP:
                if isLinking:
                    target = findItem(interactables, event.pos)
                    if target is not None and target is not selected and target.maxInputCount != 0:
                        if selected in target.inputs:
                            # the connection is already there - undo it
                            target.inputs.remove(selected)
                        else:
                            # If the connection already goes the other way, reverse it.
                            if target in selected.inputs:
                                selected.inputs.remove(target)
                            if target.maxInputCount == 1:
                                target.inputs.clear()
                            target.inputs.append(selected)
                        target.calculate()
                isLinking = False
                isMoving = False
            elif event.type == constants.MOUSEMOTION:
                if event.buttons[0] == 1:
                    # the >5 thing is to prevent random jiggles while clicking from instigating moves.
                    if selected is not None \
                    and not isMoving \
                    and not isLinking \
                    and (abs(event.pos[0] - posAtStart[0]) > 5 or abs(event.pos[1] - posAtStart[1]) > 5):
                        keyboardModifiers = key.get_mods()
                        isMoving = keyboardModifiers in (constants.KMOD_SHIFT, constants.KMOD_LSHIFT, constants.KMOD_RSHIFT)
                        isLinking = keyboardModifiers == 0
                    if isMoving:
                        selected.move(event.rel)
            elif event.type == constants.KEYDOWN:
                if event.key == constants.K_DELETE and selected is not None:
                    interactables.remove(selected)
                    for i in interactables:
                        if selected in i.inputs:
                            i.inputs.remove(selected)
                            i.calculate()
                    selected = None
                elif event.key == constants.K_LEFT and selected is not None:
                    selected.swapGate(-1)
                    selected.calculate()
                elif event.key == constants.K_RIGHT and selected is not None:
                    selected.swapGate(1)
                    selected.calculate()
                elif event.key == constants.K_UP and selected is not None:
                    selected.alternate()
                    selected.calculate()
                elif event.key == constants.K_DOWN and selected is not None:
                    selected.alternate()
                    selected.calculate()
                elif event.key == constants.K_F10 and not running:
                    singleStep(interactables)
                    tick += 1
                elif event.key == constants.K_F4:
                    tick = 0
                    running = False
                    reset(interactables, event.mod in (constants.KMOD_SHIFT, constants.KMOD_LSHIFT, constants.KMOD_RSHIFT))
                elif event.key == constants.K_F5:
                    running = True
                elif event.key == constants.K_F6:
                    running = False
                elif event.key == constants.K_s:
                    with open(filename, 'w') as file:
                        file.write(serialize(interactables))
                elif event.key in Interactable.hotkeyToTypeMap.keys():
                    if selected is not None: selected.selected = False
                    selected = Interactable.hotkeyToTypeMap[event.key](mouse.get_pos())
                    selected.selected = True
                    interactables.append(selected)

            elif event.type == constants.QUIT:
                closing = True

        if running:
            timenow = time.time()
            if (timenow - lastTickTime > .25):
                singleStep(interactables)
                tick += 1
                lastTickTime = timenow

        screen.fill(BLACK)

        tickImage = sysfont.render(str(tick), True, RED)
        tickRect = tickImage.get_rect()
        screenRect = screen.get_rect()
        tickRect.move_ip(screenRect.width - 10 - tickRect.width, 10)
        screen.blit(tickImage, tickRect)

        for box in interactables:
            for input in box.inputs:
                drawLineWithArrows(screen, input.rect.center, box.rect.center, LIGHTBLUE if input.prevState else BLUE)

        for box in interactables:
            box.draw(screen)

        if isLinking:
            mousePos = mouse.get_pos()
            target = findItem(interactables, mousePos)
            if target is None:
                draw.line(screen, GRAY, selected.rect.center, mouse.get_pos(), 1)
            else:
                draw.line(screen, GREEN, selected.rect.center, target.rect.center, 1)

        display.flip()
        # display.update()

    # Always just save on exit     
    with open(filename, 'w') as file:
        file.write(serialize(interactables))

# run the main function only if this module is executed as the main script
# (if you import this as a module then nothing is executed)
if __name__=="__main__":
    # call the main function
    main()