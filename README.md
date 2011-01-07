# Repository for the SFPark Management Application.

## Getting set up for development

Prerequisites: [Ant](http://ant.apache.org/) & [Git](http://git-scm.com/)

    git clone git@github.com:opengeo/SFPark.git
    cd SFPark
    git submodule init
    git submodule update

## Running the application in debug mode

To run the application with all scripts loaded unminified, run the following 
Ant tasks:

    ant init
    ant debug

The `ant init` task only need to be run once (any time dependencies change).

## Preparing the application for deployment

To bundle up the application for deployment in a servlet container, run the 
following ant task:

    ant war
    
The resulting SFPark.war file (in the build directory) can be dropped in a 
servlet container.
