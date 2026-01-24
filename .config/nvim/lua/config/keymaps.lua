-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here
local map = LazyVim.safe_keymap_set

map("i", "jk", "<ESC>")

vim.keymap.set("n", "<C-n>", "<cmd>NvimTreeToggle<CR>", { desc = "nvimtree toggle window" })
vim.keymap.set("n", "<leader>e", "<cmd>NvimTreeFocus<CR>", { desc = "nvimtree focus window" })

-- navigate in insert mode
map("i", "<C-h>", "<Left>", { desc = "move left" })
map("i", "<C-l>", "<Right>", { desc = "move right" })
map("i", "<C-j>", "<Down>", { desc = "move down" })
map("i", "<C-k>", "<Up>", { desc = "move up" })

-- neogit
map("n", "<leader>gg", "<cmd> Neogit <cr>", { desc = "Open NeoGit" })

-- commands
vim.api.nvim_set_keymap("c", "<C-j>", "<C-n>", { noremap = true, silent = true })
vim.api.nvim_set_keymap("c", "<C-k>", "<C-p>", { noremap = true, silent = true })

-- pickers
vim.keymap.set("n", "<leader>/", function()
  local search_dir = vim.fn.getcwd()
  -- check if the nvim-tree is focused
  if vim.bo.filetype == "NvimTree" then
    local selected_node = require("nvim-tree.api").tree.get_node_under_cursor()
    if selected_node then
      if selected_node.type == "directory" then
        search_dir = selected_node.absolute_path
        print("telescope cwd " .. search_dir)
      end
    end
  end
  Snacks.picker.grep({ dirs = { search_dir } })
end, { desc = "Grep dynamic dir" })

vim.keymap.set("n", "<leader>ff", function()
  local search_dir = vim.fn.getcwd()
  -- check if the nvim-tree is focused
  if vim.bo.filetype == "NvimTree" then
    local selected_node = require("nvim-tree.api").tree.get_node_under_cursor()
    if selected_node then
      if selected_node.type == "directory" then
        search_dir = selected_node.absolute_path
        print("telescope cwd " .. search_dir)
      end
    end
  end
  Snacks.picker.files({ cwd = search_dir })
end, { desc = "Find files" })
