#!/bin/sh
docker build -t rtv2222/user-service-js .
if [ $? == 0 ]
then
   docker run -t -i -p 8888:8888 rtv2222/user-service-js &  
else
   echo "Failed to build and deploy the docker container"
fi

