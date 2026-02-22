#!/usr/bin/env python3
"""
Zero Trust Agent Executable Builder
Creates a standalone executable for distribution to user devices
"""

import sys
import os
from pathlib import Path

def check_dependencies():
    """Check if required packages are installed"""
    required = ["PyInstaller"]
    missing = []
    
    for package in required:
        try:
            __import__(package.lower().replace("-", "_"))
        except ImportError:
            missing.append(package)
    
    if missing:
        print(f"❌ Missing packages: {', '.join(missing)}")
        print(f"Install with: pip install {' '.join(missing)}")
        return False
    return True

def build_executable():
    """Build the agent executable using PyInstaller"""
    try:
        import PyInstaller.__main__
        
        agent_dir = Path(__file__).parent
        main_file = agent_dir / "agent" / "main.py"
        output_dir = agent_dir / "dist"
        
        if not main_file.exists():
            print(f"❌ Error: {main_file} not found")
            return False
        
        print("🔨 Building Zero Trust Agent executable...")
        print(f"📁 Source: {main_file}")
        print(f"📦 Output: {output_dir}")
        
        # Build command
        PyInstaller.__main__.run([
            str(main_file),
            "--name=zero-trust-agent",
            "--onefile",
            "--windowed",
            f"--distpath={output_dir}",
            "--clean",
            "--add-data=config.json:.",
            "--hidden-import=psutil",
            "--hidden-import=wmi",
            "--hidden-import=requests",
            "--icon=NONE",  # No icon specified
            "--version-file=NONE",
        ])
        
        exe_path = output_dir / "zero-trust-agent.exe"
        if exe_path.exists():
            print(f"✅ Build successful!")
            print(f"📥 Executable: {exe_path}")
            return True
        else:
            print(f"❌ Build failed - executable not created")
            return False
            
    except Exception as e:
        print(f"❌ Build error: {str(e)}")
        return False

def copy_to_backend():
    """Copy the built executable to backend for distribution"""
    try:
        agent_dir = Path(__file__).parent
        exe_path = agent_dir / "dist" / "zero-trust-agent.exe"
        backend_dir = agent_dir.parent / "backend"
        backend_exe = backend_dir / "zero-trust-agent.exe"
        
        if not exe_path.exists():
            print(f"⚠️  Executable not found at {exe_path}")
            return False
        
        import shutil
        shutil.copy2(exe_path, backend_exe)
        print(f"✅ Executable copied to backend: {backend_exe}")
        return True
        
    except Exception as e:
        print(f"❌ Copy error: {str(e)}")
        return False

def main():
    """Main build process"""
    print("=" * 60)
    print("Zero Trust Agent - Executable Builder")
    print("=" * 60)
    print()
    
    # Check dependencies
    if not check_dependencies():
        print("\nInstall missing dependencies and try again:")
        print("  pip install PyInstaller")
        return 1
    
    # Build executable
    if not build_executable():
        return 1
    
    # Copy to backend
    if not copy_to_backend():
        print("⚠️  Warning: Could not copy to backend (non-critical)")
    
    print()
    print("=" * 60)
    print("✅ Build complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("1. The agent executable is ready in the backend folder")
    print("2. Users can download it from the Dashboard")
    print("3. Run with administrator privileges on target device")
    print()
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
