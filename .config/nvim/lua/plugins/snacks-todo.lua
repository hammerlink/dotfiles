return {
  {
    "folke/todo-comments.nvim",
    optional = true,
    -- stylua: ignore
    keys = {
      { "<leader>st", function() Snacks.picker.todo_comments() end, desc = "Todo" },
      { "<leader>sT", function () 
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
        Snacks.picker.todo_comments({ keywords = { "TODO", "FIX", "FIXME" }, cwd = search_dir }) 
      end, desc = "Todo/Fix/Fixme dynamic dir" },
    },
  },
}
