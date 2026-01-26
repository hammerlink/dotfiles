if status is-interactive
    # Commands to run in interactive sessions can go here
    atuin init fish | source
    starship init fish | source
    bind \cl accept-autosuggestion

    set -gx PATH $HOME/.cargo/bin $PATH

    if test -s $HOME/hammer.fish
        source $HOME/hammer.fish
    end
    eval (zellij setup --generate-auto-start fish | string collect)
end
