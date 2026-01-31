if status is-interactive
    set -gx PATH $HOME/.cargo/bin $PATH

    if test -s $HOME/hammer.fish
        source $HOME/hammer.fish
    end
    eval (zellij setup --generate-auto-start fish | string collect)

    function nv
        echo -ne "\033]0;nvim ("(basename (pwd))")\007"
        nvim $argv
    end

    # Commands to run in interactive sessions can go here
    # starship init fish | source
    atuin init fish | source
end
