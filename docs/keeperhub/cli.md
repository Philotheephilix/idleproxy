<!-- source: https://docs.keeperhub.com/cli -->

# CLI

# CLI

The KeeperHub CLI (`kh`) lets you manage workflows, execute blockchain actions, and monitor runs from the terminal. It is designed for scripting, CI/CD pipelines, and AI-assisted workflows via MCP.

## Install[](https://docs.keeperhub.com/cli#install)

**Homebrew (macOS/Linux):**

```
brew install keeperhub/tap/kh
```

**Go install:**

```
go install github.com/keeperhub/cli/cmd/kh@latest
```

**Binary download:** Download from [GitHub Releases](https://github.com/keeperhub/cli/releases)  and add to your PATH.

## Authenticate[](https://docs.keeperhub.com/cli#authenticate)

```
kh auth login
```

For CI/CD environments, set the `KH_API_KEY` environment variable instead.

## What’s in this section[](https://docs.keeperhub.com/cli#whats-in-this-section)

-   [Quickstart](https://docs.keeperhub.com/cli/quickstart) — install, authenticate, and run your first commands
-   [Concepts](https://docs.keeperhub.com/cli/concepts) — authentication model, output formats, configuration, MCP mode
-   [Commands](https://docs.keeperhub.com/cli/commands) — full reference for every `kh` command
