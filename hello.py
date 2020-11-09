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
import pygame as pygame
import math
import time
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

class InteractableKind:
    And = "and"
    Or = "or"
    Xor = "xor"
    Nand = "nand"
    Nor = "nor"
    XNor = "xnor"
    InputOn = "input-on"
    InputOff = "input-off"

    nexts = {
        And: Or,
        Or: Xor,
        Xor: And,
        Nand: Nor,
        Nor: XNor,
        XNor: Nand,
        InputOn: InputOff,
        InputOff: InputOn
    }
    prevs = {
        And: Xor,
        Or: And,
        Xor: Or,
        Nand: XNor,
        Nor: Nand,
        XNor: Nor,
        InputOn: InputOff,
        InputOff: InputOn
    }
    nots = {
        And: Nand,
        Or: Nor,
        Xor: XNor,
        Nand: And,
        Nor: Or,
        XNor: Xor,
        InputOn: InputOff,
        InputOff: InputOn,
    }

class Assets:
    def __init__(self):
        self.and_ = image.load("assets/and-black.png")
        self.or_ = image.load("assets/or-black.png")
        self.xor = image.load("assets/xor-black.png")
        self.nand = image.load("assets/nand-black.png")
        self.nor = image.load("assets/nor-black.png")
        self.xnor = image.load("assets/xnor-black.png")
        self.arrow = image.load("assets/arrow.png")

        # Gray background with a black button
        self.input_off = pygame.Surface((64,64))
        draw.rect(self.input_off, GRAY, (0,0,64,64))
        draw.circle(self.input_off, BLACK, (32,32), 24, 4)

        # Gray background with a yellow button
        self.input_on = pygame.Surface((64,64))
        draw.rect(self.input_on, pygame.color.THECOLORS['gray'], (0,0,64,64))
        draw.circle(self.input_on, BLACK, (32,32), 24, 4)
        draw.circle(self.input_on, YELLOW, (32,32), 22)

        self.kindToAssetMap = {
            InteractableKind.And: self.and_,
            InteractableKind.Or: self.or_,
            InteractableKind.Xor: self.xor,
            InteractableKind.Nand: self.nand,
            InteractableKind.Nor: self.nor,
            InteractableKind.XNor: self.xnor,
            InteractableKind.InputOff: self.input_off,
            InteractableKind.InputOn: self.input_on
        }

class Interactable:
    def __init__(self, kind: InteractableKind, screen: pygame.Surface, assets: Assets, pos):
        self.kind = kind
        self.currentState = False
        self.nextState = False
        self.prevState = False
        self.inputs = []
        self._assets = assets
        self._screen = screen
        self.selected = False
        self.rect = self._assets.nor.get_rect() # gateRect is the size of the image.  All the gates are the same size.
        self.rect.move_ip((pos[0] - self.rect.width/2, pos[1] - self.rect.height/2)) # now it's the rect moved to the spot we want it
    
    def draw(self):
        draw.rect(self._screen, GRAY if self.currentState else DARKGRAY, self.rect)
        if (self.selected):
            draw.rect(self._screen, GREEN, self.rect, 4)
        else:
            draw.rect(self._screen, BLUE, self.rect, 4)
        
        self._screen.blit(self._assets.kindToAssetMap[self.kind], self.rect.topleft)
    
    # returns true if pos is inside the drawn area of this thing
    def containsPosition(self, pos):
        return self.rect.collidepoint(pos)

    def move(self, pos):
        self.rect.move_ip(pos[0], pos[1])

    def calculate(self):
        if (self.kind == InteractableKind.InputOff):
            self.nextState = False
        elif (self.kind == InteractableKind.InputOn):
            self.nextState = True
        elif (self.kind == InteractableKind.And):
            self.nextState = len(self.inputs) > 0 and len(self.inputs) == self.numActivatedInputs()
        elif (self.kind == InteractableKind.Or):
            self.nextState = len(self.inputs) > 0 and self.numActivatedInputs() > 0
        elif (self.kind == InteractableKind.Xor):
            self.nextState = self.numActivatedInputs() % 2 == 1
        elif (self.kind == InteractableKind.Nand):
            self.nextState = len(self.inputs) > 0 and len(self.inputs) != self.numActivatedInputs()
        elif (self.kind == InteractableKind.Nor):
            self.nextState = len(self.inputs) > 0 and self.numActivatedInputs() == 0
        elif (self.kind == InteractableKind.XNor):
            self.nextState = len(self.inputs) > 0 and self.numActivatedInputs() % 2 == 0

    def numActivatedInputs(self) -> int:
        i = 0
        for input in self.inputs:
            if input.currentState:
                i = i + 1
        return i

    def recalculate(self):
        if (self.kind == InteractableKind.InputOff):
            self.currentState = False
        elif (self.kind == InteractableKind.InputOn):
            self.currentState = True
        elif (self.kind == InteractableKind.And):
            self.currentState = len(self.inputs) > 0 and len(self.inputs) == self._reNumActivatedInputs()
        elif (self.kind == InteractableKind.Or):
            self.currentState = len(self.inputs) > 0 and self._reNumActivatedInputs() > 0
        elif (self.kind == InteractableKind.Xor):
            self.currentState = self._reNumActivatedInputs() % 2 == 1
        elif (self.kind == InteractableKind.Nand):
            self.currentState = len(self.inputs) > 0 and len(self.inputs) != self._reNumActivatedInputs()
        elif (self.kind == InteractableKind.Nor):
            self.currentState = len(self.inputs) > 0 and self._reNumActivatedInputs() == 0
        elif (self.kind == InteractableKind.XNor):
            self.currentState = len(self.inputs) > 0 and self._reNumActivatedInputs() % 2 == 0

    def _reNumActivatedInputs(self) -> int:
        i = 0
        for input in self.inputs:
            if input.prevState:
                i = i + 1
        return i

    def apply(self):
        self.prevState = self.currentState
        self.currentState = self.nextState


def drawLineWithArrows(assets: Assets, screen: pygame.Surface, pos1: Tuple[float,float], pos2: Tuple[float,float], color: draw):
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
        
        arrow = assets.arrow
        arrow = transform.rotate(arrow, angle)
        arrowRect = arrow.get_rect()
        arrow = transform.scale(arrow, (int(arrowRect.width * .03), int(arrowRect.height * .03)))
        arrowRect = arrow.get_rect()
        arrowRect.move_ip((pos2[0] + pos1[0] - arrowRect.width)/2, (pos2[1] + pos1[1] - arrowRect.height)/2)
        screen.blit(arrow, arrowRect)

def findItem(interactables, pos):
    for i in interactables:
        if i.containsPosition(pos):
            return i
    return None

def singleStep(interactables: Iterable[InteractableKind]):
    for i in interactables:
        i.calculate()
    for i in interactables:
        i.apply()
    

# define a main function
def main():
     
    # initialize the pygame module
    pygame.init()

    # load and set the logo
    logo = pygame.image.load("logo32x32.png")
    pygame.display.set_icon(logo)
    pygame.display.set_caption("Scrap Mechanic Logic Gate Simulator")


    sysfont = font.SysFont(None, 24)

    screen = pygame.display.set_mode((700,700), constants.RESIZABLE)
     
    # define a variable to control the main loop
    closing = False
    running = False
    assets = Assets()

    interactables = []
    selected = None
    isMoving = False
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
                    if selectedNow is None:
                        if selected is not None:
                            selected.selected = False
                        kind = InteractableKind.InputOff if key.get_mods() in (constants.KMOD_SHIFT, constants.KMOD_LSHIFT, constants.KMOD_RSHIFT) else InteractableKind.And
                        selected = Interactable(kind, screen, assets, event.pos)
                        selected.selected = True
                        interactables.append( selected )
                    else:
                        if selected is not None:
                            selected.selected = False
                        selectedNow.selected = True
                        selected = selectedNow
                    posAtStart = event.pos
                elif event.button == 3 and selected is not None:
                    target = findItem(interactables, event.pos)
                    # we're making a connection from the selected item *to* the target,
                    # so we're adding to target.inputs
                    if target is not None and target is not selected and target.kind not in (InteractableKind.InputOff, InteractableKind.InputOn):
                        if selected in target.inputs:
                            # the connection is already there - undo it
                            target.inputs.remove(selected)
                        else:
                            # If the connection already goes the other way, reverse it.
                            if target in selected.inputs:
                                selected.inputs.remove(target)
                            target.inputs.append(selected)
                        target.recalculate()
            elif event.type == constants.MOUSEMOTION:
                if event.buttons[0] == 1:
                    # the >5 thing is to prevent random jiggles while clicking from instigating moves.
                    if selected is not None and not isMoving and (abs(event.pos[0] - posAtStart[0]) > 5 or abs(event.pos[1] - posAtStart[1])):
                        isMoving = True
                    if isMoving:
                        selected.move(event.rel)
            elif event.type == constants.KEYDOWN:
                if event.key == constants.K_DELETE and selected is not None:
                    interactables.remove(selected)
                    for i in interactables:
                        if selected in i.inputs:
                            i.inputs.remove(selected)
                            i.recalculate()
                    selected = None
                elif event.key == constants.K_LEFT and selected is not None:
                    selected.kind = InteractableKind.prevs[selected.kind]
                    selected.recalculate()
                elif event.key == constants.K_RIGHT and selected is not None:
                    selected.kind = InteractableKind.nexts[selected.kind]
                    selected.recalculate()
                elif event.key == constants.K_UP and selected is not None:
                    selected.kind = InteractableKind.nots[selected.kind]
                    selected.recalculate()
                elif event.key == constants.K_DOWN and selected is not None:
                    selected.kind = InteractableKind.nots[selected.kind]
                    selected.recalculate()
                elif event.key == constants.K_F10 and not running:
                    singleStep(interactables)
                    tick += 1
                elif event.key == constants.K_F5:
                    # TODO: Reset
                    running = True
                elif event.key == constants.K_F6:
                    running = False
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
                drawLineWithArrows(assets, screen, input.rect.center, box.rect.center, LIGHTBLUE if input.prevState else BLUE)

        for box in interactables:
            box.draw()
        display.flip()
        # display.update()
     
     
# run the main function only if this module is executed as the main script
# (if you import this as a module then nothing is executed)
if __name__=="__main__":
    # call the main function
    main()