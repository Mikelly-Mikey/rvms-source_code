const { sequelize, User, Vehicle, Customer, Booking, Payment, Maintenance, MaintenanceSchedule, MaintenanceAlert, Category, Supplier, InventoryItem, MpesaTransaction } = require('./models');

async function seed() {
  try {
    // Force sync – drops and recreates all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized (tables recreated)');

    // ---- 1. Users ----
    const admin = await User.create({
      username: 'admin',
      email: 'admin@rvms.com',
      password: 'admin123',
      first_name: 'Juma',
      last_name: 'Micheal',
      role: 'admin',
      is_staff: true,
      is_superuser: true,
      is_active: true
    });

    const fleetSup = await User.create({
      username: 'fleet',
      email: 'fleet@rvms.com',
      password: 'fleet123',
      first_name: 'Peter',
      last_name: 'Mbugua',
      role: 'fleet_supervisor',
      is_staff: true,
      is_active: true
    });

    const bookingOfficer = await User.create({
      username: 'reception',
      email: 'reception@rvms.com',
      password: 'reception123',
      first_name: 'Faith',
      last_name: 'Achieng',
      role: 'receptionist',
      is_staff: true,
      is_active: true
    });

    const mechanic = await User.create({
      username: 'mechanic',
      email: 'mechanic@rvms.com',
      password: 'mechanic123',
      first_name: 'James',
      last_name: 'Otieno',
      role: 'mechanic',
      is_staff: true,
      is_active: true
    });

    // Customer users (can login to view own bookings)
    const customerUser1 = await User.create({
      username: 'mwangi',
      email: 'mwangi@email.com',
      password: 'customer123',
      first_name: 'David',
      last_name: 'Mwangi',
      phone: '+254712345678',
      license_number: 'DL112233',
      role: 'customer',
      is_active: true
    });

    const customerUser2 = await User.create({
      username: 'shiks100',
      email: 'shikuG@email.com',
      password: 'customer123',
      first_name: 'Grace',
      last_name: 'Wanjiku',
      phone: '+254789012345',
      license_number: 'DL445566',
      role: 'customer',
      is_active: true
    });

    console.log('✅ Users created');

    // ---- 2. Vehicles (fleet of 20+) ----
    const v1 = await Vehicle.create({ registration: 'KDE 193A', make: 'Mazda', model: 'Axela', year: 2022, color: 'Red', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2500, weekly_rate: 15000, status: 'available', current_mileage: 78000, image_url: '/images/mazda-axela2.jpeg' });
    const v2 = await Vehicle.create({ registration: 'KBT 027F', make: 'Mazda', model: 'Axela', year: 2016, color: 'Dark Tan', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2800, weekly_rate: 16800, status: 'available', current_milage: 34590, image_url:'/images/mazda-axela3.jpeg'});
    const v3 = await Vehicle.create({ registration: 'KCB 234B', make: 'Nissan', model: 'Note', year: 2019, color: 'Silver', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3000, weekly_rate: 18000, status: 'on-rent', current_mileage: 56000, image_url: '/images/nissan-note.jpeg' });
    const v4 = await Vehicle.create({ registration: 'KCC 345C', make: 'Toyota', model: 'Rav4', year: 2020, color: 'Black', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'suv', daily_rate: 5000, weekly_rate: 30000, status: 'available', current_mileage: 42000, image_url: '/images/toyota-RAV4.jpeg' });
    const v5 = await Vehicle.create({ registration: 'KCD 456D', make: 'Mitsubishi', model: 'Outlander', year: 2019, color: 'Brown', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 7, category: 'suv', daily_rate: 5500, weekly_rate: 33000, status: 'maintenance', current_mileage: 95000, image_url: '/images/mitsubishi-outlander_SEL.jpeg' });
    const v6 = await Vehicle.create({ registration: 'KCE 567E', make: 'Mercedes', model: 'C200', year: 2021, color: 'Grey', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'luxury', daily_rate: 12000, weekly_rate: 72000, status: 'available', current_mileage: 25000, image_url: '/images/benz_c-class.jpeg' });
    const v7 = await Vehicle.create({ registration: 'KCW 678F', make: 'Toyota', model: 'Hilux', year: 2019, color: 'Silver', fuel_type: 'petrol', transmission: 'manual', seating_capacity: 5, category: 'economy', daily_rate: 2200, weekly_rate: 13000, status: 'available', current_mileage: 120000, image_url: '/images/toyota-hilux.jpeg' });
    const v8 = await Vehicle.create({ registration: 'KCG 789G', make: 'Subaru', model: 'Forester', year: 2020, color: 'Black', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'suv', daily_rate: 6000, weekly_rate: 36000, status: 'reserved', current_mileage: 61000, image_url: '/images/subaru-forester3.jpeg' });
    const v9 = await Vehicle.create({ registration: 'KCH 890H', make: 'Honda', model: 'Fit', year: 2018, color: 'Orange', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2800, weekly_rate: 16800, status: 'on-rent', current_mileage: 83000, image_url: '/images/honda-fit2.jpeg' });
    const v10 = await Vehicle.create({ registration: 'KCJ 901I', make: 'Toyota', model: 'Hilux', year: 2021, color: 'White', fuel_type: 'diesel', transmission: 'manual', seating_capacity: 5, category: 'suv', daily_rate: 7000, weekly_rate: 42000, status: 'available', current_mileage: 30000, image_url: '/images/toyota-hilux2.jpeg' });
    const v11 = await Vehicle.create({ registration: 'KCK 012J', make: 'Nissan', model: 'X-Trail', year: 2020, color: 'Black', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 7, category: 'suv', daily_rate: 6500, weekly_rate: 39000, status: 'available', current_mileage: 45000, image_url: '/images/nissan-xtrail.jpeg' });
    const v12 = await Vehicle.create({ registration: 'KCL 141K', make: 'Toyota', model: 'Probox', year: 2016, color: 'White', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2000, weekly_rate: 12000, status: 'available', current_mileage: 140000, image_url: '/images/probox(toyota).jpeg' });
    const v13 = await Vehicle.create({ registration: 'KCA 284N', make: 'Toyota', model: 'Probox', year: 2019, color: 'Gray', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2000, weekly_rate: 12000, status: 'available', current_mileage: 140000, image_url: '/images/toyota-probox.jpeg' });
    const v14 = await Vehicle.create({ registration: 'KCM 292L', make: 'Mazda', model: 'Demio', year: 2019, color: 'White', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3200, weekly_rate: 19200, status: 'available', current_mileage: 52000, image_url: '/images/mazda-demio.jpeg' });
    const v15 = await Vehicle.create({ registration: 'KCN 373M', make: 'Toyota', model: 'Fielder', year: 2018, color: 'Grey', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3500, weekly_rate: 21000, status: 'available', current_mileage: 72000, image_url: '/images/toyota-fielder1.jpeg' });
    const v16 = await Vehicle.create({ registration: 'KDG 106M', make: 'Toyota', model: 'Fielder', year: 2024, color:'Black', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3500, weekly_rate: 21000, status: 'on-rent', current_milage: 80085, image_url: '/images/toyota-fielder3.jpeg'})
    const v17 = await Vehicle.create({ registration: 'KCO 404N', make: 'Isuzu', model: 'D-Max', year: 2022, color: 'White', fuel_type: 'diesel', transmission: 'manual', seating_capacity: 5, category: 'economy', daily_rate: 8000, weekly_rate: 48000, status: 'available', current_mileage: 15000, image_url: '/images/d-max.jpeg' });
    const v18 = await Vehicle.create({ registration: 'KCP 545T', make: 'BMW', model: 'X3', year: 2021, color: 'Black', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'luxury', daily_rate: 15000, weekly_rate: 90000, status: 'available', current_mileage: 18000, image_url: '/images/bmw_x3.jpeg' });
    const v19 = await Vehicle.create({ registration: 'KCQ 616P', make: 'Suzuki', model: 'Swift', year: 2020, color: 'Red-Orange', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2300, weekly_rate: 13800, status: 'available', current_mileage: 35000, image_url: '/images/suzuki_swift2.jpeg' });
    const v20 = await Vehicle.create({ registration: 'KCR 770Q', make: 'Volkswagen', model: 'Polo', year: 2019, color: 'Navy-Blue', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 2800, weekly_rate: 16800, status: 'available', current_mileage: 48000, image_url: '/images/vw-polo1.jpeg' });
    const v21 = await Vehicle.create({ registration: 'KCS 588R', make: 'Hyundai', model: 'Tucson', year: 2022, color: 'Blue', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'suv', daily_rate: 5500, weekly_rate: 33000, status: 'on-rent', current_mileage: 12000, image_url: '/images/hyundai_tucson1.jpeg' });
    const v22 = await Vehicle.create({ registration: 'KCT 929S', make: 'Toyota', model: 'Land Cruiser', year: 2021, color: 'White', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 7, category: 'luxury', daily_rate: 18000, weekly_rate: 108000, status: 'available', current_mileage: 22000, image_url: '/images/toyota-land_cruiser_prado.jpeg' });
    const v23 = await Vehicle.create({ registration: 'KCU 101T', make: 'Mitsubishi', model: 'Outlander Phev LS', year: 2020, color: 'Black', fuel_type: 'diesel', transmission: 'manual', seating_capacity: 5, category: 'suv', daily_rate: 9000, weekly_rate: 54000, status: 'maintenance', current_mileage: 65000, image_url: '/images/MITSUBISHI-OUTLANDER_phev_ls.jpeg' });
    const v24 = await Vehicle.create({ registration: 'KDA 947K', make: 'BMW', model: 'AMG', year: 2025, color: 'Black', fuel_type: 'petrol', transmission: 'automatic', seating_capacity: 5, category: 'luxury', daily_rate: 10000, weekly_rate: 60000, status: 'available', current_milage: 10936, image_url:'/images/bmw.jpeg' });
    const v25 = await Vehicle.create({ registration: 'KCZ 792S', make: 'BMW', model: 'X3', year: 2024, color: 'Red', fuel_type: 'diesel', transmission: 'automatic', seating_capacity: 5, category: 'luxury', daily_rate: 15000, weekly_rate: 90000, status: 'available', current_mileage: 18030, image_url: '/images/bmw_x3-1.jpeg' });
    const v26 = await Vehicle.create({ registration: 'KCH 604L', make: 'Toyota', model: 'Land Cruiser', year: 2022, color: 'Slate', fuel_type: 'diesel', transmission: 'manual', seating_capacity: 7, category: 'luxury', daily_rate: 18000, weekly_rate: 108000, status: 'available', current_mileage: 22042, image_url: '/images/landcruiser- prado( toyota).jpeg' });

    console.log('✅ Vehicles created');

    // ---- 3. Customers ----
    const c1 = await Customer.create({ first_name: 'David', last_name: 'Mwangi', phone: '+254712345678', email: 'mwangi@email.com', id_type: 'national_id', id_number: '12345678', license_number: 'DL112233', license_expiry: '2026-12-31', registered_by: bookingOfficer.id });
    const c2 = await Customer.create({ first_name: 'Amina', last_name: 'Hassan', phone: '+254723456789', email: 'amina@email.com', id_type: 'passport', id_number: 'P98765', license_number: 'DL987614', license_expiry: '2026-08-15', registered_by: bookingOfficer.id });
    const c3 = await Customer.create({ first_name: 'Kevin', last_name: 'Muthoni', phone: '+254734567890', email: 'kevin@email.com', id_type: 'national_id', id_number: '11223344', license_number: 'DL543205', license_expiry: '2027-03-10', registered_by: bookingOfficer.id });
    const c4 = await Customer.create({ first_name: 'Sarah', last_name: 'Njeri', phone: '+254745678901', email: 'sarah@email.com', id_type: 'national_id', id_number: '55667788', license_number: 'DL876529', license_expiry: '2026-06-20', registered_by: bookingOfficer.id });
    const c5 = await Customer.create({ first_name: 'Brian', last_name: 'Kiprono', phone: '+254756789012', email: 'brian@email.com', id_type: 'national_id', id_number: '99001122', license_number: 'DL345661', license_expiry: '2026-11-05', registered_by: bookingOfficer.id });
    const c6 = await Customer.create({ first_name: 'Lilian', last_name: 'Akinyi', phone: '+254767890123', email: 'lilian@email.com', id_type: 'national_id', id_number: '33445566', license_number: 'DL789020', license_expiry: '2027-01-12', registered_by: bookingOfficer.id });
    const c7 = await Customer.create({ first_name: 'Tom', last_name: 'Odhiambo', phone: '+254778901234', email: 'tom@email.com', id_type: 'passport', id_number: 'P11223', license_number: 'DL012395', license_expiry: '2026-09-30', registered_by: bookingOfficer.id });
    const c8 = await Customer.create({ first_name: 'Grace', last_name: 'Wanjiku', phone: '+254789012345', email: 'shikuG@email.com', id_type: 'national_id', id_number: '77889900', license_number: 'DL445566', license_expiry: '2027-04-18', registered_by: bookingOfficer.id });
    const c9 = await Customer.create({ first_name: 'Patrick', last_name: 'Mutua', phone: '+254701234567', email: 'patrick@email.com', id_type: 'national_id', id_number: '22334455', license_number: 'DL890165', license_expiry: '2027-07-22', registered_by: bookingOfficer.id });
    const c10 = await Customer.create({ first_name: 'Joyce', last_name: 'Chebet', phone: '+254712345000', email: 'joyce@email.com', id_type: 'national_id', id_number: '66778899', license_number: 'DL234591', license_expiry: '2027-02-14', registered_by: bookingOfficer.id });

    console.log('✅ Customers created');

    // ---- 4. Bookings (historical and current) ----
    // We'll create bookings that avoid overlapping for any single vehicle.
    // Use different vehicles and dates.
    const today = new Date();
    const formatDate = (d) => d.toISOString().slice(0,10);

    // Helper to create date offset
    const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate()+days); return d; };
    const subDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate()-days); return d; };

    // Past bookings (completed or cancelled)
    const b1 = await Booking.create({
      customer_id: c1.customer_id, vehicle_id: v1.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 14), end_date: subDays(today, 10), pickup_time: '10:00', return_time: '10:00',
      status: 'completed', total_amount: 12500, deposit_paid: 5000, balance_due: 7500,
      actual_pickup_time: subDays(today, 14), actual_return_time: subDays(today, 10),
      check_out_mileage: 77000, check_in_mileage: 77800, check_out_fuel: 80, check_in_fuel: 40
    });

    const b2 = await Booking.create({
      customer_id: c2.customer_id, vehicle_id: v3.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 7), end_date: subDays(today, 4), pickup_time: '09:00', return_time: '09:00',
      status: 'completed', total_amount: 20000, deposit_paid: 10000, balance_due: 10000,
      actual_pickup_time: subDays(today, 7), actual_return_time: subDays(today, 4),
      check_out_mileage: 41000, check_in_mileage: 41600, check_out_fuel: 100, check_in_fuel: 70
    });

    const b3 = await Booking.create({
      customer_id: c3.customer_id, vehicle_id: v5.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 3), end_date: today, pickup_time: '12:00', return_time: '12:00',
      status: 'checked-out', total_amount: 36000, deposit_paid: 20000, balance_due: 16000,
      actual_pickup_time: subDays(today, 3), check_out_mileage: 25000, check_out_fuel: 90
    });

    // Currently on-rent ongoing (started yesterday, returns tomorrow)
    const b4 = await Booking.create({
      customer_id: c4.customer_id, vehicle_id: v2.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 1), end_date: addDays(today, 1), pickup_time: '08:00', return_time: '08:00',
      status: 'checked-out', total_amount: 9000, deposit_paid: 5000, balance_due: 4000,
      actual_pickup_time: subDays(today, 1), check_out_mileage: 56000, check_out_fuel: 75
    });

    // Another on-rent
    const b5 = await Booking.create({
      customer_id: c5.customer_id, vehicle_id: v8.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 2), end_date: addDays(today, 2), pickup_time: '10:00', return_time: '10:00',
      status: 'checked-out', total_amount: 14000, deposit_paid: 7000, balance_due: 7000,
      actual_pickup_time: subDays(today, 2), check_out_mileage: 83000, check_out_fuel: 100
    });

    // Reserved for future
    const b6 = await Booking.create({
      customer_id: c6.customer_id, vehicle_id: v7.vehicle_id, created_by: bookingOfficer.id,
      start_date: addDays(today, 3), end_date: addDays(today, 5), pickup_time: '14:00', return_time: '14:00',
      status: 'confirmed', total_amount: 18000, deposit_paid: 0, balance_due: 18000
    });

    // Future booking
    const b7 = await Booking.create({
      customer_id: c7.customer_id, vehicle_id: v9.vehicle_id, created_by: bookingOfficer.id,
      start_date: addDays(today, 7), end_date: addDays(today, 10), pickup_time: '09:00', return_time: '09:00',
      status: 'confirmed', total_amount: 28000, deposit_paid: 10000, balance_due: 18000
    });

    // Another completed
    const b8 = await Booking.create({
      customer_id: c8.customer_id, vehicle_id: v6.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 20), end_date: subDays(today, 15), pickup_time: '11:00', return_time: '11:00',
      status: 'completed', total_amount: 11000, deposit_paid: 5000, balance_due: 6000,
      actual_pickup_time: subDays(today, 20), actual_return_time: subDays(today, 15),
      check_out_mileage: 119000, check_in_mileage: 119700, check_out_fuel: 70, check_in_fuel: 30
    });

    // Cancelled booking
    const b9 = await Booking.create({
      customer_id: c9.customer_id, vehicle_id: v11.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 5), end_date: subDays(today, 3), pickup_time: '10:00', return_time: '10:00',
      status: 'cancelled', total_amount: 6000, cancellation_reason: 'Customer changed travel plans'
    });

    // More bookings to have at least 15 records
    const b10 = await Booking.create({ customer_id: c10.customer_id, vehicle_id: v12.vehicle_id, created_by: bookingOfficer.id, start_date: subDays(today, 10), end_date: subDays(today, 8), pickup_time: '08:00', return_time: '08:00', status: 'completed', total_amount: 9600, deposit_paid: 4000, balance_due: 5600, actual_pickup_time: subDays(today,10), actual_return_time: subDays(today,8), check_out_mileage: 51000, check_in_mileage: 51600 });
    const b11 = await Booking.create({ customer_id: c1.customer_id, vehicle_id: v13.vehicle_id, created_by: bookingOfficer.id, start_date: subDays(today, 6), end_date: subDays(today, 4), pickup_time: '09:00', return_time: '09:00', status: 'completed', total_amount: 10500, deposit_paid: 0, balance_due: 10500, actual_pickup_time: subDays(today,6), actual_return_time: subDays(today,4), check_out_mileage: 72000, check_in_mileage: 72800 });
    const b12 = await Booking.create({ customer_id: c2.customer_id, vehicle_id: v14.vehicle_id, created_by: bookingOfficer.id, start_date: subDays(today, 2), end_date: addDays(today, 1), pickup_time: '10:00', return_time: '10:00', status: 'checked-out', total_amount: 24000, deposit_paid: 12000, balance_due: 12000, actual_pickup_time: subDays(today,2), check_out_mileage: 15000 });
    const b13 = await Booking.create({ customer_id: c3.customer_id, vehicle_id: v15.vehicle_id, created_by: bookingOfficer.id, start_date: addDays(today, 1), end_date: addDays(today, 3), pickup_time: '12:00', return_time: '12:00', status: 'confirmed', total_amount: 45000 });
    const b14 = await Booking.create({ customer_id: c4.customer_id, vehicle_id: v16.vehicle_id, created_by: bookingOfficer.id, start_date: subDays(today, 15), end_date: subDays(today, 12), pickup_time: '14:00', return_time: '14:00', status: 'completed', total_amount: 9200, deposit_paid: 5000, balance_due: 4200, actual_pickup_time: subDays(today,15), actual_return_time: subDays(today,12) });
    const b15 = await Booking.create({ customer_id: c5.customer_id, vehicle_id: v17.vehicle_id, created_by: bookingOfficer.id, start_date: addDays(today, 10), end_date: addDays(today, 12), pickup_time: '09:00', return_time: '09:00', status: 'confirmed', total_amount: 8400 });

    console.log('✅ Bookings created');

    // ---- 5. Payments ----
    // For each completed/checked-out booking, add corresponding payments
    const payment1 = await Payment.create({ booking_id: b1.booking_id, amount: 5000, method: 'mpesa', reference: 'MPS123456', status: 'completed', recorded_by: bookingOfficer.id });
    const payment2 = await Payment.create({ booking_id: b1.booking_id, amount: 7500, method: 'cash', status: 'completed', recorded_by: bookingOfficer.id });

    const payment3 = await Payment.create({ booking_id: b2.booking_id, amount: 10000, method: 'mpesa', reference: 'MPS654321', status: 'completed', recorded_by: bookingOfficer.id });
    const payment4 = await Payment.create({ booking_id: b2.booking_id, amount: 10000, method: 'bank_transfer', reference: 'BANK001', status: 'completed', recorded_by: bookingOfficer.id });

    const payment5 = await Payment.create({ booking_id: b3.booking_id, amount: 20000, method: 'mpesa', reference: 'MPS7890', status: 'completed', recorded_by: bookingOfficer.id });

    const payment6 = await Payment.create({ booking_id: b4.booking_id, amount: 5000, method: 'cash', status: 'completed', recorded_by: bookingOfficer.id });

    const payment7 = await Payment.create({ booking_id: b5.booking_id, amount: 7000, method: 'mpesa', reference: 'MPS1111', status: 'completed', recorded_by: bookingOfficer.id });

    const payment8 = await Payment.create({ booking_id: b8.booking_id, amount: 11000, method: 'mpesa', reference: 'MPS2222', status: 'completed', recorded_by: bookingOfficer.id });

    const payment9 = await Payment.create({ booking_id: b10.booking_id, amount: 9600, method: 'card', reference: 'CARD123', status: 'completed', recorded_by: bookingOfficer.id });
    const payment10 = await Payment.create({ booking_id: b11.booking_id, amount: 10500, method: 'mpesa', reference: 'MPS3333', status: 'completed', recorded_by: bookingOfficer.id });
    const payment11 = await Payment.create({ booking_id: b12.booking_id, amount: 12000, method: 'mpesa', reference: 'MPS4444', status: 'completed', recorded_by: bookingOfficer.id });
    const payment12 = await Payment.create({ booking_id: b14.booking_id, amount: 9200, method: 'cash', status: 'completed', recorded_by: bookingOfficer.id });

    console.log('✅ Payments created');

    // ---- 6. Maintenance Records ----
    const m1 = await Maintenance.create({
      vehicle_id: v4.vehicle_id, service_date: subDays(today, 30), mileage: 94000,
      service_type: 'full_service', description: 'Regular 100K service, changed oil, filters, brake pads',
      cost: 25000, provider: 'AutoXpress Nairobi', provider_contact: '+254700111222',
      next_service_mileage: 105000, next_service_date: addDays(today, 180),
      is_scheduled: true, completed_by: mechanic.id, notes: 'Recommend front tyre replacement soon'
    });
    const m2 = await Maintenance.create({
      vehicle_id: v20.vehicle_id, service_date: subDays(today, 5), mileage: 64500,
      service_type: 'brake', description: 'Replaced rear brake discs and pads', cost: 18000,
      provider: 'Brake Masters', provider_contact: '+254722333444',
      next_service_mileage: 72000, is_scheduled: false, completed_by: mechanic.id
    });
    const m3 = await Maintenance.create({
      vehicle_id: v1.vehicle_id, service_date: subDays(today, 60), mileage: 76000,
      service_type: 'oil_change', description: 'Oil and filter change', cost: 4000,
      provider: 'Speedy Lube', provider_contact: '+254733444555',
      next_service_mileage: 81000, next_service_date: addDays(today, 90),
      is_scheduled: true, completed_by: mechanic.id
    });

    console.log('✅ Maintenance records created');

    // ---- 7. Maintenance Alerts ----
    await MaintenanceAlert.create({
      vehicle_id: v4.vehicle_id, alert_type: 'overdue_service', message: 'Next service overdue (100k km due 5 days ago)',
      due_date: subDays(today, 5), is_read: false
    });
    await MaintenanceAlert.create({
      vehicle_id: v6.vehicle_id, alert_type: 'upcoming_service', message: 'Oil change due in 1000 km',
      due_date: addDays(today, 15), is_read: false
    });

    console.log('✅ Maintenance alerts created');

    // ---- 8. Inventory & Categories (simple) ----
    const supplier1 = await Supplier.create({ name: 'Auto Parts Ltd', contact_person: 'James Maina', email: 'james@autoparts.co.ke', phone: '+254711999888' });
    const cat1 = await Category.create({ name: 'Filters' });
    const cat2 = await Category.create({ name: 'Brake Parts' });
    const inv1 = await InventoryItem.create({ sku: 'FIL-001', name: 'Oil Filter (universal)', description: 'Standard oil filter', item_type: 'part', category_id: cat1.category_id, universal: true, unit: 'piece', current_stock: 25, minimum_stock: 5, reorder_point: 10, unit_cost: 500, selling_price: 800 });
    const inv2 = await InventoryItem.create({ sku: 'BRK-101', name: 'Brake Pads (front)', description: 'Front brake pads set', item_type: 'part', category_id: cat2.category_id, universal: false, manufacturer: 'Brembo', part_number: 'BP2020', unit: 'set', current_stock: 8, minimum_stock: 2, reorder_point: 4, unit_cost: 3500, selling_price: 5000 });

    console.log('✅ Inventory and suppliers created');

    // Summary
    console.log('\n🎉 Seeding complete! Demo credentials:');
    console.log('   Admin:       admin / admin123');
    console.log('   Fleet Sup:   fleet / fleet123');
    console.log('   Reception:   reception / reception123');
    console.log('   Customer:    mwangi / customer123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();