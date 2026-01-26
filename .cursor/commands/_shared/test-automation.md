---
helper_id: test-automation
load_when:
  - test_framework_detected
  - validation_step
  - refactoring_analysis
sections:
  detection:
    title: "Test Framework Detection"
    lines: [39, 67]
  execution:
    title: "Test Execution"
    lines: [68, 154]
  coverage:
    title: "Test Coverage Tracking"
    lines: [180, 207]
  failure_detection:
    title: "Test Failure Detection"
    lines: [233, 247]
  generation:
    title: "Test Generation Assistance"
    lines: [273, 273]
always_load: false
---

# Test Automation Integration

This helper provides logic for automatic test framework detection, test execution, coverage tracking, and test generation assistance - all framework-agnostic and dynamically adaptable.

## Purpose

Automate test-related operations:
- Detect test frameworks automatically
- Run tests automatically during validation
- Track test coverage
- Detect test failures
- Assist with test generation

## Section: Test Framework Detection (Lines 14-67)

### Detection Methods

**Method 1: Package.json Dependencies**
- Check `package.json` for test framework dependencies
- Common frameworks:
  - `jest` → Jest
  - `vitest` → Vitest
  - `@playwright/test` → Playwright
  - `cypress` → Cypress
  - `mocha` → Mocha
  - `ava` → Ava
  - `tape` → Tape
  - `jasmine` → Jasmine
  - `pytest` → pytest (Python)
  - `unittest` → unittest (Python)

**Method 2: Config Files**
- Check for framework-specific config files:
  - `jest.config.js`, `jest.config.ts`, `jest.config.json`
  - `vitest.config.ts`, `vitest.config.js`
  - `playwright.config.ts`, `playwright.config.js`
  - `cypress.config.js`, `cypress.config.ts`
  - `mocha.opts`, `.mocharc.js`
  - `pytest.ini`, `setup.cfg` (Python)
  - `pytest.ini`, `tox.ini` (Python)

**Method 3: Test Scripts**
- Check `package.json` scripts for test commands:
  - `test`, `test:unit`, `test:integration`, `test:e2e`
  - Parse script to identify framework

**Method 4: File Patterns**
- Check for test file patterns:
  - `**/*.test.ts`, `**/*.test.tsx`, `**/*.test.js`
  - `**/*.spec.ts`, `**/*.spec.tsx`, `**/*.spec.js`
  - `**/__tests__/**`
  - `**/tests/**`

### Framework Detection Priority

1. **Check package.json dependencies** (most reliable)
2. **Check config files** (framework-specific)
3. **Check test scripts** (fallback)
4. **Check file patterns** (last resort)

### Multiple Framework Support

**If multiple frameworks detected:**
- Support running all detected frameworks
- Prioritize by usage (most test files)
- Allow user to specify which to run

## Test Execution

### Framework-Agnostic Test Runner

**Detection-based execution:**
1. Detect test framework
2. Determine test command based on framework
3. Execute test command
4. Parse test output
5. Report results

### Test Commands by Framework

**Jest:**
- `npm test` or `jest`
- `npm test -- --coverage` (with coverage)

**Vitest:**
- `npm test` or `vitest run`
- `npm test -- --coverage` (with coverage)

**Playwright:**
- `npx playwright test`
- `npx playwright test --reporter=json` (JSON output)

**Cypress:**
- `npx cypress run`
- `npx cypress run --headless`

**Mocha:**
- `npm test` or `mocha`
- `npm test -- --reporter json` (JSON output)

**pytest (Python):**
- `pytest`
- `pytest --cov` (with coverage)

### Test Execution Options

**Standard execution:**
- Run all tests
- Parse output for pass/fail
- Report summary

**Coverage execution:**
- Run tests with coverage flag
- Collect coverage data
- Generate coverage report

**Watch mode (optional):**
- Run tests in watch mode
- Re-run on file changes
- User can enable/disable

### Test Output Parsing

**Parse test results:**
- Pass/fail count
- Test names and status
- Error messages
- Execution time
- Coverage percentage (if available)

**Output format:**
```json
{
  "framework": "jest",
  "passed": 45,
  "failed": 2,
  "skipped": 1,
  "total": 48,
  "duration": 3.2,
  "coverage": {
    "lines": 85.5,
    "functions": 90.2,
    "branches": 78.3,
    "statements": 85.5
  },
  "failures": [
    {
      "test": "UserService should handle errors",
      "error": "Expected error but got success"
    }
  ]
}
```

## Section: Test Coverage Tracking (Lines 155-207)

### Coverage Collection

**Framework-specific coverage:**
- Jest: `--coverage` flag
- Vitest: `--coverage` flag
- pytest: `--cov` flag
- Other frameworks: Check framework-specific coverage tools

### Coverage Metrics

**Collect coverage data:**
- Line coverage percentage
- Function coverage percentage
- Branch coverage percentage
- Statement coverage percentage
- Per-file coverage

### Coverage Reports

**Generate coverage reports:**
- HTML reports (if framework supports)
- JSON reports (for parsing)
- Console output (for quick view)

### Coverage Tracking

**Track coverage over time:**
- Store coverage data in `.sdd/test-coverage.json`
- Compare coverage before/after changes
- Alert if coverage decreases significantly

**Coverage file format:**
```json
{
  "timestamp": "2026-01-07T12:00:00Z",
  "framework": "jest",
  "overall": {
    "lines": 85.5,
    "functions": 90.2,
    "branches": 78.3,
    "statements": 85.5
  },
  "files": {
    "src/auth/service.ts": {
      "lines": 95.0,
      "functions": 100.0
    }
  }
}
```

## Section: Test Failure Detection (Lines 208-247)

### Failure Analysis

**Detect test failures:**
- Parse test output for failures
- Identify failed tests
- Extract error messages
- Categorize failures (syntax errors, assertion failures, timeouts, etc.)

### Failure Reporting

**Report failures:**
- List failed tests
- Show error messages
- Suggest fixes (if possible)
- Block PR if configured (optional)

### Failure Categories

**Syntax errors:**
- Code compilation errors
- Import errors
- Type errors

**Assertion failures:**
- Test expectations not met
- Wrong values returned
- Missing functionality

**Timeouts:**
- Tests taking too long
- Async operations not completing
- Network timeouts

**Setup/Teardown errors:**
- Test environment issues
- Database connection errors
- Mock setup failures

## Section: Test Generation Assistance (Lines 248-273)

### Test Suggestions

**For new features:**
- Analyze code to identify test cases
- Suggest unit tests for functions
- Suggest integration tests for APIs
- Suggest E2E tests for user flows

### Test Template Generation

**Based on code structure:**
- Generate test templates for functions
- Generate test templates for components
- Generate test templates for API endpoints
- Include common test patterns

### Missing Coverage Detection

**Identify untested code:**
- Compare code with test files
- Identify functions without tests
- Identify components without tests
- Suggest tests for critical paths

## Integration Points

### In `/task/validate`:

**After automated checks:**
1. Detect test framework
2. If framework detected → run tests
3. Parse test results
4. Report pass/fail status
5. If tests fail → block validation (if configured)
6. Collect coverage (if enabled)

### In `/spec/plan`:

**When creating tasks:**
1. Check if testing is required for task
2. If yes → add test requirements to task
3. Suggest test types (unit, integration, E2E)
4. Include test acceptance criteria

### In GitHub Actions:

**In CI workflows:**
1. Add test execution step
2. Run tests on every PR
3. Collect coverage
4. Report test results
5. Block merge if tests fail (if configured)

## Error Handling

- **Test framework not detected:** Skip test execution, continue workflow
- **Test execution fails:** Report error, continue workflow (unless blocking configured)
- **Coverage collection fails:** Skip coverage, continue workflow
- **Test parsing fails:** Report raw output, continue workflow
- **Never block workflow:** All test features optional unless explicitly configured

## Configuration

### Test Configuration Options

**Via spec or config:**
- `RUN_TESTS_ON_VALIDATE=true/false` (default: true)
- `REQUIRE_TESTS_PASS=true/false` (default: false)
- `COLLECT_COVERAGE=true/false` (default: true)
- `COVERAGE_THRESHOLD=80` (minimum coverage percentage)
- `TEST_FRAMEWORK=jest` (override auto-detection)

### Sensible Defaults

- Run tests on validate: **true**
- Require tests pass: **false** (warn only)
- Collect coverage: **true**
- Coverage threshold: **none** (report only)

## Best Practices

1. **Auto-detect framework:** Don't require manual configuration
2. **Graceful degradation:** Work even if tests unavailable
3. **Report clearly:** Show test results clearly
4. **Don't block by default:** Tests are helpful but not blocking unless configured
5. **Coverage tracking:** Track coverage trends over time

## Examples

### Example 1: Jest Detection and Execution

**Detection:** `jest` in package.json
**Command:** `npm test`
**Output:** Parse Jest output
**Coverage:** `npm test -- --coverage`

### Example 2: Vitest Detection

**Detection:** `vitest` in package.json
**Command:** `npm test` or `vitest run`
**Coverage:** `vitest run --coverage`

### Example 3: Multiple Frameworks

**Detection:** Both `jest` and `@playwright/test` found
**Action:** Run both (unit tests + E2E tests)
**Report:** Combined results

### Example 4: No Framework Detected

**Detection:** No test framework found
**Action:** Skip test execution
**Report:** "No test framework detected. Skipping test execution."

