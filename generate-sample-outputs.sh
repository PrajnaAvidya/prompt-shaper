#!/bin/bash

echo "🏗️ Generating reference outputs for all samples..."
echo "=============================================="

# Create sample-outputs directory if it doesn't exist
mkdir -p sample-outputs

generated_count=0
failed_count=0

# Generate outputs for basic samples (no external dependencies)
for file in samples/0{0,1,2,3,4,5,6}-*.ps.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output_file="sample-outputs/${filename}"
        echo -n "Generating output for $filename... "
        
        if PROMPT_SHAPER_OUTPUT_ASSISTANT=false yarn parse "$file" --no-llm 2>/dev/null | sed '/^yarn run\|^\$ ts-node\|^Done in /d' > "$output_file"; then
            echo "✅ Generated"
            generated_count=$((generated_count + 1))
        else
            echo "❌ Failed"
            failed_count=$((failed_count + 1))
            rm -f "$output_file"  # Remove failed output file
        fi
    fi
done

# Generate outputs for file operation samples
for file in samples/0{7,8}-*.ps.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output_file="sample-outputs/${filename}"
        echo -n "Generating output for $filename... "
        
        if yarn parse "$file" --no-llm -e "js,json,md,css,txt" 2>/dev/null | sed '/^yarn run\|^\$ ts-node\|^Done in /d' > "$output_file"; then
            echo "✅ Generated"
            generated_count=$((generated_count + 1))
        else
            echo "❌ Failed"
            failed_count=$((failed_count + 1))
            rm -f "$output_file"  # Remove failed output file
        fi
    fi
done

# Generate outputs for URL and image samples (may fail due to network/dependencies)
for file in samples/{09,10}-*.ps.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output_file="sample-outputs/${filename}"
        echo -n "Generating output for $filename (may fail due to dependencies)... "
        
        if PROMPT_SHAPER_OUTPUT_ASSISTANT=false yarn parse "$file" --no-llm 2>/dev/null | sed '/^yarn run\|^\$ ts-node\|^Done in /d' > "$output_file"; then
            echo "✅ Generated"
            generated_count=$((generated_count + 1))
        else
            echo "⚠️  Skipped (external dependencies)"
            rm -f "$output_file"  # Remove failed output file
        fi
    fi
done

# Generate outputs for CLI and markdown samples
for file in samples/{11,12}-*.ps.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        output_file="sample-outputs/${filename}"
        echo -n "Generating output for $filename... "
        
        if PROMPT_SHAPER_OUTPUT_ASSISTANT=false yarn parse "$file" --no-llm 2>/dev/null | sed '/^yarn run\|^\$ ts-node\|^Done in /d' > "$output_file"; then
            echo "✅ Generated"
            generated_count=$((generated_count + 1))
        else
            echo "❌ Failed"
            failed_count=$((failed_count + 1))
            rm -f "$output_file"  # Remove failed output file
        fi
    fi
done

echo "=============================================="
echo "📊 Generation Results:"
echo "Generated: $generated_count"
echo "Failed: $failed_count"

if [ $failed_count -eq 0 ]; then
    echo "🎉 All reference outputs generated successfully!"
    echo ""
    echo "📝 Generated files:"
    ls -la sample-outputs/
else
    echo "❌ Some samples failed to generate outputs"
    exit 1
fi

echo ""
echo "✨ Reference outputs saved to sample-outputs/ directory"
echo "🧪 Run ./test-samples.sh to test against these references"