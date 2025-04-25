I want to start a new project. Replace the contents of this file with a plan I can later use with a code generator to guide development.
The goal is a TypeScript project, set up as an NPM monorepo with vite and vitest. 
The name of the project, set in the package.json, is finlaysonstudio-model-evals. 
Make the only inner package.json, in packages/random-word, named eval-random-words. 
The goal in eval-random-words is to ask the model to pick a random word from [clubs, diamonds, hearts, spades] n times (n = 100), randomizing the order of the words every time. 
Keep track of (a) frequency of word chosen and (b) frequency of index chosen.
