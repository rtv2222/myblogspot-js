#!/bin/sh
docker build -t rtv2222/user-service-js .
if [ $? = 0 ]
then
   value=`cat ./lastPort`
   echo "GO counter: $GO_PIPELINE_COUNTER"
   echo "Currently used port is $value"
   value=$((value+1))
   echo $value > ./lastPort
   echo "HA-PROXY ENTRY============"
   echo "server server2 10.78.106.176:$value maxconn 32"
   echo "HA-PROXY ENTRY============"
   docker run -e LISTEN_PORT=$value --net=host rtv2222/user-service-js &
else
   echo "Failed to build and deploy the docker container"
   exit 1
fi

