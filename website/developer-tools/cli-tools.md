---
title: Modern CLI Tools
sidebar_position: 3
---

# Modern CLI Tools for Multi-Agent Workflows

[Modern terminals](/developer-tools/terminals) combined with CLI tools achieve feature parity with traditional IDEs—ripgrep + fzf for global search, yazi for file exploration, tmux/Zellij for pane management, lazygit for git operations. For multi-agent development, this stack becomes critical infrastructure: session persistence across disconnects, rapid context switching between worktrees, and efficient file operations without breaking flow.

**Six categories:** Search & discovery (ripgrep, fd), text editing & inspection (micro, bat), file navigation (eza, yazi, fzf, zoxide), session management (tmux, Zellij), shell history (Atuin), and git operations (lazygit) address the most frequent CLI tasks in multi-agent development workflows.

## Search & Discovery Tools

### ripgrep

![ripgrep search results with colored pattern matches and line numbers](https://burntsushi.net/stuff/ripgrep1.png)

[**ripgrep**](https://github.com/BurntSushi/ripgrep) is a Rust-based line-oriented search tool that combines the speed of specialized tools with the flexibility of grep. Single binary, no dependencies, cross-platform support.

**Key differentiators:** 10-20x faster than grep by default, critical when agents perform dozens of searches per single task. Respects `.gitignore`, `.ignore`, and `.hgignore` files by default, automatically filtering node_modules, build artifacts, and versioned dependencies—reducing irrelevant matches and parse errors. Recursive directory search is default (`rg pattern` searches from current directory downward) instead of requiring explicit `-r` flags. Regex support using Rust regex engine with lookahead/lookbehind, Unicode awareness, and PCRE feature parity. Supports multiline search with `--multiline-dotall` flag. Integration-ready with fzf, ripgrep-all (`rga`) for searching PDFs/archives/compressed files, and multiple output formats (JSON, CSV, plain text).

**Best suited for:** Developers conducting rapid multi-agent research across codebases, where search performance compounds across dozens of parallel queries. Engineers managing large repositories (100k+ files) where grep becomes noticeably slow. Teams using ripgrep across development scripts, Makefiles, and CI/CD pipelines where `.gitignore` awareness reduces false positives.

**Trade-offs:** Rust regex engine differences mean some advanced Perl regex patterns may not work (though coverage is extensive). Default `.gitignore` respect can surprise users expecting grep's universal search—requires `--no-ignore` flag to override, adding cognitive burden for edge cases. Limited by line-oriented output; searching within binary files or deeply nested structures requires additional flags or companion tools.

**Installation:**

```bash
# macOS
brew install ripgrep

# Cargo (Rust)
cargo install ripgrep

# Linux package managers
sudo apt install ripgrep     # Debian/Ubuntu
sudo pacman -S ripgrep       # Arch
```

### fd

![fd file search with colorized output showing directories and file types](https://github.com/sharkdp/fd/raw/master/doc/screencast.svg)

[**fd**](https://github.com/sharkdp/fd) is a Rust-based find replacement optimized for simplicity and performance. Single binary, zero dependencies, cross-platform support.

**Key differentiators:** Colored output for directories, symlinks, and executables by default without flag overhead. Implicit `.gitignore` and `.ignore` file support skips hidden directories and ignored patterns automatically (use `--no-ignore` to override). Parallel execution across CPU cores for large directory traversals (default 4 workers, configurable via `--threads`). Regex-first pattern syntax beats find's complicated `-name` and `-type` expressions. Clean piping to xargs/parallel/ripgrep without needing `-print0` workarounds. Sensible defaults (case-insensitive on macOS, hidden files excluded, color support) require no configuration.

**Best suited for:** Engineers building multi-agent scripts that traverse large worktrees without manual ignore management. Developers discovering file patterns for ripgrep integration—fd output naturally feeds ripgrep for code search workflows. Users working across git worktrees who need instant file location without complex find syntax.

**Trade-offs:** Different syntax than POSIX find means scripts require translation when porting between systems. Some advanced find options (complex action chains, `-exec` with multiple conditions) not directly supported—occasional fallback to find still necessary. Colored output adds noise in pipes unless explicitly disabled (though fd auto-detects when piped and disables colors).

**Installation:**

```bash
# macOS
brew install fd

# Cargo (Rust)
cargo install fd-find

# Linux package managers
sudo apt install fd-find       # Debian/Ubuntu
sudo pacman -S fd              # Arch
```

## Text Editing & Inspection

### micro

![micro editor with solarized theme showing syntax highlighting and status bar](https://github.com/zyedidia/micro/raw/master/assets/micro-solarized.png)

[**micro**](https://micro-editor.github.io/) is a Go-based terminal text editor that brings GUI-like keybindings to the command line. Single binary, no dependencies, cross-platform support.

**Key differentiators:** Ctrl+S to save, Ctrl+Q to quit, Ctrl+F to find—no modal editing or memorization required. Syntax highlighting for 130+ languages out of box. Multi-cursor support (Sublime-style) for parallel editing. Lua plugin system for extensibility. Integrated terminal and mouse support for hybrid keyboard/mouse workflows.

**Best suited for:** Developers needing quick edits in agent context without switching to IDE. Engineers who find Vim's modal editing overhead for one-line changes. Users wanting terminal editing with familiar modern editor keybindings (coming from VSCode, Sublime, or similar GUI editors).

**Trade-offs:** Feature-minimal compared to IDEs—no LSP integration, limited refactoring tools, basic navigation. Not as powerful as Vim/Neovim for complex multi-file operations or advanced text object manipulation. For large files (1000+ lines) or deep code exploration, IDE remains superior tool choice.

**Installation:**

```bash
# macOS
brew install micro

# Linux (binary)
curl https://getmic.ro | bash

# Cross-platform (Go)
go install github.com/zyedidia/micro/cmd/micro@latest
```

Requirements: None (static binary). Optional: clipboard support via xclip/xsel on Linux.

### bat

![bat displaying code with syntax highlighting, line numbers, and git integration](https://imgur.com/rGsdnDe.png)

[**bat**](https://github.com/sharkdp/bat) is a Rust-based cat replacement with built-in syntax highlighting and git integration. Single binary, cross-platform, actively maintained.

**Key differentiators:** Syntax highlighting for 100+ languages prevents context loss when agents reference code snippets. Git integration shows line modifications (`--diff` mode compares against git index). Line numbers and column wrapping without needing less pager. Integration with external syntax definitions via DRY (Don't Repeat Yourself) configuration. Configurable through `BAT_CONFIG_PATH` environment variable for theme and style customization. Respects system colors and theme preferences across terminal emulators.

**Best suited for:** Developers inspecting files during agent workflows without breaking context (quick lookups stay in terminal vs IDE context switch). Engineers reviewing git modifications to understand what changed before agent processing. Users pairing bat with yazi previewer or fzf preview window for syntax-highlighted file navigation.

**Trade-offs:** Slightly slower than plain cat due to syntax highlighting overhead (negligible for typical use). Requires Nerd Font or compatible font for icon support in some terminal setups. Syntax highlighter is opinionated—custom language definitions require configuration rather than built-in extensibility.

**Installation:**

```bash
# macOS
brew install bat

# Cargo (Rust)
cargo install bat

# Linux package managers
sudo apt install bat        # Debian/Ubuntu
sudo pacman -S bat         # Arch
```

## Git Operations

### lazygit

![lazygit TUI showing staging, committing, and pushing workflow](https://github.com/jesseduffield/lazygit/raw/assets/demo/commit_and_push-compressed.gif)

[**lazygit**](https://github.com/jesseduffield/lazygit) is a Go-based Git TUI (terminal user interface) for visual branch management, interactive staging, and commit navigation. Cross-platform with extensive customization options.

**Key differentiators:** Visual branch tree shows repository topology without command memorization. Interactive staging supports hunk selection and individual line staging. Commit navigation browses history with inline diffs. Customizable keybindings via YAML config. Mouse support for clicking to select, scrolling through commits. Multi-worktree awareness for parallel branch development.

**Best suited for:** Developers managing multi-worktree workflows who need visual branch context. Engineers doing complex interactive rebases, cherry-picks, and merges. Users wanting git discoverability via menu-driven interface instead of command memorization.

**Trade-offs:** Performance degrades on massive repositories (Linux kernel: 57s load time, 2.6GB RAM usage). Not a replacement for all git commands—some operations faster via raw CLI. Learning curve for keybindings, though discoverable via built-in help menu.

**Installation:**

```bash
# macOS
brew install lazygit

# Go
go install github.com/jesseduffield/lazygit@latest

# Windows
scoop install lazygit

# Linux package managers
sudo apt install lazygit     # Debian/Ubuntu
sudo pacman -S lazygit       # Arch
```

Requirements: git. Optional: custom config in `~/.config/lazygit/config.yml`.

## File Navigation

### eza

![eza directory listing with icons, colors, and file metadata](https://github.com/eza-community/eza/raw/main/docs/images/screenshots.png)

[**eza**](https://eza.rocks/) is a Rust-based ls replacement, actively maintained fork of the unmaintained exa project. Fast, feature-rich, with better defaults than traditional ls.

**Key differentiators:** Colors for file types and permissions by default. Git integration shows per-file status (`--git`) or per-directory repository state (`--git-repos`). Human-readable file sizes in long format without flags. Tree view (`--tree`), icons support (`--icons`), and hyperlink support for terminal emulators. Fixes Grid Bug from exa that caused rendering issues.

**Best suited for:** Developers working across git worktrees who need instant branch status visibility. Engineers wanting better ls defaults without heavy configuration overhead. Users comfortable with modern Rust tooling ecosystem and willing to install additional dependencies.

**Trade-offs:** More dependencies than ls (Rust binary, optional Nerd Fonts for icons). Some features need configuration (icon support requires compatible fonts). Slightly longer learning curve for advanced options, though defaults work well immediately.

**Installation:**

```bash
# macOS
brew install eza

# Cargo (Rust)
cargo install eza

# Linux package managers
sudo apt install eza      # Debian/Ubuntu
sudo pacman -S eza        # Arch
```

### yazi

![yazi terminal file manager with multi-pane layout and file preview](https://yazi-rs.github.io/webp/full-border.webp)

[**yazi**](https://yazi-rs.github.io/) is a Rust-based terminal file manager with full asynchronous I/O and multi-threaded CPU task distribution. Currently in public beta, suitable as daily driver.

**Key differentiators:** Full asynchronous architecture keeps UI responsive during heavy operations (large directories, remote filesystems). Rich preview support for images (Kitty, Sixel, iTerm2, WezTerm protocols), videos, PDFs, archives, and code with syntax highlighting via built-in integration. Lua-based plugin system with package manager for extensibility. Vim-like keybindings with visual mode, multi-tab support, and auto-completion. Client-server architecture with pub-sub model enables cross-instance communication. Integrates with ripgrep, fd, fzf, and zoxide for enhanced workflows.

**Best suited for:** Developers navigating complex directory structures who need rich file previews without leaving terminal. Engineers working with remote filesystems where responsiveness matters (async I/O prevents UI freezing). Users wanting Vim-like file management with extensive customization (Lua plugins, themes, custom previewers).

**Trade-offs:** Currently in public beta—stable enough for daily use but evolving rapidly. More complex than simpler tools like nnn (which is tiny, nearly 0-config). Learning curve for Vim keybindings if coming from traditional file managers. Lacks "undo" feature that Vifm provides.

**Installation:**

```bash
# macOS
brew install yazi

# Cargo (Rust)
cargo install --locked yazi-fm yazi-cli

# Linux package managers
sudo pacman -S yazi       # Arch
```

### fzf

![fzf fuzzy finder with preview window showing file contents](https://raw.githubusercontent.com/junegunn/i/master/fzf-preview.png)

[**fzf**](https://junegunn.github.io/fzf/) is a Go-based fuzzy finder that processes millions of items instantly. Single binary, 11+ years mature (since 2013), widely adopted as the standard fuzzy CLI tool.

**Key differentiators:** Shell integration provides Ctrl+R (history search), Ctrl+T (file search), Alt+C (directory navigation), and `**<TAB>` (fuzzy completion for any command). Vim/Neovim integration via fzf.vim and fzf-lua plugins. Tmux integration via fzf-tmux wrapper for popup windows. Preview window support shows file contents or git diffs during selection. Highly customizable via environment variables (FZF_DEFAULT_OPTS, FZF_DEFAULT_COMMAND). Pipe-friendly architecture works with any command output.

**Best suited for:** Developers navigating large codebases who need instant file/symbol location without IDE context switches. Engineers with heavy shell usage for command history search and script selection. Users wanting fuzzy selection everywhere—git branches, docker containers, kubernetes pods, process lists.

**Installation:**

```bash
# macOS
brew install fzf
$(brew --prefix)/opt/fzf/install  # Shell integration

# Git clone
git clone --depth 1 https://github.com/junegunn/fzf.git ~/.fzf
~/.fzf/install

# Linux package managers
sudo apt install fzf      # Debian/Ubuntu
sudo pacman -S fzf        # Arch
```

:::tip fzf Shell Integration
Full fzf power requires shell integration. After installation, run:

```bash
$(brew --prefix)/opt/fzf/install  # macOS Homebrew
~/.fzf/install                     # Git installation
```

Enables: Ctrl+R (history), Ctrl+T (files), Alt+C (cd), `**<TAB>` (completion)
:::

### zoxide

![zoxide jumping to directories with partial name matching](https://github.com/ajeetdsouza/zoxide/raw/main/contrib/tutorial.webp)

[**zoxide**](https://github.com/ajeetdsouza/zoxide) is a Rust-based cd replacement that learns directory navigation patterns. Single binary, zero dependencies, cross-platform support.

**Key differentiators:** Frecency algorithm (frequency + recency weighted) automatically learns which directories you visit most. Jump to any directory with partial name matching (`z proj` navigates to `/path/to/project`). Sub-directory shortcuts with `zi` for interactive selection. Seamless `cd` replacement—drop-in alias with no workflow changes. Integration with file managers (yazi, lf) and fzf for enhanced discovery. Fast path learning reduces directory traversal time by 60-80% after initial usage patterns established.

**Best suited for:** Engineers managing multiple worktrees or project directories who spend time context-switching between locations. Developers with deep project structures where multiple `cd` commands happen repeatedly daily. Teams using mono-repos or microservice architectures where jumping between service directories is frequent.

**Trade-offs:** Learning phase required—frecency algorithm takes days to stabilize as zoxide builds path statistics. Partial name matching can occasionally resolve to unexpected directories if multiple paths match (interactive mode `zi` mitigates). Requires shell configuration to replace `cd` completely (adding alias is trivial, but not automatic).
requires learning new command names (though `z` becomes muscle memory quickly).

**Installation:**

```bash
# macOS
brew install zoxide

# Cargo (Rust)
cargo install zoxide

# Linux package managers
sudo apt install zoxide       # Debian/Ubuntu
sudo pacman -S zoxide        # Arch
```

Requirements: Add to shell config (`~/.bashrc`, `~/.zshrc`, `~/.config/fish/config.fish`): `eval "$(zoxide init bash)"` or equivalent for your shell. Optional: fzf for `zi` interactive selection.

## Session Management

**Critical for parallel agent workflows:** Running 4-6 Claude Code instances simultaneously requires terminal multiplexing. This section covers the tools that enable multi-agent development. Prerequisite: comfortable with the File Navigation tools above.

### tmux

![tmux with two split panes running different terminal sessions](https://hamvocke.com/_astro/tmux_split.b845PJCE_Z2bALRv.webp)

[**tmux**](https://github.com/tmux/tmux) is a C-based terminal multiplexer that enables session persistence, window splitting, and parallel pane execution on local and remote servers. Battle-tested for production use since 2007, recommended for remote servers and critical workflows where terminal disconnects are unacceptable.

**Key differentiators:** Detachable sessions survive SSH disconnects—disconnect from anywhere, reattach from anywhere, with full state preserved. Server-client architecture keeps sessions running server-side even after client exit. Pane splitting (horizontal/vertical) runs multiple agents side-by-side in a single window without context switching. Window management organizes workflows into tabs, each with independent pane layouts. Scriptable configuration via ~/.tmux.conf enables persistent keybindings and plugin management. tmux-resurrect plugin persists sessions across system reboots—restart machine, run `tmux-resurrect restore`, and worktrees + editor state recover fully. Vim-like keybindings (with customization) integrate naturally into vim/nvim workflows.

**Best suited for:** Developers running 4-6 Claude Code instances simultaneously—use multiple windows (one per git worktree) or split panes (agents side-by-side) depending on workflow. Engineers working on remote servers where SSH disconnects are frequent and session loss unacceptable. DevOps/SRE teams monitoring long-running processes that must survive network interruptions. Users combining terminal editors (vim, micro) with tmux for fully keyboard-driven development without IDE.

**Trade-offs:** Steep initial learning curve—pane navigation, window management, and session conceptual model require 1-2 weeks to internalize. Configuration complexity can spiral (plugins, keybindings, theme management) if not disciplined about minimalism. Debugging pane/session state requires understanding server architecture; "stuck" state sometimes requires killing server and losing sessions.

**vs terminal emulator tabs:** Terminal tabs reside client-side and die on disconnect. tmux sessions persist server-side indefinitely—reboots, network failure, or laptop sleep don't kill your work. Trade: tmux adds conceptual overhead; tabs are simpler mental model for single-machine workflows.

**vs Zellij:** Newer, friendlier learning curve, better default keybindings and UI polish. tmux trades some UX polish for 15+ years of battle-testing, smaller footprint, and ubiquity on remote servers where you can't install Zellij.

**Installation:**

```bash
# macOS
brew install tmux

# Linux
sudo apt install tmux       # Debian/Ubuntu
sudo pacman -S tmux        # Arch
sudo yum install tmux      # RedHat/CentOS

# Build from source
git clone https://github.com/tmux/tmux.git
cd tmux
sh autogen.sh && ./configure && make
sudo make install
```

Requirements: libevent and ncurses (pre-installed on most systems). Optional: tmux-resurrect plugin for session persistence (`git clone https://github.com/tmux-plugins/tmux-resurrect ~/.tmux/plugins/tmux-resurrect`). Optional: tpm (Tmux Plugin Manager) for managing plugins via config.

### Zellij

![Zellij terminal workspace with multiple panes and floating windows](https://raw.githubusercontent.com/zellij-org/zellij/main/assets/demo.gif)

[**Zellij**](https://zellij.dev/) is a Rust-based terminal multiplexer with modern UI, batteries-included defaults, and WASM plugin system. Active development, suitable for daily use but evolving rapidly. Consider tmux for remote servers or mission-critical workflows.

**Key differentiators:** Layout system with built-in preset arrangements (tiled, floating, stacked)—immediate productivity without configuration. Auto-tabbing enables splitting panes without explicit window management. WASM-based plugin system allows plugins in any language (Rust, JavaScript, Python via binding). UI provides visual mode/key menu—discover features without memorization. Better default keybindings (intuitive ctrl+arrow navigation) compared to tmux prefix system. Scrollback buffer with search built into the UI. Mouse support for selecting panes, resizing, and scrolling.

**Best suited for:** Developers using Zellij primarily for local development on single machines. Engineers wanting modern defaults without extensive configuration (tmux-style) to achieve basic functionality. Multi-agent workflows requiring frequent context switching between parallel tasks within a single system. Users comfortable with evolving tools and willing to adapt to keybinding changes as the project matures.

**Trade-offs:** Keybindings still evolving—updates may break established muscle memory. Remote server support experimental; ssh session persistence not as battle-tested as tmux. Plugin ecosystem significantly smaller than tmux—fewer power-user extensions available. Not recommended for production remote work or long-running SSH sessions where tmux's stability is essential. Configuration requires YAML/KDL learning instead of tmux's scripting approach.

**vs tmux:** Better defaults and learning curve for local development workflows. Zellij prioritizes accessibility; tmux rewards deep configuration investment. Trade: Zellij less stable for remote work, smaller plugin ecosystem, keybindings still evolving.

**vs traditional terminal emulator splits (iTerm2, WezTerm):** Terminal-native splits don't persist across SSH—only multiplexers (tmux, Zellij) enable detachable sessions. Terminal splits live in GUI; multiplexer sessions live on the server/machine.

**Installation:**

```bash
# macOS
brew install zellij

# Cargo (Rust)
cargo install zellij

# Linux package managers
sudo pacman -S zellij       # Arch
# Others: check https://zellij.dev/documentation/installation
```

---

**Related Course Content:**

- [Lesson 7: Planning & Execution](/docs/practical-techniques/lesson-7-planning-execution) - Multi-worktree workflows leveraging these CLI tools
- [Developer Tools: Terminals](/developer-tools/terminals) - Terminal recommendations for running these CLI tools efficiently
- [Developer Tools: MCP Servers](/developer-tools/mcp-servers) - Extend CLI agents with code research and web grounding
