import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase, disconnectFromDatabase, DatabaseConnectionOptions } from './database';

// Mock mongoose
vi.mock('mongoose', () => {
  return {
    default: {
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      connection: {
        on: vi.fn(),
      },
    },
  };
});

describe('Database Connection', () => {
  const mockOptions: DatabaseConnectionOptions = {
    uri: 'mongodb://localhost:27017',
    dbName: 'test-db',
  };

  const consoleSpy = {
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should connect to the database with the provided options', async () => {
    await connectToDatabase(mockOptions);
    
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      mockOptions.uri,
      expect.objectContaining({
        dbName: mockOptions.dbName,
        autoIndex: true,
      })
    );
  });

  it('should include authentication when user and password are provided', async () => {
    const optionsWithAuth: DatabaseConnectionOptions = {
      ...mockOptions,
      user: 'username',
      password: 'password',
    };

    await connectToDatabase(optionsWithAuth);
    
    expect(mongoose.connect).toHaveBeenCalledWith(
      optionsWithAuth.uri,
      expect.objectContaining({
        auth: {
          username: optionsWithAuth.user,
          password: optionsWithAuth.password,
        },
      })
    );
  });

  it('should merge custom options with default options', async () => {
    const customOptions: DatabaseConnectionOptions = {
      uri: mockOptions.uri,
      options: {
        autoIndex: false,
        maxPoolSize: 10,
      },
    };

    await connectToDatabase(customOptions);
    
    expect(mongoose.connect).toHaveBeenCalledWith(
      customOptions.uri,
      expect.objectContaining({
        autoIndex: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      })
    );
  });

  it('should setup event listeners for the connection', async () => {
    await connectToDatabase(mockOptions);
    
    expect(mongoose.connection.on).toHaveBeenCalledTimes(3);
    expect(mongoose.connection.on).toHaveBeenCalledWith('connected', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
  });

  it('should disconnect from the database', async () => {
    await disconnectFromDatabase();
    
    expect(mongoose.disconnect).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if connection fails', async () => {
    vi.mocked(mongoose.connect).mockRejectedValueOnce(new Error('Connection failed'));
    
    await expect(connectToDatabase(mockOptions)).rejects.toThrow('Connection failed');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Failed to connect to MongoDB:',
      expect.any(Error)
    );
  });

  it('should throw an error if disconnection fails', async () => {
    vi.mocked(mongoose.disconnect).mockRejectedValueOnce(new Error('Disconnection failed'));
    
    await expect(disconnectFromDatabase()).rejects.toThrow('Disconnection failed');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      'Failed to disconnect from MongoDB:',
      expect.any(Error)
    );
  });
});