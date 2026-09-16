from sqlalchemy.exc import SQLAlchemyError

from app.db.database import get_db
from app.main import app


def test_health_endpoint_reports_database_connection(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_health_endpoint_returns_503_when_database_unavailable(client):
    class BrokenSession:
        def execute(self, statement):
            raise SQLAlchemyError("database unavailable")

        def close(self):
            pass

    def broken_db():
        yield BrokenSession()

    previous_override = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = broken_db
    response = client.get("/health")
    if previous_override:
        app.dependency_overrides[get_db] = previous_override
    else:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 503
    assert response.json() == {"status": "degraded", "database": "unavailable"}
