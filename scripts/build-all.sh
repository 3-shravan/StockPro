#!/bin/bash
# ============================================================
# StockPro — Build All Services
# Usage: chmod +x build-all.sh && ./build-all.sh
# ============================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "========================================="
echo " StockPro Microservices Build"
echo "========================================="
echo ""

build_module() {
  local path=$1
  local name=$(basename "$path")
  echo "Building $name..."
  cd "$ROOT/$path" || exit
  mvn clean install -DskipTests
  if [ $? -ne 0 ]; then
    echo "❌ Build failed for $name"
    exit 1
  fi
  cd - > /dev/null
  echo "✅ Finished $name"
  echo ""
}

# 1. Infrastructure
build_module "discovery-server"
build_module "api-gateway"

# 2. Services
build_module "services/auth-service"
build_module "services/product-service"
build_module "services/warehouse-service"
build_module "services/purchase-service"
build_module "services/supplier-service"
build_module "services/movement-service"
build_module "services/alert-service"
build_module "services/report-service"

echo "========================================="
echo " All services built successfully!"
echo "========================================="
