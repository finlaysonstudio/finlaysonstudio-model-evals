/**
 * Example usage of the response tracking functionality
 */
import { connectToDatabase } from '@finlaysonstudio/eval-models';
import { createModelClient, ModelConfig } from '@finlaysonstudio/eval-models';
import { evaluateRandomWordSelection, EvaluationOptions } from '../src';

async function runTrackedEvaluation() {
  // Connect to the database first
  await connectToDatabase({
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/model-evals',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  });

  // Create a model client
  const modelConfig: ModelConfig = {
    provider: 'anthropic', // or 'openai'
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    modelName: 'claude-3-sonnet-20240229',
  };
  
  const modelClient = createModelClient(modelConfig);
  
  // Set up evaluation options with tracking enabled
  const evalOptions: EvaluationOptions = {
    options: ['clubs', 'diamonds', 'hearts', 'spades'],
    numRuns: 100,
    promptStyle: 'structured',
    tracking: {
      enabled: true,
      name: 'Card Suit Random Selection - Claude 3 Sonnet',
      description: 'Evaluating Claude 3 Sonnet\'s ability to select random card suits',
      modelProvider: 'anthropic',
      modelName: 'claude-3-sonnet-20240229',
    }
  };
  
  console.log('Starting tracked evaluation run...');
  
  try {
    // Run the evaluation with tracking
    const result = await evaluateRandomWordSelection(modelClient, evalOptions);
    
    // Log the summary statistics
    console.log('\nEvaluation Complete!');
    console.log('--------------------');
    console.log('Word Selection Frequencies:');
    
    const wordOptions = Object.keys(result.selectedWords);
    const totalRuns = result.totalRuns;
    
    wordOptions.forEach(word => {
      const count = result.selectedWords[word] || 0;
      const percentage = ((count / totalRuns) * 100).toFixed(2);
      console.log(`${word}: ${count} (${percentage}%)`);
    });
    
    console.log('\nPosition Bias:');
    
    const positions = Object.keys(result.positionBias);
    
    positions.forEach(pos => {
      const count = result.positionBias[parseInt(pos)] || 0;
      const percentage = ((count / totalRuns) * 100).toFixed(2);
      console.log(`Position ${pos}: ${count} (${percentage}%)`);
    });
    
    // Calculate expected frequency per word
    const expectedFreq = totalRuns / wordOptions.length;
    
    // Perform chi-square goodness of fit test for randomness
    let chiSquare = 0;
    
    wordOptions.forEach(word => {
      const observed = result.selectedWords[word] || 0;
      const diff = observed - expectedFreq;
      chiSquare += (diff * diff) / expectedFreq;
    });
    
    const degreesOfFreedom = wordOptions.length - 1;
    
    console.log('\nRandomness Analysis:');
    console.log(`Chi-square value: ${chiSquare.toFixed(4)}`);
    console.log(`Degrees of freedom: ${degreesOfFreedom}`);
    
    // Simple interpretation
    if (chiSquare < 7.815) { // 95% confidence level for df=3
      console.log('Result: Selection appears to be random within statistical significance.');
    } else {
      console.log('Result: Selection shows significant non-randomness.');
    }
    
  } catch (error) {
    console.error('Error running evaluation:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runTrackedEvaluation()
    .then(() => console.log('Example completed'))
    .catch(err => console.error('Example failed:', err));
}

export { runTrackedEvaluation };