# Gotta do this first:
#  python3 -m pip install -U pygame --user

# import the pygame module, so you can use it
import pygame.display as display
import pygame.font as font
import pygame.draw as draw
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

class Interactable:
    def __init__(self, kind: IntractableKind, _screen: pygame.Surface, _font: font.Font, pos):
        self.kind = kind
        self.isPowered = False
        self.connections = []
        self.pos = pos
        self._font = _font
        self._screen = _screen
    
    def draw(self):
        gateText = self._font.render('A', True, RED)
        gateRect = gateText.get_rect()
        draw.rect(gateText, BLUE, gateRect, 2)
        self._screen.blit(gateText, self.pos)




# define a main function
def main():
     
    # initialize the pygame module
    pygame.init()

    # load and set the logo
    logo = pygame.image.load("logo32x32.png")
    pygame.display.set_icon(logo)
    pygame.display.set_caption("minimal program")

    sysfont = font.SysFont(None, 24)

    # create a surface on screen that has the size of 240 x 180
    screen = pygame.display.set_mode((240,180))
     
    # define a variable to control the main loop
    running = True

    interacables = []
     
    # main loop
    while running:
        # event handling, gets all event from the event queue
        for event in pygame.event.get():
            if event.type == pygame.MOUSEBUTTONDOWN:
                interacables.append( Interactable(IntractableKind.And, screen, sysfont, event.pos) )
            # only do something if the event is of type QUIT
            if event.type == pygame.QUIT:
                # change the value to False, to exit the main loop
                running = False

        for i in interacables:
            i.draw()

        # display.flip()
        display.update()
     
     
# run the main function only if this module is executed as the main script
# (if you import this as a module then nothing is executed)
if __name__=="__main__":
    # call the main function
    main()