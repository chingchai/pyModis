#Bringing pyModis to the web through ZOO-Project(GSoC 2016)

The pyModis project has been developed and used to work with MODIS data, it provides wxPython user interfaces which are able to download and process data using pyModis scripts. pyModis depends on a desktop graphical user interface which does not make it directly usable from a web application. The idea of this GSoC proposal is to bring pyModis to the web by publishing Python Web Processing Services using the ZOO-Project technology accessible through a minimal web application.
An idea which can be implemented for the future, based on this initial work, include the creation of new services by combining pyModis, GRASS, OTB and SAGA-GIS services.

## Notes
  - [pymodis-services/cgi-env (main project)] (https://github.com/chingchai/pyModis/tree/gsoc-2016/zoo-pymodis/pymodis-services/cgi-env)
  - example-services/cgi-env
  - zoo-services

## Install
### Install ZOO-Project@MapMint
####Python packages and modules
Before you can install MapMint using Ansible scripts, it is necessary to ensure the presence of some Ubuntu packages and specific Python modules.
```
sudo apt-get install git python-setuptools openssh-server
sudo easy_install pip
sudo pip install paramiko PyYAML Jinja2 httplib2 six
```
####Ansible download and install scripts
It is necessary to download and Ansible specific scripts installation MapMint. To do this, use the following commands.
```
cd
mkdir mm-install
cd mm-install
git clone git://github.com/ansible/ansible.git --recursive
git clone git://github.com/mapmint/ansible-roles mapmint-setup
```
####Generating an SSH key
So your user can connect to the server via SSH MapMint on which to install, you must create a key to abort an automatic authentication. To do this use the following command.
```
mkdir ~/.ssh
ssh-keygen -t rsa
sudo mkdir /root/.ssh
sudo cp ~/.ssh/id_rsa.pub /root/.ssh/authorized_keys
```
####Installation
Installing MapMint is fully automated via the Ansible previously downloaded scripts, so it only remains to launch. Before that, it will be necessary to set Ansible and specific scripts installation MapMint to define the name of the machine that will be used to access the instance.

Initially you will enable Ansible and define which machines you want to install MapMint. In the example presented here, the facilities will be made ​​on the local machine, so localhost .
```
source ~/mm-install/ansible/hacking/env-setup
echo "localhost" > ~/ansible_hosts
sed "s:myhost.net:localhost:g" -i \
   ~/mm-install/mapmint-setup/debian/dependencies/vars/main.yml
export ANSIBLE_INVENTORY=~/ansible_hosts
```
It remains only to invoke the installation of MapMint with the command below.
```
cd ~/mm-install/mapmint-setup/ubuntu
ansible-playbook -s server.yml -u root
```
To access your MapMint instance, you can use the following links:
  - Access to administrative modules : http://localhost/ui/Dashboard_bs
  - Access to the public interface : http://localhost/ui/public/

Test the GetCapabilities request
  - GetCapabilities: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=GetCapabilities&service=WPS

Test the DescribeProcess request
  - DescribeProcess: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=DescribeProcess&service=WPS&version=1.0.0&Identifier=HelloPy

Test the Execute request
  - Execute: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=Execute&service=WPS&version=1.0.0&Identifier=HelloPy&DataInputs=name=chai

### Install pyModis
```
sudo pip install pyModis
```
### Install wxPython
```
sudo apt-get install python-wxgtk2.8
sudo pip install --upgrade --trusted-host wxpython.org --pre -f http://wxpython.org/Phoenix/snapshot-builds/ wxPython_Phoenix
```
### Test module modis_download.py
```
modis_download.py -r -t h27v07 -s MOTA - MCD43B4.005 -f 2015-01-01 -e 2015-01-30 ~/Download/lab-pyModis/modis-thailand

# Result:
listfileMCD43B4.005.txt
MCD43B4.A2015001.h27v07.005.2015027221605.hdf
MCD43B4.A2015001.h27v07.005.2015027221605.hdf.xml
MCD43B4.A2015009.h27v07.005.2015028132054.hdf
MCD43B4.A2015009.h27v07.005.2015028132054.hdf.xml
MCD43B4.A2015017.h27v07.005.2015034104800.hdf
MCD43B4.A2015017.h27v07.005.2015034104800.hdf.xml
MCD43B4.A2015025.h27v07.005.2015044141504.hdf
MCD43B4.A2015025.h27v07.005.2015044141504.hdf.xml
modisMCD43B4.005.log
```
##Implementing the Python Service
### create WPS service from downmodis module
  - pymodis-services/cgi-env/modisdownload.py
```python
  import zoo
  import sys
  import glob
  from pymodis import downmodis

  def modisdownload(conf,inputs,outputs):
      # data download
      dns = inputs["dns"]["value"] #dest = "/home/chingchai/lab-pyModis/lst_terra/"
      path = inputs["path"]["value"] # MOLA, MOLT or MOTA
      tiles = inputs["tiles"]["value"] #"h27v07,h27v08,h28v07,h28v08" Thailand extent
      today = inputs["today"]["value"] #"2015-01-01"
      enddate = inputs["enddate"]["value"] #"2015-01-30"
      product = inputs["product"]["value"] #"MCD43B4.005","MOD11A1.005"
      #result = glob.glob(dns + '*.hdf')
      down = downmodis.downModis(destinationFolder=dns, url='http://e4ftl01.cr.usgs.gov', path=path, tiles=tiles, today=today, enddate=enddate, product=product)
      down.connect()
      down.downloadsAllDay()

      outputs["Result"]["value"]=\
              "dns: "+inputs["dns"]["value"]+ " path: "+inputs["path"]["value"]+ " tiles: "+inputs["tiles"]["value"]+ " today: "+inputs["today"]["value"]+ " enddate: "+inputs["enddate"]["value"]+ " product: "+inputs["product"]["value"]+ str(glob.glob(dns + '*.hdf'))
      return zoo.SERVICE_SUCCEEDED
```

  - pymodis-services/cgi-env/modisdownload.zcfg
```
[modisdownload]
 Title = modis_download
 Abstract = downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.
 processVersion = 2
 storeSupported = true
 statusSupported = true
 serviceProvider = modisdownload
 serviceType = Python
<MetaData>
 title = Demo pyModis imagery download.
</MetaData>

 <DataInputs>
   [dns]
   Title = destinationFolder
   Abstract = where the files will be stored
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = demo
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
  [path]
   Title = the directory where the data that you want to download are stored on the FTP server.
   Abstract = directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = demo
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
  [product]
   Title = the code of the product to download.
   Abstract = product name as on the http/ftp server. (-p  --product[-p MYD11A1.005])
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = demo
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
  [tiles]
   Title = a set of tiles to be downloaded. None == all
   Abstract =  tiles.This can be passed as a string of tileIDs separated by commas, or as a list of individual tileIDs(-t  --tiles[-t h18v03,h18v04]
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = demo
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
  [today]
   Title = the day to start downloading.
   Abstract = the day to start download, if you want change data you have to use this format YYYY-MM-DD ([default=none] is for today).
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = hint -f  --firstday[-f 2008-01-01].
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
  [enddate]
   Title = the day to end downloading.
   Abstract = day to finish download, if you want change data you have to use this format YYYY-MM-DD ([default=none] use delta option)
   minOccurs = 1
   maxOccurs = 1
   <MetaData>
    title = hint -e  --enddaythe[-e 2008-01-31].
   </MetaData>
   <LiteralData>
    dataType = string
    <Default>
    uom = meters
    </Default>
    <Supported>
    uom = feet
    </Supported>
   </LiteralData>
 </DataInputs>
 <DataOutputs>
  [Result]
   Title = modis_download.py
   Abstract = modis_download.py output
   <ComplexData>
   <Default>
   mimeType = text/html
   encoding = UTF-8
   schema =
   </Default>
   <Supported>
   mimeType = text/csv
   encoding = UTF-8
   schema = http://schemas.opengis.net/gml/3.1.0/base/feature.xsd
   useMapserver = false
   </Supported>
   <Supported>
   mimeType = image/png
   useMapserver = true
   asReference = true
   msStyle = STYLE COLOR 125 0 105 OUTLINECOLOR 0 0 0 WIDTH 3 END
   </Supported>
   <Supported>
   mimeType = image/jpg
   useMapserver = true
   asReference = true
   msStyle = STYLE COLOR 125 0 105 OUTLINECOLOR 0 0 0 WIDTH 3 END
   </Supported>
   <Supported>
   mimeType = image/tif
   useMapserver = false
   asReference = false
   msClassify = ....
   </Supported>
   <Supported>
   mimeType = image/hdf
   useMapserver = false
   asReference = false
   msClassify = ....
   </Supported>
   </ComplexData>
 </DataOutputs>
```

### Test the DescribeProcess request
DescribeProcess: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=DescribeProcess&service=WPS&version=1.0.0&identifier=modisdownload

```xml
<wps:ProcessDescriptions xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsDescribeProcess_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US">
    <ProcessDescription wps:processVersion="2" storeSupported="true" statusSupported="true">
        <ows:Identifier>modisdownload</ows:Identifier>
        <ows:Title>modis_download</ows:Title>
        <ows:Abstract>downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.</ows:Abstract>
        <ows:Metadata xlink:title="Demo pyModis imagery download."/>
        <DataInputs>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>dns</ows:Identifier>
                <ows:Title>destinationFolder</ows:Title>
                <ows:Abstract>where the files will be stored</ows:Abstract>
                <ows:Metadata xlink:title="demo"/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>path</ows:Identifier>
                <ows:Title>the directory where the data that you want to download are stored on the FTP server.</ows:Title>
                <ows:Abstract>directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).</ows:Abstract>
                <ows:Metadata xlink:title="demo"/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>product</ows:Identifier>
                <ows:Title>the code of the product to download.</ows:Title>
                <ows:Abstract>product name as on the http/ftp server. (-p  --product[-p MYD11A1.005])</ows:Abstract>
                <ows:Metadata xlink:title="demo"/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>tiles</ows:Identifier>
                <ows:Title>a set of tiles to be downloaded. None == all</ows:Title>
                <ows:Abstract>tiles.This can be passed as a string of tileIDs separated by commas, or as a list of individual tileIDs(-t  --tiles[-t h18v03,h18v04]</ows:Abstract>
                <ows:Metadata xlink:title="demo"/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>today</ows:Identifier>
                <ows:Title>the day to start downloading.</ows:Title>
                <ows:Abstract>the day to start download, if you want change data you have to use this format YYYY-MM-DD ([default=none] is for today).</ows:Abstract>
                <ows:Metadata xlink:title="hint -f  --firstday[-f 2008-01-01]."/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>enddate</ows:Identifier>
                <ows:Title>the day to end downloading.</ows:Title>
                <ows:Abstract>day to finish download, if you want change data you have to use this format YYYY-MM-DD ([default=none] use delta option)</ows:Abstract>
                <ows:Metadata xlink:title="hint -e  --enddaythe[-e 2008-01-31]."/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <ows:AnyValue/>
                </LiteralData>
            </Input>
        </DataInputs>
        <ProcessOutputs>
            <Output>
                <ows:Identifier>Result</ows:Identifier>
                <ows:Title>modis_download.py</ows:Title>
                <ows:Abstract>modis_download.py output</ows:Abstract>
                <ComplexOutput>
                    <Default>
                        <Format>
                            <MimeType>text/html</MimeType>
                            <Encoding>UTF-8</Encoding>
                        </Format>
                    </Default>
                    <Supported>
                        <Format>
                            <MimeType>text/csv</MimeType>
                            <Encoding>UTF-8</Encoding>
                            <Schema>http://schemas.opengis.net/gml/3.1.0/base/feature.xsd</Schema>
                        </Format>
                        <Format>
                            <MimeType>image/png</MimeType>
                        </Format>
                        <Format>
                            <MimeType>image/jpg</MimeType>
                        </Format>
                        <Format>
                            <MimeType>image/tif</MimeType>
                        </Format>
                        <Format>
                            <MimeType>image/hdf</MimeType>
                        </Format>
                    </Supported>
                </ComplexOutput>
            </Output>
        </ProcessOutputs>
    </ProcessDescription>
</wps:ProcessDescriptions>
```

### Test the Execute request
Execute: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=Execute&service=WPS&version=1.0.0&Identifier=modisdownload&DataInputs=dns=/home/eileen/Downloads/test/;path=MOTA;tiles=h27v07;today=2015-01-01;enddate=2015-01-30;product=MCD43B4.005

```xml
<wps:ExecuteResponse xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US" serviceInstance="http://localhost/cgi-bin/mm/zoo_loader.cgi">
    <wps:Process wps:processVersion="2">
        <ows:Identifier>modisdownload</ows:Identifier>
        <ows:Title>modis_download</ows:Title>
        <ows:Abstract>downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.</ows:Abstract>
    </wps:Process>
    <wps:Status creationTime="2016-06-17T09:58:35Z">
        <wps:ProcessSucceeded>The service "modisdownload" ran successfully.</wps:ProcessSucceeded>
    </wps:Status>
    <wps:ProcessOutputs>
        <wps:Output>
            <ows:Identifier>Result</ows:Identifier>
            <ows:Title>modis_download.py</ows:Title>
            <ows:Abstract>modis_download.py output</ows:Abstract>
            <wps:Data>
                <wps:ComplexData mimeType="text/html" encoding="UTF-8">dns: /home/eileen/Downloads/test/ path: MOTA tiles: h27v07 today: 2015-01-01 enddate: 2015-01-30 product: MCD43B4.005['/home/eileen/Downloads/test/MCD43B4.A2015009.h27v07.005.2015028132054.hdf', '/home/eileen/Downloads/test/MCD43B4.A2015001.h27v07.005.2015027221605.hdf', '/home/eileen/Downloads/test/MCD43B4.A2015017.h27v07.005.2015034104800.hdf', '/home/eileen/Downloads/test/MCD43B4.A2015025.h27v07.005.2015044141504.hdf']</wps:ComplexData>
            </wps:Data>
        </wps:Output>
    </wps:ProcessOutputs>
</wps:ExecuteResponse>
```
![screenshot](https://wiki.osgeo.org/images/a/ab/Modis-testonweb.png "Test downmodis module to download MODIS Data as a WPS service")

![screenshot](https://wiki.osgeo.org/images/b/bd/Modisdown-resul.png "Result downmodis module")

### create WPS service from convertmodis module
Convert MODIS HDF file to GeoTiff file or create a HDF mosaic file for several tiles using Modis Reprojection Tools.
- convertModis
- createMosaic
- processModis


### create WPS service from convertmodis_gdal module
Convert MODIS HDF file using GDAL Python bindings. It can create GeoTiff file (or other GDAL supported formats) or HDF mosaic file for several tiles.
- file_info
- createMosaicGDAL
- convertModisGDAL


## ZOO Wiki
  - [ZOO-Wiki](http://zoo-project.org/trac/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
  - [OSGeo-Wiki](https://wiki.osgeo.org/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
