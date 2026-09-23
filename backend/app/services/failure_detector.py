from typing import Dict, Any, List, Optional
from pydantic import BaseModel

FAILURE_CATEGORIES = [
    "Incorrect Answer",
    "Incomplete Response",
    "Tool Execution Failure",
    "Step Limit Exceeded",
    "Timeout",
    "Invalid Output Format",
    "Hallucinated Claim",
    "Error Handling Failure",
    "Unclear Response",
    "Unknown Failure"
]

class DetectedFailure(BaseModel):
    category: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    evidence: str
    suggested_fix: str

class FailureDetector:
    """Classifies evaluation failures into 10 standard AI failure modes with severity and remediation."""

    def diagnose(
        self,
        test_case_dict: Dict[str, Any],
        exec_response: str,
        failure_reasons: List[Dict[str, str]],
        priority: str = "MEDIUM"
    ) -> DetectedFailure:
        tc_id = test_case_dict.get("id", "")
        category_name = test_case_dict.get("category", "")
        reasons_text = " ".join([r.get("type", "") + " " + r.get("detail", "") for r in failure_reasons]).lower()
        evidence_text = "\n".join([r.get("evidence", "") for r in failure_reasons if r.get("evidence")]) or exec_response[:200]

        # 1. Timeout detection
        if "timeout" in reasons_text:
            return DetectedFailure(
                category="Timeout",
                severity="CRITICAL" if priority in ("CRITICAL", "HIGH") else "MEDIUM",
                description=f"Execution exceeded maximum latency budget for {test_case_dict.get('name')}.",
                evidence=evidence_text,
                suggested_fix="Optimize prompt length, enable streaming completions, offload heavy tool tasks to async background queues, or increase timeout tolerance in agent profile."
            )

        # 2. Step Limit Exceeded
        if "step_limit" in reasons_text or "step limit" in reasons_text or "recursion budget" in exec_response.lower():
            return DetectedFailure(
                category="Step Limit Exceeded",
                severity="CRITICAL",
                description="Agent entered cyclic tool iteration or repeated reasoning loop without terminating within max_steps.",
                evidence=evidence_text,
                suggested_fix="Implement cycle-detection memory (visited nodes set/hash), enforce maximum tool call limits per query, or prune agent conversation context window after step 3."
            )

        # 3. Tool Execution Failure
        if "tool" in reasons_text or "503" in exec_response or "traceback" in exec_response.lower() or tc_id in ("TC-013", "TC-014", "TC-015", "TC-020"):
            return DetectedFailure(
                category="Tool Execution Failure",
                severity="HIGH",
                description="Tool call aborted or returned an unhandled error status (HTTP 503, 403, or malformed payload).",
                evidence=evidence_text,
                suggested_fix="Wrap tool invocation clients with exponential-backoff retries, validate response headers before parsing, and provide graceful fallback data when tools are degraded."
            )

        # 4. Invalid Output Format
        if any(term in reasons_text for term in ("prohibited_char", "invalid_json", "format_wrapper", "schema_key")):
            return DetectedFailure(
                category="Invalid Output Format",
                severity="HIGH" if "json" in reasons_text else "MEDIUM",
                description="Agent violated syntactic or schema constraints (markdown code fence used when raw requested, or missing JSON keys).",
                evidence=evidence_text,
                suggested_fix="Enforce strict structured outputs using JSON mode / response_format schemas, or use a post-processing regex sanitizer to strip markdown fences."
            )

        # 5. Hallucinated Claim
        if tc_id == "TC-022" or "hallucin" in reasons_text or "doi.org" in exec_response:
            return DetectedFailure(
                category="Hallucinated Claim",
                severity="CRITICAL",
                description="Agent generated fabricated scientific paper citations and nonexistent DOI numbers rather than acknowledging lack of data.",
                evidence=evidence_text,
                suggested_fix="Add strict hallucination guardrails in the system prompt: 'If a requested reference, paper, or fact is unknown or unverified, explicitly state that no record exists. Never invent DOIs or citations.'"
            )

        # 6. Unclear Response
        if tc_id in ("TC-007", "TC-023") or "clarify" in reasons_text:
            return DetectedFailure(
                category="Unclear Response",
                severity="MEDIUM",
                description="Agent gave an evasive, ambiguous, or speculative answer instead of asking for required clarification.",
                evidence=evidence_text,
                suggested_fix="Instruct agent to evaluate input ambiguity score. If the prompt lacks target entity or context, prompt the user with 1-2 targeted clarifying questions."
            )

        # 7. Incomplete Response
        if tc_id in ("TC-008", "TC-019") or "incomplete" in reasons_text or "missing" in reasons_text:
            return DetectedFailure(
                category="Incomplete Response",
                severity="HIGH",
                description="Agent halted execution prematurely before fulfilling all required parameters or sub-tasks.",
                evidence=evidence_text,
                suggested_fix="Require step verification check before final output. Ensure agent verifies all sub-questions from prompt are addressed before signaling completion."
            )

        # 8. Error Handling Failure
        if tc_id in ("TC-011", "TC-024") or "safe_handling" in reasons_text or "injection" in reasons_text:
            return DetectedFailure(
                category="Error Handling Failure",
                severity="CRITICAL",
                description="Agent crashed on malformed binary bytes or leaked internal guidelines under injection pressure.",
                evidence=evidence_text,
                suggested_fix="Sanitize raw byte inputs and strip control/null characters before tokenization. Implement system prompt isolation delimiters."
            )

        # 9. Incorrect Answer
        if any(term in reasons_text for term in ("required_term", "missing_required_term", "arithmetic")):
            return DetectedFailure(
                category="Incorrect Answer",
                severity="HIGH" if priority in ("CRITICAL", "HIGH") else "MEDIUM",
                description="Agent output did not satisfy the expected factual, logical, or mathematical truth criteria.",
                evidence=evidence_text,
                suggested_fix="Incorporate Few-Shot examples in prompt or use chain-of-thought scratchpads to allow intermediate mathematical verification."
            )

        # 10. Default fallback: Unknown Failure
        return DetectedFailure(
            category="Unknown Failure",
            severity="MEDIUM",
            description=f"Evaluation criteria check failed with unspecified anomalies: {failure_reasons[0].get('detail', '') if failure_reasons else 'General divergence'}",
            evidence=evidence_text,
            suggested_fix="Review execution logs and step traces to pinpoint root cause; consider adjusting test case criteria or prompt instructions."
        )

failure_detector = FailureDetector()
