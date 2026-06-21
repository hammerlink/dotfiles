return {
  {
    "neovim/nvim-lspconfig",
    opts = {
      diagnostics = {
        folds = {
          enabled = false,
        },
      },
      servers = {
        denols = {
          root_markers = { "deno.json", "deno.jsonc" },
        },
        vtsls = {
          root_markers = { "tsconfig.json", "package.json", "jsconfig.json", ".git" },
        },
      },
    },
  },
}
