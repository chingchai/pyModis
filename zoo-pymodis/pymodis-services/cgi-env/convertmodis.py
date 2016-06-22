import zoo
import sys
import glob
#import pymodis
from pymodis import convertmodis_gdal

def convertmodis(conf,inputs,outputs):

    #pymodis.convertmodis_gdal.convertModisGDAL(hdfname, prefix, subset, res, outformat='GTiff', epsg=None, wkt=None, resampl='NEAREST_NEIGHBOR', vrt=False)
    #modis_convert.py -s "( 1 1 1 1 1 1 1)" -o /home/eileen/Downloads/modis_data/result_convert/h27v08/ -e 4326 /home/eileen/Downloads/modis_data/MCD43B4.A2015001.h27v08.005.2015027215144.hdf
    hdfname = inputs["hdfname"]["value"] #/home/eileen/Downloads/modis_data/MCD43B4.A2015001.h27v08.005.2015027215144.hdf
    prefix = inputs["prefix"]["value"] # subset = '(1 1 1 1 1 1 1)'
    subset = inputs["subset"]["value"] # output /home/eileen/Downloads/modis_data/result_convert/h27v08/
    res = inputs["res"]["value"] # res = 500
    outformat = inputs["outformat"]["value"] #GTiff
    epsg = inputs["epsg"]["value"] #epsg=None ,epsg=4326, epsg=32647
    wkt = inputs["wkt"]["value"] #wkt=None
    resampl = inputs["resampl"]["value"] #'NEAREST_NEIGHBOR'
    vrt = inputs["vrt"]["value"] #vrt = True, False

    convert = convertmodis_gdal.convertModisGDAL(hdfname=hdfname, prefix=prefix, subset=subset, res=res,\
    outformat=outformat, epsg=epsg, wkt=wkt, resampl=resampl , vrt=vrt)
    convert.run()
    convert.run_vrt_separated()

    outputs["Result"]["value"]=\
            "hdfname: "+inputs["hdfname"]["value"]+ " prefix: "+inputs["prefix"]["value"]+ " subset: "+inputs["subset"]["value"]+ " res: "+inputs["res"]["value"]+\
            " outformat: "+inputs["outformat"]["value"]+ " epsg: "+inputs["epsg"]["value"]+ " wkt: "+inputs["wkt"]["value"]+ " vrt: "+inputs["vrt"]["value"]+\
             str(glob.glob(prefix + '*.tif'))

    return zoo.SERVICE_SUCCEEDED
