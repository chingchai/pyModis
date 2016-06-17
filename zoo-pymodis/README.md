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
  Before you can install MapMint using Ansible scripts, it is necessary to ensure the presence of some Ubuntu packages and specific Python modules.::
      sudo apt-get install git python-setuptools openssh-server
      sudo easy_install pip
      sudo pip install paramiko PyYAML Jinja2 httplib2 six

## ZOO Wiki
  - [ZOO-Wiki](http://zoo-project.org/trac/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
  - [OSGeo-Wiki](https://wiki.osgeo.org/wiki/Bringing_pyModis_to_the_web_through_ZOO-Project_GSoC_2016)
