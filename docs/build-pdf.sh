#!/usr/bin/env bash
# Regenerate PDFs from all docs/Week*.md into docs/pdf/.
# Usage: bash docs/build-pdf.sh

set -e
cd "$(dirname "$0")"
mkdir -p pdf

for f in Week*.md; do
  echo "→ $f"
  npx --yes md-to-pdf "$f" \
    --launch-options '{"args":["--no-sandbox"]}' \
    --pdf-options '{"format":"A4","margin":{"top":"20mm","bottom":"20mm","left":"20mm","right":"20mm"},"printBackground":true}'
  mv "${f%.md}.pdf" "pdf/${f%.md}.pdf"
done

echo "✅ Done. PDFs in docs/pdf/"
