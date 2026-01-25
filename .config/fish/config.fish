if status is-interactive
    # Commands to run in interactive sessions can go here
    atuin init fish | source
    starship init fish | source
    bind \cl accept-autosuggestion

    if test -s $HOME/hammer.fish
        source $HOME/hammer.fish
    end
end
