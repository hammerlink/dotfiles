return {
  {
    "CopilotC-Nvim/CopilotChat.nvim",
    opts = {
      mappings = {
        reset = {
          normal = "<C-A-l>",
          insert = "<C-A-l>",
          callback = function()
            require("CopilotChat").reset()
            vim.notify("Chat Resetted", vim.log.levels.INFO)
          end,
        },
      },
    },
  },
}
