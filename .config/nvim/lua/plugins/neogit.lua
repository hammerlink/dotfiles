return {
  {
    "NeogitOrg/neogit",
    dependencies = {
      "nvim-lua/plenary.nvim",
      "sindrets/diffview.nvim",
    },
    cmd = "Neogit",
    config = function()
      -- Configure notify to avoid background warning

      require("neogit").setup({
        commit_order = "",
        integrations = {
          diffview = true,
        },
        mappings = {
          popup = {
            ["g?"] = "HelpPopup",
            ["?"] = false,
          },
        },
      })
    end,
  },
}
