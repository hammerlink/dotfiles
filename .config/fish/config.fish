if status is-interactive
    fish_add_path $HOME/.local/bin
    set -gx PATH $HOME/.cargo/bin $PATH

    # fnm should be installed via cargo (cargo install fnm)
    fnm env --use-on-cd --shell fish | source

    if test -s $HOME/hammer.fish
        source $HOME/hammer.fish
    end

    function nv
        echo -ne "\033]0;nvim ("(basename (pwd))")\007"
        nvim $argv
    end

    # Commands to run in interactive sessions can go here
    # starship init fish | source
    atuin init fish | source

    # set editor to use with Alt + e in cli mode
    set -g EDITOR nvim
end

# pnpm
if test -d "$HOME/.local/share/pnpm"
    set -gx PNPM_HOME "$HOME/.local/share/pnpm"
    if not string match -q -- $PNPM_HOME $PATH
        set -gx PATH "$PNPM_HOME" $PATH
    end
end

# opencode
if test -d "$HOME/.opencode/bin"
    fish_add_path $HOME/.opencode/bin
end

fish_vi_key_bindings
