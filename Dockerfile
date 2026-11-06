FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
RUN groupadd --system store && useradd --system --gid store store
COPY --from=build --chown=store:store /build/target/store-backend-0.0.1-SNAPSHOT.jar ./app.jar
USER store
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
