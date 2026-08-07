#!/bin/bash
# release.sh — the ONLY way frontend changes reach allcanlearn.uk
#
# Editing src/ is not enough: the server serves the compiled bundle in build/,
# so src/ must be rebuilt and the new build committed. Run this after any
# change under src/ or public/.
#
#   ./release.sh "fix: shorter episode cards"
#
# Backend-only changes (app/*.py) don't need a rebuild — commit them normally.

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

MSG="${1:-}"
if [ -z "$MSG" ]; then
    echo "Usage: ./release.sh \"commit message\""
    exit 1
fi

if [ ! -d node_modules ]; then
    echo "==> node_modules missing, installing..."
    npm install --no-audit --no-fund
fi

echo "==> Building React app..."
CI=false npm run build

echo "==> Removing bundles no longer referenced by index.html..."
python3 - <<'PY'
import json, os, re, glob
html = open('build/index.html').read()
man  = json.load(open('build/asset-manifest.json'))
keep = {os.path.basename(v) for v in man.get('files', {}).values()}
keep |= set(re.findall(r'/static/(?:js|css)/([\w.]+)', html))
stems = {k.rsplit('.', 1)[0] for k in keep}
removed = 0
for f in glob.glob('build/static/js/*') + glob.glob('build/static/css/*'):
    base = os.path.basename(f)
    root = base.split('.map')[0].split('.LICENSE')[0]
    if root in keep or root.rsplit('.', 1)[0] in stems:
        continue
    os.remove(f); removed += 1
print(f"    removed {removed} stale file(s)")
PY

echo "==> Bundle now served:"
grep -o 'main\.[a-z0-9]*\.js' build/index.html

echo "==> Committing..."
git add -A
git commit -m "$MSG" || { echo "Nothing to commit."; exit 0; }
git push origin main

echo
echo "Pushed. Now deploy on the Ubuntu box:"
echo "  cd /home/vikki/AllCanLearn-v6 && ./deploy.sh"
