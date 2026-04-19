# tests/test_health.py
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    """Test that /health returns the expected JSON when DB is connected."""
    with patch("app.main.ping_db", new_callable=AsyncMock, return_value=True):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "credify"
    assert data["db"] == "connected"


@pytest.mark.asyncio
async def test_health_db_disconnected():
    """Test that /health reports db disconnected when ping fails."""
    with patch("app.main.ping_db", new_callable=AsyncMock, return_value=False):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["db"] == "disconnected"
