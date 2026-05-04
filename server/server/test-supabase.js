#!/usr/bin/env node
/**
 * Supabase Integration Test
 * Tests all major API endpoints to verify migration
 */

const { supabase } = require('./config/supabase');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`)
};

async function testConnection() {
  log.info('Testing Supabase connection...');
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('count');
    
    if (error) throw error;
    log.success(`Connected! Found ${data[0].count} apartments`);
    return true;
  } catch (error) {
    log.error(`Connection failed: ${error.message}`);
    return false;
  }
}

async function testApartmentsList() {
  log.info('Testing apartments list...');
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('*')
      .eq('active', true);
    
    if (error) throw error;
    log.success(`Retrieved ${data.length} active apartments`);
    return data;
  } catch (error) {
    log.error(`Failed to list apartments: ${error.message}`);
    return null;
  }
}

async function testAvailabilityCheck() {
  log.info('Testing availability check...');
  try {
    const { data, error } = await supabase
      .rpc('check_apartment_availability', {
        p_apartment_id: 'apt-1',
        p_check_in: '2026-06-01',
        p_check_out: '2026-06-05'
      });
    
    if (error) throw error;
    log.success(`Availability check: ${data ? 'Available' : 'Not available'}`);
    return data;
  } catch (error) {
    log.error(`Availability check failed: ${error.message}`);
    return null;
  }
}

async function testBookedDates() {
  log.info('Testing booked dates function...');
  try {
    const { data, error } = await supabase
      .rpc('get_booked_dates', {
        p_apartment_id: 'apt-1'
      });
    
    if (error) throw error;
    log.success(`Retrieved ${data.length} booked date ranges`);
    return data;
  } catch (error) {
    log.error(`Booked dates failed: ${error.message}`);
    return null;
  }
}

async function testBookingCreation() {
  log.info('Testing booking creation...');
  try {
    const bookingRef = `TEST-${Date.now()}`;
    const guestToken = `test-token-${Date.now()}`;
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        apartment_id: 'apt-1',
        guest_name: 'Test User',
        guest_phone: '+2349012345678',
        guest_email: 'test@example.com',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        guests: 2,
        total_price: 140000,
        status: 'pending',
        guest_token: guestToken
      })
      .select()
      .single();
    
    if (error) throw error;
    log.success(`Created test booking: ${data.booking_ref}`);
    
    // Clean up test booking
    await supabase
      .from('bookings')
      .delete()
      .eq('booking_ref', bookingRef);
    
    log.success('Cleaned up test booking');
    return data;
  } catch (error) {
    log.error(`Booking creation failed: ${error.message}`);
    return null;
  }
}

async function testBookingRetrieval() {
  log.info('Testing booking retrieval...');
  try {
    // Create a test booking first
    const bookingRef = `TEST-${Date.now()}`;
    const guestToken = `test-token-${Date.now()}`;
    
    const { data: created } = await supabase
      .from('bookings')
      .insert({
        booking_ref: bookingRef,
        apartment_id: 'apt-1',
        guest_name: 'Test User',
        guest_phone: '+2349012345678',
        guest_email: 'test@example.com',
        check_in: '2026-08-01',
        check_out: '2026-08-05',
        guests: 2,
        total_price: 140000,
        status: 'pending',
        guest_token: guestToken
      })
      .select()
      .single();
    
    // Retrieve it
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        apartments (*)
      `)
      .eq('booking_ref', bookingRef)
      .single();
    
    if (error) throw error;
    log.success(`Retrieved booking with apartment details`);
    
    // Clean up
    await supabase
      .from('bookings')
      .delete()
      .eq('booking_ref', bookingRef);
    
    log.success('Cleaned up test booking');
    return data;
  } catch (error) {
    log.error(`Booking retrieval failed: ${error.message}`);
    return null;
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 Supabase Integration Test Suite');
  console.log('='.repeat(50) + '\n');
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Test 1: Connection
  if (await testConnection()) {
    results.passed++;
  } else {
    results.failed++;
    log.error('Connection test failed - stopping tests');
    return results;
  }
  
  console.log('');
  
  // Test 2: Apartments List
  if (await testApartmentsList()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log('');
  
  // Test 3: Availability Check
  if (await testAvailabilityCheck()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log('');
  
  // Test 4: Booked Dates
  if (await testBookedDates()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log('');
  
  // Test 5: Booking Creation
  if (await testBookingCreation()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log('');
  
  // Test 6: Booking Retrieval
  if (await testBookingRetrieval()) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${results.passed} passed, ${results.failed} failed`);
  console.log('='.repeat(50) + '\n');
  
  if (results.failed === 0) {
    log.success('All tests passed! 🎉');
    log.info('Your Supabase integration is working correctly.');
  } else {
    log.error(`${results.failed} test(s) failed`);
    log.warn('Please check the errors above and fix any issues.');
  }
  
  return results;
}

// Run tests
runAllTests()
  .then(results => {
    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    log.error(`Test suite crashed: ${error.message}`);
    process.exit(1);
  });
