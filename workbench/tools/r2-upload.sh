#!/usr/bin/env bash
# Envia public/{frames,video,app,screens,mocks} para o bucket R2 (remoto), em paralelo. Uso: cd public && bash ../workbench/tools/r2-upload.sh
BUCKET=lp-cerne-assets
ct() { case "$1" in *.webp) echo image/webp;; *.avif) echo image/avif;; *.png) echo image/png;; *.jpg|*.jpeg) echo image/jpeg;; *.mp4) echo video/mp4;; *.webm) echo video/webm;; *.json) echo application/json;; *.svg) echo image/svg+xml;; *) echo application/octet-stream;; esac; }
export -f ct; export BUCKET
find frames video app screens mocks -type f | xargs -P 10 -I{} bash -c 'f="{}"; for t in 1 2 3; do npx wrangler r2 object put "$BUCKET/$f" --file "$f" --content-type "$(ct "$f")" --cache-control "public, max-age=31536000, immutable" --remote >/dev/null 2>&1 && exit 0; done; echo "FALHA $f"'
