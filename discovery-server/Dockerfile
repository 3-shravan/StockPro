# ============================================================
#  discovery-server Dockerfile — Multi-Stage Build
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

# Create non-root user
RUN addgroup -S stockpro && adduser -S discoverysvc -G stockpro

# Copy artifact from builder
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown discoverysvc:stockpro app.jar

USER discoverysvc

EXPOSE 8761

# JVM tuning for containers
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
