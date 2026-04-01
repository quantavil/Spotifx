#!/bin/bash
# combine_project.sh - Aggregates all non-ignored project files into a single text file.
# Respects .gitignore rules using git ls-files.

# Parse arguments
OUTPUT_FILE="project_context.txt"
EXCLUDE_PATTERNS=()

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -e|--exclude) EXCLUDE_PATTERNS+=("$2"); shift ;;
        -h|--help) 
            echo "Usage: $0 [-o|--output <file>] [-e|--exclude <pattern>] [output_file] [exclude_patterns...]"
            echo "  -o, --output <file>      Specify output file (default: project_context.txt)"
            echo "  -e, --exclude <pattern>  Exclude specific files/directories/patterns"
            exit 0
            ;;
        -o|--output) OUTPUT_FILE="$2"; shift ;;
        *) 
            if [[ -z "$_OUTPUT_SET" && "$1" != -* ]]; then
                # For backwards compatibility: first positional argument is output file
                OUTPUT_FILE="$1"
                _OUTPUT_SET=1
            else
                # Additional positional arguments are treated as exclude patterns
                EXCLUDE_PATTERNS+=("$1")
            fi
            ;;
    esac
    shift
done

# Check if git is initialized to respect .gitignore
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo "ERROR: Not a git repository. This script requires git to respect .gitignore."
    exit 1
fi

# Clear or create the output file
> "$OUTPUT_FILE"

# Count files to process
count=$(git ls-files -co --exclude-standard | wc -l)
echo "Found $count files. Starting aggregation into $OUTPUT_FILE..."

# Iterate through non-ignored files
# Uses -z and null delimiters to handle special characters or spaces in paths
git ls-files -co --exclude-standard -z | while IFS= read -r -d '' file; do
    # Skip the output file, lock files, images, license, and this script to avoid including redundant or harmful content
    if [ "$file" == "$OUTPUT_FILE" ] || \
       [[ "$file" == *.lock || "$file" == *-lock* || "$file" == *.png || "$(basename "$file")" == LICENSE* || "$(basename "$file")" == "combine.sh" ]]; then
        continue
    fi
    
    # Skip explicitly excluded files/patterns
    skip=false
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$file" == $pattern ]] || [[ "$file" == $pattern/* ]] || [[ "$file" == */$pattern ]] || [[ "$file" == */$pattern/* ]]; then
            skip=true
            break
        fi
    done
    
    if [ "$skip" = true ]; then
        continue
    fi
    
    if [ -f "$file" ]; then
        # Append a header with the file path
        echo "================================================================================" >> "$OUTPUT_FILE"
        echo "FILE PATH: $file" >> "$OUTPUT_FILE"
        echo "================================================================================" >> "$OUTPUT_FILE"
        
        # Append file content
        cat "$file" >> "$OUTPUT_FILE"
        
        # Add spacing between files
        echo -e "\n\n" >> "$OUTPUT_FILE"
    fi
done

echo "Success! Combined project content saved to: $(realpath "$OUTPUT_FILE")"
