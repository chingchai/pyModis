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
  - pymodis-services/cgi-env/modis/pymodis_service.py
  https://github.com/chingchai/pyModis/blob/gsoc-2016/zoo-pymodis/pymodis-services/cgi-env/modis/pymodis_service.py
```python
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
```

  - pymodis-services/cgi-env/modis/download.zcfg
  https://github.com/chingchai/pyModis/blob/gsoc-2016/zoo-pymodis/pymodis-services/cgi-env/modis/download.zcfg
```
[download]
 Title = modis_download
 Abstract = downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.
 processVersion = 2
 storeSupported = true
 statusSupported = true
 serviceProvider = pymodis_service
 serviceType = Python
 <DataInputs>
  [path]
   Title = the directory where the data that you want to download are stored on the FTP server.
   Abstract = directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).
   minOccurs = 0
   maxOccurs = 1
   <MetaData>
    title = demo
   </MetaData>
   <LiteralData>
    dataType = string
    AllowedValues = MOLA,MOLT,MOTA
    <Default>
    uom = meters
    value = MOLT
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
   mimeType = application/zip
   </Default>
   </ComplexData>
 </DataOutputs>
```

### Test the DescribeProcess request
DescribeProcess: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=DescribeProcess&service=WPS&version=1.0.0&identifier=modis.download

```xml
<wps:ProcessDescriptions xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsDescribeProcess_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US">
    <ProcessDescription wps:processVersion="2" storeSupported="true" statusSupported="true">
        <ows:Identifier>modis.download</ows:Identifier>
        <ows:Title>modis_download</ows:Title>
        <ows:Abstract>downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.</ows:Abstract>
        <DataInputs>
            <Input minOccurs="0" maxOccurs="1">
                <ows:Identifier>path</ows:Identifier>
                <ows:Title>the directory where the data that you want to download are stored on the FTP server.</ows:Title>
                <ows:Abstract>directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).</ows:Abstract>
                <ows:Metadata xlink:title="demo"/>
                <LiteralData>
                    <ows:DataType ows:reference="http://www.w3.org/TR/xmlschema-2/#string">string</ows:DataType>
                    <ows:AllowedValues>
                        <ows:Value>MOLA</ows:Value>
                        <ows:Value>MOLT</ows:Value>
                        <ows:Value>MOTA</ows:Value>
                    </ows:AllowedValues>
                    <UOMs>
                        <Default>
                            <ows:UOM>meters</ows:UOM>
                        </Default>
                        <Supported>
                            <ows:UOM>feet</ows:UOM>
                        </Supported>
                    </UOMs>
                    <DefaultValue>MOLT</DefaultValue>
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
                            <MimeType>application/zip</MimeType>
                        </Format>
                    </Default>
                </ComplexOutput>
            </Output>
        </ProcessOutputs>
    </ProcessDescription>
</wps:ProcessDescriptions>
```
![screenshot](https://lh5.googleusercontent.com/B_G2cOp9eFj27T_FtE7p0GaHPrbcInfeDXFyaQ0iT6MMZI-DX-co8nym5rOBtzU6WcjezQ=w1841-h747 "Test downmodis module to download MODIS Data as a WPS service")

### Test the Execute request
Execute: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=Execute&service=WPS&version=1.0.0&Identifier=modis.download&DataInputs=tiles=h27v07,h28v07;today=2015-01-01;enddate=2015-01-05;product=MOD11A1.005;path=MOLT&ResponseDocument=Result@asReference=true

```xml
<wps:ExecuteResponse xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US" serviceInstance="http://localhost/cgi-bin/mm/zoo_loader.cgi">
    <wps:Process wps:processVersion="2">
        <ows:Identifier>modis.download</ows:Identifier>
        <ows:Title>modis_download</ows:Title>
        <ows:Abstract>downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.</ows:Abstract>
    </wps:Process>
    <wps:Status creationTime="2016-07-02T05:13:17Z">
        <wps:ProcessSucceeded>The service "download" ran successfully.</wps:ProcessSucceeded>
    </wps:Status>
    <wps:ProcessOutputs>
        <wps:Output>
            <ows:Identifier>Result</ows:Identifier>
            <ows:Title>modis_download.py</ows:Title>
            <ows:Abstract>modis_download.py output</ows:Abstract>
            <wps:Reference href="http://myhost.net/tmp//6455ab26-403d-11e6-ae02-0800274bb48f.zip" mimeType="application/zip"/>
        </wps:Output>
    </wps:ProcessOutputs>
</wps:ExecuteResponse>
```
![screenshot](https://lh5.googleusercontent.com/IcFMzAPiNSY246iN0YojLakBkRqVXsZSxz6_QKRmutBdUIv_G2gskvfEtLrFxvumxfNUfg=w1841-h747 "Result downmodis module")

### create mosaic service from convertmodis_gdal module
- pymodis-services/cgi-env/modis/pymodis_service.py#L37
  https://github.com/chingchai/pyModis/blob/gsoc-2016/zoo-pymodis/pymodis-services/cgi-env/modis/pymodis_service.py

```python
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
```

  - pymodis-services/cgi-env/modis/download.zcfg
    https://github.com/chingchai/pyModis/blob/gsoc-2016/zoo-pymodis/pymodis-services/cgi-env/modis/mosaic.zcfg
```
[mosaic]
 Title = modis_mosaic
 Abstract = mosaic modis data from hdf to GDAL formats using GDAL.
 processVersion = 2
 storeSupported = true
 statusSupported = true
 serviceProvider = pymodis_service
 serviceType = Python
 <DataInputs>
  [tiles]
   Title = the directory where the data that you want to download are stored on the FTP server.
   Abstract = directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).
   minOccurs = 1
   maxOccurs = 1
   <ComplexData>
	<Default>
	  mimeType = application/zip
	</Default>
   </Complexata>
 </DataInputs>
 <DataOutputs>
  [Result]
   Title = output modis_mosaic.py
   Abstract = output modis_mosaic.py
   <ComplexData>
   <Default>
    mimeType = image/tiff
   </Default>
   <Supported>
     mimeType = image/png
    useMapServer = true
   </Supported>
   </ComplexData>
 </DataOutputs>
```
### Test the DescribeProcess request
DescribeProcess: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=DescribeProcess&service=WPS&version=1.0.0&identifier=modis.mosaic

```xml
<wps:ProcessDescriptions xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsDescribeProcess_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US">
    <ProcessDescription wps:processVersion="2" storeSupported="true" statusSupported="true">
        <ows:Identifier>modis.mosaic</ows:Identifier>
        <ows:Title>modis_mosaic</ows:Title>
        <ows:Abstract>mosaic modis data from hdf to GDAL formats using GDAL.</ows:Abstract>
        <DataInputs>
            <Input minOccurs="1" maxOccurs="1">
                <ows:Identifier>tiles</ows:Identifier>
                <ows:Title>the directory where the data that you want to download are stored on the FTP server.</ows:Title>
                <ows:Abstract>directory on the http/ftp [default=MOLT](source type: MOLA, MOLT or MOTA).</ows:Abstract>
                <ComplexData>
                    <Default>
                        <Format>
                            <MimeType>application/zip</MimeType>
                        </Format>
                    </Default>
                    <Supported>
                        <Format>
                            <MimeType>application/zip</MimeType>
                        </Format>
                    </Supported>
                </ComplexData>
            </Input>
        </DataInputs>
        <ProcessOutputs>
            <Output>
                <ows:Identifier>Result</ows:Identifier>
                <ows:Title>output modis_mosaic.py</ows:Title>
                <ows:Abstract>output modis_mosaic.py</ows:Abstract>
                <ComplexOutput>
                    <Default>
                        <Format>
                            <MimeType>image/tiff</MimeType>
                        </Format>
                    </Default>
                    <Supported>
                        <Format>
                            <MimeType>image/png</MimeType>
                        </Format>
                    </Supported>
                </ComplexOutput>
            </Output>
        </ProcessOutputs>
    </ProcessDescription>
</wps:ProcessDescriptions>
```
![screenshot](https://lh4.googleusercontent.com/Pta9RVlK6oUNIzngdviOdtYVg1a43EChyJgvKeuVjZMufTERF4SFfKS_ZmGUqpXFagC8gw=w1841-h747 "DescribeProcess mosaic service")

### Test the Execute request
Execute and accessing tiff as WCS GetMap Request: http://localhost/cgi-bin/mm/zoo_loader.cgi?request=Execute&service=WPS&version=1.0.0&Identifier=modis.download&DataInputs=tiles=h27v07,h28v07;today=2015-01-01;enddate=2015-01-05;product=MOD11A1.005;path=MOLT&ResponseDocument=Result@asReference=true
```xml
<wps:ExecuteResponse xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US" serviceInstance="http://localhost/cgi-bin/mm/zoo_loader.cgi">
    <wps:Process wps:processVersion="2">
        <ows:Identifier>modis.download</ows:Identifier>
        <ows:Title>modis_download</ows:Title>
        <ows:Abstract>downloads MODIS data from NASA FTP servers. It can download large amounts of data and it can be profitably used with cron jobs to receive data with a fixed delay of time.</ows:Abstract>
    </wps:Process>
    <wps:Status creationTime="2016-07-02T05:13:17Z">
        <wps:ProcessSucceeded>The service "download" ran successfully.</wps:ProcessSucceeded>
    </wps:Status>
    <wps:ProcessOutputs>
        <wps:Output>
            <ows:Identifier>Result</ows:Identifier>
            <ows:Title>modis_download.py</ows:Title>
            <ows:Abstract>modis_download.py output</ows:Abstract>
            <wps:Reference href="http://myhost.net/tmp//6455ab26-403d-11e6-ae02-0800274bb48f.zip" mimeType="application/zip"/>
        </wps:Output>
    </wps:ProcessOutputs>
</wps:ExecuteResponse>
```
![screenshot](https://lh5.googleusercontent.com/JMBb4D8C6MIZi9cB60TZV27d3gzaiTiC1vRaD_ncAyz9Zxox63lGKQqo_DGhLJdcpNSInQ=w1841-h745 "Result mosaic accessing a remote tiff as WCS GetMap Request")

Execute and accessing tiff as WMS GetMap Request:
http://localhost/cgi-bin/mm/zoo_loader.cgi?request=Execute&service=WPS&version=1.0.0&Identifier=modis.mosaic&DataInputs=tiles=reference@xlink:href=http://myhost.net/tmp/6455ab26-403d-11e6-ae02-0800274bb48f.zip&ResponseDocument=Result@asReference=true@mimeType=image/png
```xml
<wps:ExecuteResponse xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsExecute_response.xsd" service="WPS" version="1.0.0" xml:lang="en-US" serviceInstance="http://localhost/cgi-bin/mm/zoo_loader.cgi">
    <wps:Process wps:processVersion="2">
        <ows:Identifier>modis.mosaic</ows:Identifier>
        <ows:Title>modis_mosaic</ows:Title>
        <ows:Abstract>mosaic modis data from hdf to GDAL formats using GDAL.</ows:Abstract>
    </wps:Process>
    <wps:Status creationTime="2016-07-02T05:44:33Z">
        <wps:ProcessSucceeded>The service "mosaic" ran successfully.</wps:ProcessSucceeded>
    </wps:Status>
    <wps:ProcessOutputs>
        <wps:Output>
            <ows:Identifier>Result</ows:Identifier>
            <ows:Title>output modis_mosaic.py</ows:Title>
            <ows:Abstract>output modis_mosaic.py</ows:Abstract>
            <wps:Reference href="http://myhost.net/cgi-bin/mm/mapserv.cgi?map=/var/data/Result_f4254a5a-4041-11e6-89ba-0800274bb48f.map&request=GetMap&service=WMS&version=1.3.0&layers=Result&width=640.000&height=320.000&format=image/png&bbox=10.000,91.384,20.000,117.064&crs=EPSG:4326" mimeType="image/tiff"/>
        </wps:Output>
    </wps:ProcessOutputs>
</wps:ExecuteResponse>
```
![screenshot](https://lh4.googleusercontent.com/zXZ10hirrIOdcHHSid_d681atZeP-nuRg7dRnuqVyA88T47HlWRMOOPc-5wFQShOUwoutw=w1841-h747 "Result mosaic accessing a remote tiff as WMS GetMap Request")

## ZOO Wiki
  - [ZOO-Wiki](http://zoo-project.org/trac/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
  - [OSGeo-Wiki](https://wiki.osgeo.org/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
