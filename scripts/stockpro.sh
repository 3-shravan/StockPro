#!/bin/bash
# ============================================================
# StockPro — Unified Management CLI
# Usage: ./stockpro.sh [command] [subcommand]
# ============================================================

# --- 1. Configuration -----------------------------------------

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT/logs"
SERVICES_DIR="$ROOT/services"

# Service Definitions: [name] [path] [port] [jar_name]
SERVICES=(
    "discovery-server" "discovery-server" 8761 "discovery-server-0.0.1-SNAPSHOT.jar"
    "api-gateway" "api-gateway" 8080 "api-gateway-0.0.1-SNAPSHOT.jar"
    "auth-service" "services/auth-service" 8081 "auth-service-0.0.1-SNAPSHOT.jar"
    "product-service" "services/product-service" 8082 "product-service-0.0.1-SNAPSHOT.jar"
    "warehouse-service" "services/warehouse-service" 8083 "warehouse-service-0.0.1-SNAPSHOT.jar"
    "purchase-service" "services/purchase-service" 8084 "purchase-service-0.0.1-SNAPSHOT.jar"
    "supplier-service" "services/supplier-service" 8085 "supplier-service-0.0.1-SNAPSHOT.jar"
    "movement-service" "services/movement-service" 8086 "movement-service-0.0.1-SNAPSHOT.jar"
    "alert-service" "services/alert-service" 8087 "alert-service-0.0.1-SNAPSHOT.jar"
    "report-service" "services/report-service" 8088 "report-service-0.0.1-SNAPSHOT.jar"
)

# --- 2. Colors & Icons ----------------------------------------

BOLD="\033[1m"
RESET="\033[0m"
CYAN="\033[0;36m"
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
BLUE="\033[0;34m"
GRAY="\033[0;90m"

ICON_INFO="🔹"
ICON_SUCCESS="✅"
ICON_WARN="⚠️ "
ICON_ERROR="❌"
ICON_BUILD="📦"
ICON_CLEAN="🧹"
ICON_START="🚀"
ICON_STOP="🛑"
ICON_DB="🗄️ "

# --- 3. Helper Functions --------------------------------------

log_header() {
    echo -e "${BOLD}${CYAN}"
    echo "  ┌──────────────────────────────────────────────────────────┐"
    echo "  │              STOCKPRO - MICROSERVICES CLI                │"
    echo "  └──────────────────────────────────────────────────────────┘"
    echo -e "${RESET}"
}

log_info()    { echo -e "${BLUE}${ICON_INFO} [INFO]${RESET} $1"; }
log_success() { echo -e "${GREEN}${ICON_SUCCESS} [SUCCESS]${RESET} $1"; }
log_warn()    { echo -e "${YELLOW}${ICON_WARN} [WARN]${RESET} $1"; }
log_error()   { echo -e "${RED}${ICON_ERROR} [ERROR]${RESET} $1"; }
log_step()    { echo -e "${BOLD}${GRAY}── $1 ──────────────────────────────────────────${RESET}"; }

check_java() {
    JAVA_VER=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | cut -d'.' -f1)
    if [ "$JAVA_VER" != "21" ]; then
        log_warn "System Java is $JAVA_VER, but project requires Java 21."
        export JAVA_HOME=/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home
    fi
}

get_db_creds() {
    local env_file="$ROOT/services/auth-service/.env"
    if [ -f "$env_file" ]; then
        DB_USER=$(grep "^LOCAL_DB_USERNAME=" "$env_file" | cut -d'=' -f2-)
        DB_PASS=$(grep "^LOCAL_DB_PASSWORD=" "$env_file" | cut -d'=' -f2-)
    else
        DB_USER="root"
        DB_PASS="shravan"
    fi
}

# --- 4. Build Management --------------------------------------

cmd_build() {
    check_java
    log_header
    log_step "Building all modules"
    for ((i=0; i<${#SERVICES[@]}; i+=4)); do
        local name=${SERVICES[$i]}
        local path=${SERVICES[$i+1]}
        echo -ne "  ${ICON_BUILD}  Building ${BOLD}$name${RESET}... \r"
        mvn clean install -DskipTests -f "$ROOT/$path/pom.xml" -q
        if [ $? -ne 0 ]; then
            echo -e "  ${ICON_ERROR}  Building ${BOLD}$name${RESET}... ${RED}FAILED${RESET}"
            log_error "Build failed for $name"
            exit 1
        fi
        echo -e "  ${ICON_SUCCESS}  Building ${BOLD}$name${RESET}... ${GREEN}DONE${RESET}  "
    done
    echo
    log_success "All modules built successfully."
}

cmd_clean() {
    log_header
    log_step "Cleaning all builds"
    for ((i=0; i<${#SERVICES[@]}; i+=4)); do
        local name=${SERVICES[$i]}
        local path=${SERVICES[$i+1]}
        echo -ne "  ${ICON_CLEAN}  Cleaning ${BOLD}$name${RESET}... \r"
        mvn clean -f "$ROOT/$path/pom.xml" -q
        echo -e "  ${ICON_CLEAN}  Cleaning ${BOLD}$name${RESET}... ${GREEN}DONE${RESET}  "
    done
    echo
    log_success "Cleanup complete."
}

# --- 5. Process Management ------------------------------------

cmd_stop() {
    log_header
    log_step "Stopping all services"
    for ((i=0; i<${#SERVICES[@]}; i+=4)); do
        local name=${SERVICES[$i]}
        local port=${SERVICES[$i+2]}
        local pids=$(lsof -ti:$port)
        if [ ! -z "$pids" ]; then
            echo -ne "  ${ICON_STOP}  Stopping ${BOLD}$name${RESET} (Port $port)... \r"
            kill -9 $pids 2>/dev/null
            echo -e "  ${ICON_STOP}  Stopping ${BOLD}$name${RESET} (Port $port)... ${GREEN}STOPPED${RESET}"
        fi
    done
    log_success "All services stopped."
}

cmd_start() {
    cmd_stop
    check_java
    mkdir -p "$LOG_DIR"
    log_header
    log_step "Starting services"
    
    for ((i=0; i<${#SERVICES[@]}; i+=4)); do
        local name=${SERVICES[$i]}
        local path=${SERVICES[$i+1]}
        local port=${SERVICES[$i+2]}
        local jar=${SERVICES[$i+3]}
        local jar_path="$ROOT/$path/target/$jar"
        
        if [ ! -f "$jar_path" ]; then
            log_error "JAR not found: $jar_path. Please run './stockpro.sh build' first."
            exit 1
        fi

        echo -ne "  ${ICON_START}  Starting ${BOLD}$name${RESET} on port ${CYAN}$port${RESET}... \r"
        cd "$ROOT/$path"
        nohup java -jar "$jar_path" > "$LOG_DIR/$name.log" 2>&1 &
        cd - > /dev/null
        echo -e "  ${ICON_START}  Starting ${BOLD}$name${RESET} on port ${CYAN}$port${RESET}... ${GREEN}LAUNCHED${RESET}"
        
        if [ "$name" == "discovery-server" ]; then sleep 8; fi
        if [ "$name" == "api-gateway" ]; then sleep 5; fi
    done
    echo
    log_success "All services started. Logs: ${GRAY}$LOG_DIR${RESET}"
}

cmd_status() {
    log_header
    log_step "Service Status Dashboard"
    printf "${BOLD}%-20s %-10s %-15s %s${RESET}\n" "Service" "Port" "Status" "PID"
    echo -e "${GRAY}------------------------------------------------------------${RESET}"
    
    local up_count=0
    local total_count=$(( ${#SERVICES[@]} / 4 ))

    for ((i=0; i<${#SERVICES[@]}; i+=4)); do
        local name=${SERVICES[$i]}
        local port=${SERVICES[$i+2]}
        local pid=$(lsof -ti:$port | head -n 1)
        local status_text="${RED}DOWN${RESET}"
        
        if [ ! -z "$pid" ]; then
            status_text="${GREEN}UP${RESET}"
            ((up_count++))
        else
            pid="-"
        fi
        
        printf "%-20s %-10s %-24b %s\n" "$name" "$port" "$status_text" "$pid"
    done
    
    echo -e "${GRAY}------------------------------------------------------------${RESET}"
    echo -e "  Summary: ${GREEN}$up_count UP${RESET}, ${RED}$((total_count - up_count)) DOWN${RESET} (Total: $total_count)"
    echo
}

# --- 6. Database Management -----------------------------------

cmd_db_list_all() {
    get_db_creds
    log_header
    log_step "Database: All StockPro Databases"
    mysql -u"$DB_USER" -p"$DB_PASS" -t -e "SHOW DATABASES LIKE 'stockpro_%';"
}

cmd_db_users() {
    get_db_creds
    log_header
    log_step "Database: User List"
    mysql -u"$DB_USER" -p"$DB_PASS" -t -e "SELECT user_id, full_name, email, role, is_active FROM stockpro_auth.users;"
}

cmd_db_counts() {
    get_db_creds
    log_header
    log_step "Database: Record Counts"
    echo -e "${BOLD}%-20s %s${RESET}" "Table" "Count"
    echo -e "${GRAY}-----------------------------------${RESET}"
    
    local queries=(
        "stockpro_auth.users"
        "stockpro_product.products"
        "stockpro_product.categories"
        "stockpro_warehouse.warehouses"
        "stockpro_warehouse.inventory"
        "stockpro_supplier.suppliers"
        "stockpro_purchase.purchase_orders"
        "stockpro_movement.stock_movements"
    )

    for q in "${queries[@]}"; do
        local count=$(mysql -u"$DB_USER" -p"$DB_PASS" -N -s -e "SELECT COUNT(*) FROM $q;" 2>/dev/null || echo "0")
        printf "%-20s %s\n" "$q" "$count"
    done
    echo
}

cmd_db_clear_users() {
    get_db_creds
    log_header
    log_step "Database: Clear Users"
    log_warn "This will delete ALL users from stockpro_auth."
    read -p "  Confirm action? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mysql -u"$DB_USER" -p"$DB_PASS" -e "DELETE FROM stockpro_auth.users;"
        log_success "Users cleared."
    else
        log_info "Operation cancelled."
    fi
}

cmd_db_tables() {
    get_db_creds
    local svc=$1
    if [ -z "$svc" ]; then log_error "Usage: ./stockpro.sh db tables <service>"; return; fi
    log_header
    log_step "Database: Tables in stockpro_$svc"
    mysql -u"$DB_USER" -p"$DB_PASS" -t -e "SHOW TABLES FROM stockpro_$svc;"
}

cmd_db_view() {
    get_db_creds
    local svc=$1
    local table=$2
    if [ -z "$svc" ]; then log_error "Usage: ./stockpro.sh db view <service> [table]"; return; fi
    
    # Auto-detect main table if not specified
    if [ -z "$table" ]; then
        case "$svc" in
            auth) table="users" ;;
            product) table="products" ;;
            warehouse) table="warehouses" ;;
            purchase) table="purchase_orders" ;;
            supplier) table="suppliers" ;;
            movement) table="stock_movements" ;;
            alert) table="alerts" ;;
            report) table="reports" ;;
            *) log_error "Unknown service. Please specify table: ./stockpro.sh db view $svc <table_name>"; return ;;
        esac
    fi

    log_header
    log_step "Database: Viewing $table in stockpro_$svc (Top 15)"
    mysql -u"$DB_USER" -p"$DB_PASS" -t -e "SELECT * FROM stockpro_$svc.$table LIMIT 15;"
}

cmd_db_truncate() {
    get_db_creds
    local svc=$1
    local table=$2
    if [ -z "$svc" ] || [ -z "$table" ]; then log_error "Usage: ./stockpro.sh db truncate <service> <table_name>"; return; fi
    
    log_header
    log_step "Database: TRUNCATE $table"
    log_warn "This will delete ALL data from $svc.$table."
    read -p "  Confirm? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mysql -u"$DB_USER" -p"$DB_PASS" -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE stockpro_$svc.$table; SET FOREIGN_KEY_CHECKS=1;"
        log_success "Table $table truncated."
    fi
}

cmd_db_wipe() {
    get_db_creds
    local target_service=$1
    log_header
    
    if [ ! -z "$target_service" ]; then
        log_step "Database: WIPE SERVICE [$target_service]"
        log_warn "This will drop and recreate the database for: $target_service"
        read -p "  Confirm? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            local db="stockpro_$target_service"
            echo -ne "  ${ICON_DB}  Wiping ${BOLD}$db${RESET}... \r"
            mysql -u"$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db;" 2>/dev/null
            if [ $? -eq 0 ]; then
                echo -e "  ${ICON_DB}  Wiping ${BOLD}$db${RESET}... ${GREEN}DONE${RESET}"
                log_success "$target_service database wiped."
            else
                echo -e "  ${ICON_DB}  Wiping ${BOLD}$db${RESET}... ${RED}FAILED${RESET}"
                log_error "Could not wipe $db. Ensure MySQL is running."
            fi
        fi
    else
        log_step "Database: WIPE ALL DATA"
        log_warn "‼️  CRITICAL: This will drop and recreate ALL StockPro databases."
        echo -e "  Affected: ${GRAY}auth, product, warehouse, purchase, supplier, movement, alert, report${RESET}"
        read -p "  Type 'RESET' to confirm: " confirm
        if [ "$confirm" == "RESET" ]; then
            local dbs=("stockpro_auth" "stockpro_product" "stockpro_warehouse" "stockpro_purchase" "stockpro_supplier" "stockpro_movement" "stockpro_alert" "stockpro_report")
            for db in "${dbs[@]}"; do
                echo -ne "  ${ICON_DB}  Wiping ${BOLD}$db${RESET}... \r"
                mysql -u"$DB_USER" -p"$DB_PASS" -e "DROP DATABASE IF EXISTS $db; CREATE DATABASE $db;" 2>/dev/null
                echo -e "  ${ICON_DB}  Wiping ${BOLD}$db${RESET}... ${GREEN}DONE${RESET}"
            done
            log_success "All databases wiped and recreated."
        else
            log_info "Operation cancelled."
        fi
    fi
}

# --- 7. Main Entry Point --------------------------------------

case "$1" in
    build)  cmd_build ;;
    clean)  cmd_clean ;;
    start)  cmd_start ;;
    stop)   cmd_stop ;;
    status) cmd_status ;;
    db)
        case "$2" in
            list-dbs|dbs)           cmd_db_list_all ;;
            users|list)             cmd_db_users ;;
            counts|stats)           cmd_db_counts ;;
            clear-users|rm-users)   cmd_db_clear_users ;;
            tables)                 cmd_db_tables "$3" ;;
            view)                   cmd_db_view "$3" "$4" ;;
            truncate)               cmd_db_truncate "$3" "$4" ;;
            wipe|reset)             cmd_db_wipe "$3" ;;
            *)                      echo "Usage: ./stockpro.sh db [list-dbs|tables <svc>|view <svc> [tbl]|truncate <svc> <tbl>|wipe [svc]]" ;;
        esac
        ;;
    *)
        log_header
        echo -e "${BOLD}Usage:${RESET} ./stockpro.sh ${CYAN}[command]${RESET}"
        echo
        echo -e "${BOLD}Build & Process Commands:${RESET}"
        echo -e "  ${CYAN}build${RESET}      Build all microservices (Maven)"
        echo -e "  ${CYAN}clean${RESET}      Remove build artifacts"
        echo -e "  ${CYAN}start${RESET}      Start all services in background"
        echo -e "  ${CYAN}stop${RESET}       Stop all running services"
        echo -e "  ${CYAN}status${RESET}     View service status dashboard"
        echo
        echo -e "${BOLD}Database Commands:${RESET}"
        echo -e "  ${CYAN}db list-dbs${RESET}     List all StockPro databases"
        echo -e "  ${CYAN}db tables [svc]${RESET} List all tables in a service database"
        echo -e "  ${CYAN}db view [svc] [tbl]${RESET} View top records from a table"
        echo -e "  ${CYAN}db truncate [svc] [tbl]${RESET} Delete all data from a specific table"
        echo -e "  ${CYAN}db wipe [svc]${RESET}   Wipe and recreate databases (all or specific service)"
        echo -e "  ${CYAN}db users${RESET}        List all registered users (Auth Service)"
        echo -e "  ${CYAN}db counts${RESET}       Show record counts for all major tables"
        echo
        exit 1
        ;;
esac
