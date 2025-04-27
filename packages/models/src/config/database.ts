import mongoose from 'mongoose';

/**
 * MongoDB connection options
 */
export interface DatabaseConnectionOptions {
  uri: string;
  dbName?: string;
  user?: string;
  password?: string;
  options?: mongoose.ConnectOptions;
}

/**
 * Default connection options
 */
const defaultOptions: mongoose.ConnectOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

/**
 * Connects to MongoDB using the provided options
 * @param options DatabaseConnectionOptions
 * @returns Promise<mongoose.Connection>
 */
export async function connectToDatabase(options: DatabaseConnectionOptions): Promise<mongoose.Connection> {
  try {
    const { uri, dbName, user, password, options: customOptions } = options;
    
    // Build connection options
    const connectOptions: mongoose.ConnectOptions = {
      ...defaultOptions,
      ...customOptions,
    };
    
    // Add database name if provided
    if (dbName) {
      connectOptions.dbName = dbName;
    }
    
    // Add authentication if provided
    if (user && password) {
      connectOptions.auth = {
        username: user,
        password: password,
      };
    }

    // Connect to MongoDB
    await mongoose.connect(uri, connectOptions);
    
    // Get the connection
    const connection = mongoose.connection;
    
    // Log connection state
    connection.on('connected', () => {
      console.info('Connected to MongoDB');
    });
    
    connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    connection.on('disconnected', () => {
      console.info('Disconnected from MongoDB');
    });
    
    // Return the connection
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnects from MongoDB
 * @returns Promise<void>
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('Failed to disconnect from MongoDB:', error);
    throw error;
  }
}