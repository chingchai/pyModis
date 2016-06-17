# Bringing pyModis to the web through ZOO-Project(GSoC 2016)

The pyModis project has been developed and used to work with MODIS data, it provides wxPython user interfaces which are able to download and process data using pyModis scripts. pyModis depends on a desktop graphical user interface which does not make it directly usable from a web application. The idea of this GSoC proposal is to bring pyModis to the web by publishing Python Web Processing Services using the ZOO-Project technology accessible through a minimal web application.
An idea which can be implemented for the future, based on this initial work, include the creation of new services by combining pyModis, GRASS, OTB and SAGA-GIS services.

## Notes
  - pymodis-services/cgi-env (main project)
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
```







## ZOO Wiki
  - [ZOO-Wiki](http://zoo-project.org/trac/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
  - [OSGeo-Wiki](https://wiki.osgeo.org/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
