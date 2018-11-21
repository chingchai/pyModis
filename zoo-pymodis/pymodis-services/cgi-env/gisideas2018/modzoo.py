#!/usr/bin/python python
import sys
import os
import psycopg2
import urllib2
import time
import atexit
import zoo
import glob
import shutil
import subprocess

GISBASE = "/usr/lib/grass72"
os.environ['GISBASE'] = GISBASE
os.environ['PATH'] = os.environ['PATH'] + ":$GISBASE/bin:$GISBASE/scripts"
if 'LD_LIBRARY_PATH' in os.environ.keys():
    os.environ['LD_LIBRARY_PATH'] = os.environ['LD_LIBRARY_PATH'] + ":$GISBASE/lib"
else:
    os.environ['LD_LIBRARY_PATH'] = "$GISBASE/lib"

# for parallel session management, we use process ID (PID) as lock file number:
os.environ['GIS_LOCK'] = str(os.getpid())
# path to GRASS settings file
os.environ['GISRC'] = "$HOME/.grass7/rc$$"

grasspath = os.path.join(GISBASE, 'etc','python')
if grasspath not in sys.path:
    sys.path.append(grasspath)

LOCATION = "pymodis"
#GISDBASE = "/home/user/grassdata"
GISDBASE = os.path.join(os.path.expanduser("~"), "grassdata")
MAPSET = "PERMANENT"

from grass import script as gscript
from grass.script import setup
setup.init(GISBASE, GISDBASE, LOCATION, MAPSET)
#from grass.pygrass import vector
from grass.script import core as mg

# pyModis
from pymodis import downmodis
from pymodis import convertmodis
from pymodis import convertmodis_gdal
from pymodis.convertmodis_gdal import convertModisGDAL


folder = "/home/user/modis/tmp"
for the_file in os.listdir(folder):
    file_path = os.path.join(folder, the_file)
    try:
        if os.path.isfile(file_path):
            os.unlink(file_path)
        #elif os.path.isdir(file_path): shutil.rmtree(file_path)
    except Exception as e:
        print(e)

dns = "/home/user/modis/tmp"
password = "password"
user = "username"
path="MOLT"
tiles = ""
today = "2017-02-01"
enddate = "2017-02-16"
product = "MOD13A2.006"

# Download MODIS data
down = downmodis.downModis(destinationFolder=dns, password=password, user=user, url='http://e4ftl01.cr.usgs.gov', path=path, tiles=tiles, today=today, enddate=enddate, product=product)
down.connect()
down.downloadsAllDay()

files = glob.glob(os.path.join(dns, '*.hdf'))
print files
output_pref = os.path.join(dns, '')
subset = [0,0,0,1,1,0,1,0,0,0,0,0]
epsg = "4326"

# Convert and Reprojection 
modisconv = convertModisGDAL(hdfname=files[0], prefix=output_pref, subset=subset, res=0.00340106, epsg=epsg)
modisconv.run()
band1 = glob.glob(os.path.join(dns, '_1 km 16 days red reflectance.tif'))
band2 = glob.glob(os.path.join(dns, '_1 km 16 days NIR reflectance.tif'))
band7 = glob.glob(os.path.join(dns, '_1 km 16 days MIR reflectance.tif'))
print band1
print band2
print band7

def modtool(conf,inputs,outputs):

	# Set path result rain idw method
	path = '/home/user/modis/output/'
	t = time.strftime("%Y%m%d:%H%M%S")
	print "Date: "+t
	# Set Extent
	mg.run_command('g.region', rast='prov_mask@PERMANENT', res = "0.00340106")
	mg.run_command('r.in.gdal', input=band1 ,output = "xsur_refl_b01", overwrite= True)
	mg.run_command('r.in.gdal', input=band2 ,output = "xsur_refl_b02", overwrite= True)
	mg.run_command('r.in.gdal', input=band7 ,output = "xsur_refl_b07", overwrite= True)
	# Index Calculator
	mg.run_command('r.mapcalc', expression = "ndvi = float(xsur_refl_b02 - xsur_refl_b01) / float(xsur_refl_b02 + xsur_refl_b01)",overwrite= True)
	mg.run_command('r.mapcalc', expression = "ndwi = float(xsur_refl_b02 - xsur_refl_b07) / float(xsur_refl_b02 + xsur_refl_b07)",overwrite= True)
	mg.run_command('r.mapcalc', expression = "nddi = float(ndvi - ndwi) / float(ndvi + ndwi)",overwrite= True)
	# Export Index
	mg.run_command('r.out.gdal', input='ndvi', output= path+"ndvi.tif", overwrite= True)
	mg.run_command('r.out.gdal', input='ndwi', output= path+"ndwi.tif", overwrite= True)
	mg.run_command('r.out.gdal', input='nddi', output= path+"nddi.tif", overwrite= True)
	
	# Result
	outputs["Result"]["generated_file"]=glob.glob(os.path.join(["exec"]["value"]+".tif"))

	return zoo.SERVICE_SUCCEEDED
