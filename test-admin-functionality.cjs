#!/usr/bin/env node

// Comprehensive Chatroom Admin Functionality Test Script
const http = require('http');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000';
const COOKIES_FILE = '/tmp/test_cookies.txt';

// Test configuration
const TEST_CONFIG = {
  chatrooms: {
    adminTest: 14, // Aaron is admin
    memberTest: 15, // Aaron is admin 
  },
  users: {
    admin: { id: 2, email: 'aaron_marc2004@yahoo.com', password: '11111111', username: 'nearbytrav' },
    member1: { id: 1, email: 'admin@thenearbytraveler.com', password: '11111111', username: 'nearbytravlr' },
    member2: { id: 51, email: 'aarontest@thenearbytraveler.com', password: '11111111', username: 'testingaaron' }
  }
};

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const logMessage = `${status}: ${testName}${message ? ' - ' + message : ''}`;
  console.log(logMessage);
  
  testResults.tests.push({
    test: testName,
    passed,
    message
  });
  
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
}

// Test functions
async function testLogin(userType = 'admin') {
  console.log(`\n🔐 Testing Login for ${userType}...`);
  
  const user = TEST_CONFIG.users[userType];
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  try {
    const response = await makeRequest(options, {
      email: user.email,
      password: user.password
    });
    
    const loginSuccess = response.statusCode === 200 && response.data.ok === true;
    logTest(`Login as ${userType}`, loginSuccess, 
      loginSuccess ? `User ID: ${response.data.user?.id}` : `Status: ${response.statusCode}`);
    
    // Store session cookie for future requests
    if (loginSuccess && response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie']
        .map(cookie => cookie.split(';')[0])
        .join('; ');
      fs.writeFileSync(COOKIES_FILE, cookies);
    }
    
    return loginSuccess;
  } catch (error) {
    logTest(`Login as ${userType}`, false, error.message);
    return false;
  }
}

async function testGetMembers(chatroomId) {
  console.log(`\n👥 Testing Get Members for Chatroom ${chatroomId}...`);
  
  const cookies = fs.existsSync(COOKIES_FILE) ? fs.readFileSync(COOKIES_FILE, 'utf8') : '';
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/chatrooms/${chatroomId}/members`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    const success = response.statusCode === 200 && Array.isArray(response.data);
    logTest(`Get members for chatroom ${chatroomId}`, success, 
      success ? `Found ${response.data.length} members` : `Status: ${response.statusCode}, Data: ${JSON.stringify(response.data)}`);
    
    if (success) {
      // Test member data structure
      const members = response.data;
      console.log(`\n📋 Member Analysis for Chatroom ${chatroomId}:`);
      for (const member of members) {
        const hasRequiredFields = member.userId && member.name && member.role;
        console.log(`   - ${member.name} (@${member.username || 'N/A'}) - Role: ${member.role} - ID: ${member.userId}`);
        logTest(`Member data structure for user ${member.userId}`, hasRequiredFields,
          hasRequiredFields ? `Role: ${member.role}` : 'Missing required fields');
      }
      
      return { success: true, members };
    }
    
    return { success: false, members: [] };
  } catch (error) {
    logTest(`Get members for chatroom ${chatroomId}`, false, error.message);
    return { success: false, members: [] };
  }
}

async function testAdminAction(action, chatroomId, targetUserId, expectedStatus = 200) {
  console.log(`\n⚡ Testing Admin Action: ${action} on user ${targetUserId}...`);
  
  const cookies = fs.existsSync(COOKIES_FILE) ? fs.readFileSync(COOKIES_FILE, 'utf8') : '';
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/chatrooms/${chatroomId}/admin/${action}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    }
  };
  
  const postData = action === 'transfer' 
    ? { newOwnerId: targetUserId }
    : { targetUserId: targetUserId };
  
  try {
    const response = await makeRequest(options, postData);
    
    const success = response.statusCode === expectedStatus;
    logTest(`Admin action: ${action}`, success, 
      `Status: ${response.statusCode}, Expected: ${expectedStatus}${response.data.message ? ', Message: ' + response.data.message : ''}`);
    
    return { success, response };
  } catch (error) {
    logTest(`Admin action: ${action}`, false, error.message);
    return { success: false, response: null };
  }
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting Comprehensive Chatroom Admin Functionality Tests\n');
  console.log('=' .repeat(80));
  
  try {
    // Test 1: Authentication Tests
    console.log('\n📋 SECTION 1: AUTHENTICATION TESTS');
    console.log('-'.repeat(50));
    
    const loginSuccess = await testLogin('admin');
    
    if (!loginSuccess) {
      console.log('❌ Login failed - cannot continue with other tests');
      return;
    }
    
    // Test 2: Basic Functionality Tests
    console.log('\n📋 SECTION 2: BASIC FUNCTIONALITY TESTS');
    console.log('-'.repeat(50));
    
    const { success: getMembersSuccess, members } = await testGetMembers(TEST_CONFIG.chatrooms.adminTest);
    await testGetMembers(TEST_CONFIG.chatrooms.memberTest);
    
    if (getMembersSuccess && members.length > 0) {
      // Find different role members for testing
      const regularMembers = members.filter(m => m.role === 'member');
      const adminMembers = members.filter(m => m.role === 'admin');
      const ownerMembers = members.filter(m => m.role === 'owner');
      
      console.log(`\n📊 Role Distribution:`);
      console.log(`   - Owners: ${ownerMembers.length}`);
      console.log(`   - Admins: ${adminMembers.length}`);
      console.log(`   - Members: ${regularMembers.length}`);
      
      // Test 3: Permission Matrix Tests
      console.log('\n📋 SECTION 3: PERMISSION MATRIX TESTS');
      console.log('-'.repeat(50));
      
      if (regularMembers.length > 0) {
        const testMember = regularMembers[0];
        console.log(`\nTesting admin actions on member: ${testMember.name}`);
        
        // Test promote action
        await testAdminAction('promote', TEST_CONFIG.chatrooms.adminTest, testMember.userId, 200);
        
        // Test demote action (should work now that user is admin)
        await testAdminAction('demote', TEST_CONFIG.chatrooms.adminTest, testMember.userId, 200);
        
        // Test remove action
        await testAdminAction('remove', TEST_CONFIG.chatrooms.adminTest, testMember.userId, 200);
      }
      
      // Test 4: Edge Cases and Error Handling
      console.log('\n📋 SECTION 4: EDGE CASES AND ERROR HANDLING');
      console.log('-'.repeat(50));
      
      // Test invalid chatroom ID
      await testGetMembers(999999);
      
      // Test invalid user ID for admin actions
      await testAdminAction('promote', TEST_CONFIG.chatrooms.adminTest, 999999, 400);
      
      // Test self-action protection (should fail)
      const currentUserId = TEST_CONFIG.users.admin.id;
      await testAdminAction('remove', TEST_CONFIG.chatrooms.adminTest, currentUserId, 403);
    }
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('=' .repeat(80));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => console.log(`   - ${t.test}: ${t.message}`));
    }
    
    console.log('\n🎉 Testing complete!');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Execute tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults };