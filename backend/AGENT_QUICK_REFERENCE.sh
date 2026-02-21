#!/usr/bin/env bash
# Quick reference for agent endpoints

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"

echo "=================================="
echo "Agent Endpoints Quick Reference"
echo "=================================="
echo "Backend: $BACKEND_URL"
echo ""

# Test 1: Check backend health
echo "1️⃣  Check Backend Health"
echo "   GET /docs"
echo "   curl -s $BACKEND_URL/docs | head -20"
echo ""

# Test 2: Register agent
echo "2️⃣  Register Agent"
echo "   POST /agent/register"
echo "   curl -X POST $BACKEND_URL/agent/register -H 'Content-Type: application/json' \\"
echo "     -d '{\"device_uuid\":\"test\",\"hostname\":\"PC\",\"os_version\":\"Windows 10\"}'"
echo ""

# Test 3: Send heartbeat
echo "3️⃣  Send Heartbeat"
echo "   POST /agent/heartbeat"
echo "   curl -X POST $BACKEND_URL/agent/heartbeat \\"
echo "     -H 'Authorization: Bearer TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"device_uuid\":\"test\",\"metrics\":{...}}'"
echo ""

# Test 4: List devices (admin)
echo "4️⃣  List Devices"
echo "   GET /agent/devices"
echo "   curl -s $BACKEND_URL/agent/devices?limit=10 \\"
echo "     -H 'Authorization: Bearer ADMIN_TOKEN' | jq"
echo ""

# Test 5: Get telemetry (admin)
echo "5️⃣  Get Device Telemetry"
echo "   GET /agent/devices/{device_id}/telemetry"
echo "   curl -s $BACKEND_URL/agent/devices/42/telemetry?limit=20 \\"
echo "     -H 'Authorization: Bearer ADMIN_TOKEN' | jq"
echo ""

echo "=================================="
echo "Integration Test Suite"
echo "=================================="
echo "python test_agent_endpoints.py"
echo ""

echo "=================================="
echo "Environment Setup"
echo "=================================="
echo "1. Start backend:"
echo "   cd backend"
echo "   python -m uvicorn app:app --port 8000 --reload"
echo ""
echo "2. Configure agent:"
echo "   Edit agent/config.json:"
echo "   - backend_url: http://your-server:8000"
echo "   - heartbeat_interval: 30"
echo ""
echo "3. Start agent:"
echo "   cd agent"
echo "   python agent.py"
echo ""

echo "✓ All endpoints ready!"
