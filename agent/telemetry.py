"""
Telemetry Module - Collects system metrics and events
"""

import psutil
import logging
import os
import platform
from datetime import datetime, timezone
from typing import Dict, List, Any
import subprocess

logger = logging.getLogger(__name__)


class SystemTelemetry:
    """Collect system performance and resource telemetry"""
    
    def __init__(self):
        self.last_disk_io = {}
        self.last_net_io = {}
        self.last_check = datetime.now(timezone.utc)
    
    def get_cpu_usage(self) -> Dict[str, float]:
        """
        Get CPU usage metrics
        
        Returns:
            Dict with cpu_percent, per_cpu_percent, count, and load_average
        """
        try:
            return {
                "percent": psutil.cpu_percent(interval=1),
                "per_cpu": psutil.cpu_percent(interval=0.1, percpu=True),
                "count": psutil.cpu_count(),
                "count_logical": psutil.cpu_count(logical=False),
                "load_average": os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            }
        except Exception as e:
            logger.error(f"Error getting CPU usage: {e}")
            return {}
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """
        Get memory usage metrics
        
        Returns:
            Dict with total, available, percent_used, used, free
        """
        try:
            mem = psutil.virtual_memory()
            swap = psutil.swap_memory()
            
            return {
                "virtual": {
                    "total_mb": mem.total / (1024 ** 2),
                    "available_mb": mem.available / (1024 ** 2),
                    "used_mb": mem.used / (1024 ** 2),
                    "free_mb": mem.free / (1024 ** 2),
                    "percent": mem.percent
                },
                "swap": {
                    "total_mb": swap.total / (1024 ** 2),
                    "used_mb": swap.used / (1024 ** 2),
                    "free_mb": swap.free / (1024 ** 2),
                    "percent": swap.percent
                }
            }
        except Exception as e:
            logger.error(f"Error getting memory usage: {e}")
            return {}
    
    def get_disk_usage(self) -> Dict[str, Any]:
        """
        Get disk usage metrics for all mounted partitions
        
        Returns:
            Dict with disk partitions and usage
        """
        try:
            disks = {}
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disks[partition.device] = {
                        "mountpoint": partition.mountpoint,
                        "fstype": partition.fstype,
                        "total_gb": usage.total / (1024 ** 3),
                        "used_gb": usage.used / (1024 ** 3),
                        "free_gb": usage.free / (1024 ** 3),
                        "percent": usage.percent
                    }
                except PermissionError:
                    pass  # Skip partitions we can't access
            
            return {"disks": disks}
        except Exception as e:
            logger.error(f"Error getting disk usage: {e}")
            return {}
    
    def get_process_count(self) -> Dict[str, int]:
        """
        Get running process count
        
        Returns:
            Dict with total and by-status process counts
        """
        try:
            processes = psutil.pids()
            return {
                "total": len(processes),
                "running": len([p for p in processes if psutil.Process(p).status() == psutil.STATUS_RUNNING]),
                "sleeping": len([p for p in processes if psutil.Process(p).status() == psutil.STATUS_SLEEPING])
            }
        except Exception as e:
            logger.error(f"Error getting process count: {e}")
            return {}
    
    def get_network_connections(self) -> Dict[str, Any]:
        """
        Get network connection summary
        
        Returns:
            Dict with connection counts by state
        """
        try:
            connections = psutil.net_connections()
            states = {}
            
            for conn in connections:
                status = conn.status
                states[status] = states.get(status, 0) + 1
            
            return {
                "total": len(connections),
                "by_state": states
            }
        except Exception as e:
            logger.error(f"Error getting network connections: {e}")
            return {}
    
    def get_logged_in_users(self) -> List[Dict[str, Any]]:
        """
        Get list of logged-in users
        
        Returns:
            List of dicts with username, terminal, host, start_time
        """
        try:
            users = []
            for user in psutil.users():
                users.append({
                    "username": user.name,
                    "terminal": user.terminal,
                    "host": user.host,
                    "started_at": datetime.fromtimestamp(user.started).isoformat()
                })
            return users
        except Exception as e:
            logger.error(f"Error getting logged-in users: {e}")
            return []
    
    def get_usb_devices(self) -> List[Dict[str, str]]:
        """
        Get list of connected USB devices (platform-specific)
        
        Returns:
            List of connected USB devices with info
        """
        devices = []
        
        try:
            if platform.system() == "Windows":
                # Windows: Use wmic
                result = subprocess.run(
                    ['wmic', 'logicaldisk', 'get', 'name'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    for line in result.stdout.strip().split('\n')[1:]:
                        if line.strip():
                            devices.append({
                                "type": "usb_drive",
                                "device": line.strip(),
                                "detected_at": datetime.now(timezone.utc).isoformat()
                            })
            
            elif platform.system() == "Linux":
                # Linux: Check /dev/disk/by-id for USB devices
                try:
                    result = subprocess.run(
                        ['lsblk', '-o', 'NAME,TYPE,TRAN'],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    for line in result.stdout.strip().split('\n')[1:]:
                        if 'usb' in line.lower():
                            devices.append({
                                "type": "usb",
                                "info": line.strip(),
                                "detected_at": datetime.now(timezone.utc).isoformat()
                            })
                except:
                    pass
            
            elif platform.system() == "Darwin":
                # macOS: Use system_profiler
                try:
                    result = subprocess.run(
                        ['system_profiler', 'SPUSBDataType'],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if result.returncode == 0:
                        devices.append({
                            "type": "usb_devices",
                            "data": result.stdout[:500],  # First 500 chars
                            "detected_at": datetime.now(timezone.utc).isoformat()
                        })
                except:
                    pass
        
        except Exception as e:
            logger.warning(f"Could not enumerate USB devices: {e}")
        
        return devices
    
    def collect_all_telemetry(self) -> Dict[str, Any]:
        """
        Collect all system telemetry
        
        Returns:
            Comprehensive telemetry dictionary
        """
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "cpu": self.get_cpu_usage(),
            "memory": self.get_memory_usage(),
            "disk": self.get_disk_usage(),
            "processes": self.get_process_count(),
            "network": self.get_network_connections(),
            "logged_in_users": self.get_logged_in_users(),
            "usb_devices": self.get_usb_devices()
        }
