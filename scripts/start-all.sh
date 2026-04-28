#!/bin/bash
# ============================================================
# StockPro — Start All Services
# Usage: chmod +x start-all.sh && ./start-all.sh
# ============================================================

# Verify Java Version
JAVA_VER=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
if [ "$JAVA_VER" != "21" ]; then
  echo "⚠️ WARNING: System Java is version $JAVA_VER, but this project requires Java 21."
  echo "Setting JAVA_HOME to the detected Homebrew OpenJDK 21 path for stability..."
  export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home
else
  echo "✅ Using system Java 21."
fi

# Resolve project root relative to script location
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --- Cleanup existing services ---
echo "Cleaning up existing StockPro services..."
for port in 8761 8080 8081 8082 8083 8084 8085 8086 8087; do
  PIDS=$(lsof -ti:$port)
  if [ ! -z "$PIDS" ]; then
    echo "  Killing processes on port $port (PIDs: $(echo $PIDS | xargs))"
    echo "$PIDS" | xargs kill -9 2>/dev/null
  fi
done
echo ""

start_service() {
  local name=$1
  local jar_path=$2
  local port=$3
  local log_file="$ROOT/logs/$name.log"
  
  # Determine service root for .env loading
  local service_root=$(dirname "$(dirname "$jar_path")")

  mkdir -p "$ROOT/logs"

  echo "Starting $name on port $port..."
  # Change to service directory, start jar, then change back
  cd "$service_root"
  nohup java -jar "$jar_path" > "$log_file" 2>&1 &
  local pid=$!
  cd - > /dev/null
  
  echo "  PID=$pid | Log: $log_file"
}

echo "========================================="
echo " StockPro Microservices Startup"
echo "========================================="
echo ""

# 1. Discovery Server (must start first)
start_service "discovery-server" \
  "$ROOT/discovery-server/target/discovery-server-0.0.1-SNAPSHOT.jar" 8761
sleep 8

# 2. API Gateway (needs Eureka to be up)
start_service "api-gateway" \
  "$ROOT/api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar" 8080
sleep 5

# 3. Microservices (can start in any order)
start_service "auth-service"     "$ROOT/services/auth-service/target/auth-service-0.0.1-SNAPSHOT.jar"         8081
start_service "product-service"  "$ROOT/services/product-service/target/product-service-0.0.1-SNAPSHOT.jar"   8082
start_service "warehouse-service" "$ROOT/services/warehouse-service/target/warehouse-service-0.0.1-SNAPSHOT.jar" 8083
start_service "purchase-service" "$ROOT/services/purchase-service/target/purchase-service-0.0.1-SNAPSHOT.jar" 8084
start_service "supplier-service" "$ROOT/services/supplier-service/target/supplier-service-0.0.1-SNAPSHOT.jar" 8085
start_service "movement-service" "$ROOT/services/movement-service/target/movement-service-0.0.1-SNAPSHOT.jar" 8086
start_service "alert-service"    "$ROOT/services/alert-service/target/alert-service-0.0.1-SNAPSHOT.jar"       8087

echo ""
echo "========================================="
echo " All services started!"
echo ""
echo " Eureka Dashboard : http://localhost:8761"
echo " API Gateway      : http://localhost:8080"
echo "========================================="
