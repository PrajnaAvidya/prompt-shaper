#!/bin/bash

echo "🧪 Testing all PromptShaper samples..."
echo "=================================="

failed_samples=()
total_samples=0

# Test basic samples (no external dependencies)
for file in samples/0{0,1,2,3,4,5,6}-*.ps.md; do
    if [ -f "$file" ]; then
        total_samples=$((total_samples + 1))
        echo -n "Testing $(basename "$file")... "
        if yarn parse "$file" --no-llm > /dev/null 2>&1; then
            echo "✅ PASS"
        else
            echo "❌ FAIL"
            failed_samples+=("$file")
        fi
    fi
done

# Test file operation samples
for file in samples/0{7,8}-*.ps.md; do
    if [ -f "$file" ]; then
        total_samples=$((total_samples + 1))
        echo -n "Testing $(basename "$file") with extensions... "
        if yarn parse "$file" --no-llm -e "js,json,md,css,txt" > /dev/null 2>&1; then
            echo "✅ PASS"
        else
            echo "❌ FAIL"
            failed_samples+=("$file")
        fi
    fi
done

# Test URL and image samples (may fail due to network/dependencies)
for file in samples/{09,10}-*.ps.md; do
    if [ -f "$file" ]; then
        total_samples=$((total_samples + 1))
        echo -n "Testing $(basename "$file") (may fail due to dependencies)... "
        if yarn parse "$file" --no-llm > /dev/null 2>&1; then
            echo "✅ PASS"
        else
            echo "⚠️  EXPECTED FAIL (external dependencies)"
        fi
    fi
done

# Test CLI and markdown samples
for file in samples/{11,12}-*.ps.md; do
    if [ -f "$file" ]; then
        total_samples=$((total_samples + 1))
        echo -n "Testing $(basename "$file")... "
        if yarn parse "$file" --no-llm > /dev/null 2>&1; then
            echo "✅ PASS"
        else
            echo "❌ FAIL"
            failed_samples+=("$file")
        fi
    fi
done

echo "=================================="
echo "📊 Test Results:"
echo "Total samples: $total_samples"
echo "Failed samples: ${#failed_samples[@]}"

if [ ${#failed_samples[@]} -eq 0 ]; then
    echo "🎉 All core samples passed!"
else
    echo "❌ Failed samples:"
    for failed in "${failed_samples[@]}"; do
        echo "  - $failed"
    done
fi

echo ""
echo "🔍 To test manually:"
echo "  yarn parse samples/00-overview.ps.md --no-llm"
echo "  yarn parse samples/07-load-files.ps.md --no-llm"
echo "  yarn parse samples/08-load-directories.ps.md --no-llm -e \"js,json,md\""