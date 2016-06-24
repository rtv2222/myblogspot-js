#!/bin/sh
docker build -t rtv2222/user-service-js .
if [ $? = 0 ]
then
   value=$((8000+$GO_PIPELINE_COUNTER))
   echo "HA-PROXY ENTRY============"
   echo "server server2 172.16.210.130:$value maxconn 32"
   echo "HA-PROXY ENTRY============"
   docker run -e LISTEN_PORT=$value --net=host rtv2222/user-service-js &
else
   echo "Failed to build and deploy the docker container"
   exit 1
fi

