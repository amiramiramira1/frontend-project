# PowerShell script to test different Gemini models against the Boxify AI Service
# Assumes the AI service is running on http://localhost:8000

$models = @(
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "Manual Curl/API Testing of Models on Boxify AI Service" -ForegroundColor Cyan
Write-Host "Make sure the AI service is running on http://localhost:8000" -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

foreach ($model in $models) {
    Write-Host ""
    Write-Host "---------------------------------------------------------" -ForegroundColor Green
    Write-Host "Testing model: $model" -ForegroundColor Green
    Write-Host "Sending query: 'Can you recommend a keto box?'" -ForegroundColor Gray
    Write-Host "---------------------------------------------------------" -ForegroundColor Green
    
    $body = @{
        message = "Can you recommend a keto box?"
        sessionId = "manual-test-$model"
        model = $model
    } | ConvertTo-Json -Depth 5
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method Post -ContentType "application/json; charset=utf-8" -Body $body
        $endTime = Get-Date
        $latency = ($endTime - $startTime).TotalSeconds
        
        Write-Host "Status: Success" -ForegroundColor Green
        Write-Host "Latency: $($latency.ToString('F2')) seconds" -ForegroundColor Yellow
        Write-Host "Response model used: $($response.model)" -ForegroundColor Gray
        Write-Host "Answer: $($response.answer)" -ForegroundColor White
        
        if ($response.toolCalls -and $response.toolCalls.Count -gt 0) {
            Write-Host "Tool calls made:" -ForegroundColor Blue
            foreach ($tc in $response.toolCalls) {
                Write-Host "  - Tool: $($tc.tool)" -ForegroundColor Blue
                Write-Host "    Args: $(ConvertTo-Json $tc.args -Compress)" -ForegroundColor Blue
            }
        } else {
            Write-Host "Tool calls made: None" -ForegroundColor Blue
        }
    } catch {
        Write-Host "Error occurred while contacting the server:" -ForegroundColor Red
        Write-Error $_.Exception.Message
    }
}
