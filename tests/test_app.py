import copy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def client():
    """Provide a TestClient and reset the in-memory activities before each test."""
    # Make a deep copy of the initial activities so tests can mutate safely
    original = copy.deepcopy(app_module.activities)
    client = TestClient(app_module.app)
    yield client
    # Restore original state after each test
    app_module.activities.clear()
    app_module.activities.update(original)


def test_get_activities(client):
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # A known activity exists
    assert "Chess Club" in data


def test_signup_and_no_duplicate(client):
    activity = "Chess Club"
    email = "testuser@example.com"

    # Ensure email not present initially
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200
    assert "Signed up" in signup_resp.json().get("message", "")

    # Now email should be present
    resp2 = client.get("/activities")
    assert email in resp2.json()[activity]["participants"]

    # Signing up again should fail with 400
    dup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert dup_resp.status_code == 400


def test_unregister_participant(client):
    activity = "Programming Class"
    email = "remove_me@example.com"

    # Sign up first
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200

    # Ensure present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Delete participant
    delete_resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert delete_resp.status_code == 200
    assert "Removed" in delete_resp.json().get("message", "")

    # Ensure removed
    resp2 = client.get("/activities")
    assert email not in resp2.json()[activity]["participants"]
