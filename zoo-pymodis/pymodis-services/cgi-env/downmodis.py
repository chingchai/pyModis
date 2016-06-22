import zoo
import sys
import glob
#import pymodis
from pymodis import downmodis

def downmodis(conf,inputs,outputs):
    # data download
    dns = inputs["dns"]["value"] #dest = "/home/chingchai/lab-pyModis/lst_terra/"
    path = inputs["path"]["value"] # MOLA, MOLT or MOTA
    tiles = inputs["tiles"]["value"] #"h27v07,h27v08,h28v07,h28v08" Thailand extent
    today = inputs["today"]["value"] #"2015-01-01"
    enddate = inputs["enddate"]["value"] #"2015-01-30"
    product = inputs["product"]["value"] #"MCD43B4.005","MOD11A1.005"

    down = downmodis.downModis(destinationFolder=dns, url='http://e4ftl01.cr.usgs.gov', path=path, tiles=tiles, today=today, enddate=enddate, product=product)
    down.connect()
    down.downloadsAllDay()

    outputs["Result"]["value"]=\
            "destinationFolder: "+inputs["dns"]["value"]+ " path: "+inputs["path"]["value"]+ " tiles: "+inputs["tiles"]["value"]+\
            " today: "+inputs["today"]["value"]+ " enddate: "+inputs["enddate"]["value"]+ " product: "+inputs["product"]["value"]+ str(glob.glob(dns + '*.hdf'))
    return zoo.SERVICE_SUCCEEDED
