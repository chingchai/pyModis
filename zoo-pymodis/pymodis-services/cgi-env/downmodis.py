import zoo
import sys
import glob
import os
import zipfile

from pymodis import downmodis

def modisdownload(conf,inputs,outputs):
    # data download
    # Create a temporary directory to store the downloaded files
    storeDir = os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"])
    dns = storeDir #dest = "/home/chingchai/lab-pyModis/lst_terra/"
    path = inputs["path"]["value"] # MOLA, MOLT or MOTA
    tiles = ",".join(inputs["tiles"]["value"]) #"h27v07,h27v08,h28v07,h28v08" Thailand extent
    today = inputs["today"]["value"] #"2015-01-01"
    enddate = inputs["enddate"]["value"] #"2015-01-30"
    product = inputs["product"]["value"] #"MCD43B4.005","MOD11A1.005"

    os.makedirs(dns)
    down = downmodis.downModis(destinationFolder=dns, url='http://e4ftl01.cr.usgs.gov', path=path, tiles=tiles, today=today, enddate=enddate, product=product)
    down.connect()
    down.downloadsAllDay()

    d=zipfile.ZipFile(os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+".zip"), 'w')
    for name in glob.glob(os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"],"*.hdf")):
        if name.count("zip")==0:
            d.write(name.replace("\\","/"),os.path.basename(name), zipfile.ZIP_DEFLATED)
        print >> sys.stderr,name.replace("\\","/")
    d.close()
    outputs["Result"]["generated_file"]=os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+".zip")
    return zoo.SERVICE_SUCCEEDED
