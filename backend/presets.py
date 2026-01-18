#presets 
from pavfunctions import stimulate
from time import sleep

# Anxiety helpers
def heartbeat(loop):
    for _ in range(loop):
        stimulate("vibe", 10, 1, 0)
        stimulate("vibe",25,2,0)
        sleep(1.5)

def breathing(loop):
    stimulate("vibe",30,3,.25)
    sleep(1)
    for i in range(loop):
        stimulate("vibe",50,5,0)
        sleep(1)
        stimulate("vibe",30,min(7,5+i),0)
        sleep(1)

