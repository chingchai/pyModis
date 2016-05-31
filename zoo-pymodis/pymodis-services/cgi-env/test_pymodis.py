import zoo
def test_pymodis(conf,inputs,outputs):
    outputs["Result"]["value"]=\
            " | dns: "+inputs["dns"]["value"]+ " | pwd: "+inputs["pwd"]["value"]+ " | usr: "+inputs["usr"]["value"]+ " | path:"+inputs["path"]["value"]+ " | product:" +inputs["product"]["value"]+ " | tiles:"+inputs["tiles"]["value"]+" | today:"+inputs["today"]["value"]+ " | enddate:"+inputs["enddate"]["value"]
    return zoo.SERVICE_SUCCEEDED
