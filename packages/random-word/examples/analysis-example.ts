/**
 * Example of using the statistical analysis functions
 */
import { ModelClient } from '../src/types/model-client';
import { TrackedEvaluationOptions, runTrackedEvaluation } from '../src/utils/tracking-utils';
import { analyzeRandomness } from '../src/analysis/statistical-analysis';
import { detectPositionBias, detectEdgePositionBias, detectWordPositionCorrelation } from '../src/analysis/position-bias';

// Mock model client for example purposes
const mockModel: ModelClient = {
  generateObject: async ({ schema, prompt }) => {
    // This is a simplified mock for example purposes
    // In a real app, this would call the actual model API
    const words = ['clubs', 'diamonds', 'hearts', 'spades'];
    return {
      selectedWord: words[Math.floor(Math.random() * words.length)],
      reason: 'Random selection for example purposes'
    };
  }
};

async function runAnalysisExample() {
  console.log('Starting random word evaluation...');
  
  const options: TrackedEvaluationOptions = {
    name: 'Example Statistical Analysis Test',
    description: 'Testing the comprehensive statistical analysis',
    modelProvider: 'openai', // This is just for the example
    modelName: 'gpt-4',      // This is just for the example
    wordOptions: ['clubs', 'diamonds', 'hearts', 'spades'],
    numRuns: 100,
    promptStyle: 'simple'
  };
  
  try {
    // Run 100 evaluations and collect results
    const { evaluationRunId, results } = await runTrackedEvaluation(mockModel, options);
    
    console.log(`Evaluation ID: ${evaluationRunId}`);
    console.log(`Total runs: ${results.totalRuns}`);
    
    // Print frequency distribution
    console.log('\nWord Frequency:');
    Object.entries(results.selectedWords).forEach(([word, count]) => {
      console.log(`  ${word}: ${count} (${(count / results.totalRuns * 100).toFixed(1)}%)`);
    });
    
    console.log('\nPosition Bias:');
    Object.entries(results.positionBias).forEach(([position, count]) => {
      console.log(`  Position ${position}: ${count} (${(count / results.totalRuns * 100).toFixed(1)}%)`);
    });
    
    // Perform comprehensive analysis
    console.log('\nPerforming comprehensive statistical analysis...');
    const analysis = analyzeRandomness(results);
    
    // Print analysis results
    console.log('\n----- STATISTICAL ANALYSIS RESULTS -----');
    
    console.log('\nEntropy Analysis:');
    console.log(`  Word Entropy: ${analysis.entropy.words.entropy.toFixed(3)} (Normalized: ${analysis.entropy.words.normalizedEntropy.toFixed(3)})`);
    console.log(`  Position Entropy: ${analysis.entropy.positions.entropy.toFixed(3)} (Normalized: ${analysis.entropy.positions.normalizedEntropy.toFixed(3)})`);
    
    console.log('\nDistribution Analysis:');
    console.log(`  Word Distribution: Mean=${analysis.distribution.words.mean.toFixed(2)}, StdDev=${analysis.distribution.words.stdDev.toFixed(2)}, CV=${analysis.distribution.words.coefficientOfVariation.toFixed(3)}`);
    console.log(`  Position Distribution: Mean=${analysis.distribution.positions.mean.toFixed(2)}, StdDev=${analysis.distribution.positions.stdDev.toFixed(2)}, CV=${analysis.distribution.positions.coefficientOfVariation.toFixed(3)}`);
    
    console.log('\nChi-Square Test:');
    console.log(`  Words: χ²=${analysis.chiSquare.words.chiSquare.toFixed(2)}, df=${analysis.chiSquare.words.degreesOfFreedom}`);
    console.log(`  Interpretation: ${analysis.chiSquare.words.interpretation}`);
    console.log(`  Positions: χ²=${analysis.chiSquare.positions.chiSquare.toFixed(2)}, df=${analysis.chiSquare.positions.degreesOfFreedom}`);
    console.log(`  Interpretation: ${analysis.chiSquare.positions.interpretation}`);
    
    console.log('\nRuns Test (Sequential Independence):');
    console.log(`  Words: Runs=${analysis.sequentialIndependence.words.numberOfRuns}, Expected=${analysis.sequentialIndependence.words.expectedRuns.toFixed(2)}, Z=${analysis.sequentialIndependence.words.zScore.toFixed(2)}`);
    console.log(`  Interpretation: ${analysis.sequentialIndependence.words.interpretation}`);
    console.log(`  Positions: Runs=${analysis.sequentialIndependence.positions.numberOfRuns}, Expected=${analysis.sequentialIndependence.positions.expectedRuns.toFixed(2)}, Z=${analysis.sequentialIndependence.positions.zScore.toFixed(2)}`);
    console.log(`  Interpretation: ${analysis.sequentialIndependence.positions.interpretation}`);
    
    console.log('\nOverall Assessment:');
    console.log(`  Random Distribution: ${analysis.overallAssessment.isUniformDistribution ? 'Yes' : 'No'}`);
    console.log(`  Sequential Independence: ${analysis.overallAssessment.isSequentiallyIndependent ? 'Yes' : 'No'}`);
    console.log(`  Interpretation: ${analysis.overallAssessment.interpretation}`);
    
    // Add enhanced position bias detection
    console.log('\n----- ENHANCED POSITION BIAS ANALYSIS -----');
    
    // Perform detailed position bias analysis
    const positionBiasAnalysis = detectPositionBias(results.rawSelections);
    console.log('\nPosition Bias Metrics:');
    console.log(`  Bias Index: ${positionBiasAnalysis.biasMetrics.biasIndex.toFixed(3)} (0 = no bias, 1 = max bias)`);
    console.log(`  Max Deviation: ${(positionBiasAnalysis.biasMetrics.maxDeviation * 100).toFixed(1)}% at position ${positionBiasAnalysis.biasMetrics.maxDeviationPosition}`);
    console.log(`  Assessment: ${positionBiasAnalysis.biasAssessment.interpretation}`);
    
    // Analyze edge position effects (first/last position bias)
    const edgeBiasAnalysis = detectEdgePositionBias(results.rawSelections);
    console.log('\nEdge Position Effects:');
    console.log(`  First Position Bias: ${(edgeBiasAnalysis.firstPositionBias * 100).toFixed(1)}%`);
    console.log(`  Last Position Bias: ${(edgeBiasAnalysis.lastPositionBias * 100).toFixed(1)}%`);
    console.log(`  Assessment: ${edgeBiasAnalysis.interpretation}`);
    
    // Analyze word-position correlations
    const correlationAnalysis = detectWordPositionCorrelation(results.rawSelections);
    console.log('\nWord-Position Correlations:');
    if (correlationAnalysis.hasSignificantCorrelation) {
      console.log('  Significant correlations detected:');
      correlationAnalysis.significantCorrelations.slice(0, 3).forEach(corr => {
        console.log(`    '${corr.word}' at position ${corr.position}: ${(corr.deviation * 100).toFixed(1)}% deviation`);
      });
    } else {
      console.log('  No significant word-position correlations detected');
    }
    console.log(`  Assessment: ${correlationAnalysis.interpretation}`);
    
  } catch (error) {
    console.error('Error during evaluation:', error);
  }
}

// Run the example (uncomment to run)
// runAnalysisExample();

export { runAnalysisExample };