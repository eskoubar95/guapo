---
helper_id: deployment-detection
load_when:
  - pr_created
  - pr_updated
  - validation_step
sections:
  detection:
    title: "Provider Detection"
    lines: [32, 91]
  preview:
    title: "Preview Deployment Logic"
    lines: [111, 194]
  status:
    title: "Deployment Status Checking"
    lines: [214, 217]
always_load: false
---

# Deployment Detection & Automation

This helper provides logic for detecting deployment providers and automating preview deployments for PRs.

## Purpose

Automatically detect deployment providers and handle preview deployments:
- Detect deployment provider (Vercel, Railway, Netlify, etc.)
- Trigger preview deployments when PRs are created
- Check deployment status
- Add preview URLs to PR descriptions

## Section: Provider Detection (Lines 13-91)

### Detection Methods

**Method 1: Config Files**
- Check for provider-specific config files
- Vercel: `vercel.json`, `.vercel/` folder
- Railway: `railway.json`, `railway.toml`
- Netlify: `netlify.toml`
- AWS: `amplify.yml`, `serverless.yml`, `sam.yaml`, `appspec.yml`, `buildspec.yml`
- GCP: `app.yaml`, `cloudbuild.yaml`
- Azure: `azure-pipelines.yml`, `.github/workflows/azure-*.yml`
- Docker: `Dockerfile`, `docker-compose.yml`
- Kubernetes: `kubernetes/`, `k8s/` directories, `*.yaml` manifests

**Method 2: Spec Files**
- Read `spec/08-infrastructure.md`
- Check "Hosting" section for provider
- Check "CI/CD" section for deployment config

**Method 3: Environment Variables**
- Check for provider-specific env vars
- Vercel: `VERCEL`, `VERCEL_URL`
- Railway: `RAILWAY_ENVIRONMENT`
- Netlify: `NETLIFY`

**Method 4: Git Remote**
- Check git remote URLs
- `*.vercel.app` → Vercel
- `*.railway.app` → Railway
- `*.netlify.app` → Netlify
- `*.amplifyapp.com` → AWS Amplify
- `*.run.app` → GCP Cloud Run
- `*.appspot.com` → GCP App Engine
- `*.web.app` → Firebase Hosting
- `*.azurewebsites.net` → Azure App Service
- `*.azurestaticapps.net` → Azure Static Web Apps

### Provider-Specific Detection

#### Vercel

**Detection:**
- Check for `vercel.json` file
- Check for `.vercel/` directory
- Check for `VERCEL` environment variable
- Check git remote for `vercel.app`

**Preview Deployment:**
- Vercel automatically creates preview deployments for PRs
- Preview URL format: `https://[project-name]-[hash].vercel.app`
- Get preview URL from Vercel API or git remote

#### Railway

**Detection:**
- Check for `railway.json` file
- Check for `railway.toml` file
- Check for `RAILWAY_ENVIRONMENT` environment variable
- Check git remote for `railway.app`

**Preview Deployment:**
- Railway can create preview environments for PRs
- Requires Railway CLI or API integration
- Preview URL from Railway dashboard or API

#### Netlify

**Detection:**
- Check for `netlify.toml` file
- Check for `netlify/` directory
- Check for `NETLIFY` environment variable
- Check git remote for `netlify.app`

**Preview Deployment:**
- Netlify automatically creates preview deployments for PRs
- Preview URL format: `https://[branch-name]--[project-name].netlify.app`
- Get preview URL from Netlify API or build logs

## Section: Preview Deployment Logic (Lines 92-194)

### When to Deploy

**Trigger conditions:**
1. PR created (after PR creation)
2. PR updated (new commits pushed)
3. Manual trigger (if user requests)

**Skip conditions:**
1. Provider not detected
2. Preview deployment not configured
3. Deployment already in progress
4. User explicitly skips deployment

### Deployment Process

**Step 1: Detect Provider**
1. Run provider detection
2. If provider detected → proceed
3. If no provider → skip deployment

**Step 2: Check Deployment Status**
1. Check if deployment already exists for PR
2. If exists → get preview URL
3. If not exists → trigger deployment

**Step 3: Trigger Deployment**

**Vercel:**
- Vercel auto-deploys on PR creation (if connected to GitHub)
- Get preview URL from Vercel API or wait for webhook
- Alternative: Use Vercel CLI `vercel --prod=false`

**Railway:**
- Use Railway CLI: `railway up`
- Or trigger via Railway API
- Get preview URL from Railway dashboard

**Netlify:**
- Netlify auto-deploys on PR creation (if connected to GitHub)
- Get preview URL from Netlify API
- Alternative: Use Netlify CLI `netlify deploy --branch=<branch-name>`

**AWS Amplify:**
- Amplify auto-deploys on PR creation (if connected to GitHub)
- Get preview URL from Amplify API or console
- Alternative: Use Amplify CLI `amplify publish --branch=<branch-name>`

**AWS Lambda (Serverless):**
- Use Serverless Framework: `serverless deploy --stage=preview`
- Or use AWS SAM: `sam deploy --stack-name preview-<branch>`
- Get preview URL from API Gateway or Lambda function URL

**GCP Cloud Run:**
- Deploy to preview service: `gcloud run deploy <service>-preview --source .`
- Get preview URL from Cloud Run service URL
- Or use Cloud Build for automated deployment

**GCP App Engine:**
- Deploy preview version: `gcloud app deploy --version=<branch-name>`
- Get preview URL from App Engine version URL

**Firebase Hosting:**
- Auto-deploys on PR creation (if connected to GitHub)
- Get preview URL from Firebase Hosting API
- Alternative: Use Firebase CLI `firebase hosting:channel:deploy <branch-name>`

**Azure App Service:**
- Deploy to staging slot: `az webapp deployment slot swap --slot staging`
- Get preview URL from staging slot URL
- Or use Azure CLI for preview deployment

**Azure Static Web Apps:**
- Auto-deploys on PR creation (if connected to GitHub)
- Get preview URL from Azure Static Web Apps API
- Preview URL format: `https://[branch-name].[app-name].azurestaticapps.net`

**Docker:**
- Build image: `docker build -t <image>:<branch-name> .`
- Push to registry: `docker push <image>:<branch-name>`
- Deploy to preview environment (provider-specific)

**Kubernetes:**
- Apply manifests to preview namespace: `kubectl apply -f k8s/ -n preview-<branch>`
- Get preview URL from ingress or service
- Or use Helm for preview deployment: `helm install preview-<branch> ./chart`

**Self-Hosted:**
- Execute custom deployment script
- Or trigger via CI/CD pipeline
- Get preview URL from deployment output or config

**Step 4: Wait for Deployment**
1. Poll deployment status
2. Wait for deployment to complete (or timeout)
3. Get preview URL when ready

**Step 5: Update PR**
1. Add preview URL to PR description
2. Format: `### Preview\n[Preview URL](url)`
3. Update PR via GitHub helpers

## Section: Deployment Status Checking (Lines 195-217)

### Vercel

**Check status:**
- Use Vercel API: `GET /v1/deployments`
- Check deployment status: `ready`, `building`, `error`
- Get preview URL from deployment object

### Railway

**Check status:**
- Use Railway API or CLI
- Check service status
- Get preview URL from service URL

### Netlify

**Check status:**
- Use Netlify API: `GET /api/v1/sites/[site_id]/deploys`
- Check deploy status: `ready`, `building`, `error`
- Get preview URL from deploy object

## Integration Points

### In `/task/validate`:

**After PR created:**
1. Detect deployment provider
2. If provider detected → trigger preview deployment
3. Wait for deployment (with timeout)
4. Get preview URL
5. Update PR description with preview URL
6. Update state tracking

### In GitHub Workflow:

**If GitHub Actions configured:**
- GitHub Actions can handle deployment
- This helper can check deployment status
- Get preview URL from GitHub Actions output or provider API

## Error Handling

- **Provider not detected:** Skip deployment, continue workflow
- **Deployment fails:** Report error, continue without preview URL
- **Deployment timeout:** Report timeout, continue workflow
- **API unavailable:** Skip deployment, continue workflow
- **Preview URL not available:** Continue without preview URL

## Best Practices

1. **Auto-detect provider:** Don't require manual configuration
2. **Graceful degradation:** Work even if deployment unavailable
3. **Update PR description:** Always add preview URL when available
4. **Handle timeouts:** Don't block workflow waiting for deployment
5. **Cache preview URLs:** Store in state file for quick access

## Examples

### Example 1: Vercel Auto-Deployment

**Detection:** `vercel.json` found
**Action:** Wait for Vercel auto-deployment
**Result:** Get preview URL from Vercel API
**Update PR:** Add preview URL to PR description

### Example 2: Railway Manual Deployment

**Detection:** `railway.json` found
**Action:** Trigger deployment via Railway CLI
**Result:** Get preview URL from Railway
**Update PR:** Add preview URL to PR description

### Example 3: No Provider Detected

**Detection:** No provider config found
**Action:** Skip deployment
**Result:** Continue workflow without preview URL
**Update PR:** No preview URL added

