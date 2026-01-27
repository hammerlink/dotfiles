if status is-interactive
    # Commands to run in interactive sessions can go here
    atuin init fish | source
    # starship init fish | source

    set -gx PATH $HOME/.cargo/bin $PATH

    if test -s $HOME/hammer.fish
        source $HOME/hammer.fish
    end
    eval (zellij setup --generate-auto-start fish | string collect)

    function nv
        echo -ne "\033]0;nvim ("(basename (pwd))")\007"
        nvim $argv
    end
end
