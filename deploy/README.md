# Deploy

The blog runs on the home server in an unprivileged LXC as one compose project in `/opt/blog`:
PostgreSQL, the api, the web and cloudflared. CI builds `ghcr.io/seeeeeeong/blog-v2-api` and
`ghcr.io/seeeeeeong/blog-v2-web` on every push to `main` (tags `main` and the commit SHA);
`deploy.yml` then has the server pull and restart. **Never build an image on the server.**

Only the tunnel reaches the site. No port is published; the browser sees the web alone, and
`/api/*` goes through Next's rewrite to `http://api:8150`, which is fixed when the web image is
built. `NEXT_PUBLIC_SITE_URL` (repository variable `SITE_URL`) and the footer's commit are baked
in the same way, so changing `SITE_URL` takes a new build of `main`.

## One-time setup

1. **Container**: an unprivileged LXC with `nesting=1,keyctl=1`, 2 GB of memory. Install Docker
   Engine and the compose plugin.
2. **Files**: create `/opt/blog` and copy `compose.yaml` and `backup.sh` into it. Copy
   `.env.example` to `/opt/blog/.env`, fill it in and `chmod 600` it.
3. **Images**: the packages stay private. The deploy job logs in with its own token; to pull by
   hand, `docker login ghcr.io` with a `read:packages` token first.
4. **Tunnel**: create a Cloudflare Tunnel, put its token in `TUNNEL_TOKEN`, and route the public
   hostname to `http://web:3150`.
5. **Sign-in**: a GitHub OAuth App whose callback is `<BLOG_PUBLIC_URL>/api/auth/github/callback`.
6. **Repository variable** `SITE_URL=https://<domain>`, then rerun CI on `main`.
7. **Start**: `cd /opt/blog && docker compose up -d --wait`.
8. **Backup**: copy `cron.example` to `/etc/cron.d/blog-backup` (mode 644). Dumps land in
   `/opt/blog/backup`, one per weekday, mode 600.
9. **Runner**: a self-hosted runner with the label `blog`, run as a service by a user in the
   `docker` group who owns `/opt/blog`. The `docker` group is root inside the container.
   Because the repository is public, set Settings, Actions, General, "Fork pull request
   workflows" to require approval for all external contributors, so no fork runs a job on it.
   Then set the repository variable `DEPLOY_ENABLED=true`.

## Operations

```bash
docker compose ps                     # health of every service
docker compose logs -f api            # one service's log
BLOG_TAG=<sha> docker compose up -d   # roll back to a commit's images; set it in .env to keep it

# restore a dump over the current database
docker compose exec -T postgres pg_restore -U blog -d blog --clean --if-exists < backup/blog-mon.dump
```

`compose.yaml` is copied by hand: a change to it reaches the server only when copied again.
