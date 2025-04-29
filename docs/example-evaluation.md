# Example Evaluation: Color Selection Bias

This example walks through the process of setting up a new evaluation to test whether an LLM shows bias when selecting colors from a list.

## Step 1: Setup the evaluation

```typescript
// color-selection-example.ts
import { connectToDatabase, disconnectFromDatabase } from '@finlaysonstudio/eval-models';
import { createModelClient, ModelConfig } from '@finlaysonstudio/eval-models';
import { evaluateRandomWordSelection, EvaluationOptions } from '@finlaysonstudio/eval-random-words';
import { analyzeRandomness } from '@finlaysonstudio/eval-random-words';

async function runColorSelectionEvaluation() {
  try {
    // Connect to MongoDB
    await connectToDatabase({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
      dbName: 'model-evals',
    });
    
    console.log('Connected to MongoDB');
    
    // Configure the model client
    const modelConfig: ModelConfig = {
      provider: 'openai', // or 'anthropic'
      apiKey: process.env.OPENAI_API_KEY || '',
      modelName: 'gpt-4o', // or any supported model
    };
    
    // Create the model client
    const modelClient = createModelClient(modelConfig);
    
    // Set up the evaluation options
    const evalOptions: EvaluationOptions = {
      options: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
      numRuns: 100,
      promptStyle: 'structured',
      tracking: {
        enabled: true,
        name: 'Color Selection Randomness - GPT-4o',
        description: 'Evaluating GPT-4o\'s ability to randomly select colors',
        modelProvider: 'openai',
        modelName: 'gpt-4o',
      }
    };
    
    console.log('Starting evaluation run...');
    
    // Run the evaluation
    const result = await evaluateRandomWordSelection(modelClient, evalOptions);
    
    console.log('Evaluation complete');
    console.log(`Evaluation Run ID: ${result.evaluationRunId}`);
    
    // Display word selection frequencies
    console.log('\nColor Selection Frequencies:');
    Object.entries(result.selectedWords).forEach(([word, count]) => {
      const percentage = ((count / result.totalRuns) * 100).toFixed(2);
      console.log(`${word}: ${count} (${percentage}%)`);
    });
    
    // Display position bias
    console.log('\nPosition Bias:');
    Object.entries(result.positionBias).forEach(([position, count]) => {
      const percentage = ((count / result.totalRuns) * 100).toFixed(2);
      console.log(`Position ${position}: ${count} (${percentage}%)`);
    });
    
    // Analyze the results
    console.log('\nPerforming statistical analysis...');
    const analysis = analyzeRandomness(result);
    
    // Print analysis summary
    console.log('\nAnalysis Summary:');
    console.log(`Random Distribution: ${analysis.overallAssessment.isUniformDistribution ? 'Yes' : 'No'}`);
    console.log(`Sequential Independence: ${analysis.overallAssessment.isSequentiallyIndependent ? 'Yes' : 'No'}`);
    console.log(`Interpretation: ${analysis.overallAssessment.interpretation}`);
    
    // Calculate chi-square critical value for 5 degrees of freedom at 0.05 significance
    // df = 6 - 1 = 5, critical value = 11.07
    const chiSquareValue = analysis.chiSquare.words.chiSquare;
    const criticalValue = 11.07;
    
    console.log('\nRandomness Test:');
    console.log(`Chi-square test statistic: ${chiSquareValue.toFixed(2)}`);
    console.log(`Critical value (α=0.05, df=5): ${criticalValue}`);
    
    if (chiSquareValue > criticalValue) {
      console.log('Result: The color selection shows significant bias (p < 0.05)');
    } else {
      console.log('Result: The color selection appears random (p > 0.05)');
    }
    
    return result.evaluationRunId;
    
  } catch (error) {
    console.error('Error running evaluation:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await disconnectFromDatabase();
    console.log('Disconnected from MongoDB');
  }
}

// Run the evaluation if this file is executed directly
if (require.main === module) {
  runColorSelectionEvaluation()
    .then((evaluationId) => {
      console.log(`Evaluation completed with ID: ${evaluationId}`);
      process.exit(0);
    })
    .catch(err => {
      console.error('Evaluation failed:', err);
      process.exit(1);
    });
}

export { runColorSelectionEvaluation };
```

## Step 2: Retrieve and analyze the stored results

```typescript
// analyze-color-results.ts
import { connectToDatabase, disconnectFromDatabase } from '@finlaysonstudio/eval-models';
import { EvaluationService } from '@finlaysonstudio/eval-models';
import { 
  detectPositionBias, 
  detectEdgePositionBias, 
  detectWordPositionCorrelation 
} from '@finlaysonstudio/eval-random-words';

async function analyzeColorResults(evaluationRunId: string) {
  try {
    // Connect to MongoDB
    await connectToDatabase({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
      dbName: 'model-evals',
    });
    
    console.log('Connected to MongoDB');
    
    // Create evaluation service
    const evaluationService = new EvaluationService();
    
    // Retrieve the evaluation run
    const evaluationRun = await evaluationService.getEvaluationRun(evaluationRunId);
    console.log(`Analyzing evaluation: ${evaluationRun.name}`);
    
    // Retrieve all model responses
    const responses = await evaluationService.getModelResponses(evaluationRunId);
    console.log(`Retrieved ${responses.length} responses`);
    
    // Format the responses for analysis
    const rawSelections = responses.map(response => {
      const parsedResponse = response.parsedResponse as { selectedWord: string };
      const metadata = response.metadata as { wordOrder: string[], selectedPosition: number };
      
      return {
        selectedWord: parsedResponse.selectedWord,
        wordOptions: metadata.wordOrder,
        selectedPosition: metadata.selectedPosition,
        promptIndex: response.promptIndex,
      };
    });
    
    // Perform position bias analysis
    console.log('\nPosition Bias Analysis:');
    const positionBiasAnalysis = detectPositionBias(rawSelections);
    
    console.log(`Bias Index: ${positionBiasAnalysis.biasMetrics.biasIndex.toFixed(3)} (0 = no bias, 1 = max bias)`);
    console.log(`Max Deviation: ${(positionBiasAnalysis.biasMetrics.maxDeviation * 100).toFixed(1)}% at position ${positionBiasAnalysis.biasMetrics.maxDeviationPosition}`);
    console.log(`Assessment: ${positionBiasAnalysis.biasAssessment.interpretation}`);
    
    // Check for edge position bias
    console.log('\nEdge Position Effects:');
    const edgeBiasAnalysis = detectEdgePositionBias(rawSelections);
    
    console.log(`First Position Bias: ${(edgeBiasAnalysis.firstPositionBias * 100).toFixed(1)}%`);
    console.log(`Last Position Bias: ${(edgeBiasAnalysis.lastPositionBias * 100).toFixed(1)}%`);
    console.log(`Assessment: ${edgeBiasAnalysis.interpretation}`);
    
    // Check for specific color-position correlations
    console.log('\nColor-Position Correlations:');
    const correlationAnalysis = detectWordPositionCorrelation(rawSelections);
    
    if (correlationAnalysis.hasSignificantCorrelation) {
      console.log('Significant correlations detected:');
      correlationAnalysis.significantCorrelations.forEach(corr => {
        console.log(`'${corr.word}' at position ${corr.position}: ${(corr.deviation * 100).toFixed(1)}% deviation from expected`);
      });
    } else {
      console.log('No significant color-position correlations detected');
    }
    
    // Retrieve analysis results
    const analysisResults = await evaluationService.getAnalysisResults(evaluationRunId);
    
    console.log('\nStored Analysis Results:');
    for (const result of analysisResults) {
      console.log(`\n${result.name} (${result.type}):`);
      console.log(result.result);
    }
    
  } catch (error) {
    console.error('Error analyzing results:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await disconnectFromDatabase();
    console.log('Disconnected from MongoDB');
  }
}

// Usage example:
// analyzeColorResults('your-evaluation-run-id');

export { analyzeColorResults };
```

## Step 3: Create visualizations for the results

While the project doesn't currently include visualization components, you could export the data to CSV and use external tools like Excel, Python with matplotlib, or a web-based visualization library.

```typescript
// export-results-to-csv.ts
import { connectToDatabase, disconnectFromDatabase } from '@finlaysonstudio/eval-models';
import { EvaluationService } from '@finlaysonstudio/eval-models';
import * as fs from 'fs';
import * as path from 'path';

async function exportResultsToCsv(evaluationRunId: string, outputDir: string) {
  try {
    // Connect to MongoDB
    await connectToDatabase({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
      dbName: 'model-evals',
    });
    
    // Create evaluation service
    const evaluationService = new EvaluationService();
    
    // Get evaluation run details
    const evaluationRun = await evaluationService.getEvaluationRun(evaluationRunId);
    
    // Get all responses
    const responses = await evaluationService.getModelResponses(evaluationRunId);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create filename with evaluation name and date
    const fileName = `${evaluationRun.name.replace(/\s+/g, '-')}-${evaluationRunId}.csv`;
    const filePath = path.join(outputDir, fileName);
    
    // Create CSV content
    let csvContent = 'prompt_index,prompt,selected_word,selected_position,response_time_ms\n';
    
    for (const response of responses) {
      const parsedResponse = response.parsedResponse as { selectedWord: string };
      const metadata = response.metadata as { selectedPosition: number };
      
      // Escape any commas in the prompt
      const escapedPrompt = response.prompt.replace(/,/g, '","');
      
      csvContent += `${response.promptIndex},"${escapedPrompt}",${parsedResponse.selectedWord},${metadata.selectedPosition},${response.responseTime}\n`;
    }
    
    // Write to file
    fs.writeFileSync(filePath, csvContent);
    
    console.log(`Results exported to: ${filePath}`);
    return filePath;
    
  } catch (error) {
    console.error('Error exporting results:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await disconnectFromDatabase();
  }
}

// Usage:
// exportResultsToCsv('your-evaluation-run-id', './exports');

export { exportResultsToCsv };
```

## Running a Comparative Analysis

To compare multiple models, you can run the same evaluation with different model configurations:

```typescript
// compare-models.ts
import { connectToDatabase, disconnectFromDatabase } from '@finlaysonstudio/eval-models';
import { createModelClient, ModelConfig } from '@finlaysonstudio/eval-models';
import { evaluateRandomWordSelection, EvaluationOptions } from '@finlaysonstudio/eval-random-words';
import { analyzeRandomness } from '@finlaysonstudio/eval-random-words';

async function compareColorSelectionAcrossModels() {
  try {
    // Connect to MongoDB
    await connectToDatabase({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
      dbName: 'model-evals',
    });
    
    console.log('Connected to MongoDB');
    
    // Define model configurations to test
    const modelConfigs = [
      {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        modelName: 'gpt-4o',
        displayName: 'GPT-4o'
      },
      {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY || '',
        modelName: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo'
      },
      {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        modelName: 'claude-3-sonnet-20240229',
        displayName: 'Claude 3 Sonnet'
      }
    ];
    
    const results = [];
    
    // Run evaluation for each model
    for (const config of modelConfigs) {
      console.log(`\nEvaluating ${config.displayName}...`);
      
      // Create model client
      const modelClient = createModelClient(config);
      
      // Set up evaluation options
      const evalOptions: EvaluationOptions = {
        options: ['red', 'blue', 'green', 'yellow', 'purple', 'orange'],
        numRuns: 100,
        promptStyle: 'structured',
        tracking: {
          enabled: true,
          name: `Color Selection - ${config.displayName}`,
          description: `Evaluating ${config.displayName}'s ability to randomly select colors`,
          modelProvider: config.provider,
          modelName: config.modelName,
        }
      };
      
      // Run evaluation
      const result = await evaluateRandomWordSelection(modelClient, evalOptions);
      
      // Analyze results
      const analysis = analyzeRandomness(result);
      
      // Store results
      results.push({
        modelName: config.displayName,
        evaluationRunId: result.evaluationRunId,
        chiSquare: analysis.chiSquare.words.chiSquare,
        biasIndex: analysis.distribution.words.coefficientOfVariation,
        isRandom: analysis.overallAssessment.isUniformDistribution,
        interpretation: analysis.overallAssessment.interpretation
      });
      
      console.log(`Evaluation complete for ${config.displayName}`);
    }
    
    // Print comparative results
    console.log('\n========= COMPARATIVE RESULTS =========');
    console.log('Model Name | Chi-Square | Bias Index | Random?');
    console.log('---------------------------------------');
    
    results.forEach(r => {
      console.log(`${r.modelName} | ${r.chiSquare.toFixed(2)} | ${r.biasIndex.toFixed(3)} | ${r.isRandom ? 'Yes' : 'No'}`);
    });
    
    return results;
    
  } catch (error) {
    console.error('Error comparing models:', error);
    throw error;
  } finally {
    await disconnectFromDatabase();
    console.log('Disconnected from MongoDB');
  }
}

// Run the comparison if this file is executed directly
if (require.main === module) {
  compareColorSelectionAcrossModels()
    .then(() => {
      console.log('Comparison completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Comparison failed:', err);
      process.exit(1);
    });
}

export { compareColorSelectionAcrossModels };
```

This example demonstrates a complete workflow for evaluating color selection bias across multiple models, analyzing the results, and exporting data for external visualization.