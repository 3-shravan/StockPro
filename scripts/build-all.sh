#!/bin/bash
export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home
# Resolve project root relative to script location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔨 Building All Services..."

build_service() {
  echo "Building $1..."
  mvn clean package -DskipTests -f "$ROOT/$2/pom.xml"
}

build_service "discovery-server" "discovery-server"
build_service "api-gateway" "api-gateway"
build_service "auth-service" "services/auth-service"
build_service "product-service" "services/product-service"
build_service "warehouse-service" "services/warehouse-service"
build_service "purchase-service" "services/purchase-service"
build_service "supplier-service" "services/supplier-service"
build_service "movement-service" "services/movement-service"
build_service "alert-service" "services/alert-service"

echo "✅ All builds completed."
