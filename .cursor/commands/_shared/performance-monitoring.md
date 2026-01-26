---
helper_id: performance-monitoring
load_when:
  - preview_url_available
  - performance_enabled
  - validation_step
  - refactoring_analysis
sections:
  metrics:
    title: "Performance Metrics Collection"
    lines: [37, 80]
  tools:
    title: "Monitoring Tools Integration"
    lines: [104, 146]
  regression:
    title: "Performance Regression Detection"
    lines: [170, 180]
  lighthouse:
    title: "Lighthouse Integration"
    lines: [222, 250]
always_load: false
---

# Performance Monitoring Integration

This helper provides logic for performance metrics collection, monitoring tools integration, performance regression detection, and Lighthouse integration - all framework-agnostic and dynamically adaptable.

## Purpose

Monitor and track performance metrics:
- Collect performance metrics (bundle size, load time, API response time)
- Integrate with monitoring tools (Vercel Analytics, Google Analytics, Sentry, etc.)
- Detect performance regressions
- Run Lighthouse audits
- Report performance metrics in PRs

## Section: Performance Metrics Collection (Lines 14-80)

### Bundle Size Tracking

**Framework-Agnostic Detection:**
- Check build output directory (dist/, build/, .next/, out/)
- Calculate total bundle size
- Track individual file sizes
- Detect large files (> 100KB)

**Bundle Analysis:**
- Parse build output for size information
- Track bundle size over time
- Compare bundle size before/after changes
- Alert if bundle size increases significantly (> 20%)

**Storage:**
- Store bundle size data in `.sdd/performance-metrics.json`
- Track trends over time
- Compare with previous builds

### Load Time Metrics

**Frontend Load Time:**
- Measure initial page load time
- Measure time to interactive (TTI)
- Measure first contentful paint (FCP)
- Measure largest contentful paint (LCP)

**Backend Response Time:**
- Measure API endpoint response times
- Track database query performance
- Monitor server response times

**Collection Methods:**
- Browser DevTools Performance API
- Server-side timing headers
- Custom performance marks
- Framework-agnostic timing

### API Response Time Tracking

**Endpoint Monitoring:**
- Track response times per endpoint
- Identify slow endpoints (> 500ms)
- Track p50, p95, p99 percentiles
- Monitor error rates

**Database Query Performance:**
- Track query execution time
- Identify slow queries (> 100ms)
- Monitor query frequency
- Detect N+1 query problems

### Database Query Performance

**Query Monitoring:**
- Track query execution time
- Identify slow queries
- Monitor query patterns
- Detect inefficient queries

**Framework-Agnostic:**
- Works with any database (PostgreSQL, MySQL, MongoDB, etc.)
- Parse query logs or use database-specific tools
- Track query performance over time

## Section: Monitoring Tools Integration (Lines 81-146)

### Vercel Analytics

**Integration:**
- Check if Vercel Analytics is enabled
- Read analytics data from Vercel API
- Track Core Web Vitals
- Monitor performance metrics

**Metrics:**
- Real User Monitoring (RUM) data
- Core Web Vitals (LCP, FID, CLS)
- Performance scores
- Error rates

### Google Analytics

**Integration:**
- Check for Google Analytics configuration
- Read analytics data via API (if available)
- Track page load times
- Monitor user experience metrics

**Metrics:**
- Page load time
- Time to interactive
- Bounce rate
- User engagement

### Sentry Performance

**Integration:**
- Check if Sentry is configured
- Read performance data from Sentry API
- Track transaction performance
- Monitor error rates

**Metrics:**
- Transaction duration
- Transaction throughput
- Error rate
- Apdex score

### New Relic / Datadog

**Integration:**
- Check for New Relic or Datadog configuration
- Read performance data via API
- Track application performance
- Monitor infrastructure metrics

**Metrics:**
- Application response time
- Throughput
- Error rate
- Infrastructure metrics

### Custom Performance APIs

**Integration:**
- Support for custom performance monitoring
- Read from custom APIs
- Parse custom metrics format
- Framework-agnostic integration

## Section: Performance Regression Detection (Lines 147-180)

### Before/After Comparison

**Compare Performance:**
- Get baseline performance from previous build/commit
- Compare current performance with baseline
- Calculate performance delta
- Flag significant regressions (> 20% degradation)

### Performance Budgets

**Budget Definition:**
- Set maximum bundle size (e.g., 500KB)
- Set maximum load time (e.g., 2 seconds)
- Set maximum API response time (e.g., 200ms)
- Set minimum Lighthouse score (e.g., 90)

**Budget Enforcement:**
- Check if metrics exceed budgets
- Flag budget violations
- Block PR if budgets exceeded (optional)
- Report budget status in PR

### Performance Reports

**PR Comments:**
- Add performance metrics to PR comments
- Show before/after comparison
- Highlight regressions
- Suggest optimizations

**Report Format:**
```markdown
## Performance Metrics

### Bundle Size
- Current: 450KB
- Previous: 420KB
- Change: +30KB (+7.1%) ⚠️

### Load Time
- Current: 1.8s
- Previous: 1.6s
- Change: +0.2s (+12.5%) ⚠️

### API Response Time
- Current: 150ms (p95)
- Previous: 140ms (p95)
- Change: +10ms (+7.1%)
```

## Section: Lighthouse Integration (Lines 199-250)

### Lighthouse Audits

**Automatic Audits:**
- Run Lighthouse audit on preview URL
- Collect performance, accessibility, SEO, best practices scores
- Generate Lighthouse report
- Parse Lighthouse JSON output

**Audit Configuration:**
- Desktop or mobile audit
- Performance budget
- Custom categories
- Framework-agnostic (works with any web app)

### Lighthouse Scores

**Performance Score:**
- 0-100 performance score
- Core Web Vitals (LCP, FID, CLS)
- Performance metrics
- Opportunities for improvement

**Accessibility Score:**
- 0-100 accessibility score
- Accessibility violations
- ARIA issues
- Color contrast issues

**SEO Score:**
- 0-100 SEO score
- Meta tags
- Structured data
- Mobile-friendly

**Best Practices Score:**
- 0-100 best practices score
- Security issues
- HTTPS usage
- Console errors

### Lighthouse Reporting

**PR Comments:**
- Add Lighthouse scores to PR comments
- Show score changes
- Highlight regressions
- Link to full Lighthouse report

**Report Format:**
```markdown
## Lighthouse Audit Results

### Performance: 92 (was 95) ⚠️
- LCP: 1.2s
- FID: 10ms
- CLS: 0.05

### Accessibility: 98 (was 98) ✅
### SEO: 95 (was 95) ✅
### Best Practices: 100 (was 100) ✅
```

## Integration Points

### In `/task/validate`:

**After validation:**
1. Collect performance metrics (if enabled)
2. Run Lighthouse audit (if preview URL available)
3. Compare with baseline
4. Report performance status
5. Add performance metrics to PR comment (if PR exists)

### In GitHub Actions:

**In CI workflows:**
1. Build application
2. Measure bundle size
3. Run Lighthouse audit (if possible)
4. Report performance metrics
5. Fail build if budgets exceeded (optional)

## Error Handling

- **Metrics collection fails:** Skip metrics, continue workflow
- **Monitoring tool unavailable:** Skip monitoring, continue workflow
- **Lighthouse audit fails:** Skip Lighthouse, continue workflow
- **Performance regression detected:** Report warning, don't block (unless configured)
- **Never block workflow:** All performance features optional

## Configuration

### Performance Configuration Options

**Via spec or config:**
- `COLLECT_PERFORMANCE_METRICS=true/false` (default: true)
- `RUN_LIGHTHOUSE_AUDITS=true/false` (default: true)
- `PERFORMANCE_BUDGET_BUNDLE_SIZE=500KB` (max bundle size)
- `PERFORMANCE_BUDGET_LOAD_TIME=2000ms` (max load time)
- `PERFORMANCE_BUDGET_LIGHTHOUSE=90` (min Lighthouse score)
- `BLOCK_ON_PERFORMANCE_REGRESSION=true/false` (default: false)

### Sensible Defaults

- Collect metrics: **true**
- Run Lighthouse: **true** (if preview URL available)
- Performance budgets: **none** (report only)
- Block on regression: **false** (warn only)

## Best Practices

1. **Auto-detect monitoring tools:** Don't require manual configuration
2. **Graceful degradation:** Work even if monitoring unavailable
3. **Report clearly:** Show performance metrics clearly
4. **Don't block by default:** Performance is important but not blocking unless configured
5. **Track trends:** Monitor performance over time

## Examples

### Example 1: Bundle Size Tracking

**Detection:** Build output in `dist/` directory
**Measurement:** Calculate total bundle size
**Comparison:** Compare with previous build
**Report:** "Bundle size: 450KB (+30KB from previous build)"

### Example 2: Lighthouse Audit

**Trigger:** Preview URL available
**Audit:** Run Lighthouse on preview URL
**Scores:** Performance: 92, Accessibility: 98, SEO: 95
**Report:** Add scores to PR comment

### Example 3: Performance Regression

**Baseline:** Previous build performance metrics
**Current:** Current build performance metrics
**Comparison:** Detect 20% degradation in load time
**Action:** Report warning in PR comment

### Example 4: No Monitoring Available

**Detection:** No monitoring tools configured
**Action:** Skip performance monitoring
**Report:** "Performance monitoring not configured. Skipping."

