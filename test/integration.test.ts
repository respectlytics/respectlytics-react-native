/**
 * Integration Tests for Respectlytics React Native SDK
 * 
 * These tests verify the SDK works correctly against the live Django backend.
 * 
 * SETUP:
 * 1. Copy .env.testing.example to .env.testing
 * 2. Add your test API key from the dashboard
 * 
 * RUN:
 * npm run test:integration
 */

// Since we can't run React Native code in Node, this is a simplified
// API test that validates the backend accepts our event format

const API_ENDPOINT = process.env.RESPECTLYTICS_PROD_BASE_URL 
  ? `${process.env.RESPECTLYTICS_PROD_BASE_URL}/events/`
  : 'https://respectlytics.com/api/v1/events/';

const API_KEY = process.env.RESPECTLYTICS_TEST_API_KEY || '';

interface TestEvent {
  event_name: string;
  timestamp: string;
  session_id: string;
  user_id?: string;
  screen?: string;
  platform: string;
  os_version: string;
  app_version: string;
  locale: string;
  device_type: string;
}

function generateSessionId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => 
    Math.floor(Math.random() * 16).toString(16)
  );
}

function generateUserId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/x/g, () => 
    Math.floor(Math.random() * 16).toString(16)
  );
}

async function sendEvent(event: TestEvent): Promise<{ ok: boolean; status: number }> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-App-Key': API_KEY,
    },
    body: JSON.stringify(event),
  });
  
  return { ok: response.ok, status: response.status };
}

async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Respectlytics React Native SDK - Integration Tests');
  console.log('='.repeat(60));
  console.log(`API Endpoint: ${API_ENDPOINT}`);
  console.log(`API Key: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'NOT SET'}`);
  console.log('');

  if (!API_KEY) {
    console.error('❌ ERROR: RESPECTLYTICS_TEST_API_KEY not set');
    console.error('   Copy .env.testing.example to .env.testing and add your API key');
    process.exit(1);
  }

  const sessionId = generateSessionId();
  const userId = generateUserId();
  let passed = 0;
  let failed = 0;

  // Test 1: Basic event without user_id
  console.log('Test 1: Basic event without user_id');
  try {
    const result = await sendEvent({
      event_name: 'rn_sdk_test_anonymous',
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      platform: 'iOS',
      os_version: '17.0',
      app_version: '1.0.0',
      locale: 'en_US',
      device_type: 'phone',
    });
    if (result.ok) {
      console.log('   ✓ PASSED (status: ' + result.status + ')');
      passed++;
    } else {
      console.log('   ✗ FAILED (status: ' + result.status + ')');
      failed++;
    }
  } catch (err) {
    console.log('   ✗ FAILED (error: ' + err + ')');
    failed++;
  }

  // Test 2: Event with user_id
  console.log('Test 2: Event with user_id');
  try {
    const result = await sendEvent({
      event_name: 'rn_sdk_test_identified',
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      user_id: userId,
      platform: 'Android',
      os_version: '14',
      app_version: '1.0.0',
      locale: 'en_US',
      device_type: 'phone',
    });
    if (result.ok) {
      console.log('   ✓ PASSED (status: ' + result.status + ')');
      passed++;
    } else {
      console.log('   ✗ FAILED (status: ' + result.status + ')');
      failed++;
    }
  } catch (err) {
    console.log('   ✗ FAILED (error: ' + err + ')');
    failed++;
  }

  // Test 3: Event with screen
  console.log('Test 3: Event with screen');
  try {
    const result = await sendEvent({
      event_name: 'rn_sdk_test_with_screen',
      timestamp: new Date().toISOString(),
      session_id: sessionId,
      user_id: userId,
      screen: 'HomeScreen',
      platform: 'iOS',
      os_version: '17.0',
      app_version: '1.0.0',
      locale: 'en_US',
      device_type: 'tablet',
    });
    if (result.ok) {
      console.log('   ✓ PASSED (status: ' + result.status + ')');
      passed++;
    } else {
      console.log('   ✗ FAILED (status: ' + result.status + ')');
      failed++;
    }
  } catch (err) {
    console.log('   ✗ FAILED (error: ' + err + ')');
    failed++;
  }

  // Test 4: Multiple events (batch simulation)
  console.log('Test 4: Multiple events (batch simulation)');
  try {
    const events = [
      'rn_sdk_batch_event_1',
      'rn_sdk_batch_event_2',
      'rn_sdk_batch_event_3',
      'rn_sdk_batch_event_4',
      'rn_sdk_batch_event_5',
    ];
    
    let allPassed = true;
    for (const eventName of events) {
      const result = await sendEvent({
        event_name: eventName,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        user_id: userId,
        platform: 'iOS',
        os_version: '17.0',
        app_version: '1.0.0',
        locale: 'en_US',
        device_type: 'phone',
      });
      if (!result.ok) {
        allPassed = false;
        break;
      }
    }
    
    if (allPassed) {
      console.log('   ✓ PASSED (5 events sent)');
      passed++;
    } else {
      console.log('   ✗ FAILED');
      failed++;
    }
  } catch (err) {
    console.log('   ✗ FAILED (error: ' + err + ')');
    failed++;
  }

  // Test 5: Invalid API key
  console.log('Test 5: Invalid API key returns 401');
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': 'invalid-api-key',
      },
      body: JSON.stringify({
        event_name: 'should_fail',
        timestamp: new Date().toISOString(),
        session_id: sessionId,
        platform: 'iOS',
        os_version: '17.0',
        app_version: '1.0.0',
        locale: 'en_US',
        device_type: 'phone',
      }),
    });
    
    if (response.status === 401) {
      console.log('   ✓ PASSED (got expected 401)');
      passed++;
    } else {
      console.log('   ✗ FAILED (expected 401, got ' + response.status + ')');
      failed++;
    }
  } catch (err) {
    console.log('   ✗ FAILED (error: ' + err + ')');
    failed++;
  }

  // Summary
  console.log('');
  console.log('='.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  
  // Expected events in dashboard:
  console.log('');
  console.log('📊 DASHBOARD VERIFICATION:');
  console.log('   Check your Respectlytics dashboard for these events:');
  console.log('   - rn_sdk_test_anonymous (1 event)');
  console.log('   - rn_sdk_test_identified (1 event)');
  console.log('   - rn_sdk_test_with_screen (1 event, screen: HomeScreen)');
  console.log('   - rn_sdk_batch_event_1 through rn_sdk_batch_event_5 (5 events)');
  console.log('');
  console.log('   Total expected: 8 events');
  console.log('   Session ID: ' + sessionId);
  console.log('   User ID: ' + userId);
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
