#presets 
from pavfunctions import stimulate
from time import sleep

# Anxiety helpers
def heartbeat(mode):
    for _ in range(3):
        stimulate(mode, 10, 1, 0)
        stimulate(mode,25,2,0)
        sleep(1.5)

def breathing(mode):
    # stimulate(mode,30,3,.5)
    # sleep(1)
    for i in range(3):
        stimulate(mode,50,5,0)
        sleep(1)
        stimulate(mode,30,min(7,5+i),0)
        sleep(1)

def single(mode):
    stimulate(mode, 50, 1, 0)

def double(mode):
    stimulate(mode, 50, 2, .25)

def triple(mode):
    stimulate(mode, 50, 3, .5)

def long(mode):
    stimulate(mode, 50, 2, 0)
