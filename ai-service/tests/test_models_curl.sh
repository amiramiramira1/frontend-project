#!/bin/bash
# Bash script to test different Gemini models against the Boxify AI Service
# Assumes the AI service is running on http://localhost:8000

MODELS=(
    "gemini-2.5-flash-lite"
    "gemini-2.5-flash"
    "gemini-2.5-pro"
    "gemini-2.0-flash"
)

echo "========================================================="
echo "Manual Curl/API Testing of Models on Boxify AI Service"
echo "Make sure the AI service is running on http://localhost:8000"
echo "========================================================="

for model in "${MODELS[@]}"; do
    echo ""
    echo "---------------------------------------------------------"
    echo "Testing model: $model"
    echo "Sending query: 'Can you recommend a keto box?'"
    echo "---------------------------------------------------------"
    
    start_time=$(date +%s.%N)
    
    response=$(curl -s -X POST http://localhost:8000/chat \
      -H "Content-Type: application/json" \
      -d "{\"message\": \"Can you recommend a keto box?\", \"sessionId\": \"manual-test-$model\", \"model\": \"$model\"}")
      
    end_time=$(date +%s.%N)
    
    # Calculate latency (portable fallback if date command lacks nanoseconds)
    if [[ "$start_time" == *N* ]]; then
        latency="unknown"
    else
        latency=$(echo "$end_time - $start_time" | bc 2>/dev/null)
        if [ -z "$latency" ]; then
            latency="calculated via python"
            # Fallback to python for math if bc is missing
            latency=$(python -c "print(f'{$end_time - $start_time:.2f}')" 2>/dev/null)
        else
            latency=$(printf "%.2f" $latency)
        fi
    fi

    echo "Latency: $latency seconds"
    echo "Raw Response:"
    echo "$response" | python -m json.tool 2>/dev/null || echo "$response"
done
