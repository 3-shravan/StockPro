# ============================================================
#  purchase-service Dockerfile — Multi-Stage Build
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Create a non-root user
RUN addgroup -S stockpro && adduser -S purchasesvc -G stockpro

# Copy only the fat JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown purchasesvc:stockpro app.jar

USER purchasesvc

EXPOSE 8084

# JVM tuning for containers
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
