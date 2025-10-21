// MongoDB连接测试路由
const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      MONGODB_URI_exists: !!process.env.MONGODB_URI
    },
    connection: {
      currentState: mongoose.connection.readyState,
      stateDescription: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
    },
    tests: []
  };

  // Test 1: Check if URI is accessible
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    results.tests.push({
      test: 'URI Check',
      passed: false,
      error: 'MONGODB_URI environment variable not found'
    });
    return res.status(500).json(results);
  }

  results.tests.push({
    test: 'URI Check',
    passed: true,
    uriFormat: uri.startsWith('mongodb+srv') ? 'Atlas SRV' : 'Standard',
    uriLength: uri.length
  });

  // Test 2: Try to connect if not connected
  if (mongoose.connection.readyState !== 1) {
    try {
      console.log('Attempting fresh connection...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        maxPoolSize: 1
      });

      results.tests.push({
        test: 'Fresh Connection',
        passed: true,
        duration: `${Date.now() - startTime}ms`
      });
    } catch (error) {
      results.tests.push({
        test: 'Fresh Connection',
        passed: false,
        error: error.message,
        errorCode: error.code,
        duration: `${Date.now() - startTime}ms`
      });

      // Try to parse the error
      if (error.message.includes('ENOTFOUND')) {
        results.diagnosis = 'DNS resolution failed - MongoDB Atlas cluster hostname not found';
      } else if (error.message.includes('authentication')) {
        results.diagnosis = 'Authentication failed - check username/password';
      } else if (error.message.includes('whitelist') || error.message.includes('IP')) {
        results.diagnosis = 'IP whitelist issue - add 0.0.0.0/0 to MongoDB Atlas Network Access';
      } else if (error.message.includes('timed out')) {
        results.diagnosis = 'Connection timeout - likely network/firewall issue';
      }
    }
  }

  // Test 3: If connected, try a ping
  if (mongoose.connection.readyState === 1) {
    try {
      await mongoose.connection.db.admin().ping();
      results.tests.push({
        test: 'Database Ping',
        passed: true,
        host: mongoose.connection.host,
        database: mongoose.connection.name
      });
    } catch (error) {
      results.tests.push({
        test: 'Database Ping',
        passed: false,
        error: error.message
      });
    }
  }

  // Final state
  results.connection.finalState = mongoose.connection.readyState;
  results.connection.finalStateDescription = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  results.totalDuration = `${Date.now() - startTime}ms`;

  const statusCode = results.tests.every(t => t.passed) ? 200 : 503;
  res.status(statusCode).json(results);
});

module.exports = router;