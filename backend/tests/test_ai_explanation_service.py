import httpx

from app.services.ai_explanation_service import AIExplanationService


class FakeResponse:
    def __init__(self, payload=None, status_code=200):
        self._payload = payload or {}
        self.status_code = status_code
        self.request = httpx.Request("POST", "https://api.z.ai/api/paas/v4/chat/completions")

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError(
                "provider error",
                request=self.request,
                response=httpx.Response(self.status_code, request=self.request),
            )


class FakeClient:
    response = FakeResponse()
    error = None
    last_json = None

    def __init__(self, timeout):
        self.timeout = timeout

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def post(self, url, headers, json):
        FakeClient.last_json = json
        if FakeClient.error:
            raise FakeClient.error
        return FakeClient.response


def test_missing_api_key_returns_safe_status(sample_result):
    service = AIExplanationService(api_key="")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.explanation is None
    assert outcome.status == "missing_api_key"


def test_successful_explanation_generation(monkeypatch, sample_result):
    FakeClient.error = None
    FakeClient.response = FakeResponse(
        {
            "choices": [
                {
                    "message": {
                        "content": "This works well because the score is strong and travel times fit the group."
                    }
                }
            ]
        }
    )
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", FakeClient)
    service = AIExplanationService(api_key="test-key")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.status == "generated"
    assert outcome.explanation == "This works well because the score is strong and travel times fit the group."
    assert FakeClient.last_json["model"] == "glm-5.1"
    assert "Do not invent restaurant features" in FakeClient.last_json["messages"][0]["content"]


def test_provider_timeout_returns_safe_status(monkeypatch, sample_result):
    FakeClient.error = httpx.TimeoutException("timeout")
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", FakeClient)
    service = AIExplanationService(api_key="test-key")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.explanation is None
    assert outcome.status == "timeout"
    FakeClient.error = None


def test_provider_error_returns_safe_status(monkeypatch, sample_result):
    FakeClient.error = None
    FakeClient.response = FakeResponse(status_code=500)
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", FakeClient)
    service = AIExplanationService(api_key="test-key")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.explanation is None
    assert outcome.status == "provider_error"


def test_rate_limit_returns_safe_status(monkeypatch, sample_result):
    FakeClient.error = None
    FakeClient.response = FakeResponse(status_code=429)
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", FakeClient)
    service = AIExplanationService(api_key="test-key")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.explanation is None
    assert outcome.status == "rate_limited"


def test_empty_and_malformed_responses_return_safe_status(monkeypatch, sample_result):
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", FakeClient)
    service = AIExplanationService(api_key="test-key")

    FakeClient.response = FakeResponse({"choices": [{"message": {"content": "   "}}]})
    empty = service.explain_result(sample_result, [], "casual")
    assert empty.status == "empty_response"

    FakeClient.response = FakeResponse({"unexpected": []})
    malformed = service.explain_result(sample_result, [], "casual")
    assert malformed.status == "malformed_response"


def test_existing_explanation_is_reused_without_provider_call(monkeypatch, sample_result):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("provider should not be called")

    sample_result.ai_explanation = "Stored explanation"
    sample_result.ai_status = "generated"
    monkeypatch.setattr("app.services.ai_explanation_service.httpx.Client", fail_if_called)
    service = AIExplanationService(api_key="test-key")

    outcome = service.explain_result(sample_result, [], "casual")

    assert outcome.explanation == "Stored explanation"
    assert outcome.status == "generated"
