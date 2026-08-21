#!/bin/sh
# 启动 dev server，并保证用的是一个 Next.js 能接受的 Node。
#
# 【为什么需要这个包一层】
# 这台机器的 PATH 里同时挂着五个 nvm 版本，而 v16.20.2 排在最前面：
#   ~/.nvm/versions/node/v16.20.2/bin   ← which node 命中这个
#   ~/.nvm/versions/node/v18.20.7/bin
#   ~/.nvm/versions/node/v20.18.3/bin
#   ~/.nvm/versions/node/v22.14.0/bin
#   ~/.nvm/versions/node/v22.21.1/bin
# 于是直接跑 `npm run dev` 会拿到 Node 16，Next 15 直接拒绝启动：
#   You are using Node.js 16.20.2. For Next.js, Node.js version
#   "^18.18.0 || ^19.8.0 || >= 20.0.0" is required.
#
# 这里不去改用户的 .zshrc（那会影响他所有项目），只在启动这个项目时
# 把 nvm 里**最新的一个 ≥18 版本**顶到 PATH 前面。
#
# 找不到合适的版本就原样往下走 —— 让 Next 自己报那条清楚的错，
# 而不是这个脚本编一个含糊的错误。

set -e

MIN_MAJOR=18

pick_node() {
  # nvm 的版本目录名形如 v22.21.1，用 sort -V（版本排序）取最新的那个 ≥ MIN_MAJOR。
  #
  # 【别改回 sort -t. -k1.2,1n …】那串写法在 macOS 的 BSD sort 上**完全不生效**，
  # 输出仍是升序，于是这里会挑到 v18 而不是 v22 —— 踩过。
  # sort -V 在 macOS 和 GNU coreutils 上都有。
  [ -d "$HOME/.nvm/versions/node" ] || return 1
  for dir in $(ls "$HOME/.nvm/versions/node" 2>/dev/null | sort -V -r); do
    major=$(echo "$dir" | sed 's/^v\([0-9]*\).*/\1/')
    if [ "$major" -ge "$MIN_MAJOR" ] 2>/dev/null; then
      if [ -x "$HOME/.nvm/versions/node/$dir/bin/node" ]; then
        echo "$HOME/.nvm/versions/node/$dir/bin"
        return 0
      fi
    fi
  done
  return 1
}

CURRENT_MAJOR=$(node -v 2>/dev/null | sed 's/^v\([0-9]*\).*/\1/')
if [ -z "$CURRENT_MAJOR" ] || [ "$CURRENT_MAJOR" -lt "$MIN_MAJOR" ] 2>/dev/null; then
  if NODE_BIN=$(pick_node); then
    PATH="$NODE_BIN:$PATH"
    export PATH
    echo "[dev.sh] PATH 里的 node 是 v$CURRENT_MAJOR，换成 $(node -v)（Next 需要 >= $MIN_MAJOR）"
  fi
fi

exec npx next dev "$@"
