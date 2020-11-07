# Gotta do this first:
#  python3 -m pip install -U pygame --user

# import the pygame module, so you can use it
import pygame.display as display
import pygame.font as font
import pygame.draw as draw
import pygame.image as image
import pygame.constants as constants
import pygame as pygame
from enum import Enum

BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
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

class Interactable:
    def __init__(self, kind: IntractableKind, screen: pygame.Surface, assets: Assets, pos):
        self.kind = kind
        self.isPowered = False
        self.connections = []
        self.pos = pos
        self._assets = assets
        self._screen = screen
        self.selected = False
    
    def draw(self):
        gateRect = self._assets.nor.get_rect() # gateRect is the size of the image...
        gateRect.move_ip(self.pos) # now it's the rect moved to the spot we want it
        draw.rect(self._screen, GRAY, gateRect)
        if (self.selected):
            draw.rect(self._screen, GREEN, gateRect, 4)
        else:
            draw.rect(self._screen, BLUE, gateRect, 4)
        self._screen.blit(self._assets.nor, self.pos)
    
    # returns true if pos is inside the drawn area of this thing
    def containsPosition(self, pos):
        gateRect = self._assets.nor.get_rect() # gateRect is the size of the image...
        return pos[0] >= self.pos[0] and pos[0] < self.pos[0] + gateRect.right and pos[1] >= self.pos[1] and pos[1] < self.pos[1] + gateRect.bottom


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
     
    # main loop
    while running:
        # event handling, gets all event from the event queue
        for event in pygame.event.get():
            if event.type == constants.MOUSEBUTTONDOWN:
                selectedNow = findItem(interactables, event.pos)
                if selectedNow is None:
                    interactables.append( Interactable(IntractableKind.And, screen, assets, event.pos) )
                else:
                    if selected is not None:
                        selected.selected = False
                    selectedNow.selected = True
                    selected = selectedNow
            # only do something if the event is of type QUIT
            if event.type == constants.QUIT:
                # change the value to False, to exit the main loop
                running = False

        for i in interactables:
            i.draw()

        # display.flip()
        display.update()
     
     
# run the main function only if this module is executed as the main script
# (if you import this as a module then nothing is executed)
if __name__=="__main__":
    # call the main function
    main()