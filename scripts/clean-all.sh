#!/bin/bash
# ============================================================
# StockPro — Clean All Builds
# ============================================================

# Resolve project root relative to script location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🧹 Cleaning All Services..."

clean_service() {
  echo "Cleaning $1..."
  mvn clean -f "$ROOT/$2/pom.xml" -q
}

clean_service "discovery-server" "discovery-server"
clean_service "api-gateway" "api-gateway"
clean_service "auth-service" "services/auth-service"
clean_service "product-service" "services/product-service"
clean_service "warehouse-service" "services/warehouse-service"
clean_service "purchase-service" "services/purchase-service"
clean_service "supplier-service" "services/supplier-service"
clean_service "movement-service" "services/movement-service"
clean_service "alert-service" "services/alert-service"
clean_service "report-service" "services/report-service"

echo "✅ All clean operations completed."
