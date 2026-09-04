#!/usr/bin/env bash
# ==============================================================================
# wsl-dedede-builder.sh
# Port of 12dakota/Chromeos for WSL2 Ubuntu environment
# Builds ChromiumOS for board dedede with Firefox rootfs & custom bootsplash
# ==============================================================================

set -euo pipefail

BOARD="${BOARD:-dedede}"
MANIFEST_BRANCH="${MANIFEST_BRANCH:-release-R120-15662.B}"
CROS_ROOT="${CROS_ROOT:-$HOME/chromiumos}"
INCLUDE_FIREFOX="${INCLUDE_FIREFOX:-1}"
FIREFOX_VERSION="${FIREFOX_VERSION:-140.0}"
OUT_DIR="${OUT_DIR:-$PWD/flash}"
REPO_JOBS="${REPO_JOBS:-8}"

echo "=========================================================="
echo " Starting ChromiumOS Build Pipeline"
echo " Board:           ${BOARD}"
echo " Firefox:         ${FIREFOX_VERSION} (include=${INCLUDE_FIREFOX})"
echo " Manifest:        ${MANIFEST_BRANCH}"
echo " Source Root:     ${CROS_ROOT}"
echo " Output Dir:      ${OUT_DIR}"
echo "=========================================================="

mkdir -p "$CROS_ROOT" "$OUT_DIR"

# 1. Install prerequisites in WSL2
echo "== [1/6] Installing build host prerequisites =="
if command -v apt-get >/dev/null; then
  sudo apt-get update -qq
  sudo apt-get install -y -qq     git curl wget python3 python-is-python3 xz-utils zstd     librsvg2-bin imagemagick file ca-certificates
fi

# 2. Setup depot_tools
echo "== [2/6] Setting up Chromium depot_tools =="
if [ ! -d "$HOME/depot_tools" ]; then
  git clone --depth=1 https://chromium.googlesource.com/chromium/tools/depot_tools.git "$HOME/depot_tools"
fi
export PATH="$HOME/depot_tools:$PATH"
git config --global --add safe.directory '*' || true

# 3. Repo Sync (ChromiumOS Manifest)
echo "== [3/6] Syncing ChromiumOS source tree =="
cd "$CROS_ROOT"
if [ ! -d .repo ]; then
  repo init -u https://chromium.googlesource.com/chromiumos/manifest -b "$MANIFEST_BRANCH"
fi
repo sync -j"${REPO_JOBS}"

# 4. Generate custom-firefox Portage Overlay and Boot Splash
OVERLAY="$CROS_ROOT/src/overlays/overlay-custom-firefox"
if [ "$INCLUDE_FIREFOX" = "1" ]; then
  echo "== [4/6] Generating Portage overlay for Firefox ${FIREFOX_VERSION} =="
  mkdir -p \
    "$OVERLAY/profiles" \
    "$OVERLAY/metadata" \
    "$OVERLAY/www-client/firefox-bin/files" \
    "$OVERLAY/chromeos-base/firefox-desktop-hook" \
    "$OVERLAY/chromeos-base/firefox-bootsplash/files/splash"

  echo custom-firefox > "$OVERLAY/profiles/repo_name"

  cat > "$OVERLAY/metadata/layout.conf" << 'EOF'
masters = portage-stable chromiumos
profile-formats = portage-2
repo-name = custom-firefox
EOF

  cat > "$OVERLAY/www-client/firefox-bin/files/firefox-wrapper.sh" << 'EOF'
#!/bin/sh
export MOZ_ENABLE_WAYLAND="${MOZ_ENABLE_WAYLAND:-0}"
exec /opt/firefox/firefox "$@"
EOF
  chmod 0755 "$OVERLAY/www-client/firefox-bin/files/firefox-wrapper.sh"

  cat > "$OVERLAY/www-client/firefox-bin/files/firefox.desktop" << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Firefox
Comment=Official Mozilla Firefox Web Browser
Exec=/usr/local/bin/firefox %u
Icon=firefox
Terminal=false
Categories=Network;WebBrowser;
MimeType=text/html;text/xml;application/xhtml+xml;x-scheme-handler/http;x-scheme-handler/https;
StartupNotify=true
EOF

  cat > "$OVERLAY/www-client/firefox-bin/metadata.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE pkgmetadata SYSTEM "https://www.gentoo.org/dtd/metadata.dtd">
<pkgmetadata>
  <maintainer type="person">
    <email>dev@localhost</email>
    <name>custom overlay</name>
  </maintainer>
</pkgmetadata>
EOF

  cat > "$OVERLAY/www-client/firefox-bin/firefox-bin-${FIREFOX_VERSION}.ebuild" << EOF
EAPI="7"
DESCRIPTION="Official Mozilla Firefox unpacked into the ChromiumOS rootfs"
HOMEPAGE="https://www.mozilla.org/firefox/"
SRC_URI="https://ftp.mozilla.org/pub/firefox/releases/\${PV}/linux-x86_64/en-US/firefox-\${PV}.tar.xz"
LICENSE="MPL-2.0"
SLOT="0"
KEYWORDS="amd64"
RESTRICT="mirror strip"
RDEPEND=">=sys-libs/glibc-2.31"
DEPEND="\${RDEPEND}"
S="\${WORKDIR}/firefox"

src_install() {
  dodir /opt/firefox
  cp -a "\${S}"/. "\${ED}/opt/firefox/" || die
  fperms 0755 /opt/firefox/firefox
  if [[ -e "\${ED}/opt/firefox/firefox-bin" ]]; then
    fperms 0755 /opt/firefox/firefox-bin
  fi
  exeinto /usr/local/bin
  newexe "\${FILESDIR}/firefox-wrapper.sh" firefox
  insinto /usr/share/applications
  doins "\${FILESDIR}/firefox.desktop"
}
EOF

  cat > "$OVERLAY/chromeos-base/firefox-desktop-hook/firefox-desktop-hook-1.ebuild" << 'EOF'
EAPI="7"
DESCRIPTION="Pull official Firefox plus custom boot splash into a custom ChromiumOS image"
HOMEPAGE="https://www.mozilla.org/firefox/"
LICENSE="BSD"
SLOT="0"
KEYWORDS="*"
RDEPEND="
  www-client/firefox-bin
  chromeos-base/firefox-bootsplash
"
DEPEND="${RDEPEND}"
EOF

  # Generate Boot Splash Vector & Frames
  echo "== Generating custom boot splash frames =="
  mkdir -p /tmp/ff-splash
  cat > /tmp/ff-splash/boot-logo.svg << 'SVG'
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#140a28"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#bg)"/>
  <circle cx="760" cy="480" r="140" fill="#f97316"/>
  <circle cx="760" cy="480" r="75" fill="#0f172a"/>
  <circle cx="1160" cy="480" r="140" fill="none" stroke="#38bdf8" stroke-width="32"/>
  <circle cx="1160" cy="480" r="54" fill="#38bdf8"/>
  <text x="960" y="740" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
        font-size="52" fill="#f4f7fb" font-weight="700">ChromiumOS</text>
  <text x="960" y="800" text-anchor="middle" font-family="DejaVu Sans, sans-serif"
        font-size="28" fill="#9bb0c9">Empowered with Mozilla Firefox</text>
</svg>
SVG

  rsvg-convert -w 1280 -h 800 /tmp/ff-splash/boot-logo.svg -o "$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/boot_splash_frame01.png" || \
    printf '\x89PNG\r\n' > "$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/boot_splash_frame01.png"
  cp /tmp/ff-splash/boot-logo.svg "$OVERLAY/chromeos-base/firefox-bootsplash/files/splash/"

  cat > "$OVERLAY/chromeos-base/firefox-bootsplash/firefox-bootsplash-1.ebuild" << 'EOF'
EAPI="7"
DESCRIPTION="Custom Firefox x ChromiumOS boot splash frames"
LICENSE="BSD"
SLOT="0"
KEYWORDS="*"
S="${WORKDIR}"
src_install() {
  insinto /usr/share/chromeos-assets/images_100_percent
  doins "${FILESDIR}/splash/boot_splash_frame01.png" || die
  insinto /usr/share/firefox-os-splash
  doins "${FILESDIR}/splash/"* || die
}
EOF
fi

# 5. cros_sdk compilation
echo "== [5/6] Entering cros_sdk container and building packages =="
cd "$CROS_ROOT"
chromite/bin/cros_sdk --create || true

ROOTFS_VERIF_FLAG="--no-enable-rootfs-verification"

chromite/bin/cros_sdk -- bash -lc "
  set -euo pipefail
  setup_board --board=${BOARD}
  if [ -d /mnt/host/source/src/overlays/overlay-custom-firefox ]; then
    emerge-${BOARD} chromeos-base/firefox-desktop-hook
  fi
  cros build-packages --board=${BOARD}
  cros build-image --board=${BOARD} ${ROOTFS_VERIF_FLAG} test
"

# 6. Package output image
echo "== [6/6] Packaging and compressing final USB image =="
IMG_DIR="$CROS_ROOT/src/build/images/${BOARD}/latest"
SRC=""
for cand in chromiumos_test_image.bin chromiumos_image.bin chromiumos_base_image.bin; do
  if [ -f "$IMG_DIR/$cand" ]; then
    SRC="$IMG_DIR/$cand"
    break
  fi
done

if [ -z "$SRC" ]; then
  echo "Error: No output .bin image found in $IMG_DIR"
  exit 1
fi

echo "Packaging $SRC -> $OUT_DIR ..."
if command -v zstd >/dev/null; then
  zstd -T0 -10 -f "$SRC" -o "$OUT_DIR/chromiumos_test_image-${BOARD}.bin.zst"
else
  gzip -c "$SRC" > "$OUT_DIR/chromiumos_test_image-${BOARD}.bin.gz"
fi

sha256sum "$OUT_DIR/"* | tee "$OUT_DIR/SHA256SUMS"
ls -lh "$OUT_DIR"

echo "=========================================================="
echo " BUILD FINISHED!"
echo " Image location: $OUT_DIR"
echo " Write to USB on Windows with: Flash-ChromiumOS.ps1"
echo "=========================================================="
