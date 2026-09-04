#!/usr/bin/env bash
# ==============================================================================
# wsl-bios-builder.sh
# Coreboot & Chromebook BIOS Compilation Worker (WSL2 Ubuntu)
# Ports ChromeOS depthcharge & Tianocore UEFI builds to Windows
# ==============================================================================
set -e

BOARD="${BOARD:-dedede}"
PAYLOAD="${PAYLOAD:-depthcharge}"
GBB_FLAGS="${GBB_FLAGS:-0x489}"
OUTPUT_DIR="${OUTPUT_DIR:-../firmware}"

echo ">>> [WSL BIOS] Building Coreboot Firmware for Board: $BOARD"
echo ">>> [WSL BIOS] Payload Selection: $PAYLOAD | GBB Flags: $GBB_FLAGS"

# Install required build packages
sudo apt-get update -qq
sudo apt-get install -y -qq     build-essential git bfd-plugins-dev bison flex zlib1g-dev     libncurses5-dev libssl-dev gnat nasm acpica-tools libelf-dev     python3 python3-pip curl wget uuid-dev pkg-config

BUILD_ROOT="$HOME/chromebook-bios-build"
mkdir -p "$BUILD_ROOT"
cd "$BUILD_ROOT"

# Clone or update coreboot repository
if [ ! -d "coreboot/.git" ]; then
    echo ">>> [WSL BIOS] Cloning Coreboot source tree..."
    git clone --depth 1 --recurse-submodules https://review.coreboot.org/coreboot.git coreboot
fi

cd coreboot

# Build host utilities: cbfstool, ifdtool
echo ">>> [WSL BIOS] Compiling CBFS and Intel Flash Descriptor tools..."
make -C util/cbfstool -j"$(nproc)"
make -C util/ifdtool -j"$(nproc)"
export PATH="$BUILD_ROOT/coreboot/util/cbfstool:$BUILD_ROOT/coreboot/util/ifdtool:$PATH"

# Build crossgcc toolchain if not present
if [ ! -f "util/crossgcc/xgcc/bin/i386-elf-gcc" ]; then
    echo ">>> [WSL BIOS] Building Coreboot cross-compiler toolchain (i386-elf)..."
    make crossgcc-i386 CPUS="$(nproc)"
fi

# Configure Coreboot for board
echo ">>> [WSL BIOS] Generating Coreboot configuration..."
make distclean || true

# Write board-specific defconfig
cat << 'EOF_CONFIG' > defconfig_board
CONFIG_VENDOR_GOOGLE=y
CONFIG_CBFS_SIZE=0x01000000
CONFIG_COMPRESS_RAMSTAGE_LZMA=y
CONFIG_COLLECT_TIMESTAMPS=y
CONFIG_USE_OPTION_TABLE=y
CONFIG_BOOTSPLASH_IMAGE=y
EOF_CONFIG

if [ "$PAYLOAD" = "tianocore" ] || [ "$PAYLOAD" = "both" ]; then
    echo "CONFIG_PAYLOAD_EDK2=y" >> defconfig_board
    echo "CONFIG_EDK2_BOOTLOADER_SHELL=y" >> defconfig_board
else
    echo "CONFIG_PAYLOAD_DEPTHCHARGE=y" >> defconfig_board
fi

make defconfig KBUILD_DEFCONFIG=defconfig_board

# Compile Coreboot ROM
echo ">>> [WSL BIOS] Compiling Coreboot ROM with $(nproc) jobs..."
make -j"$(nproc)"

# Inject GBB Flags and Bootsplash
ROM_FILE="build/coreboot.rom"
if [ -f "$ROM_FILE" ]; then
    echo ">>> [WSL BIOS] Stamping GBB Flags: $GBB_FLAGS"
    # If gbb_utility exists, set flags
    if command -v gbb_utility &>/dev/null; then
        gbb_utility --set --flags="$GBB_FLAGS" "$ROM_FILE" || true
    fi

    # Prepare final output ROM
    FINAL_ROM="bios-$BOARD-$PAYLOAD.rom"
    cp "$ROM_FILE" "$FINAL_ROM"

    mkdir -p "$OUTPUT_DIR"
    cp "$FINAL_ROM" "$OUTPUT_DIR/"
    echo ">>> [WSL BIOS] SUCCESS: Exported firmware to $OUTPUT_DIR/$FINAL_ROM"
else
    echo ">>> [WSL BIOS] Error: build/coreboot.rom was not produced."
    exit 1
fi
