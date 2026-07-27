function zellij
    if not contains -- -s $argv; and not contains -- --session $argv
        command zellij attach -c (hostname) $argv
    else
        command zellij $argv
    end
end
