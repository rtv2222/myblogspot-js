docker build -t rtv2222/user-service-js .&& docker run -t -i -p 8888:8888 rtv2222/user-service-js & || echo "Failed to build and deploy the docker container"
