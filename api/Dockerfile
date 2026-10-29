# Packages the jar CI built (./gradlew :api:bootJar); nothing is compiled here.
FROM eclipse-temurin:25-jre-alpine AS layers
WORKDIR /layers
COPY build/libs/api.jar app.jar
RUN java -Djarmode=tools -jar app.jar extract --layers --destination extracted

FROM eclipse-temurin:25-jre-alpine
RUN addgroup -S -g 10001 blog && adduser -S -D -H -u 10001 -G blog blog
WORKDIR /app
# Least to most often changed, so a new commit rebuilds only the last layer.
COPY --from=layers /layers/extracted/dependencies/ ./
COPY --from=layers /layers/extracted/spring-boot-loader/ ./
COPY --from=layers /layers/extracted/snapshot-dependencies/ ./
COPY --from=layers /layers/extracted/application/ ./
USER blog
EXPOSE 8150
# The heap takes 60% of the container's limit; metaspace, threads and buffers need the rest.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60", "-XX:+ExitOnOutOfMemoryError", "-jar", "app.jar"]
