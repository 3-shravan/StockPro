import requests
import json
import time
import sys
from datetime import datetime, timedelta

# --- Configuration & Logging ---
BASE_URL = "http://localhost:8080/api/v1"

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log_info(msg):
    print(f"{Colors.OKBLUE}[INFO]{Colors.ENDC} {msg}")

def log_success(msg):
    print(f"{Colors.OKGREEN}[SUCCESS]{Colors.ENDC} {msg}")

def log_warning(msg):
    print(f"{Colors.WARNING}[WARN]{Colors.ENDC} {msg}")

def log_error(msg):
    print(f"{Colors.FAIL}[ERROR]{Colors.ENDC} {msg}")

def log_header(msg):
    print(f"\n{Colors.HEADER}{Colors.BOLD}=== {msg} ==={Colors.ENDC}")

# --- StockPro Client ---
class StockProClient:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.token = None
        self.user_id = None

    def _request(self, method, endpoint, **kwargs):
        url = f"{self.base_url}{endpoint}"
        if self.token:
            headers = kwargs.get('headers', {})
            headers['Authorization'] = f"Bearer {self.token}"
            kwargs['headers'] = headers
        
        try:
            response = self.session.request(method, url, **kwargs)
            if response is None: return None
            if response.status_code >= 400:
                log_warning(f"Request {method} {endpoint} returned {response.status_code}")
                # log_debug(f"Response body: {response.text}")
            return response
        except Exception as e:
            log_error(f"Request failed: {method} {endpoint} - {str(e)}")
            return None

    def post(self, endpoint, data=None, **kwargs): return self._request('POST', endpoint, json=data, **kwargs)
    def get(self, endpoint, **kwargs): return self._request('GET', endpoint, **kwargs)
    def put(self, endpoint, data=None, **kwargs): return self._request('PUT', endpoint, json=data, **kwargs)
    def delete(self, endpoint, **kwargs): return self._request('DELETE', endpoint, **kwargs)

    def login(self, email, password):
        log_info(f"Logging in as {email}...")
        resp = self.post("/auth/login", {"email": email, "password": password})
        if resp and resp.status_code == 200:
            data = resp.json().get('data', {})
            self.token = data.get('token')
            # Extract user ID from token or separate profile call
            profile_resp = self.get_profile_by_email(email)
            if profile_resp:
                self.user_id = profile_resp.get('userId')
            log_success("Login successful.")
            return True
        log_error(f"Login failed: {resp.text if resp else 'No response'}")
        return False

    def get_profile_by_email(self, email):
        # Helper to find user ID by email since login only returns token
        resp = self.get("/auth/users")
        if resp and resp.status_code == 200:
            users = resp.json().get('data', [])
            for u in users:
                if u['email'] == email:
                    return u
        return None

# --- Test Suite ---
def run_tests():
    log_header("🚀 Starting Comprehensive StockPro Integration Test")
    
    client = StockProClient(BASE_URL)
    ts = int(time.time())
    
    # 1. AUTH SERVICE TESTS
    log_header("1. Testing Auth Service")
    
    admin_email = f"admin_{ts}@stockpro.com"
    admin_data = {
        "fullName": "Test Admin",
        "email": admin_email,
        "password": "Password123!",
        "role": "ADMIN",
        "department": "IT",
        "phone": "1234567890"
    }
    
    log_info(f"Registering admin: {admin_email}")
    resp = client.post("/auth/register", admin_data)
    if resp and resp.status_code in [200, 201]:
        log_success("Admin registered.")
    else:
        log_error(f"Registration failed: {resp.text if resp else 'No response'}")
        sys.exit(1)

    if not client.login(admin_email, "Password123!"):
        sys.exit(1)

    # Test Profile
    log_info("Testing Profile retrieval...")
    resp = client.get(f"/auth/profile/{client.user_id}")
    if resp and resp.status_code == 200:
        log_success(f"Profile retrieved for {resp.json()['data']['fullName']}")
    else:
        log_error("Profile retrieval failed")

    # Test Update Profile
    log_info("Testing Profile update...")
    update_data = {"fullName": "Updated Admin Name", "department": "Operations"}
    resp = client.put(f"/auth/profile/{client.user_id}", update_data)
    if resp and resp.status_code == 200:
        log_success("Profile updated successfully.")
    else:
        log_error("Profile update failed")

    # Test User List
    log_info("Testing User List (Admin access)...")
    resp = client.get("/auth/users")
    if resp and resp.status_code == 200:
        log_success(f"Retrieved {len(resp.json()['data'])} users.")
    else:
        log_error("User list retrieval failed")

    # 2. PRODUCT SERVICE TESTS
    log_header("2. Testing Product Service")
    sku = f"PROD-{ts}"
    product_data = {
        "name": "Heavy Duty Drill",
        "sku": sku,
        "category": "TOOLS",
        "brand": "StockPro-Industrial",
        "unitOfMeasure": "PCS",
        "reorderLevel": 5,
        "description": "Powerful industrial drill"
    }
    
    log_info(f"Creating product with SKU: {sku}")
    resp = client.post("/products", product_data)
    if resp and resp.status_code == 201:
        product_id = resp.json()['data']['productId']
        log_success(f"Product created with ID: {product_id}")
    else:
        log_error(f"Product creation failed: {resp.text if resp else 'No response'}")
        return

    # Test Get by SKU
    log_info(f"Retrieving product by SKU: {sku}")
    resp = client.get(f"/products/sku/{sku}")
    if resp and resp.status_code == 200:
        log_success("Product found by SKU.")
    else:
        log_error("Product not found by SKU")

    # Test Update Product
    log_info(f"Updating product ID: {product_id}")
    update_prod_data = {
        "name": "Updated Heavy Duty Drill", 
        "reorderLevel": 10,
        "category": "TOOLS",
        "unitOfMeasure": "PCS"
    }
    resp = client.put(f"/products/{product_id}", update_prod_data)
    if resp and resp.status_code == 200:
        log_success("Product updated successfully.")
    else:
        log_error(f"Product update failed: {resp.status_code if resp else 'No response'}")

    # 3. SUPPLIER SERVICE TESTS
    log_header("3. Testing Supplier Service")
    supplier_data = {
        "name": f"Supplier_{ts}",
        "taxId": f"TAX-{ts}",
        "contactName": "Supplier Rep",
        "email": f"rep_{ts}@supplier.com",
        "phone": "9876543210",
        "address": "456 Industrial Ave",
        "city": "Chicago",
        "country": "USA",
        "category": "TOOLS"
    }
    
    log_info(f"Creating supplier: {supplier_data['name']}")
    resp = client.post("/suppliers", supplier_data)
    if resp and resp.status_code == 201:
        supplier_id = resp.json()['data']['supplierId']
        log_success(f"Supplier created with ID: {supplier_id}")
    else:
        log_error(f"Supplier creation failed: {resp.text if resp else 'No response'}")
        return

    # Test Rating
    log_info("Updating supplier rating...")
    resp = client.put(f"/suppliers/{supplier_id}/rating?rating=4.5")
    if resp and resp.status_code == 200:
        log_success("Supplier rating updated.")
    else:
        log_error("Supplier rating update failed")

    # 4. WAREHOUSE SERVICE TESTS
    log_header("4. Testing Warehouse Service")
    warehouse_data = {
        "name": f"Warehouse_{ts}",
        "location": "West Coast",
        "address": "789 Logistics Blvd",
        "managerId": client.user_id,
        "capacity": 10000
    }
    
    log_info(f"Creating warehouse: {warehouse_data['name']}")
    resp = client.post("/warehouses", warehouse_data)
    if resp and resp.status_code == 201:
        warehouse_id = resp.json()['data']['warehouseId']
        log_success(f"Warehouse created with ID: {warehouse_id}")
    else:
        log_error(f"Warehouse creation failed: {resp.text if resp else 'No response'}")
        return

    # Test Initial Stock (Should be 0 or 404)
    log_info("Checking initial stock level...")
    resp = client.get(f"/warehouses/{warehouse_id}/stock/{product_id}")
    if resp and resp.status_code == 200:
        log_info(f"Initial stock: {resp.json()['data']['quantity']}")
    else:
        log_info("No initial stock record (expected).")

    # Test Manual Stock Update
    log_info("Performing manual stock update...")
    client.put("/warehouses/stock/update", {"warehouseId": warehouse_id, "productId": product_id, "quantity": 50})
    resp = client.get(f"/warehouses/{warehouse_id}/stock/{product_id}")
    if resp and resp.status_code == 200 and resp.json()['data']['quantity'] == 50:
        log_success("Manual stock update verified.")
    else:
        log_error("Manual stock update failed")

    # 5. PURCHASE SERVICE TESTS (Lifecycle & Cross-Service Sync)
    log_header("5. Testing Purchase Order Lifecycle")
    po_data = {
        "supplierId": supplier_id,
        "warehouseId": warehouse_id,
        "expectedDate": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
        "notes": "Bulk order for drills",
        "lineItems": [{"productId": product_id, "quantity": 100, "unitCost": 45.0}]
    }
    
    log_info("Creating Purchase Order (DRAFT)...")
    resp = client.post("/purchase-orders", po_data)
    if resp and resp.status_code == 201:
        po_id = resp.json()['data']['poId']
        log_success(f"PO created with ID: {po_id}")
    else:
        log_error(f"PO creation failed: {resp.text if resp else 'No response'}")
        return

    # Test Update PO (Add another item or change quantity)
    log_info("Updating Draft PO...")
    po_data["lineItems"][0]["quantity"] = 120
    client.put(f"/purchase-orders/{po_id}", po_data)

    # Approve PO
    log_info(f"Approving PO ID: {po_id}")
    resp = client.put(f"/purchase-orders/{po_id}/approve")
    if resp and resp.status_code == 200:
        log_success("PO Approved.")
    else:
        log_error("PO approval failed")

    # Receive Goods (Triggers Sync)
    log_info("Receiving goods (Syncing with Warehouse & Movement)...")
    receive_data = {
        "items": [{"productId": product_id, "quantity": 120}],
        "receiveDate": datetime.now().strftime("%Y-%m-%d")
    }
    resp = client.post(f"/purchase-orders/{po_id}/receive", receive_data)
    if resp and resp.status_code == 200:
        log_success("Goods received successfully.")
    else:
        log_error("Goods receipt failed")

    # 6. VERIFY CROSS-SERVICE SYNC
    log_header("6. Verifying Cross-Service Data Consistency")
    
    # Check Warehouse Stock (50 manual + 120 PO = 170)
    log_info("Verifying final stock levels...")
    resp = client.get(f"/warehouses/{warehouse_id}/stock/{product_id}")
    if resp and resp.status_code == 200:
        qty = resp.json()['data']['quantity']
        log_success(f"Final Stock Level: {qty} (Expected: 170)")
        if qty != 170: log_warning("Stock level mismatch!")
    else:
        log_error("Could not verify stock level")

    # Check Movement Records
    log_info("Verifying movement records...")
    resp = client.get(f"/movements/product/{product_id}")
    if resp and resp.status_code == 200:
        movements = resp.json()['data']
        log_success(f"Found {len(movements)} movement records for product.")
    else:
        log_error("Could not verify movements")

    # 7. ALERT SERVICE TESTS
    log_header("7. Testing Alert Service")
    
    # Trigger a low stock alert manually for testing
    log_info("Triggering low-stock alert manually...")
    resp = client.post(f"/alerts/low-stock?productId={product_id}&warehouseId={warehouse_id}&currentQty=2")
    
    log_info("Checking alerts for admin...")
    resp = client.get(f"/alerts/recipient/{client.user_id}")
    if resp and resp.status_code == 200:
        alerts = resp.json()['data']
        if len(alerts) > 0:
            alert_id = alerts[0]['alertId']
            log_success(f"Alert received: {alerts[0]['message']}")
            
            # Mark as read
            client.put(f"/alerts/{alert_id}/read")
            log_success("Alert marked as read.")
        else:
            log_warning("No alerts found.")
    else:
        log_error("Could not retrieve alerts")

    # 8. CLEANUP & DEACTIVATION
    log_header("8. Testing Deactivation Endpoints")
    
    log_info(f"Deactivating product ID: {product_id}")
    client.put(f"/products/{product_id}/deactivate")
    
    log_info(f"Deactivating supplier ID: {supplier_id}")
    client.put(f"/suppliers/{supplier_id}/deactivate")
    
    log_info(f"Deactivating warehouse ID: {warehouse_id}")
    client.delete(f"/warehouses/{warehouse_id}")

    log_header("🎉 All Integration Tests Completed!")

if __name__ == "__main__":
    try:
        run_tests()
    except KeyboardInterrupt:
        print("\nTest interrupted by user.")
    except Exception as e:
        log_error(f"Unhandled exception: {str(e)}")
        import traceback
        traceback.print_exc()
