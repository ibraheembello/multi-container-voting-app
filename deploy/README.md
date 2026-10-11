# Deployment (AWS EC2)

The app runs on an EC2 host behind the host nginx, which terminates TLS for
`voting.ibraheembello.com` and proxies to the web container on `127.0.0.1:8080`.
After the one-time setup below, every push to `main` deploys automatically
through GitHub Actions.

## One-time host setup

1. **Install Docker + Compose plugin** on the host.

2. **DNS:** add an A record `voting.ibraheembello.com` pointing at the host's
   public IP (managed in Route 53 here).

3. **App directory and env:**

   ```bash
   mkdir -p ~/voting
   cat > ~/voting/.env <<'EOF'
   POSTGRES_USER=voteuser
   POSTGRES_PASSWORD=<strong-password>
   POSTGRES_DB=voting
   JWT_SECRET=<long-random-string>
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=<admin-email>
   ADMIN_PASSWORD=<admin-password>
   EOF
   chmod 600 ~/voting/.env
   ```

4. **Nginx site:** copy `nginx/voting.ibraheembello.com.conf` into
   `/etc/nginx/sites-available/`, symlink it into `sites-enabled/`, and reload.

5. **TLS:** issue a certificate and enable auto-renewal.

   ```bash
   sudo certbot --nginx -d voting.ibraheembello.com --non-interactive \
     --agree-tos --redirect -m <email>
   ```

## GitHub Actions secrets

| Secret        | Value                                          |
| ------------- | ---------------------------------------------- |
| `EC2_HOST`    | the host's public IP or DNS name               |
| `EC2_SSH_KEY` | the private key for the `ubuntu` user on the host |

`GITHUB_TOKEN` is provided automatically and is used to push and pull GHCR
images.

## How a deploy runs

The `deploy` job copies `docker-compose.prod.yml` and `remote-deploy.sh` to
`~/voting/`, then runs `remote-deploy.sh` over SSH, which:

1. logs in to GHCR,
2. pulls the images tagged with the commit SHA,
3. rolls the stack with `docker compose -f docker-compose.prod.yml up -d`,
4. smoke-tests `/api/health`,
5. records the SHA as last-good, or rolls back to the previous last-good tag if
   the smoke test fails.
