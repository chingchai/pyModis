import zoo
import sys
import glob
import os
import zipfile

from pymodis import downmodis
from pymodis import convertmodis
from pymodis import convertmodis_gdal

def download(conf,inputs,outputs):
    # data download
    # Create a temporary directory to store the downloaded files
    storeDir = os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"])
    dns = storeDir #dest = "/home/chingchai/lab-pyModis/lst_terra/"
    path = inputs["path"]["value"] # MOLA, MOLT or MOTA
    tiles = inputs["tiles"]["value"]
    #tiles = ",".join(inputs["tiles"]["value"]) #"h27v07,h27v08,h28v07,h28v08" Thailand extent
    today = inputs["today"]["value"] #"2015-01-01"
    enddate = inputs["enddate"]["value"] #"2015-01-30"
    product = inputs["product"]["value"] #"MCD43B4.005","MOD11A1.005"

    os.makedirs(dns)
    down = downmodis.downModis(destinationFolder=dns, url='http://e4ftl01.cr.usgs.gov', path=path, tiles=tiles, today=today, enddate=enddate, product=product)
    down.connect()
    down.downloadsAllDay()

    d=zipfile.ZipFile(os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+".zip"), 'w')
    for name in glob.glob(os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"],"*")):
        if name.count("zip")==0:
            d.write(name.replace("\\","/"),os.path.basename(name), zipfile.ZIP_DEFLATED)
            print >> sys.stderr,name.replace("\\","/")
    d.close()
    outputs["Result"]["generated_file"]=os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+".zip")
    return zoo.SERVICE_SUCCEEDED

def mosaic(conf,inputs,outputs):
    storeDir = os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"])
    listName=None
    fh = open(inputs["tiles"]["cache_file"], 'rb')
    z = zipfile.ZipFile(fh)
    for name in z.namelist():
        z.extract(name, storeDir)
        print >> sys.stderr,name
        if "listfile" in name:
            listName=os.path.join(storeDir,name)
    fh.close()
    print >> sys.stderr,listName
    tiles = []
    with open(listName) as f:
        for l in f:
            name = os.path.splitext(l.strip())[0]
            if '.hdf' not in name:
                if storeDir not in l:
                    fname = os.path.join(storeDir, l.strip())
                else:
                    fname = l.strip()
                tiles.append(fname)
    print >> sys.stderr,tiles
    modisOgg = convertmodis_gdal.createMosaicGDAL(tiles, False,"GTiff")
    storeResult=os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+".tif")
    modisOgg.run(storeResult)

    outputs["Result"]["generated_file"]=storeResult
    return zoo.SERVICE_SUCCEEDED

def convert(conf,inputs,outputs):
    storeDir = os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"])
    fh = open(inputs["tiles"]["cache_file"], 'rb')
    z = zipfile.ZipFile(fh)
    for name in z.namelist():
        z.extract(name, storeDir)
        #print >> sys.stderr,name

        if "listfile" in name:
            listName=os.path.join(storeDir,name)
    fh.close()
    #print >> sys.stderr,listName

    files = glob.glob(os.path.join(storeDir, 'MOD11A1.A2015*.hdf'))
    #files = glob.glob(os.path.join(dest, 'MOD11A1.A2015*.hdf'))
    #subset = [1,1,0,0,1,1]
    subset = inputs["subset"]["value"]
    res = inputs["res"]["value"]
    epsg = inputs["epsg"]["value"]
    output_pref = os.path.join(storeDir, 'MOD11A1.A2015*')


    modisconv = convertmodis_gdal.convertModisGDAL(hdfname=files[0], prefix=output_pref, subset=subset, res=res, epsg=epsg)
    modisconv.run()

    outputs["Result"]["generated_file"]=os.path.join(conf["main"]["tmpPath"],conf["lenv"]["usid"]+"*_vrt.tif")
    return zoo.SERVICE_SUCCEEDED
