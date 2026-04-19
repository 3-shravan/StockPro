# ============================================================
#  auth-service Dockerfile — Multi-Stage Build
#
#  Stage 1 (builder): Compile & package the JAR with Maven
#  Stage 2 (runtime): Lean JRE-only image — no build tools
#
#  Build:  docker build -t stockpro/auth-service:latest .
#  Run:    docker run -p 8081:8081 --env-file .env stockpro/auth-service:latest
# ============================================================

# ── Stage 1: Build ───────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Copy dependency descriptor first — Docker layer cache means we only
# re-download dependencies when pom.xml changes, not on every code change.
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and package (skip tests — tests are run in CI before image build)
COPY src ./src
RUN mvn package -DskipTests -q

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine AS runtime

WORKDIR /app

# Create a non-root user — never run as root in production
RUN addgroup -S stockpro && adduser -S authsvc -G stockpro

# Copy only the fat JAR from the builder stage
COPY --from=builder /build/target/*.jar app.jar

# Set ownership
RUN chown authsvc:stockpro app.jar

USER authsvc

EXPOSE 8081

# JVM tuning for containers:
#   -XX:+UseContainerSupport        → respect Docker memory limits
#   -XX:MaxRAMPercentage=75.0       → use 75% of container RAM for heap
#   -Djava.security.egd=...         → faster startup by using /dev/urandom
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
