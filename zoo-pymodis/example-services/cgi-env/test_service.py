import zoo
import sys

def Hellochai(conf,inputs,outputs):
    outputs["Result"]["value"]=\
            "Hello "+inputs["name"]["value"]+" from the ZOO-Project Python "+str(sys.version)+" world !"
    return zoo.SERVICE_SUCCEEDED
