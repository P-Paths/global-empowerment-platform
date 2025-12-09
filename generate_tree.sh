#!/bin/bash
# Generate complete project tree
find . -not -path '*/node_modules/*' -not -path '*/__pycache__/*' -not -path '*/.git/*' -not -path '*/.next/*' -not -path '*/.venv/*' -not -name '*.pyc' -not -name '.DS_Store' -not -name 'project_tree.txt' | sed 's|^\./||' | sort | awk -F'/' '{
    depth = NF
    path = $0
    is_dir = (system("test -d \"" $0 "\"")) == 0
    for (i = 1; i < depth; i++) {
        indent = indent "│   "
    }
    if (NF == 1) {
        if (is_dir) print "📁 " $0
        else print "📄 " $0
    } else {
        if (is_dir) print indent "├── 📁 " $NF
        else print indent "├── 📄 " $NF
    }
    indent = ""
}'
