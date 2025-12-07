// Utility to populate test listings data
export const populateTestListings = () => {
  const testListings = [
    {
      id: 'listing-1',
      title: '2015 Honda Civic EX - Great Condition, Must Sell Quick!',
      price: 8500,
      description: 'Well-maintained Honda Civic with clean title. Recent oil change and new tires. Great fuel economy. Must sell due to relocation.',
      images: [
        '/pic1.jpg',
        '/pic2.jpg',
        '/pic3.jpg'
      ],
      mileage: '125,000',
      titleStatus: 'Clean',
      postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'active',
      platforms: ['facebook_marketplace', 'craigslist'],
      messages: 3,
      clicks: 47,
      make: 'Honda',
      model: 'Civic',
      year: '2015',
      city: 'Austin',
      zipCode: '78701',
      finalDescription: '🚙 2015 Honda Civic EX\n🏁 Mileage: 125,000 miles\n📄 Title: Clean\n📍 Location: Austin, TX\n\n💡 Details:\n• Well-maintained with clean title\n• Recent oil change and new tires\n• Great fuel economy\n• Must sell due to relocation\n\n🔧 Features & Equipment:\n• Bluetooth connectivity\n• Backup camera\n• Cruise control\n\n🔑 Perfect daily driver with excellent reliability!\n\n📱 Message me to schedule a test drive or ask questions!'
    },
    {
      id: 'listing-2',
      title: '2018 Toyota Camry LE - One Owner, Low Miles',
      price: 18500,
      description: 'Single owner Toyota Camry with full service history. Excellent condition, no accidents. Selling to upgrade to SUV.',
      images: [
        '/pic2.jpg',
        '/pic1.jpg',
        '/pic4.jpg'
      ],
      mileage: '45,000',
      titleStatus: 'Clean',
      postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      status: 'active',
      platforms: ['facebook_marketplace', 'offerup', 'autotrader'],
      messages: 7,
      clicks: 89,
      make: 'Toyota',
      model: 'Camry',
      year: '2018',
      city: 'Dallas',
      zipCode: '75201',
      finalDescription: '🚙 2018 Toyota Camry LE\n🏁 Mileage: 45,000 miles\n📄 Title: Clean\n📍 Location: Dallas, TX\n\n💡 Details:\n• Single owner with full service history\n• Excellent condition, no accidents\n• Selling to upgrade to SUV\n\n🔧 Features & Equipment:\n• Apple CarPlay\n• Toyota Safety Sense\n• Blind spot monitor\n• Backup camera\n\n🔑 Low mileage, excellent condition - perfect family car!\n\n📱 Message me to schedule a test drive or ask questions!'
    },
    {
      id: 'listing-3',
      title: '2012 Ford F-150 XLT - Work Truck, Runs Great',
      price: 12000,
      description: 'Reliable work truck with some cosmetic wear. Engine and transmission in great shape. Perfect for contractor or daily driver.',
      images: [
        '/pic3.jpg',
        '/pic1.jpg'
      ],
      mileage: '180,000',
      titleStatus: 'Clean',
      postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'active',
      platforms: ['craigslist', 'facebook_marketplace'],
      messages: 2,
      clicks: 23,
      make: 'Ford',
      model: 'F-150',
      year: '2012',
      city: 'Houston',
      zipCode: '77001',
      finalDescription: '🚙 2012 Ford F-150 XLT\n🏁 Mileage: 180,000 miles\n📄 Title: Clean\n📍 Location: Houston, TX\n\n💡 Details:\n• Reliable work truck with some cosmetic wear\n• Engine and transmission in great shape\n• Perfect for contractor or daily driver\n\n🔧 Features & Equipment:\n• 4WD capability\n• Tow package\n• Bed liner\n• Running boards\n\n🔑 Solid work truck that runs great!\n\n📱 Message me to schedule a test drive or ask questions!'
    },
    {
      id: 'listing-4',
      title: '2016 BMW 3 Series 328i - Luxury Sedan',
      price: 22000,
      description: 'Well-maintained BMW with premium package. Clean Carfax, regular maintenance. Selling due to job transfer.',
      images: [
        '/pic4.jpg',
        '/pic2.jpg',
        '/pic3.jpg',
        '/pic1.jpg'
      ],
      mileage: '75,000',
      titleStatus: 'Clean',
      postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      status: 'sold',
      platforms: ['facebook_marketplace', 'cars_com', 'cargurus'],
      messages: 12,
      clicks: 156,
      soldAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Sold 1 day ago
      soldFor: 21000,
      soldTo: 'John Smith',
      make: 'BMW',
      model: '3 Series',
      year: '2016',
      city: 'San Antonio',
      zipCode: '78201',
      finalDescription: '🚙 2016 BMW 3 Series 328i\n🏁 Mileage: 75,000 miles\n📄 Title: Clean\n📍 Location: San Antonio, TX\n\n💡 Details:\n• Well-maintained BMW with premium package\n• Clean Carfax, regular maintenance\n• Selling due to job transfer\n\n🔧 Features & Equipment:\n• Premium package\n• Navigation system\n• Leather seats\n• Sunroof\n• Heated seats\n\n🔑 Luxury and performance in one package!\n\n📱 Message me to schedule a test drive or ask questions!'
    }
  ];

  // Store in localStorage
  localStorage.setItem('testListings', JSON.stringify(testListings));
  
  return testListings;
};

// Function to add a new listing
export const addTestListing = (listing: any) => {
  const existingListings = JSON.parse(localStorage.getItem('testListings') || '[]');
  const newListing = {
    ...listing,
    id: `listing-${Date.now()}`,
    postedAt: new Date().toISOString(),
    status: 'active',
    messages: 0,
    clicks: 0
  };
  
  const updatedListings = [newListing, ...existingListings];
  localStorage.setItem('testListings', JSON.stringify(updatedListings));
  
  return newListing;
};
