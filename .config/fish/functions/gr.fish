function gr --description 'Change directory to the Git repository root'
    set -l root (command git rev-parse --show-toplevel 2>/dev/null)
    if test $status -ne 0
        return 1
    end

    cd -- $root
end
