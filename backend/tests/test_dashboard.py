from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_returns_data(
    client: AsyncClient, auth_headers: dict
):
    response = await client.get(
        "/api/v1/dashboard",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "kpi" in data["data"]
    assert "total_farms" in data["data"]["kpi"]
    assert "total_trees" in data["data"]["kpi"]
