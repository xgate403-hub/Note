#!/usr/bin/env sh
# 从 npm registry 获取 IBM Plex Sans SC（OFL-1.1）完整 woff2，放入 demo/fonts/
# 拉丁 IBM Plex Sans 与 Departure Mono 体积小，已随仓库提供。
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
OUT="$HERE/../demo/fonts"
TMP=$(mktemp -d)
echo "downloading @ibm/plex-sans-sc 1.1.0 (~120MB tarball) ..."
curl -sSL -o "$TMP/plexsc.tgz" https://registry.npmjs.org/@ibm/plex-sans-sc/-/plex-sans-sc-1.1.0.tgz
tar xzf "$TMP/plexsc.tgz" -C "$TMP"
for w in Regular Medium SemiBold Bold; do
  cp "$TMP/package/fonts/complete/woff2/hinted/IBMPlexSansSC-$w.woff2" "$OUT/"
done
rm -rf "$TMP"
ls -la "$OUT"
