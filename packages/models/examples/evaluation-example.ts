import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { 
  EvaluationService, 
  EvaluationRunType, 
  EvaluationRunStatus,
  AnalysisResultType 
} from '../src';

/**
 * Example showing how to use the EvaluationService for storing and retrieving evaluation results
 */
async function runExample() {
  try {
    // Connect to MongoDB
    await connectToDatabase({
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      dbName: 'model-evals',
    });

    console.log('Connected to MongoDB');

    // Create evaluation service
    const evaluationService = new EvaluationService();

    // Create an evaluation run
    const evaluationRun = await evaluationService.createEvaluationRun({
      name: 'Random Word Selection Example',
      description: 'Testing random word selection with GPT-4',
      type: EvaluationRunType.RANDOM_WORD,
      modelProvider: 'openai',
      modelName: 'gpt-4',
      config: {
        numPrompts: 10,
        words: ['clubs', 'diamonds', 'hearts', 'spades'],
      },
    });

    console.log('Created evaluation run:', evaluationRun._id.toString());

    // Update status to running
    await evaluationService.updateEvaluationRunStatus(
      evaluationRun._id,
      EvaluationRunStatus.RUNNING
    );

    // Mock generator function for responses
    async function* generateResponses() {
      const words = ['clubs', 'diamonds', 'hearts', 'spades'];
      
      for (let i = 0; i < 10; i++) {
        // Shuffle the words for each prompt
        const shuffledWords = [...words].sort(() => Math.random() - 0.5);
        
        // Select a random word (simulating model response)
        const selectedIndex = Math.floor(Math.random() * 4);
        const selectedWord = shuffledWords[selectedIndex];
        
        // Calculate the original position of the selected word
        const originalPosition = words.indexOf(selectedWord);
        
        yield {
          promptIndex: i,
          prompt: `Choose a random word from the following list: ${shuffledWords.join(', ')}`,
          response: { 
            selectedWord,
            reason: `I randomly chose ${selectedWord}`,
          },
          responseTime: 100 + Math.random() * 200,
          metadata: {
            wordOrder: shuffledWords,
            selectedPosition: selectedIndex,
            originalPosition,
          },
        };
      }
    }

    // Save the responses
    console.log('Saving model responses...');
    for await (const { promptIndex, prompt, response, responseTime, metadata } of generateResponses()) {
      await evaluationService.saveModelResponse({
        evaluationRunId: evaluationRun._id,
        promptIndex,
        prompt,
        rawResponse: JSON.stringify(response),
        parsedResponse: response,
        responseTime,
        metadata,
      });
      
      console.log(`Saved response ${promptIndex + 1}/10`);
    }

    // Update status to completed
    await evaluationService.updateEvaluationRunStatus(
      evaluationRun._id,
      EvaluationRunStatus.COMPLETED
    );

    // Calculate word frequency results
    const wordCounts = {
      clubs: 0,
      diamonds: 0,
      hearts: 0,
      spades: 0,
    };

    // Calculate position bias results
    const positionCounts = [0, 0, 0, 0];

    // Get all responses
    const responses = await evaluationService.getModelResponses(evaluationRun._id);
    
    // Analyze responses
    for (const response of responses) {
      const parsedResponse = response.parsedResponse as { selectedWord: string };
      const metadata = response.metadata as { selectedPosition: number };
      
      // Count word frequencies
      wordCounts[parsedResponse.selectedWord]++;
      
      // Count position selection
      positionCounts[metadata.selectedPosition]++;
    }

    // Save word frequency analysis
    await evaluationService.saveAnalysisResult({
      evaluationRunId: evaluationRun._id,
      type: AnalysisResultType.FREQUENCY_DISTRIBUTION,
      name: 'Word Frequency',
      description: 'Distribution of selected words',
      result: wordCounts,
      metadata: {
        totalResponses: responses.length,
      },
    });

    // Save position bias analysis
    await evaluationService.saveAnalysisResult({
      evaluationRunId: evaluationRun._id,
      type: AnalysisResultType.POSITION_BIAS,
      name: 'Position Bias',
      description: 'Distribution of selected positions',
      result: {
        positionCounts,
        positionPercentages: positionCounts.map(count => count / responses.length),
      },
      metadata: {
        totalResponses: responses.length,
      },
    });

    // Retrieve and display results
    const analysisResults = await evaluationService.getAnalysisResults(evaluationRun._id);
    
    console.log('\nAnalysis Results:');
    for (const result of analysisResults) {
      console.log(`\n${result.name} (${result.type}):`);
      console.log(result.result);
    }

    console.log('\nExample completed successfully');
  } catch (error) {
    console.error('Error in example:', error);
  } finally {
    // Disconnect from MongoDB
    await disconnectFromDatabase();
    console.log('Disconnected from MongoDB');
  }
}

// Run the example
if (require.main === module) {
  runExample();
}

export { runExample };