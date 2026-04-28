#!/bin/bash
# ============================================================
# StockPro — Stop All Services
# Usage: chmod +x stop-all.sh && ./stop-all.sh
# ============================================================

echo "Stopping all StockPro microservices..."
for port in 8761 8080 8081 8082 8083 8084 8085 8086 8087; do
  PIDS=$(lsof -ti:$port)
  if [ ! -z "$PIDS" ]; then
    echo "  Stopping processes on port $port (PIDs: $(echo $PIDS | xargs))"
    echo "$PIDS" | xargs kill -9 2>/dev/null
  else
    echo "  Port $port is clear."
  fi
done

echo ""
echo "All services stopped."
