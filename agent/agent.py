"""
Zero Trust Endpoint Agent - Main agent logic
Registers with backend and sends periodic heartbeats with telemetry
"""

import logging
import json
import time
import threading
import requests
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional
import sys

from device_identity import DeviceIdentity
from telemetry import SystemTelemetry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('agent.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class ZeroTrustAgent:
    """Main agent class - manages registration, heartbeats, and telemetry"""
    
    def __init__(self, config_path: str = "config.json"):
        """
        Initialize the agent
        
        Args:
            config_path: Path to configuration file
        """
        self.config = self._load_config(config_path)
        self.device_identity = DeviceIdentity(storage_path=self.config['device_id_storage'])
        self.telemetry = SystemTelemetry()
        
        self.device_uuid = None
        self.agent_token = None
        self.registered = False
        self.running = False
        self.heartbeat_thread = None
        
        # Get or create device UUID
        self.device_uuid = self.device_identity.get_or_create_uuid()
        logger.info(f"Agent initialized with device UUID: {self.device_uuid[:16]}...")
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from JSON file"""
        try:
            if not Path(config_path).exists():
                logger.error(f"Config file not found: {config_path}")
                raise FileNotFoundError(f"Config file not found: {config_path}")
            
            with open(config_path, 'r') as f:
                config = json.load(f)
            
            logger.info(f"Configuration loaded from {config_path}")
            return config
        
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in config file: {e}")
            raise
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            raise
    
    def register_with_backend(self) -> bool:
        """
        Register device with backend
        
        Returns:
            True if registration successful, False otherwise
        """
        try:
            backend_url = self.config['backend_url']
            register_endpoint = f"{backend_url}/agent/register"
            
            payload = {
                "device_uuid": self.device_uuid,
                "device_info": self.device_identity.get_device_info(),
                "agent_version": self.config['agent_version']
            }
            
            logger.info(f"Registering with backend: {register_endpoint}")
            
            response = requests.post(
                register_endpoint,
                json=payload,
                timeout=self.config['request_timeout']
            )
            
            if response.status_code == 200:
                data = response.json()
                self.agent_token = data.get('agent_token')
                
                # Save agent token
                self._save_agent_token(self.agent_token)
                
                logger.info(f"✅ Successfully registered with backend")
                self.registered = True
                return True
            
            elif response.status_code == 400:
                logger.warning(f"Registration failed (400): {response.json()}")
                return False
            
            else:
                logger.error(f"Registration failed ({response.status_code}): {response.text}")
                return False
        
        except requests.Timeout:
            logger.error(f"Registration timeout (>{self.config['request_timeout']}s)")
            return False
        except requests.ConnectionError as e:
            logger.error(f"Connection error during registration: {e}")
            return False
        except Exception as e:
            logger.error(f"Error registering with backend: {e}")
            return False
    
    def send_heartbeat(self) -> bool:
        """
        Send heartbeat with telemetry to backend
        
        Returns:
            True if heartbeat successful, False otherwise
        """
        if not self.registered or not self.agent_token:
            logger.warning("Agent not registered yet, skipping heartbeat")
            return False
        
        try:
            backend_url = self.config['backend_url']
            heartbeat_endpoint = f"{backend_url}/agent/heartbeat"
            
            # Collect telemetry
            telemetry_data = self.telemetry.collect_all_telemetry()
            
            payload = {
                "device_uuid": self.device_uuid,
                "agent_token": self.agent_token,
                "telemetry": telemetry_data,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
            response = requests.post(
                heartbeat_endpoint,
                json=payload,
                timeout=self.config['request_timeout']
            )
            
            if response.status_code == 200:
                logger.debug("✅ Heartbeat sent successfully")
                return True
            
            elif response.status_code == 401:
                logger.warning("Agent token invalid, re-registering...")
                self.registered = False
                self.register_with_backend()
                return False
            
            else:
                logger.warning(f"Heartbeat failed ({response.status_code}): {response.text}")
                return False
        
        except requests.Timeout:
            logger.error(f"Heartbeat timeout (>{self.config['request_timeout']}s)")
            return False
        except requests.ConnectionError as e:
            logger.error(f"Connection error during heartbeat: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending heartbeat: {e}")
            return False
    
    def _heartbeat_loop(self):
        """Periodic heartbeat loop"""
        heartbeat_interval = self.config['heartbeat_interval']
        
        logger.info(f"Heartbeat loop started (interval: {heartbeat_interval}s)")
        
        while self.running:
            try:
                self.send_heartbeat()
                
                # Sleep in small increments to allow quick shutdown
                remaining = heartbeat_interval
                while remaining > 0 and self.running:
                    time.sleep(min(1, remaining))
                    remaining -= 1
            
            except Exception as e:
                logger.error(f"Error in heartbeat loop: {e}")
                time.sleep(5)  # Wait before retrying
    
    def start(self) -> bool:
        """
        Start the agent
        
        Returns:
            True if started successfully, False otherwise
        """
        try:
            logger.info("Starting Zero Trust Agent...")
            
            # Register with backend
            if not self.register_with_backend():
                logger.error("Failed to register with backend")
                return False
            
            # Start heartbeat thread
            self.running = True
            self.heartbeat_thread = threading.Thread(
                target=self._heartbeat_loop,
                daemon=True,
                name="HeartbeatThread"
            )
            self.heartbeat_thread.start()
            
            logger.info("✅ Agent started successfully")
            return True
        
        except Exception as e:
            logger.error(f"Error starting agent: {e}")
            return False
    
    def stop(self):
        """Stop the agent gracefully"""
        logger.info("Stopping Zero Trust Agent...")
        
        self.running = False
        
        # Wait for heartbeat thread to finish
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            self.heartbeat_thread.join(timeout=5)
        
        logger.info("✅ Agent stopped")
    
    def _save_agent_token(self, token: str):
        """Save agent token to secure file"""
        try:
            token_file = Path(self.config['agent_token_storage'])
            
            with open(token_file, 'w') as f:
                json.dump({"agent_token": token}, f)
            
            # Restrict file permissions
            try:
                import os
                os.chmod(token_file, 0o600)
            except:
                pass
            
            logger.info(f"Agent token saved to {token_file}")
        
        except Exception as e:
            logger.error(f"Error saving agent token: {e}")
    
    def _load_agent_token(self) -> Optional[str]:
        """Load saved agent token"""
        try:
            token_file = Path(self.config['agent_token_storage'])
            
            if token_file.exists():
                with open(token_file, 'r') as f:
                    data = json.load(f)
                    return data.get('agent_token')
        
        except Exception as e:
            logger.warning(f"Could not load agent token: {e}")
        
        return None
    
    def run(self):
        """Run agent continuously (blocking)"""
        try:
            if not self.start():
                logger.error("Failed to start agent")
                return
            
            logger.info("Agent running... Press Ctrl+C to stop")
            
            # Keep main thread alive
            while self.running:
                time.sleep(1)
        
        except KeyboardInterrupt:
            logger.info("Received interrupt signal")
        
        finally:
            self.stop()


def main():
    """Main entry point"""
    try:
        agent = ZeroTrustAgent(config_path="config.json")
        agent.run()
    
    except FileNotFoundError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)
    
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
