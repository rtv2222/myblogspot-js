#!/bin/sh
docker build -t rtv2222/user-service-js .
if [ $? = 0 ]
then
   value=`cat ./lastPort`
   echo "Currently used port is $value"
   value=$((value+1))
   echo $value > ./lastPort
   echo "Invoking docker run with $value"
   docker run -e LISTEN_PORT=$value --net=host rtv2222/user-service-js &
else
   echo "Failed to build and deploy the docker container"
   exit 1
fi

