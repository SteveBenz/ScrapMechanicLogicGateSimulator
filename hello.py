# Gotta do this first:
#  python3 -m pip install -U pygame --user

# import the pygame module, so you can use it
import pygame.display as display
import pygame.font as font
import pygame.draw as draw
import pygame.image as image
import pygame.transform as transform
import pygame.constants as constants
import pygame as pygame
import math
from enum import Enum

BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
LIGHTBLUE = (128, 128, 255)
GRAY = (200, 200, 200)

class IntractableKind(Enum):
    And = "and"
    Or = "or"
    Xor = "xor"
    Button = "button"

class Assets:
    def __init__(self):
        self.and_ = image.load("assets/and-black.png")
        self.or_ = image.load("assets/or-black.png")
        self.xor = image.load("assets/xor-black.png")
        self.nand = image.load("assets/nand-black.png")
        self.nor = image.load("assets/nor-black.png")
        self.xnor = image.load("assets/xnor-black.png")
        self.arrow = image.load("assets/arrow.png")

class Interactable:
    def __init__(self, kind: IntractableKind, screen: pygame.Surface, assets: Assets, pos):
        self.kind = kind
        self.isPowered = False
        self.inputs = []
        self._assets = assets
        self._screen = screen
        self.selected = False
        self.rect = self._assets.nor.get_rect() # gateRect is the size of the image...
        self.rect.move_ip((pos[0] - self.rect.width/2, pos[1] - self.rect.height/2)) # now it's the rect moved to the spot we want it
    
    def draw(self):
        draw.rect(self._screen, GRAY, self.rect)
        if (self.selected):
            draw.rect(self._screen, GREEN, self.rect, 4)
        else:
            draw.rect(self._screen, BLUE, self.rect, 4)
        self._screen.blit(self._assets.nor, self.rect.topleft)
    
    # returns true if pos is inside the drawn area of this thing
    def containsPosition(self, pos):
        return self.rect.collidepoint(pos)

    def move(self, pos):
        self.rect.move_ip(pos[0], pos[1])

def drawLineWithArrows(assets: Assets, screen, pos1: tuple, pos2: tuple):
        draw.line(screen, BLUE, pos1, pos2, 3)
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


# define a main function
def main():
     
    # initialize the pygame module
    pygame.init()

    # load and set the logo
    logo = pygame.image.load("logo32x32.png")
    pygame.display.set_icon(logo)
    pygame.display.set_caption("minimal program")


    sysfont = font.SysFont(None, 24)

    screen = pygame.display.set_mode((700,700), constants.RESIZABLE)
     
    # define a variable to control the main loop
    running = True
    assets = Assets()

    interactables = []
    selected = None
    isMoving = False
    posAtStart = (0,0)
     
    # main loop
    while running:
        # event handling, gets all event from the event queue
        for event in pygame.event.get():
            if event.type == constants.MOUSEBUTTONDOWN:
                if event.button == 1:
                    selectedNow = findItem(interactables, event.pos)
                    if selectedNow is None:
                        if selected is not None:
                            selected.selected = False
                        selected = Interactable(IntractableKind.And, screen, assets, event.pos)
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
                    if target is not None and target is not selected:
                        if selected in target.inputs:
                            # the connection is already there - undo it
                            target.inputs.remove(selected)
                        else:
                            # If the connection already goes the other way, reverse it.
                            if target in selected.inputs:
                                selected.inputs.remove(target)
                            target.inputs.append(selected)
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
                    selected = None
            elif event.type == constants.QUIT:
                running = False

        screen.fill(BLACK)

        for box in interactables:
            for input in box.inputs:
                drawLineWithArrows(assets, screen, input.rect.center, box.rect.center)

        for box in interactables:
            box.draw()
        display.flip()
        # display.update()
     
     
# run the main function only if this module is executed as the main script
# (if you import this as a module then nothing is executed)
if __name__=="__main__":
    # call the main function
    main()