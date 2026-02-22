"""
Device Identity Module - Generates stable device UUID based on machine hardware
"""

import hashlib
import platform
import socket
import uuid
import json
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class DeviceIdentity:
    """Generate and manage stable device identification"""
    
    def __init__(self, storage_path: str = ".device_identity.json"):
        self.storage_path = Path(storage_path)
        self.device_uuid = None
        self.device_info = {}
    
    def get_mac_address(self) -> str:
        """Get primary MAC address"""
        try:
            import uuid
            mac = uuid.getnode()
            return ':'.join(['{:02x}'.format((mac >> ele) & 0xff) for ele in range(0, 48, 8)][::-1])
        except Exception as e:
            logger.warning(f"Could not get MAC address: {e}")
            return "unknown"
    
    def get_hostname(self) -> str:
        """Get device hostname"""
        try:
            return socket.gethostname()
        except Exception as e:
            logger.warning(f"Could not get hostname: {e}")
            return "unknown"
    
    def get_os_info(self) -> dict:
        """Get OS and version information"""
        try:
            return {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
                "processor": platform.processor()
            }
        except Exception as e:
            logger.warning(f"Could not get OS info: {e}")
            return {}
    
    def get_cpu_info(self) -> str:
        """Get CPU model information"""
        try:
            import cpuinfo
            cpu = cpuinfo.get_cpu_info()
            return cpu.get('brand_raw', 'unknown')
        except ImportError:
            # Fallback if cpuinfo not available
            try:
                return platform.processor() or "unknown"
            except Exception:
                return "unknown"
        except Exception as e:
            logger.warning(f"Could not get CPU info: {e}")
            return "unknown"
    
    def generate_device_uuid(self) -> str:
        """
        Generate stable device UUID by hashing hardware identifiers
        
        Components (in order of priority):
        1. MAC address (most reliable)
        2. Hostname
        3. OS information
        4. CPU info
        
        Returns:
            SHA256 hash of combined identifiers
        """
        try:
            # Collect hardware identifiers
            mac = self.get_mac_address()
            hostname = self.get_hostname()
            os_info = self.get_os_info()
            cpu = self.get_cpu_info()
            
            # Store device info for reference
            self.device_info = {
                "mac_address": mac,
                "hostname": hostname,
                "os": os_info.get("system", "unknown"),
                "os_release": os_info.get("release", "unknown"),
                "os_version": os_info.get("version", "unknown"),
                "machine": os_info.get("machine", "unknown"),
                "processor": os_info.get("processor", "unknown"),
                "cpu": cpu
            }
            
            # Create composite hash
            composite = f"{mac}:{hostname}:{os_info.get('release', '')}:{cpu}"
            device_uuid = hashlib.sha256(composite.encode()).hexdigest()
            
            self.device_uuid = device_uuid
            logger.info(f"Generated device UUID: {device_uuid[:16]}...")
            
            return device_uuid
        
        except Exception as e:
            logger.error(f"Error generating device UUID: {e}")
            raise
    
    def load_from_storage(self) -> str:
        """
        Load stored device UUID from file
        
        Returns:
            Device UUID if exists, None otherwise
        """
        try:
            if self.storage_path.exists():
                with open(self.storage_path, 'r') as f:
                    data = json.load(f)
                    self.device_uuid = data.get('device_uuid')
                    self.device_info = data.get('device_info', {})
                    logger.info(f"Loaded device UUID from storage: {self.device_uuid[:16]}...")
                    return self.device_uuid
        except Exception as e:
            logger.warning(f"Could not load device UUID from storage: {e}")
        
        return None
    
    def save_to_storage(self) -> bool:
        """
        Persist device UUID to local file
        
        Returns:
            True if successful, False otherwise
        """
        try:
            data = {
                "device_uuid": self.device_uuid,
                "device_info": self.device_info,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            
            with open(self.storage_path, 'w') as f:
                json.dump(data, f, indent=2)
            
            # Restrict file permissions (Unix-like systems)
            try:
                os.chmod(self.storage_path, 0o600)
            except:
                pass  # Windows doesn't support chmod the same way
            
            logger.info(f"Device UUID saved to {self.storage_path}")
            return True
        
        except Exception as e:
            logger.error(f"Could not save device UUID to storage: {e}")
            return False
    
    def get_or_create_uuid(self) -> str:
        """
        Get device UUID, creating and storing if it doesn't exist
        
        Returns:
            Device UUID (persisted)
        """
        # Try to load from storage first
        uuid_from_storage = self.load_from_storage()
        if uuid_from_storage:
            return uuid_from_storage
        
        # Generate new UUID
        uuid_new = self.generate_device_uuid()
        
        # Persist to storage
        self.save_to_storage()
        
        return uuid_new
    
    def get_device_info(self) -> dict:
        """Get detailed device information"""
        return {
            "device_uuid": self.device_uuid,
            **self.device_info
        }


# Import after class definition to avoid circular imports
from datetime import datetime, timezone
