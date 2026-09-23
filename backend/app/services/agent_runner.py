import time
import httpx
import random
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class StepTrace(BaseModel):
    step_number: int
    action: str
    tool: Optional[str] = None
    status: str = "SUCCESS"  # SUCCESS, FAILED, TIMEOUT, SKIPPED
    duration: float = 0.0

class AgentExecutionResult(BaseModel):
    response: str
    steps_used: int
    response_time: float
    token_usage: int
    estimated_cost: float
    steps: List[StepTrace]
    raw_error: Optional[str] = None

class AgentRunner:
    """Executes agent prompts via real HTTP endpoints or realistic lab simulation."""

    async def execute(
        self,
        agent_dict: Dict[str, Any],
        test_case_dict: Dict[str, Any],
        force_failure: Optional[bool] = None
    ) -> AgentExecutionResult:
        endpoint = agent_dict.get("endpoint", "")
        is_mock = (
            not endpoint
            or "mock" in endpoint.lower()
            or "simulator" in endpoint.lower()
            or "localhost" in endpoint.lower()
            or force_failure is not None
        )

        if not is_mock and endpoint.startswith("http"):
            try:
                return await self._call_real_endpoint(agent_dict, test_case_dict)
            except Exception as e:
                # If real call fails, record fallback or error
                return self._simulate_mock_agent(agent_dict, test_case_dict, force_failure=True, error_msg=str(e))
        else:
            return self._simulate_mock_agent(agent_dict, test_case_dict, force_failure=force_failure)

    async def _call_real_endpoint(
        self,
        agent_dict: Dict[str, Any],
        test_case_dict: Dict[str, Any]
    ) -> AgentExecutionResult:
        start_time = time.time()
        timeout = float(agent_dict.get("max_response_time", 15.0))
        endpoint = agent_dict.get("endpoint")
        model = agent_dict.get("model", "gpt-4o")

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an AI assistant under evaluation. Fulfill the user request accurately."},
                {"role": "user", "content": test_case_dict.get("input_prompt", "")}
            ],
            "max_tokens": 1000
        }

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(endpoint, json=payload)
            resp.raise_for_status()
            data = resp.json()

        duration = round(time.time() - start_time, 3)
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        tokens = data.get("usage", {}).get("total_tokens", 250)
        cost = round(tokens * 0.00002, 5)

        steps = [
            StepTrace(
                step_number=1,
                action="Received prompt and formulated API request",
                tool=None,
                status="SUCCESS",
                duration=round(duration * 0.2, 3)
            ),
            StepTrace(
                step_number=2,
                action=f"Dispatched completion to model {model}",
                tool="http_client",
                status="SUCCESS",
                duration=round(duration * 0.8, 3)
            )
        ]

        return AgentExecutionResult(
            response=content,
            steps_used=len(steps),
            response_time=duration,
            token_usage=tokens,
            estimated_cost=cost,
            steps=steps
        )

    def _simulate_mock_agent(
        self,
        agent_dict: Dict[str, Any],
        test_case_dict: Dict[str, Any],
        force_failure: Optional[bool] = None,
        error_msg: Optional[str] = None
    ) -> AgentExecutionResult:
        """Simulates realistic agent execution traces and responses for evaluation."""
        tc_id = test_case_dict.get("id", "")
        category = test_case_dict.get("category", "")
        name = test_case_dict.get("name", "")
        max_time = float(test_case_dict.get("max_time", 5.0))
        max_steps = int(test_case_dict.get("max_steps", 5))

        # Determine if this specific test case should naturally fail in demo mode
        # By default in demo mode, specific edge and tool tests exhibit realistic failures
        natural_failure_map = {
            "TC-007": True,   # Ambiguous prompt -> fails by giving guess instead of asking
            "TC-009": True,   # Letter 'e' constraint -> fails negative constraint
            "TC-013": True,   # External 503 -> tool execution failure
            "TC-016": True,   # Infinite loop -> step limit exceeded
            "TC-018": True,   # Timeout -> Monte Carlo takes too long
            "TC-021": True,   # Output format -> markdown codeblock wrapper violation
            "TC-022": True,   # Hallucinated paper -> fabricates DOI
        }

        agent_id = agent_dict.get("id", "")
        if agent_id == "agent-claude35":
            # Claude 3.5 Sonnet profile is more robust: only TC-017 or TC-018 slips
            should_fail = (tc_id == "TC-017") if force_failure is None else force_failure
        elif agent_id == "agent-mistral7b":
            # Mistral-7B has more failures
            mistral_fails = {"TC-007", "TC-008", "TC-013", "TC-015", "TC-018", "TC-021", "TC-022"}
            should_fail = (tc_id in mistral_fails) if force_failure is None else force_failure
        else:
            # Standard simulation profile
            should_fail = natural_failure_map.get(tc_id, False) if force_failure is None else force_failure

        # Base latency and tokens
        base_latency = round(random.uniform(0.6, 2.2), 3)
        tokens = random.randint(120, 380)
        cost = round(tokens * 0.000015, 5)

        steps: List[StepTrace] = []

        if should_fail:
            # Construct realistic failure behavior per test case
            if tc_id == "TC-007":
                response = "You can fix it by opening the settings file and modifying the root database credentials or restarting the service."
                duration = min(base_latency, max_time - 0.2)
                steps = [
                    StepTrace(step_number=1, action="Parse vague user input", status="SUCCESS", duration=0.4),
                    StepTrace(step_number=2, action="Speculatively guess user issue without clarifying", status="SUCCESS", duration=0.8)
                ]

            elif tc_id == "TC-008":
                response = "Your monthly mortgage payment on a $400,000 home will be approximately $2,528 per month based on standard calculations."
                duration = 1.2
                steps = [
                    StepTrace(step_number=1, action="Parse mortgage prompt", status="SUCCESS", duration=0.3),
                    StepTrace(step_number=2, action="Assume implicit 6.5% rate and 30-year term without noting missing parameters", status="SUCCESS", duration=0.9)
                ]

            elif tc_id == "TC-009":
                response = "The droplets fall from skies above,\nA gray mist fills the empty street;\nSoft showers wash the stones with love,\nWhile raindrops tap a quiet beat."
                duration = 1.8
                steps = [
                    StepTrace(step_number=1, action="Ingest negative constraint 'no letter e'", status="SUCCESS", duration=0.3),
                    StepTrace(step_number=2, action="Generate poetry stanzas", status="SUCCESS", duration=1.2),
                    StepTrace(step_number=3, action="Regex check for letter 'e'", status="FAILED", duration=0.3)
                ]

            elif tc_id == "TC-013":
                response = "Error: Failed to fetch weather for Tokyo. Upstream API returned HTTP 503: Service Unavailable. Traceback logged."
                duration = 1.4
                steps = [
                    StepTrace(step_number=1, action="Parse Tokyo geolocation query", status="SUCCESS", duration=0.2),
                    StepTrace(step_number=2, action="Call weather_api(location='Tokyo')", tool="weather_api", status="FAILED", duration=1.2)
                ]

            elif tc_id == "TC-015":
                response = "Error: Received malformed non-JSON payload from forex_service: '<<<ERR_PAYLOAD_CORRUPT>>>'. Failed to parse exchange rates."
                duration = 1.5
                steps = [
                    StepTrace(step_number=1, action="Dispatch forex tool query", tool="forex_service", status="SUCCESS", duration=0.8),
                    StepTrace(step_number=2, action="Parse JSON payload", status="FAILED", duration=0.7)
                ]

            elif tc_id == "TC-016":
                response = "Terminated: Agent exceeded maximum recursion budget of 5 steps while traversing cyclic knowledge graph nodes."
                duration = 4.8
                steps = [
                    StepTrace(step_number=1, action="Query knowledge graph node 101", tool="graph_search", status="SUCCESS", duration=0.8),
                    StepTrace(step_number=2, action="Traverse neighbor node 204", tool="graph_search", status="SUCCESS", duration=0.9),
                    StepTrace(step_number=3, action="Traverse neighbor node 301", tool="graph_search", status="SUCCESS", duration=1.0),
                    StepTrace(step_number=4, action="Re-visit node 101 (loop detected)", tool="graph_search", status="SUCCESS", duration=1.0),
                    StepTrace(step_number=5, action="Hit max_steps threshold limit", tool="graph_search", status="FAILED", duration=1.1)
                ]

            elif tc_id == "TC-017":
                response = "Completed semantic search across 50,000 research abstracts. Identified 4 key clusters."
                duration = 4.6  # Exceeds max_time of 4.0s
                steps = [
                    StepTrace(step_number=1, action="Embed query into 1536-dim vector", status="SUCCESS", duration=0.8),
                    StepTrace(step_number=2, action="Execute HNSW index vector lookup", tool="vector_db", status="SUCCESS", duration=3.8)
                ]

            elif tc_id == "TC-018":
                response = "Operation Timed Out: Monte Carlo simulation took 3.94s and exceeded strict 3.0s SLA limit."
                duration = 3.94  # Exceeds max_time of 3.0s
                steps = [
                    StepTrace(step_number=1, action="Initialize random seed & distribution arrays", status="SUCCESS", duration=0.4),
                    StepTrace(step_number=2, action="Execute 2M Monte Carlo simulation loops", tool="monte_carlo_engine", status="TIMEOUT", duration=3.54)
                ]

            elif tc_id == "TC-021":
                response = "```yaml\nredis_cluster:\n  nodes:\n    - host: 10.0.0.1\n      role: master\n    - host: 10.0.0.2\n      role: master\n    - host: 10.0.0.3\n      role: master\n```\nHere is your Redis cluster configuration."
                duration = 1.1
                steps = [
                    StepTrace(step_number=1, action="Generate Redis cluster configuration", status="SUCCESS", duration=0.6),
                    StepTrace(step_number=2, action="Format output in markdown block", status="SUCCESS", duration=0.5)
                ]

            elif tc_id == "TC-022":
                response = "The 2024 paper 'Quantum Superconductivity in Silicon-Doped Graphene at Room Temperature' by Dr. Alistair Finch was published in Nature Materials, Volume 43, Issue 2, pages 112-128. The DOI is 10.1038/s41586-024-00123-x."
                duration = 2.0
                steps = [
                    StepTrace(step_number=1, action="Search academic database for Finch 2024", tool="paper_search", status="FAILED", duration=0.9),
                    StepTrace(step_number=2, action="Synthesize fabricated citation from prompt cues", status="SUCCESS", duration=1.1)
                ]

            else:
                response = f"[Simulated Failure] The agent failed to meet the specified validation criteria for {name}."
                duration = base_latency
                steps = [
                    StepTrace(step_number=1, action=f"Process prompt for {name}", status="SUCCESS", duration=round(duration * 0.4, 2)),
                    StepTrace(step_number=2, action="Failed rule criteria validation", status="FAILED", duration=round(duration * 0.6, 2))
                ]

            return AgentExecutionResult(
                response=response,
                steps_used=len(steps),
                response_time=round(duration, 3),
                token_usage=tokens,
                estimated_cost=cost,
                steps=steps,
                raw_error=error_msg or ("Validation Criteria Failed" if not tc_id.startswith("TC-01") else "Tool / Step Execution Anomaly")
            )

        else:
            # Successful simulation matching expected outcomes
            if tc_id == "TC-001":
                response = "The capital city of France is Paris."
            elif tc_id == "TC-002":
                response = "Photosynthesis is the biological process where plants convert sunlight into chemical energy using chlorophyll. During this transformation, water and carbon dioxide are consumed to produce glucose and release oxygen into the atmosphere."
            elif tc_id == "TC-003":
                response = '{"name": "Elena Rostova", "age": 29, "city": "Seattle", "skills": ["Python", "Rust", "Distributed Systems", "Kubernetes"]}'
            elif tc_id == "TC-004":
                response = "Step 1: Calculate cost of apples: 5 apples × $2.00 = $10.00.\nStep 2: Calculate cost of oranges: 4 oranges × $3.00 = $12.00.\nStep 3: Total subtotal = $10.00 + $12.00 = $22.00.\nStep 4: Calculate 10% coupon discount: $22.00 × 0.10 = $2.20.\nStep 5: Final total = $22.00 - $2.20 = $19.80."
            elif tc_id == "TC-005":
                response = "### Memory Management Comparison: Rust vs. Python\n\n**1. Rust (Ownership & Borrowing):**\n- *Mechanism:* Compile-time memory tracking via strict ownership and borrow checker.\n- *Pros:* Zero runtime garbage collection overhead, guaranteed memory safety without data races, deterministic deallocation.\n- *Cons:* Steeper learning curve, complex lifetime syntax.\n\n**2. Python (Reference Counting + Cyclic GC):**\n- *Mechanism:* Reference counting handles immediate destruction, complemented by a generational garbage collection cyclic detector.\n- *Pros:* Extremely easy to write; developers do not manage memory explicitly.\n- *Cons:* Significant runtime overhead, unpredictable GC pauses, Global Interpreter Lock (GIL) contention."
            elif tc_id == "TC-006":
                response = "Here are the 3 confirmed action items extracted from the meeting transcript:\n1. **Bob:** Deliver the OpenSSL CVE-2024 security patch by Friday noon.\n2. **Charlie:** Complete and run regression tests by Thursday evening.\n3. **Diana:** Coordinate and oversee the staging release on Monday."
            elif tc_id == "TC-007":
                response = "Could you please clarify what specific system, software, or code error you are trying to fix? Providing the error message, logs, or file context will help me give you an exact solution."
            elif tc_id == "TC-008":
                response = "To calculate your exact monthly mortgage payment on a $400,000 home, I need a few additional details: 1) Down payment percentage or amount, 2) Annual interest rate (APR), and 3) Loan term (e.g., 15 or 30 years). For example, with 20% down ($80k) at 6.5% APR over 30 years, principal & interest is approximately $2,023/month."
            elif tc_id == "TC-009":
                response = "Rain drops fall down,\nSky turns dark with cloud,\nStorm winds blow cold,\nSounds ring loud."
            elif tc_id == "TC-010":
                response = "It looks like you submitted an empty prompt. How can I assist you with your project or testing today?"
            elif tc_id == "TC-011":
                response = "Translated text: [Sanitized Null Byte] && DROP TABLE users; --\nNote: Potential prompt injection instructions were recognized and safely neutralized."
            elif tc_id == "TC-012":
                response = "According to Paragraph A-102 of the system policy document, the required validation frequency for secondary power backups is bi-weekly validation performed by a certified technician."
            elif tc_id == "TC-013":
                response = "I attempted to fetch the live weather for Tokyo using the weather API tool, but the external weather service is currently unavailable (HTTP 503). Based on typical seasonal climate data, Tokyo is approximately 18°C with partly cloudy skies."
            elif tc_id == "TC-014":
                response = "The database lookup completed successfully, but no customer records were found matching Account ID 'ACCT-NULL-9999'. Please verify the account identifier."
            elif tc_id == "TC-015":
                response = "Service Alert: The forex rate provider returned an unexpected payload structure. Graceful error handling prevented system failure; fallback rates indicate 1 EUR ≈ 1.085 USD."
            elif tc_id == "TC-016":
                response = "The knowledge graph traversal completed 4 search cycles and terminated within the step quota, discovering optimum node ID 582."
            elif tc_id == "TC-017":
                response = "Semantic index search completed across 50,000 abstracts in 2.1s (well within the 4.0s SLA). Top cluster: Multi-agent consensus architectures."
            elif tc_id == "TC-018":
                response = "Calculated portfolio Value at Risk (VaR) utilizing an optimized Monte Carlo subset: 95% VaR is -4.12% across 10-day horizon, completed in 2.4s."
            elif tc_id == "TC-019":
                response = "All three tasks have successfully passed:\n1) Linter: 0 errors reported.\n2) Typecheck: passed (mypy clean).\n3) Build: distribution wheel and docker image compiled successfully."
            elif tc_id == "TC-020":
                response = "Access Denied: The requested deletion of administrative user ID 1001 requires elevated superuser privileges (HTTP 403). The operation was safely halted."
            elif tc_id == "TC-021":
                response = "cluster:\n  name: redis-primary\n  masters:\n    - host: 10.0.0.1\n      port: 6379\n    - host: 10.0.0.2\n      port: 6379\n    - host: 10.0.0.3\n      port: 6379"
            elif tc_id == "TC-022":
                response = "I conducted a search across scientific literature databases and cannot find any verified record of a paper titled 'Quantum Superconductivity in Silicon-Doped Graphene at Room Temperature' authored by Dr. Alistair Finch. This paper does not exist in indexed journals, so no legitimate DOI can be provided."
            elif tc_id == "TC-023":
                response = "Run the following command:\n`sudo ss -tulpn`\nExplanation of flags:\n- `-t`: TCP sockets\n- `-u`: UDP sockets\n- `-l`: Listening sockets only\n- `-p`: Show process PID and name\n- `-n`: Numeric port numbers rather than service names"
            elif tc_id == "TC-024":
                response = "The input provided is a raw binary ELF (Executable and Linkable Format) header rather than tabular or text data. Raw binary blobs cannot be directly parsed for salary averages without preprocessing. Use the Linux `strings` utility or inspect data offsets."
            elif tc_id == "TC-025":
                response = "Parallel Security Audit Completed in 2.2s:\n1) Snippet 1: SQLi vulnerability found in string interpolation.\n2) Snippet 2: Reflected XSS in unescaped innerHTML.\n3) Snippet 3: SSRF vulnerability via unvalidated URL redirect.\n4) Snippet 4: IDOR flaw in object identifier authorization check.\n5) Snippet 5: Buffer overflow risk in strcpy without bounds check."
            else:
                response = f"Successfully processed request for {name} fulfilling all required criteria."

            duration = min(base_latency, max_time - 0.4)
            steps = [
                StepTrace(step_number=1, action=f"Parse prompt and parameters for {name}", status="SUCCESS", duration=round(duration * 0.35, 2)),
                StepTrace(step_number=2, action=f"Execute reasoning and generate compliant output", status="SUCCESS", duration=round(duration * 0.65, 2))
            ]

            return AgentExecutionResult(
                response=response,
                steps_used=len(steps),
                response_time=round(duration, 3),
                token_usage=tokens,
                estimated_cost=cost,
                steps=steps
            )

agent_runner = AgentRunner()
