# Extend vert.x image                       (1)
FROM vertx/vertx3

# Set the name of the verticle to deploy    (2)
ENV VERTICLE_NAME server.js

# Set the location of the verticles         (3)
ENV VERTICLE_HOME /usr/verticles

EXPOSE 8080

# Copy your verticle to the container       (4)
COPY $VERTICLE_NAME $VERTICLE_HOME/

# Copy your verticle's dependencies       (5)
COPY target/lib/vertx-auth-mongo-3.2.1.jar $VERTICLE_HOME/lib

# Launch the verticle                       (6)
WORKDIR $VERTICLE_HOME
ENTRYPOINT ["sh", "-c"]
CMD ["vertx run $VERTICLE_NAME -cp $VERTICLE_HOME/lib/vertx-auth-mongo-3.2.1.jar"]
