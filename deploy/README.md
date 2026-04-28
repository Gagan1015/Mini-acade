# Deploying Arcado on AWS (ECS Fargate)

This is a one-shot, click-through runbook to get Arcado live on AWS without
infrastructure-as-code. After you finish once, the only thing you re-run on
each deploy is `deploy/build-and-push.ps1` (or `.sh`) plus an
`aws ecs update-service --force-new-deployment`.

## Architecture

```
                       Route53 (your portfolio domain)
                              │
        ┌─────────────────────┴─────────────────────┐
        ▼                                           ▼
   arcado.<domain>                        api.arcado.<domain>
        │                                           │
        ▼                                           ▼
   ALB :443  ──►  Target group :3000        ALB :443 (sticky cookie)
   (client)        ECS Fargate                (server)  Target group :3001
                  arcado-client                          ECS Fargate
                                                         arcado-server
                                                                │
                                                                ▼
                                                  RDS PostgreSQL (private)
```

Both services live in the **same VPC**. The server has **stickiness** enabled
on the ALB so a client's WebSocket reconnects land on the same Fargate task.

## What you need before starting

- An AWS account, an IAM user with admin access, AWS CLI v2 logged in
  (`aws configure`).
- Docker Desktop running locally.
- A registered domain in Route53 (or delegated to it). The runbook assumes the
  zone already exists; if your portfolio domain is registered elsewhere
  (Cloudflare/Namecheap), create a public hosted zone in Route53 for the
  Arcado **subdomain** (e.g. `arcado.example.com`) and add an `NS` delegation
  record at your registrar pointing to the Route53 nameservers.
- A Google or GitHub OAuth app (NextAuth) with the production callback URL
  added: `https://arcado.<domain>/api/auth/callback/google` (and the same for
  github).

Pick a **region** once and stick to it. Examples below use `ap-south-1` (Mumbai)
since it's closest to your timezone — change it everywhere if you prefer
another region.

---

## Step 0 — Pick names

Settle on these strings up front; you'll paste them into many places.

| Name | Example |
|---|---|
| Region | `ap-south-1` |
| Cluster | `arcado` |
| Client service | `arcado-client` |
| Server service | `arcado-server` |
| ECR repos | `arcado-client`, `arcado-server` |
| RDS instance | `arcado-db` |
| Client hostname | `arcado.<your-portfolio-domain>` |
| Server hostname | `api.arcado.<your-portfolio-domain>` |

---

## Step 1 — Create the two ECR repositories

```bash
aws ecr create-repository --repository-name arcado-client --region ap-south-1
aws ecr create-repository --repository-name arcado-server --region ap-south-1
```

Note your account ID — you'll see it echoed in the response (`123456789012`).

## Step 2 — Configure the local `.env.deploy`

```bash
cp deploy/.env.deploy.example deploy/.env.deploy
# edit AWS_ACCOUNT_ID, AWS_REGION, NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
```

Use the **production HTTPS** URLs even though the ALB doesn't exist yet — you
can rebuild the client later if these change, but it's cheaper to set them
correctly the first time:

```
NEXT_PUBLIC_API_URL=https://api.arcado.<your-portfolio-domain>
NEXT_PUBLIC_WS_URL=wss://api.arcado.<your-portfolio-domain>
```

Then build + push both images:

```powershell
# Windows
Get-Content deploy/.env.deploy | ForEach-Object {
  if ($_ -match '^\s*([^#][^=]+)=(.*)$') { Set-Item "Env:$($Matches[1].Trim())" $Matches[2].Trim() }
}
.\deploy\build-and-push.ps1
```

```bash
# macOS/Linux
set -a && . deploy/.env.deploy && set +a
./deploy/build-and-push.sh
```

You should see the images show up in ECR in the AWS Console.

---

## Step 3 — Create the VPC

In the **VPC console** → **Create VPC**:

- **VPC and more** preset.
- Name: `arcado-vpc`
- IPv4 CIDR: `10.0.0.0/16`
- AZs: 2
- Public subnets: 2 (for the ALB + NAT gateway)
- Private subnets: 2 (for ECS tasks + RDS)
- NAT gateway: **In 1 AZ** (cheapest setup; one NAT is fine)
- VPC endpoints: None
- Click **Create**.

Wait a couple of minutes for the NAT to come up. Note the four subnet IDs.

---

## Step 4 — Create the RDS PostgreSQL instance

1. **Aurora and RDS console** → **Create database**.
2. Engine: **PostgreSQL** 16.x (default minor). Template: **Free tier** for
   testing, **Production** otherwise.
3. DB instance identifier: `arcado-db`.
4. Master username: `arcado`. Password: generate a strong one and save it in a
   password manager.
5. Instance class: `db.t4g.micro` (free tier eligible) or `db.t4g.small` for
   prod.
6. Storage: 20 GiB gp3, autoscaling enabled.
7. **Connectivity**:
   - VPC: `arcado-vpc`
   - DB subnet group: create new, pick the **two private** subnets.
   - Public access: **No**.
   - VPC security group: create new called `arcado-db-sg` (we'll edit it
     in step 6).
8. **Initial database name**: `arcado`.
9. Backup retention: 7 days.
10. Create.

Note the **endpoint** once it's available (e.g. `arcado-db.xxxxx.ap-south-1.rds.amazonaws.com`).

The full connection string you'll plug into Secrets Manager later:

```
postgresql://arcado:<password>@arcado-db.xxxxx.ap-south-1.rds.amazonaws.com:5432/arcado?schema=public&sslmode=require
```

---

## Step 5 — Push your DB schema

The fastest way to seed the schema without spinning up a bastion host: run
`prisma db push` from your laptop through a temporary IP allowlist.

1. RDS console → `arcado-db` → modify **Public accessibility** → **Yes**
   (leave the SG closed for now).
2. EC2 → Security Groups → `arcado-db-sg` → add an inbound rule
   **PostgreSQL 5432** from your current public IP (`<your-ip>/32`).
3. From your laptop:
   ```bash
   DATABASE_URL="postgresql://arcado:<password>@arcado-db.xxxxx.ap-south-1.rds.amazonaws.com:5432/arcado?sslmode=require" \
     pnpm --filter @arcado/db db:push
   DATABASE_URL="..." pnpm --filter @arcado/db db:seed   # optional
   ```
4. Revert: RDS → Public accessibility → **No**, and delete the `5432 from <your-ip>/32` rule.

---

## Step 6 — Security groups

In the EC2 console → **Security Groups**:

| Name | Inbound rules |
|---|---|
| `arcado-alb-sg` | 80 + 443 from `0.0.0.0/0` |
| `arcado-tasks-sg` | 3000 + 3001 from **`arcado-alb-sg`** only |
| `arcado-db-sg` | 5432 from **`arcado-tasks-sg`** only |

This produces the chain `internet → ALB → tasks → RDS`, with nothing else
publicly reachable.

---

## Step 7 — Create the secrets

In **AWS Secrets Manager** create three "Other type of secret" entries (key
`value`, plaintext):

| Secret name | Plaintext |
|---|---|
| `arcado/database-url` | the full `postgresql://...` connection string from step 4 |
| `arcado/nextauth-secret` | output of `openssl rand -base64 32` |
| `arcado/oauth-google-id` | from Google Cloud Console |
| `arcado/oauth-google-secret` | from Google Cloud Console |
| `arcado/oauth-github-id` | from GitHub OAuth app |
| `arcado/oauth-github-secret` | from GitHub OAuth app |

Note each secret's full ARN.

---

## Step 8 — Request an ACM certificate

ACM **must be in `us-east-1` for CloudFront**, but for ALB it must be in the
**same region as the ALB** (`ap-south-1` here).

1. ACM (`ap-south-1`) → **Request certificate** → public.
2. Domain names: `arcado.<domain>` and `api.arcado.<domain>` (one cert
   covers both).
3. Validation: **DNS**.
4. Click **Create records in Route53** to auto-create the validation CNAMEs.
5. Wait 1–5 minutes until status is **Issued**.

---

## Step 9 — Create the Application Load Balancer

EC2 → **Load Balancers** → **Create** → **Application Load Balancer**.

- Name: `arcado-alb`
- Scheme: **internet-facing**
- VPC: `arcado-vpc`
- Mappings: pick the **two public** subnets
- Security group: `arcado-alb-sg`
- Listeners:
  - **HTTP :80** → action **redirect to HTTPS :443**
  - **HTTPS :443** → certificate from step 8 → for now create a placeholder
    target group named `arcado-client-tg` (target type **IP**, port 3000,
    protocol HTTP, VPC `arcado-vpc`, health check path `/`).

Click **Create load balancer**.

After it's created, also create a **second target group** for the server:

- EC2 → Target Groups → Create
- Name: `arcado-server-tg`, target type **IP**, port `3001`, protocol HTTP,
  VPC `arcado-vpc`, health check path `/health`.
- After creation, **edit** the target group → **Attributes** → enable:
  - **Stickiness**: Type = **Load balancer generated cookie**, duration **1
    day**. (Critical for Socket.IO long-poll fallback / reconnect.)
  - **Deregistration delay**: 30s.

Add **host-based listener rules** to the HTTPS :443 listener:

| Priority | Condition | Action |
|---|---|---|
| 10 | Host header `api.arcado.<domain>` | Forward to `arcado-server-tg` |
| 20 | Host header `arcado.<domain>` | Forward to `arcado-client-tg` |
| default | * | Forward to `arcado-client-tg` |

---

## Step 10 — Create the ECS cluster + task definitions + services

ECS console → **Clusters** → **Create cluster**:

- Name: `arcado`
- Infrastructure: **AWS Fargate (serverless)**.
- Create.

### Task definition: `arcado-client`

- Launch type: **Fargate**
- OS: **Linux/X86_64** (or ARM64 if you built ARM images on an M-series Mac
  — see notes at the bottom).
- CPU/Memory: **0.5 vCPU / 1 GB** (good starting point)
- Task role: leave blank.
- Task execution role: `ecsTaskExecutionRole` (auto-create on first use).
  After creation, attach the AWS managed policy
  **`SecretsManagerReadWrite`** OR a tighter inline policy that only allows
  `secretsmanager:GetSecretValue` on the ARNs from step 7.
- Container:
  - Name: `client`
  - Image: `<account>.dkr.ecr.ap-south-1.amazonaws.com/arcado-client:latest`
  - Port mappings: container port `3000`, protocol TCP.
  - Environment variables (plain):
    - `NODE_ENV=production`
    - `NEXTAUTH_URL=https://arcado.<domain>`
    - `ADMIN_EMAILS=you@example.com`
  - Environment variables (from Secrets Manager — paste the ARNs from step 7):
    - `DATABASE_URL` ← `arcado/database-url`
    - `NEXTAUTH_SECRET` ← `arcado/nextauth-secret`
    - `GOOGLE_CLIENT_ID` ← `arcado/oauth-google-id`
    - `GOOGLE_CLIENT_SECRET` ← `arcado/oauth-google-secret`
    - `GITHUB_CLIENT_ID` ← `arcado/oauth-github-id`
    - `GITHUB_CLIENT_SECRET` ← `arcado/oauth-github-secret`
  - Log driver: `awslogs`, log group `/ecs/arcado-client` (auto-create).
- Create.

### Task definition: `arcado-server`

Same shape, different image and env:

- Container name: `server`, port `3001`.
- Environment variables (plain):
  - `NODE_ENV=production`
  - `PORT=3001`
  - `CLIENT_URL=https://arcado.<domain>`
  - `ADMIN_EMAILS=you@example.com`
- Environment variables (from secrets):
  - `DATABASE_URL` ← `arcado/database-url`
  - `JWT_SECRET` ← reuse `arcado/nextauth-secret` (or create a separate one)

### Services

Create two services in the `arcado` cluster:

| Service | Task def | Desired count | Subnets | SG | Target group | Container port |
|---|---|---|---|---|---|---|
| `arcado-client` | `arcado-client:1` | 1 | private | `arcado-tasks-sg` | `arcado-client-tg` | 3000 |
| `arcado-server` | `arcado-server:1` | 1 | private | `arcado-tasks-sg` | `arcado-server-tg` | 3001 |

For each service:
- **Network**: VPC `arcado-vpc`, subnets = the two **private** subnets,
  security group = `arcado-tasks-sg`, **public IP = OFF**.
- **Load balancing**: Application Load Balancer, pick `arcado-alb`, the
  matching listener and target group.
- **Service auto scaling**: optional. Min 1, Max 4, target tracking on CPU
  60% is sane.

---

## Step 11 — Point Route53 at the ALB

Route53 → your hosted zone → **Create record**:

| Name | Type | Alias | Target |
|---|---|---|---|
| `arcado` | A | yes | `arcado-alb-...elb.amazonaws.com` |
| `api.arcado` | A | yes | `arcado-alb-...elb.amazonaws.com` |

Both records point at the same ALB; the host-based listener rules from
step 9 do the routing.

Wait 30–120 seconds for DNS to propagate.

---

## Step 12 — Smoke test

```bash
curl -I https://arcado.<domain>
curl https://api.arcado.<domain>/health
```

Then open `https://arcado.<domain>` in a browser. Sign in via Google / GitHub.
Open the network tab and confirm the websocket upgrades to `wss://api.arcado.<domain>`.

If something is wrong, the fastest diagnostic is **CloudWatch Logs** →
`/ecs/arcado-client` and `/ecs/arcado-server`. Most failures the first time
through this runbook are:

- Missing secret value → service crashes on boot.
- Tasks running in a subnet without a NAT route → can't pull from ECR.
- `arcado-tasks-sg` not allowing 3000/3001 from `arcado-alb-sg` → ALB
  health check fails.
- OAuth callback URL not added to the Google/GitHub app → sign in 400s.

---

## Re-deploying

After the first stand-up, every deploy is two steps:

```powershell
.\deploy\build-and-push.ps1
aws ecs update-service --cluster arcado --service arcado-client --force-new-deployment --region ap-south-1
aws ecs update-service --cluster arcado --service arcado-server --force-new-deployment --region ap-south-1
```

ECS will pull the new `:latest` tag and roll the tasks one at a time.

If you want CI to do this automatically on push to `main`, ask me to wire up
a GitHub Actions workflow next — it's about 40 lines of YAML and one IAM role
with OIDC trust.

---

## Notes & gotchas

- **ARM vs x86**: if you're on an M-series Mac, `docker build` produces ARM
  images. Fargate supports ARM (Graviton) — set the task definition's CPU
  architecture to `ARM64` and Fargate will run it. To force x86 from an M
  Mac use `docker buildx build --platform linux/amd64 ...`.
- **Cold start**: a fresh Fargate task takes ~30 s to pull, start Node, and
  pass the health check. The ALB will keep the old task alive in the
  meantime as long as `Minimum healthy percent` is at the default 100%.
- **Costs**: 2× Fargate (0.5 vCPU / 1 GB) + ALB + NAT gateway + RDS t4g.micro
  ≈ **\$60–80 / month** in `ap-south-1`. The NAT gateway is the biggest
  surprise (~\$32/mo). To shave that off, put tasks in **public subnets with
  public IP enabled** and skip the NAT — fine for a side project, less ideal
  for prod.
- **WebSocket stickiness**: already configured on the server target group,
  but verify in the ALB target group **Attributes** tab if connections drop
  unexpectedly.
- **Database migrations**: this project uses `prisma db push` (no migration
  history yet). When you adopt `prisma migrate`, add a one-shot ECS task
  that runs `prisma migrate deploy` before the service rolls.
- **Prisma engine missing in client**: if the client task crashes at boot
  with a "Prisma Client could not locate the Query Engine" error, it means
  Next.js's file tracer didn't pick up the native `.so.node`. Fix by adding
  an explicit `output` in `db/prisma/schema.prisma`:
  ```prisma
  generator client {
    provider      = "prisma-client-js"
    output        = "../../node_modules/.prisma/client"
    binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
  }
  ```
  …rebuild, and add a `COPY --from=builder /repo/node_modules/.prisma
  ./node_modules/.prisma` line to `client/Dockerfile` runner stage.
