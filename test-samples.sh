#!/bin/bash

echo "🧪 Testing all PromptShaper samples with regression detection..."
echo "=============================================================="

failed_samples=()
total_samples=0
parse_failures=0
content_mismatches=0

# Function to test a sample with content comparison
test_sample() {
    local file="$1"
    local cli_args="$2"
    local filename=$(basename "$file")
    local reference_file="sample-outputs/$filename"
    
    total_samples=$((total_samples + 1))
    echo -n "Testing $filename... "
    
    # Check if reference output exists
    if [ ! -f "$reference_file" ]; then
        echo "❌ FAIL (no reference output)"
        failed_samples+=("$file - missing reference")
        return 1
    fi
    
    # Generate current output (filter out yarn output)
    local temp_output="/tmp/prompt-shaper-test-$$-$filename"
    if yarn parse "$file" $cli_args 2>/dev/null | sed '/^yarn run\|^\$ ts-node\|^Done in /d' > "$temp_output"; then
        # Compare with reference
        if diff -q "$reference_file" "$temp_output" > /dev/null 2>&1; then
            echo "✅ PASS"
            rm -f "$temp_output"
            return 0
        else
            echo "❌ CONTENT MISMATCH"
            echo "   Reference: $reference_file"
            echo "   Current:   $temp_output"
            echo "   Run: diff \"$reference_file\" \"$temp_output\" to see differences"
            failed_samples+=("$file - content mismatch")
            content_mismatches=$((content_mismatches + 1))
            return 1
        fi
    else
        echo "❌ PARSE FAILURE"
        failed_samples+=("$file - parse failure")
        parse_failures=$((parse_failures + 1))
        rm -f "$temp_output"
        return 1
    fi
}

# Test basic samples (no external dependencies)
for file in samples/0{0,1,2,3,4,5,6}-*.ps.md; do
    if [ -f "$file" ]; then
        test_sample "$file" "--disable-llm"
    fi
done

# Test file operation samples
for file in samples/0{7,8}-*.ps.md; do
    if [ -f "$file" ]; then
        test_sample "$file" "--disable-llm -e \"js,json,md,css,txt\""
    fi
done

# Test URL and image samples (check if reference exists first)
for file in samples/{09,10}-*.ps.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        reference_file="sample-outputs/$filename"
        
        if [ -f "$reference_file" ]; then
            test_sample "$file" "--disable-llm"
        else
            total_samples=$((total_samples + 1))
            echo "⚠️  Skipping $filename (no reference - external dependencies)"
        fi
    fi
done

# Test CLI and markdown samples
for file in samples/{11,12}-*.ps.md; do
    if [ -f "$file" ]; then
        test_sample "$file" "--disable-llm"
    fi
done

echo "=============================================================="
echo "📊 Test Results:"
echo "Total samples: $total_samples"
echo "Failed samples: ${#failed_samples[@]}"
echo "  - Parse failures: $parse_failures"
echo "  - Content mismatches: $content_mismatches"

if [ ${#failed_samples[@]} -eq 0 ]; then
    echo "🎉 All samples passed! No regressions detected."
    exit 0
else
    echo ""
    echo "❌ Failed samples:"
    for failed in "${failed_samples[@]}"; do
        echo "  - $failed"
    done
    echo ""
    echo "🔧 To regenerate reference outputs:"
    echo "  ./generate-sample-outputs.sh"
    echo ""
    echo "🔍 To debug specific failures:"
    echo "  yarn parse samples/filename.ps.md --disable-llm"
    echo "  diff sample-outputs/filename.ps.md /tmp/current-output"
    exit 1
fi