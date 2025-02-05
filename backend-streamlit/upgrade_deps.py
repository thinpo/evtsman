#!/usr/bin/env python3

import subprocess
import sys
import os
import venv
from pathlib import Path
import difflib

def run_command(command):
    """Run a command and return its output"""
    try:
        result = subprocess.run(
            command,
            shell=True,
            check=True,
            capture_output=True,
            text=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {command}")
        print(f"Error output: {e.stderr}")
        sys.exit(1)

def main():
    print("🔄 Starting dependency upgrade process...")
    
    # Get the virtual environment path
    venv_path = Path("venv")
    
    # Check if virtual environment exists
    if not venv_path.exists():
        print("📦 Creating virtual environment...")
        venv.create(venv_path, with_pip=True)
    
    # Get the pip path
    if sys.platform == "win32":
        pip_path = venv_path / "Scripts" / "pip"
        python_path = venv_path / "Scripts" / "python"
    else:
        pip_path = venv_path / "bin" / "pip"
        python_path = venv_path / "bin" / "python"
    
    # Upgrade pip itself
    print("⬆️  Upgrading pip...")
    run_command(f"{python_path} -m pip install --upgrade pip")
    
    # Backup current requirements
    print("📝 Backing up current requirements...")
    current_reqs = run_command(f"{pip_path} freeze")
    with open("requirements.backup.txt", "w") as f:
        f.write(current_reqs)
    
    # Upgrade all packages
    print("🔄 Upgrading all packages...")
    run_command(f"{python_path} -m pip install --upgrade -r requirements.txt")
    
    # Generate new requirements file
    print("📝 Updating requirements.txt with new versions...")
    new_reqs = run_command(f"{pip_path} freeze")
    with open("requirements.txt.new", "w") as f:
        f.write(new_reqs)
    
    # Show diff between old and new requirements
    print("📊 Changes in dependencies:")
    with open("requirements.backup.txt", "r") as f:
        old_reqs = f.readlines()
    with open("requirements.txt.new", "r") as f:
        new_reqs = f.readlines()
    
    for line in difflib.unified_diff(old_reqs, new_reqs, fromfile='old', tofile='new'):
        if line.startswith('+'):
            print(f"\033[92m{line.strip()}\033[0m")  # Green for additions
        elif line.startswith('-'):
            print(f"\033[91m{line.strip()}\033[0m")  # Red for removals
        else:
            print(line.strip())
    
    # Replace old requirements with new ones
    os.replace("requirements.txt.new", "requirements.txt")
    os.remove("requirements.backup.txt")
    
    print("\n✅ Upgrade complete! New versions are saved in requirements.txt")
    print("🔍 Please test the application to ensure everything works correctly.")

if __name__ == "__main__":
    main() 