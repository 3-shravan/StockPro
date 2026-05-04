# StockPro

Unified Microservices Inventory Management Platform.

## 🛠️ Management CLI

Use the `./stockpro.sh` script to manage the entire platform.

### Core Commands
| Command | Description |
|---|---|
| `./stockpro.sh build` | Build all microservices (skipping tests) |
| `./stockpro.sh start` | Start all services (Infra first, then microservices) |
| `./stockpro.sh stop` | Stop all running services |
| `./stockpro.sh status` | Show status of all services and their PIDs |
| `./stockpro.sh clean` | Clean all build artifacts (mvn clean) |

### Database Management
| Command | Description |
|---|---|
| `./stockpro.sh db seed` | Seed the admin user (shravan) |
| `./stockpro.sh db rm-users` | Delete all users from the auth database |
| `./stockpro.sh db wipe` | Drop and recreate all service databases (Hard Reset) |

## 📂 Project Structure
- `api-gateway/`: Central entry point and JWT validation.
- `discovery-server/`: Netflix Eureka for service registration.
- `services/`: All backend microservices.
- `client/`: React/TypeScript frontend (Next.js/Vite).
- `scripts/`: Shared SQL scripts and legacy utilities.
- `logs/`: Runtime logs for all services.
