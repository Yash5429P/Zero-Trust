"""
Setup script for Zero Trust Agent
Install and test the agent
"""

import subprocess
import sys
import os
from pathlib import Path


def install_dependencies():
    """Install required Python packages"""
    print("Installing dependencies...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    print("✅ Dependencies installed")


def test_imports():
    """Test that all imports work"""
    print("\nTesting imports...")
    try:
        import requests
        import psutil
        print(f"  ✅ requests v{requests.__version__}")
        print(f"  ✅ psutil v{psutil.__version__}")
        
        from device_identity import DeviceIdentity
        print("  ✅ device_identity module")
        
        from telemetry import SystemTelemetry
        print("  ✅ telemetry module")
        
        print("✅ All imports successful")
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False


def verify_config():
    """Verify config.json exists and is valid"""
    print("\nVerifying configuration...")
    config_file = Path("config.json")
    
    if not config_file.exists():
        print("❌ config.json not found")
        return False
    
    try:
        import json
        with open(config_file, 'r') as f:
            config = json.load(f)
        print(f"  ✅ Backend URL: {config.get('backend_url')}")
        print(f"  ✅ Heartbeat interval: {config.get('heartbeat_interval')}s")
        print("✅ Configuration valid")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return False


def test_device_identity():
    """Test device identity generation"""
    print("\nTesting device identity...")
    try:
        from device_identity import DeviceIdentity
        
        device = DeviceIdentity(storage_path=".device_identity_test.json")
        uuid = device.generate_device_uuid()
        
        print(f"  ✅ Generated UUID: {uuid[:16]}...")
        print(f"  ✅ Device info: {device.get_device_info()}")
        
        # Clean up test file
        Path(".device_identity_test.json").unlink(missing_ok=True)
        
        print("✅ Device identity test passed")
        return True
    except Exception as e:
        print(f"❌ Device identity test failed: {e}")
        return False


def test_telemetry():
    """Test telemetry collection"""
    print("\nTesting telemetry collection...")
    try:
        from telemetry import SystemTelemetry
        
        telemetry = SystemTelemetry()
        
        print("  Testing CPU metrics...")
        cpu = telemetry.get_cpu_usage()
        print(f"    ✅ CPU usage: {cpu.get('percent')}%")
        
        print("  Testing memory metrics...")
        mem = telemetry.get_memory_usage()
        print(f"    ✅ Memory used: {mem['virtual']['percent']}%")
        
        print("  Testing disk metrics...")
        disk = telemetry.get_disk_usage()
        print(f"    ✅ Disk count: {len(disk['disks'])} partition(s)")
        
        print("  Testing logged-in users...")
        users = telemetry.get_logged_in_users()
        print(f"    ✅ Users logged in: {len(users)}")
        
        print("✅ Telemetry test passed")
        return True
    except Exception as e:
        print(f"⚠️  Telemetry test warning: {e}")
        return True  # Don't fail on telemetry issues


def main():
    """Run all setup tests"""
    print("=" * 60)
    print("Zero Trust Agent - Setup & Verification")
    print("=" * 60)
    
    tests = [
        ("Dependencies", install_dependencies),
        ("Imports", test_imports),
        ("Configuration", verify_config),
        ("Device Identity", test_device_identity),
        ("Telemetry", test_telemetry),
    ]
    
    results = []
    
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"❌ {name} test failed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("Setup Verification Summary")
    print("=" * 60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    all_passed = all(result for _, result in results)
    
    print("=" * 60)
    
    if all_passed:
        print("\n✅ All checks passed! You can now run:")
        print("   python agent.py")
        return 0
    else:
        print("\n❌ Some checks failed. Please fix the issues above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
