"""
Utility functions for PHASE 1: Session Tracking & Geolocation
"""
import httpx
import json
import ipaddress
from user_agents import parse
from fastapi import Request
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# IP ADDRESS EXTRACTION
# =============================================================================

def get_client_ip(request: Request) -> str:
    """
    Extract client IP address from request, handling proxies and load balancers
    
    Priority order:
    1. X-Forwarded-For header (common with proxies)
    2. X-Real-IP header (nginx)
    3. request.client.host (direct connection)
    """
    # Check X-Forwarded-For header (can contain multiple IPs)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Take the first IP (original client)
        return forwarded_for.split(",")[0].strip()
    
    # Check X-Real-IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    
    # Fallback to direct connection
    if request.client and request.client.host:
        return request.client.host
    
    return "unknown"


# =============================================================================
# USER AGENT PARSING
# =============================================================================

def parse_user_agent(user_agent_string: str) -> Dict[str, Optional[str]]:
    """
    Parse user agent string to extract browser, OS, and device information
    
    Returns:
        {
            "browser": "Chrome 120.0",
            "os": "Windows 10",
            "device": "PC",
            "full_string": "Mozilla/5.0..."
        }
    """
    try:
        ua = parse(user_agent_string)
        
        # Get browser info
        browser = f"{ua.browser.family} {ua.browser.version_string}" if ua.browser.family else "Unknown Browser"
        
        # Get OS info
        os = f"{ua.os.family} {ua.os.version_string}" if ua.os.family else "Unknown OS"
        
        # Get device type
        if ua.is_mobile:
            device = f"Mobile - {ua.device.family}" if ua.device.family else "Mobile"
        elif ua.is_tablet:
            device = f"Tablet - {ua.device.family}" if ua.device.family else "Tablet"
        elif ua.is_pc:
            device = "PC"
        elif ua.is_bot:
            device = f"Bot - {ua.device.family}" if ua.device.family else "Bot"
        else:
            device = "Unknown Device"
        
        return {
            "browser": browser,
            "os": os,
            "device": device,
            "full_string": user_agent_string
        }
    except Exception as e:
        logger.error(f"Error parsing user agent: {e}")
        return {
            "browser": "Unknown Browser",
            "os": "Unknown OS",
            "device": "Unknown Device",
            "full_string": user_agent_string
        }


def get_user_agent_info(request: Request) -> Dict[str, Optional[str]]:
    """Extract and parse user agent from request"""
    user_agent_string = request.headers.get("User-Agent", "Unknown")
    return parse_user_agent(user_agent_string)


# =============================================================================
# GEOLOCATION FROM IP
# =============================================================================

async def get_location_from_ip(ip_address: str) -> Dict[str, Optional[str]]:
    """
    Fetch geolocation data from IP address using ipapi.co (HTTPS, free tier)

    Returns:
        {
            "country": "United States",
            "city": "New York",
            "region": "New York",
            "timezone": "America/New_York",
            "isp": "AT&T Services"
        }

    Note:
    - For local/dev, IP will be private and return "Local"
    - For real-world accuracy, ensure your proxy forwards X-Forwarded-For
    """
    # Skip localhost/private IPs
    if ip_address in ["localhost", "unknown"]:
        return {
            "country": "Local",
            "city": "Local",
            "region": "Local",
            "timezone": "UTC",
            "isp": "Local Network"
        }

    try:
        ip_obj = ipaddress.ip_address(ip_address)
        if ip_obj.is_private or ip_obj.is_loopback:
            return {
                "country": "Local",
                "city": "Local",
                "region": "Local",
                "timezone": "UTC",
                "isp": "Local Network"
            }
    except ValueError:
        return {
            "country": "Local",
            "city": "Local",
            "region": "Local",
            "timezone": "UTC",
            "isp": "Local Network"
        }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"https://ipapi.co/{ip_address}/json/")

            if response.status_code == 200:
                data = response.json()

                if not data.get("error"):
                    return {
                        "country": data.get("country_name", "Unknown"),
                        "city": data.get("city", "Unknown"),
                        "region": data.get("region", "Unknown"),
                        "timezone": data.get("timezone", "UTC"),
                        "isp": data.get("org", "Unknown")
                    }
    except Exception as e:
        logger.error(f"Geolocation API error for IP {ip_address}: {e}")

    # Fallback if API fails
    return {
        "country": "Unknown",
        "city": "Unknown",
        "region": "Unknown",
        "timezone": "UTC",
        "isp": "Unknown"
    }


def get_location_string(location_data: Dict[str, Optional[str]]) -> str:
    """Format location data as a readable string"""
    city = location_data.get("city", "Unknown")
    country = location_data.get("country", "Unknown")
    
    if city and country and city != "Unknown" and country != "Unknown":
        return f"{city}, {country}"
    elif country and country != "Unknown":
        return country
    else:
        return "Unknown Location"


# =============================================================================
# RISK SCORING
# =============================================================================

def calculate_login_risk_score(
    different_country: bool,
    multiple_failed_attempts: bool,
    new_device: bool,
    multiple_simultaneous_sessions: bool
) -> int:
    """
    PHASE 2 risk scoring (integer points):
    - Different country login: +4
    - Multiple failed attempts: +3
    - New device: +2
    - Multiple simultaneous sessions: +2
    """
    risk_score = 0

    if different_country:
        risk_score += 4
    if multiple_failed_attempts:
        risk_score += 3
    if new_device:
        risk_score += 2
    if multiple_simultaneous_sessions:
        risk_score += 2

    return risk_score


def get_risk_status(risk_score: int) -> str:
    """Auto-flag as suspicious when risk_score >= 5"""
    return "suspicious" if risk_score >= 5 else "normal"


def parse_login_ip_history(raw: str) -> list[str]:
    if not raw:
        return []
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [str(ip) for ip in data]
    except Exception:
        return []
    return []


def update_login_ip_history(user, ip_address: str) -> str:
    """Append IP to history, keep last 10 entries, return JSON string."""
    history = parse_login_ip_history(user.login_ip_history)
    history.append(ip_address)
    history = history[-10:]
    return json.dumps(history)


# =============================================================================
# SESSION HELPERS
# =============================================================================

def generate_session_summary(session) -> str:
    """Generate human-readable session summary"""
    return f"{session.device} from {session.city or 'Unknown'}, {session.country or 'Unknown'} ({session.ip_address})"


# =============================================================================
# AGENT TRUST SCORE MANAGEMENT
# =============================================================================

def calculate_agent_trust_score(
    current_score: float,
    last_seen_at: Optional[object] = None,
    suspicious_flag: bool = False
) -> float:
    """
    Calculate updated device trust score based on agent activity.
    
    Rules:
    - If no heartbeat for >2 minutes: score -= 20 (stale device)
    - If suspicious flag in telemetry: score -= 30 (anomaly detected)
    - Minimum trust_score = 0
    - Maximum = 100
    
    Args:
        current_score: Current trust score (0-100)
        last_seen_at: Datetime of last heartbeat. If None or older than 2 min, apply penalty
        suspicious_flag: Whether telemetry indicates suspicious activity
        
    Returns:
        Updated trust score (0-100)
    """
    from datetime import datetime, timezone, timedelta
    
    updated_score = current_score
    now = datetime.now(timezone.utc)
    
    # Check if device is stale (>2 minutes without heartbeat)
    if last_seen_at:
        try:
            # Ensure last_seen_at is timezone-aware
            if last_seen_at.tzinfo is None:
                last_seen_at = last_seen_at.replace(tzinfo=timezone.utc)
            
            time_since_last_seen = now - last_seen_at
            if time_since_last_seen > timedelta(minutes=2):
                updated_score -= 20
                logger.warning(f"Device stale for {time_since_last_seen}. Score penalty applied.")
        except Exception as e:
            logger.error(f"Error calculating stale device score: {e}")
    
    # Apply penalty for suspicious telemetry
    if suspicious_flag:
        updated_score -= 30
        logger.warning("Suspicious telemetry detected. Score penalty applied.")
    
    # Enforce bounds
    updated_score = max(0, min(100, updated_score))
    
    return updated_score


def verify_agent_token(token: str, agent_token_hash: str) -> bool:
    """
    Verify agent token matches stored hash.
    
    Args:
        token: JWT token from request
        agent_token_hash: Stored SHA256 hash of token
        
    Returns:
        True if tokens match, False otherwise
    """
    import hashlib
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    return token_hash == agent_token_hash


def hash_agent_token(token: str) -> str:
    """
    Create SHA256 hash of agent token for secure storage.
    
    PHASE B: Updated to work with secret tokens (not JWT).
    Secret tokens are random 64-byte values, hashed with SHA256.
    
    Args:
        token: Secret token to hash
        
    Returns:
        SHA256 hex digest
    """
    import hashlib
    return hashlib.sha256(token.encode()).hexdigest()


# =============================================================================
# PHASE B: SECURE SECRET TOKEN GENERATION
# =============================================================================

def generate_agent_token() -> str:
    """
    Generate cryptographically secure random token for agent authentication.
    
    PHASE B: Replace JWT with random secret token.
    
    Returns:
        128-character hex string (64 random bytes)
        
    Example:
        Token: "a7f3c9e2b1d4f6a8c0e1f2d3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1"
    """
    import secrets
    # Generate 64 random bytes, return as hex string (128 chars)
    return secrets.token_hex(64)


def validate_agent_token_rotation(
    agent_token_rotated_at: Optional[object],
    max_age_days: int = 90
) -> bool:
    """
    Check if agent token needs rotation based on age.
    
    PHASE B: Force token rotation every N days for security.
    
    Args:
        agent_token_rotated_at: Datetime of last rotation
        max_age_days: Maximum token age in days (default 90)
        
    Returns:
        True if token requires rotation, False if still valid
    """
    from datetime import datetime, timezone, timedelta
    
    if agent_token_rotated_at is None:
        # Never rotated - must rotate now
        return True
    
    try:
        # Ensure timezone-aware
        if agent_token_rotated_at.tzinfo is None:
            agent_token_rotated_at = agent_token_rotated_at.replace(tzinfo=timezone.utc)
        
        age = datetime.now(timezone.utc) - agent_token_rotated_at
        return age > timedelta(days=max_age_days)
    except Exception as e:
        logger.error(f"Error checking token age: {e}")
        return False

# =============================================================================
# PHASE B: SESSION REVOCATION ON TRUST DROP
# =============================================================================

def revoke_device_sessions(db, device_id: int, reason: str = "Trust score threshold exceeded") -> int:
    """
    Revoke all active sessions for a device when trust score drops below threshold.
    
    PHASE B: Enforces immediate logout when device becomes untrusted.
    
    Args:
        db: Database session
        device_id: Device ID whose sessions to revoke
        reason: Reason for revocation (logged)
        
    Returns:
        Number of sessions revoked
    """
    from datetime import datetime, timezone
    
    try:
        # Find all active sessions for this device
        from models import Session
        
        # Update criteria: active sessions for the device
        sessions_to_revoke = db.query(Session).filter(
            Session.device_id == device_id,
            Session.is_active == True
        ).all()
        
        revoked_count = 0
        now = datetime.now(timezone.utc)
        
        for session in sessions_to_revoke:
            session.is_active = False
            session.logout_at = now
            revoked_count += 1
            logger.warning(
                f"Session revoked for device {device_id}: {reason} (session_id: {session.session_id[:16]}...)"
            )
        
        if revoked_count > 0:
            db.commit()
        
        return revoked_count
        
    except Exception as e:
        logger.error(f"Error revoking device sessions: {e}")
        db.rollback()
        return 0