import zoo
import sys
import glob
#import pymodis
from pymodis import convertmodis_gdal

def createmosaic(conf,inputs,outputs):
    # pymodis.convertmodis_gdal.createMosaicGDAL(hdfnames, subset, outformat='HDF4Image')
    filelist = inputs["hdfnames"]["value"]
    subset = inputs["subset"]["value"] # subset = "(1 1 1 1 1 1 1)"
    outformat = inputs["outformat"]["value"] # 'GTiff', 'HDF4Image'

    mos = convertmodis_gdal.createMosaicGDAL(hdfnames=filelist, subset=subset, outformat=outformat)
    mos.run(str(filelist + 'mosaic.tif'))

    outputs["Result"]["value"]=\
            "hdfnames: "+inputs["filelist"]["value"]+ " subset: "+inputs["subset"]["value"]+ " outformat: "+inputs["outformat"]["value"]

    return zoo.SERVICE_SUCCEEDED
