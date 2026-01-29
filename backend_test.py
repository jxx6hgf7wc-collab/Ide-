#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
import uuid

class SparkAPITester:
    def __init__(self, base_url="https://creative-genius-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request failed: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "", 200)

    def test_register(self):
        """Test user registration"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_data = {
            "name": "Test User",
            "email": test_email,
            "password": "testpass123"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   📝 Registered user: {test_email}")
            return True
        return False

    def test_login(self):
        """Test user login with existing user"""
        if not self.user_id:
            return False
            
        # Create a new user for login test
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        register_data = {
            "name": "Login Test User",
            "email": test_email,
            "password": "loginpass123"
        }
        
        # Register first
        success, _ = self.run_test("Pre-Login Registration", "POST", "auth/register", 200, register_data)
        if not success:
            return False
            
        # Now test login
        login_data = {
            "email": test_email,
            "password": "loginpass123"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        
        if success and 'token' in response:
            print(f"   📝 Login successful for: {test_email}")
            return True
        return False

    def test_get_me(self):
        """Test get current user endpoint"""
        if not self.token:
            self.log_test("Get Current User", False, "No auth token available")
            return False
            
        return self.run_test("Get Current User", "GET", "auth/me", 200)[0]

    def test_creative_generation(self):
        """Test AI creative generation"""
        if not self.token:
            self.log_test("Creative Generation", False, "No auth token available")
            return False
            
        test_data = {
            "category": "writing",
            "prompt": "A story about a robot learning to paint"
        }
        
        success, response = self.run_test("Creative Generation", "POST", "creative/generate", 200, test_data)
        
        if success and 'suggestion' in response:
            print(f"   🎨 Generated suggestion: {response['suggestion'][:50]}...")
            return True
        return False

    def test_creative_history(self):
        """Test getting creative history"""
        if not self.token:
            self.log_test("Creative History", False, "No auth token available")
            return False
            
        return self.run_test("Creative History", "GET", "creative/history", 200)[0]

    def test_favorites_crud(self):
        """Test favorites CRUD operations"""
        if not self.token:
            self.log_test("Favorites CRUD", False, "No auth token available")
            return False
            
        # Create favorite
        favorite_data = {
            "category": "design",
            "prompt": "Logo for a coffee shop",
            "suggestion": "Consider a minimalist design with coffee bean elements"
        }
        
        success, response = self.run_test("Create Favorite", "POST", "favorites", 200, favorite_data)
        if not success:
            return False
            
        favorite_id = response.get('id')
        if not favorite_id:
            self.log_test("Favorites CRUD", False, "No favorite ID returned")
            return False
            
        # Get favorites
        success, _ = self.run_test("Get Favorites", "GET", "favorites", 200)
        if not success:
            return False
            
        # Delete favorite
        success, _ = self.run_test("Delete Favorite", "DELETE", f"favorites/{favorite_id}", 200)
        return success

    def test_theme_update(self):
        """Test theme update"""
        if not self.token:
            self.log_test("Theme Update", False, "No auth token available")
            return False
            
        theme_data = {"theme": "dark"}
        success, response = self.run_test("Update Theme", "PUT", "settings/theme", 200, theme_data)
        
        if success and response.get('theme') == 'dark':
            print(f"   🎨 Theme updated to: dark")
            return True
        return False

    def test_invalid_endpoints(self):
        """Test error handling for invalid requests"""
        # Test invalid category
        invalid_data = {
            "category": "invalid_category",
            "prompt": "Test prompt"
        }
        
        success, _ = self.run_test("Invalid Category", "POST", "creative/generate", 400, invalid_data)
        return success

    def test_unauthorized_access(self):
        """Test unauthorized access"""
        # Temporarily remove token
        original_token = self.token
        self.token = None
        
        success, _ = self.run_test("Unauthorized Access", "GET", "auth/me", 401)
        
        # Restore token
        self.token = original_token
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Spark API Tests...")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 50)
        
        # Basic connectivity
        self.test_root_endpoint()
        
        # Authentication tests
        self.test_register()
        self.test_login()
        self.test_get_me()
        
        # Core functionality tests
        self.test_creative_generation()
        self.test_creative_history()
        self.test_favorites_crud()
        self.test_theme_update()
        
        # Error handling tests
        self.test_invalid_endpoints()
        self.test_unauthorized_access()
        
        # Print summary
        print("=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed!")
            return 1

def main():
    tester = SparkAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())