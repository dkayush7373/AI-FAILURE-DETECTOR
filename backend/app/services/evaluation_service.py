import json
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.services.agent_runner import AgentExecutionResult

class EvaluationVerdict(BaseModel):
    is_passed: bool
    status: str  # PASS or FAIL
    failure_reasons: List[Dict[str, str]] = []  # [{ "type": "...", "detail": "...", "evidence": "..." }]

class EvaluationService:
    """Evaluates agent execution results against test case specifications and criteria."""

    def evaluate(
        self,
        test_case_dict: Dict[str, Any],
        exec_result: AgentExecutionResult
    ) -> EvaluationVerdict:
        failure_reasons = []

        max_time = float(test_case_dict.get("max_time", 10.0))
        max_steps = int(test_case_dict.get("max_steps", 10))
        response = exec_result.response or ""

        # 1. Check Latency SLA
        if exec_result.response_time > max_time:
            failure_reasons.append({
                "type": "TIMEOUT",
                "detail": f"Execution time ({exec_result.response_time}s) exceeded max allowed time ({max_time}s).",
                "evidence": f"Recorded duration: {exec_result.response_time}s > {max_time}s SLA."
            })

        # 2. Check Step Limit SLA
        if exec_result.steps_used > max_steps:
            failure_reasons.append({
                "type": "STEP_LIMIT",
                "detail": f"Steps used ({exec_result.steps_used}) exceeded max permitted steps ({max_steps}).",
                "evidence": f"Total steps: {exec_result.steps_used} > limit of {max_steps}."
            })

        # 3. Check for Step-Level Failures
        failed_steps = [s for s in exec_result.steps if s.status in ("FAILED", "TIMEOUT")]
        if failed_steps:
            for s in failed_steps:
                failure_reasons.append({
                    "type": "STEP_FAILURE",
                    "detail": f"Agent step #{s.step_number} ({s.action}) failed with status '{s.status}'.",
                    "evidence": f"Tool: {s.tool or 'None'} | Action: {s.action} | Status: {s.status}"
                })

        # 4. Parse and Evaluate Success Criteria JSON
        criteria_str = test_case_dict.get("success_criteria", "{}")
        criteria: Dict[str, Any] = {}
        try:
            criteria = json.loads(criteria_str) if isinstance(criteria_str, str) and criteria_str.startswith("{") else {}
        except Exception:
            criteria = {}

        # 4a. Check Required Terms
        if "required_terms" in criteria:
            for term in criteria["required_terms"]:
                if term.lower() not in response.lower():
                    failure_reasons.append({
                        "type": "MISSING_REQUIRED_TERM",
                        "detail": f"Expected output to contain key term '{term}'.",
                        "evidence": f"Output was: '{response[:120]}...'"
                    })

        # 4b. Check Prohibited Terms
        if "prohibited_terms" in criteria:
            for term in criteria["prohibited_terms"]:
                if term.lower() in response.lower():
                    failure_reasons.append({
                        "type": "PROHIBITED_TERM_PRESENT",
                        "detail": f"Output contained prohibited term '{term}'.",
                        "evidence": f"Found forbidden substring '{term}' in response."
                    })

        # 4c. Check Prohibited Characters (e.g. Negative constraint TC-009)
        if "prohibited_characters" in criteria:
            for ch in criteria["prohibited_characters"]:
                matches = [m.start() for m in re.finditer(re.escape(ch), response, re.IGNORECASE)]
                if matches:
                    failure_reasons.append({
                        "type": "PROHIBITED_CHAR_PRESENT",
                        "detail": f"Output contained forbidden character '{ch}' {len(matches)} times.",
                        "evidence": f"Found '{ch}' in snippet: '{response[max(0, matches[0]-10):min(len(response), matches[0]+15)]}'"
                    })

        # 4d. Check JSON Schema / Format
        if criteria.get("format") == "json":
            try:
                # Strip backticks if user provided codeblock
                cleaned = response.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                if cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                parsed_json = json.loads(cleaned.strip())

                if "required_keys" in criteria and isinstance(parsed_json, dict):
                    for req_key in criteria["required_keys"]:
                        if req_key not in parsed_json:
                            failure_reasons.append({
                                "type": "SCHEMA_KEY_MISSING",
                                "detail": f"JSON output missing required key '{req_key}'.",
                                "evidence": f"Keys found: {list(parsed_json.keys())}"
                            })
            except Exception as e:
                failure_reasons.append({
                    "type": "INVALID_JSON",
                    "detail": f"Output could not be parsed as valid JSON: {str(e)}",
                    "evidence": f"Raw text: '{response[:100]}...'"
                })

        # 4e. Check Raw YAML Format (TC-021)
        if criteria.get("format") == "raw_yaml":
            if "```" in response:
                failure_reasons.append({
                    "type": "INVALID_FORMAT_WRAPPER",
                    "detail": "Strict format requested raw YAML without markdown backticks.",
                    "evidence": "Output contained '```' markdown fence."
                })

        # 4f. Min/Max Length Checks
        if "min_length" in criteria and len(response.strip()) < criteria["min_length"]:
            failure_reasons.append({
                "type": "INSUFFICIENT_LENGTH",
                "detail": f"Response length ({len(response.strip())}) is less than minimum required ({criteria['min_length']}).",
                "evidence": f"Length: {len(response.strip())} chars."
            })
        if "max_length" in criteria and len(response.strip()) > criteria["max_length"]:
            failure_reasons.append({
                "type": "EXCESSIVE_LENGTH",
                "detail": f"Response length ({len(response.strip())}) exceeded maximum allowable ({criteria['max_length']}).",
                "evidence": f"Length: {len(response.strip())} chars."
            })

        # 5. Check Non-empty
        if criteria.get("non_empty", True) and not response.strip():
            failure_reasons.append({
                "type": "EMPTY_OUTPUT",
                "detail": "Agent returned completely empty output.",
                "evidence": "Response length: 0 characters."
            })

        # 6. Specific heuristic checks for explicit failure prefixes in simulation
        if "[FAIL Response]" in response or "[Simulated Failure]" in response:
            if not failure_reasons:
                failure_reasons.append({
                    "type": "SIMULATED_FAILURE_TRIGGER",
                    "detail": "Evaluator recognized synthetic failure trace.",
                    "evidence": response[:120]
                })

        is_passed = len(failure_reasons) == 0
        status = "PASS" if is_passed else "FAIL"

        return EvaluationVerdict(
            is_passed=is_passed,
            status=status,
            failure_reasons=failure_reasons
        )

evaluation_service = EvaluationService()
