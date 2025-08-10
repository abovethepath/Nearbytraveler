import { testAllFeeds, getCityFeeds, processRSSFeedForEvents, CITY_RSS_FEEDS } from './expanded-city-rss-feeds';

async function runFullTest() {
  console.log('🧪 COMPREHENSIVE RSS FEED TEST');
  console.log('='.repeat(50));
  
  // Test all feeds
  await testAllFeeds();
  
  console.log('\n📊 FEED SUMMARY');
  console.log('='.repeat(50));
  
  const citiesCount = new Set(CITY_RSS_FEEDS.map(f => f.city)).size;
  const totalFeeds = CITY_RSS_FEEDS.length;
  const activeFeeds = CITY_RSS_FEEDS.filter(f => f.isActive).length;
  
  console.log(`Total cities: ${citiesCount}`);
  console.log(`Total feeds: ${totalFeeds}`);
  console.log(`Active feeds: ${activeFeeds}`);
  
  console.log('\n🏙️ FEEDS BY CITY');
  console.log('='.repeat(50));
  
  const cities = [...new Set(CITY_RSS_FEEDS.map(f => f.city))];
  
  for (const city of cities) {
    const cityFeeds = getCityFeeds(city);
    console.log(`\n${city}: ${cityFeeds.length} feeds`);
    
    for (const feed of cityFeeds) {
      const schedule = feed.publishDays && feed.publishTime 
        ? `${feed.publishDays.join(', ')} at ${feed.publishTime}`
        : 'No schedule';
      console.log(`  📰 ${feed.publication} (${feed.category}) - ${schedule}`);
    }
  }
  
  console.log('\n🧪 TEST EVENT PROCESSING');
  console.log('='.repeat(50));
  
  // Test one feed from each city
  const testFeeds = cities.map(city => getCityFeeds(city)[0]).filter(Boolean);
  
  for (const feed of testFeeds.slice(0, 3)) { // Test first 3 cities
    console.log(`\n📰 Testing event processing: ${feed.publication} (${feed.city})`);
    try {
      const eventsCreated = await processRSSFeedForEvents(feed);
      console.log(`✅ Would create ${eventsCreated} events`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

// Run if called directly
if (require.main === module) {
  runFullTest().catch(console.error);
}

export { runFullTest };