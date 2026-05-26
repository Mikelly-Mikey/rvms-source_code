const { sequelize, User, Vehicle, Customer, Booking, Payment, Maintenance, MaintenanceSchedule, MaintenanceAlert, Category, Supplier, InventoryItem, MpesaTransaction, ActivityLog, Review } = require('./models');

async function seed() {
  try {
    // Force sync – drops and recreates all tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synchronized (tables recreated)');

    // ---- helpers ----
    const today = new Date();
    const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
    const subDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() - days); return d; };
    const subHours = (date, hours) => { const d = new Date(date); d.setHours(d.getHours() - hours); return d; };

    // =====================================================================
    //  1. USERS  (IDs auto-assigned 1-6)
    // =====================================================================
    const admin = await User.create({          // id = 1
      username: 'admin', email: 'admin@rvms.com', password: 'admin123',
      first_name: 'Juma', last_name: 'Micheal',
      role: 'admin', is_staff: true, is_superuser: true, is_active: true
    });
    const fleetSup = await User.create({       // id = 2
      username: 'fleet', email: 'fleet@rvms.com', password: 'fleet123',
      first_name: 'Peter', last_name: 'Mbugua',
      role: 'fleet_supervisor', is_staff: true, is_active: true
    });
    const bookingOfficer = await User.create({ // id = 3
      username: 'reception', email: 'reception@rvms.com', password: 'reception123',
      first_name: 'Faith', last_name: 'Achieng',
      role: 'receptionist', is_staff: true, is_active: true
    });
    const mechanic = await User.create({       // id = 4
      username: 'mechanic', email: 'mechanic@rvms.com', password: 'mechanic123',
      first_name: 'James', last_name: 'Otieno',
      role: 'mechanic', is_staff: true, is_active: true
    });
    // Customer users — their User.id must match Customer.customer_id for dashboard to work
    const customerUser1 = await User.create({  // id = 5
      username: 'mwangi', email: 'mwangi@email.com', password: 'customer123',
      first_name: 'David', last_name: 'Mwangi',
      phone: '+254712345678', license_number: 'DL112233',
      role: 'customer', is_active: true
    });
    const customerUser2 = await User.create({  // id = 6
      username: 'shiks100', email: 'shikuG@email.com', password: 'customer123',
      first_name: 'Grace', last_name: 'Wanjiku',
      phone: '+254789012345', license_number: 'DL445566',
      role: 'customer', is_active: true
    });
    console.log('✅ Users created (admin=1, fleet=2, reception=3, mechanic=4, mwangi=5, shiks100=6)');

    // =====================================================================
    //  2. VEHICLES  (26 vehicles, mixed statuses)
    // =====================================================================
    const v1  = await Vehicle.create({ registration: 'KDE 193A', make: 'Mazda',   model: 'Axela',          year: 2022, color: 'Red',        fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2500,  weekly_rate: 15000,  status: 'available',   current_mileage: 78000,  image_url: '/images/mazda-axela2.jpeg' });
    const v2  = await Vehicle.create({ registration: 'KBT 027F', make: 'Mazda',   model: 'Axela',          year: 2016, color: 'Dark Tan',   fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2800,  weekly_rate: 16800,  status: 'on-rent',     current_mileage: 34590,  image_url: '/images/mazda-axela3.jpeg' });
    const v3  = await Vehicle.create({ registration: 'KCB 234B', make: 'Nissan',  model: 'Note',           year: 2019, color: 'Silver',     fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3000,  weekly_rate: 18000,  status: 'available',   current_mileage: 56000,  image_url: '/images/nissan-note.jpeg' });
    const v4  = await Vehicle.create({ registration: 'KCC 345C', make: 'Toyota',  model: 'Rav4',           year: 2020, color: 'Black',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'suv',     daily_rate: 5000,  weekly_rate: 30000,  status: 'on-rent',     current_mileage: 42000,  image_url: '/images/toyota-RAV4.jpeg' });
    const v5  = await Vehicle.create({ registration: 'KCD 456D', make: 'Mitsubishi', model: 'Outlander',   year: 2019, color: 'Brown',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 7, category: 'suv',     daily_rate: 5500,  weekly_rate: 33000,  status: 'maintenance', current_mileage: 95000,  image_url: '/images/mitsubishi-outlander_SEL.jpeg' });
    const v6  = await Vehicle.create({ registration: 'KCE 567E', make: 'Mercedes', model: 'C200',          year: 2021, color: 'Grey',       fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'luxury',  daily_rate: 12000, weekly_rate: 72000,  status: 'available',   current_mileage: 25000,  image_url: '/images/benz_c-class.jpeg' });
    const v7  = await Vehicle.create({ registration: 'KCW 678F', make: 'Toyota',  model: 'Hilux',          year: 2019, color: 'Silver',     fuel_type: 'petrol',  transmission: 'manual',    seating_capacity: 5, category: 'economy', daily_rate: 2200,  weekly_rate: 13000,  status: 'available',   current_mileage: 120000, image_url: '/images/toyota-hilux.jpeg' });
    const v8  = await Vehicle.create({ registration: 'KCG 789G', make: 'Subaru',  model: 'Forester',       year: 2020, color: 'Black',      fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'suv',     daily_rate: 6000,  weekly_rate: 36000,  status: 'on-rent',     current_mileage: 61000,  image_url: '/images/subaru-forester3.jpeg' });
    const v9  = await Vehicle.create({ registration: 'KCH 890H', make: 'Honda',   model: 'Fit',            year: 2018, color: 'Orange',     fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2800,  weekly_rate: 16800,  status: 'on-rent',     current_mileage: 83000,  image_url: '/images/honda-fit2.jpeg' });
    const v10 = await Vehicle.create({ registration: 'KCJ 901I', make: 'Toyota',  model: 'Hilux',          year: 2021, color: 'White',      fuel_type: 'diesel',  transmission: 'manual',    seating_capacity: 5, category: 'suv',     daily_rate: 7000,  weekly_rate: 42000,  status: 'available',   current_mileage: 30000,  image_url: '/images/toyota-hilux2.jpeg' });
    const v11 = await Vehicle.create({ registration: 'KCK 012J', make: 'Nissan',  model: 'X-Trail',        year: 2020, color: 'Black',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 7, category: 'suv',     daily_rate: 6500,  weekly_rate: 39000,  status: 'available',   current_mileage: 45000,  image_url: '/images/nissan-xtrail.jpeg' });
    const v12 = await Vehicle.create({ registration: 'KCL 141K', make: 'Toyota',  model: 'Probox',         year: 2016, color: 'White',      fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2000,  weekly_rate: 12000,  status: 'available',   current_mileage: 140000, image_url: '/images/probox(toyota).jpeg' });
    const v13 = await Vehicle.create({ registration: 'KCA 284N', make: 'Toyota',  model: 'Probox',         year: 2019, color: 'Gray',       fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2000,  weekly_rate: 12000,  status: 'available',   current_mileage: 140000, image_url: '/images/toyota-probox.jpeg' });
    const v14 = await Vehicle.create({ registration: 'KCM 292L', make: 'Mazda',   model: 'Demio',          year: 2019, color: 'White',      fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3200,  weekly_rate: 19200,  status: 'available',   current_mileage: 52000,  image_url: '/images/mazda-demio.jpeg' });
    const v15 = await Vehicle.create({ registration: 'KCN 373M', make: 'Toyota',  model: 'Fielder',        year: 2018, color: 'Grey',       fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3500,  weekly_rate: 21000,  status: 'available',   current_mileage: 72000,  image_url: '/images/toyota-fielder1.jpeg' });
    const v16 = await Vehicle.create({ registration: 'KDG 106M', make: 'Toyota',  model: 'Fielder',        year: 2024, color: 'Black',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 3500,  weekly_rate: 21000,  status: 'on-rent',     current_mileage: 80085,  image_url: '/images/toyota-fielder3.jpeg' });
    const v17 = await Vehicle.create({ registration: 'KCO 404N', make: 'Isuzu',   model: 'D-Max',          year: 2022, color: 'White',      fuel_type: 'diesel',  transmission: 'manual',    seating_capacity: 5, category: 'economy', daily_rate: 8000,  weekly_rate: 48000,  status: 'available',   current_mileage: 15000,  image_url: '/images/d-max.jpeg' });
    const v18 = await Vehicle.create({ registration: 'KCP 545T', make: 'BMW',     model: 'X3',             year: 2021, color: 'Black',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'luxury',  daily_rate: 15000, weekly_rate: 90000,  status: 'available',   current_mileage: 18000,  image_url: '/images/bmw_x3.jpeg' });
    const v19 = await Vehicle.create({ registration: 'KCQ 616P', make: 'Suzuki',  model: 'Swift',          year: 2020, color: 'Red-Orange', fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'economy', daily_rate: 2300,  weekly_rate: 13800,  status: 'available',   current_mileage: 35000,  image_url: '/images/suzuki_swift2.jpeg' });
    const v20 = await Vehicle.create({ registration: 'KCR 770Q', make: 'Volkswagen', model: 'Polo',        year: 2019, color: 'Navy-Blue',  fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'compact', daily_rate: 2800,  weekly_rate: 16800,  status: 'available',   current_mileage: 48000,  image_url: '/images/vw-polo1.jpeg' });
    const v21 = await Vehicle.create({ registration: 'KCS 588R', make: 'Hyundai', model: 'Tucson',         year: 2022, color: 'Blue',       fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'suv',     daily_rate: 5500,  weekly_rate: 33000,  status: 'available',   current_mileage: 12000,  image_url: '/images/hyundai_tucson1.jpeg' });
    const v22 = await Vehicle.create({ registration: 'KCT 929S', make: 'Toyota',  model: 'Land Cruiser',   year: 2021, color: 'White',      fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 7, category: 'luxury',  daily_rate: 18000, weekly_rate: 108000, status: 'available',   current_mileage: 22000,  image_url: '/images/toyota-land_cruiser_prado.jpeg' });
    const v23 = await Vehicle.create({ registration: 'KCU 101T', make: 'Mitsubishi', model: 'Outlander Phev LS', year: 2020, color: 'Black', fuel_type: 'diesel', transmission: 'manual', seating_capacity: 5, category: 'suv', daily_rate: 9000, weekly_rate: 54000, status: 'maintenance', current_mileage: 65000, image_url: '/images/MITSUBISHI-OUTLANDER_phev_ls.jpeg' });
    const v24 = await Vehicle.create({ registration: 'KDA 947K', make: 'BMW',     model: 'AMG',            year: 2025, color: 'Black',      fuel_type: 'petrol',  transmission: 'automatic', seating_capacity: 5, category: 'luxury',  daily_rate: 10000, weekly_rate: 60000,  status: 'available',   current_mileage: 10936,  image_url: '/images/bmw.jpeg' });
    const v25 = await Vehicle.create({ registration: 'KCZ 792S', make: 'BMW',     model: 'X3',             year: 2024, color: 'Red',        fuel_type: 'diesel',  transmission: 'automatic', seating_capacity: 5, category: 'luxury',  daily_rate: 15000, weekly_rate: 90000,  status: 'available',   current_mileage: 18030,  image_url: '/images/bmw_x3-1.jpeg' });
    const v26 = await Vehicle.create({ registration: 'KCH 604L', make: 'Toyota',  model: 'Land Cruiser',   year: 2022, color: 'Slate',      fuel_type: 'diesel',  transmission: 'manual',    seating_capacity: 7, category: 'luxury',  daily_rate: 18000, weekly_rate: 108000, status: 'available',   current_mileage: 22042,  image_url: '/images/landcruiser- prado( toyota).jpeg' });

    console.log('✅ 26 Vehicles created');

    // =====================================================================
    //  3. CUSTOMERS  (10 customers, IDs auto 1-10)
    //     c5 (customer_id=5) maps to mwangi (User.id=5)
    //     c6 (customer_id=6) maps to shiks100 (User.id=6)
    // =====================================================================
    const c1  = await Customer.create({ first_name: 'David',   last_name: 'Mwangi',  phone: '+254712345678', email: 'mwangi@email.com',   id_type: 'national_id', id_number: '12345678', license_number: 'DL112233', license_expiry: '2026-12-31', registered_by: bookingOfficer.id });
    const c2  = await Customer.create({ first_name: 'Amina',   last_name: 'Hassan',  phone: '+254723456789', email: 'amina@email.com',    id_type: 'passport',    id_number: 'P98765',   license_number: 'DL987614', license_expiry: '2026-08-15', registered_by: bookingOfficer.id });
    const c3  = await Customer.create({ first_name: 'Kevin',   last_name: 'Muthoni', phone: '+254734567890', email: 'kevin@email.com',    id_type: 'national_id', id_number: '11223344', license_number: 'DL543205', license_expiry: '2027-03-10', registered_by: bookingOfficer.id });
    const c4  = await Customer.create({ first_name: 'Sarah',   last_name: 'Njeri',   phone: '+254745678901', email: 'sarah@email.com',    id_type: 'national_id', id_number: '55667788', license_number: 'DL876529', license_expiry: '2026-06-20', registered_by: bookingOfficer.id });
    // c5 → matches mwangi (User.id = 5)
    const c5  = await Customer.create({ first_name: 'Brian',   last_name: 'Kiprono', phone: '+254756789012', email: 'brian@email.com',    id_type: 'national_id', id_number: '99001122', license_number: 'DL345661', license_expiry: '2026-11-05', registered_by: bookingOfficer.id });
    // c6 → matches shiks100 (User.id = 6)
    const c6  = await Customer.create({ first_name: 'Lilian',  last_name: 'Akinyi',  phone: '+254767890123', email: 'lilian@email.com',   id_type: 'national_id', id_number: '33445566', license_number: 'DL789020', license_expiry: '2027-01-12', registered_by: bookingOfficer.id });
    const c7  = await Customer.create({ first_name: 'Tom',     last_name: 'Odhiambo', phone: '+254778901234', email: 'tom@email.com',     id_type: 'passport',    id_number: 'P11223',   license_number: 'DL012395', license_expiry: '2026-09-30', registered_by: bookingOfficer.id });
    const c8  = await Customer.create({ first_name: 'Grace',   last_name: 'Wanjiku', phone: '+254789012345', email: 'shikuG@email.com',   id_type: 'national_id', id_number: '77889900', license_number: 'DL445566', license_expiry: '2027-04-18', registered_by: bookingOfficer.id });
    const c9  = await Customer.create({ first_name: 'Patrick', last_name: 'Mutua',   phone: '+254701234567', email: 'patrick@email.com',  id_type: 'national_id', id_number: '22334455', license_number: 'DL890165', license_expiry: '2027-07-22', registered_by: bookingOfficer.id });
    const c10 = await Customer.create({ first_name: 'Joyce',   last_name: 'Chebet',  phone: '+254712345000', email: 'joyce@email.com',    id_type: 'national_id', id_number: '66778899', license_number: 'DL234591', license_expiry: '2027-02-14', registered_by: bookingOfficer.id });

    console.log('✅ 10 Customers created');

    // =====================================================================
    //  4. BOOKINGS  (15 bookings with correct math)
    //     total_amount = daily_rate × days
    //     balance_due  = total_amount − deposit_paid
    //     Vehicles on-rent: v2, v4, v8, v9, v16  (5 checked-out bookings)
    //     Vehicles in maintenance: v5, v23
    // =====================================================================

    // ---- COMPLETED bookings (past) ----

    // b1: David Mwangi rented Mazda Axela (v1, 2500/day) for 5 days — COMPLETED, fully paid
    // days = ceil((day14-day10)/86400000)+1 = 5 days → total = 12,500
    const b1 = await Booking.create({
      customer_id: c1.customer_id, vehicle_id: v1.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 19), end_date: subDays(today, 15), pickup_time: '10:00', return_time: '10:00',
      status: 'completed', total_amount: 12500, deposit_paid: 12500, balance_due: 0,
      actual_pickup_time: subDays(today, 19), actual_return_time: subDays(today, 15),
      check_out_mileage: 77000, check_in_mileage: 77800, check_out_fuel: 80, check_in_fuel: 40
    });

    // b2: Amina Hassan rented Nissan Note (v3, 3000/day) for 4 days — COMPLETED, fully paid
    // 4 days → total = 12,000
    const b2 = await Booking.create({
      customer_id: c2.customer_id, vehicle_id: v3.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 13), end_date: subDays(today, 10), pickup_time: '09:00', return_time: '09:00',
      status: 'completed', total_amount: 12000, deposit_paid: 12000, balance_due: 0,
      actual_pickup_time: subDays(today, 13), actual_return_time: subDays(today, 10),
      check_out_mileage: 55000, check_in_mileage: 55600, check_out_fuel: 100, check_in_fuel: 70
    });

    // b3: Grace Wanjiku (c8/shiks100 → but customer_id 8 ≠ User.id 6)
    //     For customer dashboard to work, we need customer_id matching User.id=6
    //     So let's use c6 (customer_id=6) for shiks100's bookings
    // c6 = Lilian Akinyi → rented Mercedes C200 (v6, 12000/day) for 3 days — COMPLETED, partial balance
    // 3 days → total = 36,000; paid 30,000; balance = 6,000
    const b3 = await Booking.create({
      customer_id: c6.customer_id, vehicle_id: v6.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 22), end_date: subDays(today, 20), pickup_time: '11:00', return_time: '11:00',
      status: 'completed', total_amount: 36000, deposit_paid: 30000, balance_due: 6000,
      actual_pickup_time: subDays(today, 22), actual_return_time: subDays(today, 20),
      check_out_mileage: 24000, check_in_mileage: 24500, check_out_fuel: 90, check_in_fuel: 50
    });

    // b4: Sarah Njeri rented Toyota Fielder (v16, 3500/day) for 4 days — COMPLETED, fully paid
    // 4 days → total = 14,000
    const b4 = await Booking.create({
      customer_id: c4.customer_id, vehicle_id: v15.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 18), end_date: subDays(today, 15), pickup_time: '14:00', return_time: '14:00',
      status: 'completed', total_amount: 14000, deposit_paid: 14000, balance_due: 0,
      actual_pickup_time: subDays(today, 18), actual_return_time: subDays(today, 15),
      check_out_mileage: 71000, check_in_mileage: 71800, check_out_fuel: 80, check_in_fuel: 45
    });

    // b5: Brian Kiprono (c5, matches mwangi User.id=5) rented Toyota Rav4 (v4, 5000/day) for 5 days — COMPLETED, balance outstanding
    // 5 days → total = 25,000; paid 18,000; balance = 7,000
    const b5 = await Booking.create({
      customer_id: c5.customer_id, vehicle_id: v4.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 12), end_date: subDays(today, 8), pickup_time: '10:00', return_time: '10:00',
      status: 'completed', total_amount: 25000, deposit_paid: 18000, balance_due: 7000,
      actual_pickup_time: subDays(today, 12), actual_return_time: subDays(today, 8),
      check_out_mileage: 41000, check_in_mileage: 41900, check_out_fuel: 100, check_in_fuel: 60
    });

    // b6: Joyce Chebet rented Toyota Probox (v12, 2000/day) for 3 days — COMPLETED, fully paid
    // 3 days → total = 6,000
    const b6 = await Booking.create({
      customer_id: c10.customer_id, vehicle_id: v12.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 10), end_date: subDays(today, 8), pickup_time: '08:00', return_time: '08:00',
      status: 'completed', total_amount: 6000, deposit_paid: 6000, balance_due: 0,
      actual_pickup_time: subDays(today, 10), actual_return_time: subDays(today, 8),
      check_out_mileage: 139000, check_in_mileage: 139400, check_out_fuel: 70, check_in_fuel: 30
    });

    // b7: Kevin Muthoni rented VW Polo (v20, 2800/day) for 3 days — COMPLETED, paid in full
    // 3 days → total = 8,400
    const b7 = await Booking.create({
      customer_id: c3.customer_id, vehicle_id: v20.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 7), end_date: subDays(today, 5), pickup_time: '09:00', return_time: '09:00',
      status: 'completed', total_amount: 8400, deposit_paid: 8400, balance_due: 0,
      actual_pickup_time: subDays(today, 7), actual_return_time: subDays(today, 5),
      check_out_mileage: 47000, check_in_mileage: 47600, check_out_fuel: 85, check_in_fuel: 50
    });

    // ---- CHECKED-OUT bookings (currently on rent) ----

    // b8: Sarah Njeri rented Mazda Axela (v2, 2800/day) for 3 days — CHECKED-OUT (v2 = on-rent)
    // 3 days → total = 8,400; deposit = 5,000; balance = 3,400
    const b8 = await Booking.create({
      customer_id: c4.customer_id, vehicle_id: v2.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 1), end_date: addDays(today, 1), pickup_time: '08:00', return_time: '08:00',
      status: 'checked-out', total_amount: 8400, deposit_paid: 5000, balance_due: 3400,
      actual_pickup_time: subDays(today, 1), check_out_mileage: 34590, check_out_fuel: 75
    });

    // b9: Brian Kiprono (c5/mwangi) rented Toyota Rav4 (v4, 5000/day) for 4 days — CHECKED-OUT (v4 = on-rent)
    // 4 days → total = 20,000; deposit = 12,000; balance = 8,000
    const b9 = await Booking.create({
      customer_id: c5.customer_id, vehicle_id: v4.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 1), end_date: addDays(today, 2), pickup_time: '10:00', return_time: '10:00',
      status: 'checked-out', total_amount: 20000, deposit_paid: 12000, balance_due: 8000,
      actual_pickup_time: subDays(today, 1), check_out_mileage: 42000, check_out_fuel: 90
    });

    // b10: Amina Hassan rented Subaru Forester (v8, 6000/day) for 5 days — CHECKED-OUT (v8 = on-rent)
    // 5 days → total = 30,000; deposit = 15,000; balance = 15,000
    const b10 = await Booking.create({
      customer_id: c2.customer_id, vehicle_id: v8.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 2), end_date: addDays(today, 2), pickup_time: '10:00', return_time: '10:00',
      status: 'checked-out', total_amount: 30000, deposit_paid: 15000, balance_due: 15000,
      actual_pickup_time: subDays(today, 2), check_out_mileage: 61000, check_out_fuel: 100
    });

    // b11: Lilian Akinyi (c6/shiks100) rented Honda Fit (v9, 2800/day) for 3 days — CHECKED-OUT (v9 = on-rent)
    // 3 days → total = 8,400; deposit = 4,000; balance = 4,400
    const b11 = await Booking.create({
      customer_id: c6.customer_id, vehicle_id: v9.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 1), end_date: addDays(today, 1), pickup_time: '09:00', return_time: '09:00',
      status: 'checked-out', total_amount: 8400, deposit_paid: 4000, balance_due: 4400,
      actual_pickup_time: subDays(today, 1), check_out_mileage: 83000, check_out_fuel: 80
    });

    // b12: Tom Odhiambo rented Toyota Fielder (v16, 3500/day) for 4 days — CHECKED-OUT (v16 = on-rent)
    // 4 days → total = 14,000; deposit = 7,000; balance = 7,000
    const b12 = await Booking.create({
      customer_id: c7.customer_id, vehicle_id: v16.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 2), end_date: addDays(today, 1), pickup_time: '10:00', return_time: '10:00',
      status: 'checked-out', total_amount: 14000, deposit_paid: 7000, balance_due: 7000,
      actual_pickup_time: subDays(today, 2), check_out_mileage: 80085, check_out_fuel: 65
    });

    // ---- CONFIRMED bookings (future reservations) ----

    // b13: Patrick Mutua — Toyota Hilux (v7, 2200/day) for 3 days — CONFIRMED (future)
    // 3 days → total = 6,600; deposit = 3,000; balance = 3,600
    const b13 = await Booking.create({
      customer_id: c9.customer_id, vehicle_id: v7.vehicle_id, created_by: bookingOfficer.id,
      start_date: addDays(today, 3), end_date: addDays(today, 5), pickup_time: '14:00', return_time: '14:00',
      status: 'confirmed', total_amount: 6600, deposit_paid: 3000, balance_due: 3600
    });

    // b14: David Mwangi — Mazda Demio (v14, 3200/day) for 4 days — CONFIRMED (future)
    // 4 days → total = 12,800; no deposit yet
    const b14 = await Booking.create({
      customer_id: c1.customer_id, vehicle_id: v14.vehicle_id, created_by: bookingOfficer.id,
      start_date: addDays(today, 7), end_date: addDays(today, 10), pickup_time: '09:00', return_time: '09:00',
      status: 'confirmed', total_amount: 12800, deposit_paid: 0, balance_due: 12800
    });

    // b15: Brian Kiprono (c5/mwangi) — Isuzu D-Max (v17, 8000/day) for 3 days — CONFIRMED (future)
    // 3 days → total = 24,000; deposit = 10,000; balance = 14,000
    const b15 = await Booking.create({
      customer_id: c5.customer_id, vehicle_id: v17.vehicle_id, created_by: bookingOfficer.id,
      start_date: addDays(today, 10), end_date: addDays(today, 12), pickup_time: '09:00', return_time: '09:00',
      status: 'confirmed', total_amount: 24000, deposit_paid: 10000, balance_due: 14000
    });

    // ---- CANCELLED booking ----
    const b16 = await Booking.create({
      customer_id: c9.customer_id, vehicle_id: v11.vehicle_id, created_by: bookingOfficer.id,
      start_date: subDays(today, 5), end_date: subDays(today, 3), pickup_time: '10:00', return_time: '10:00',
      status: 'cancelled', total_amount: 19500, deposit_paid: 0, balance_due: 19500,
      cancellation_reason: 'Customer changed travel plans'
    });

    console.log('✅ 16 Bookings created (7 completed, 5 checked-out, 3 confirmed, 1 cancelled)');

    // =====================================================================
    //  5. PAYMENTS  (matching deposit_paid totals exactly)
    // =====================================================================

    // b1: David Mwangi — fully paid 12,500 (deposit 5000 + balance 7500)
    await Payment.create({ booking_id: b1.booking_id, amount: 5000,  method: 'mpesa',         reference: 'MPS-DM-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Initial deposit' });
    await Payment.create({ booking_id: b1.booking_id, amount: 7500,  method: 'cash',                                   status: 'completed', recorded_by: bookingOfficer.id, notes: 'Balance on return' });

    // b2: Amina Hassan — fully paid 12,000 (6000 deposit + 6000 balance)
    await Payment.create({ booking_id: b2.booking_id, amount: 6000,  method: 'mpesa',         reference: 'MPS-AH-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit via M-Pesa' });
    await Payment.create({ booking_id: b2.booking_id, amount: 6000,  method: 'bank_transfer', reference: 'BANK-AH-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Final balance via bank transfer' });

    // b3: Lilian Akinyi (shiks100 customer) — paid 30,000 of 36,000 (deposit 20000 + partial 10000)
    await Payment.create({ booking_id: b3.booking_id, amount: 20000, method: 'mpesa',         reference: 'MPS-LA-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for Mercedes C200' });
    await Payment.create({ booking_id: b3.booking_id, amount: 10000, method: 'cash',                                   status: 'completed', recorded_by: bookingOfficer.id, notes: 'Partial payment on return' });

    // b4: Sarah Njeri — fully paid 14,000
    await Payment.create({ booking_id: b4.booking_id, amount: 7000,  method: 'mpesa',         reference: 'MPS-SN-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit' });
    await Payment.create({ booking_id: b4.booking_id, amount: 7000,  method: 'mpesa',         reference: 'MPS-SN-002', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Balance cleared' });

    // b5: Brian Kiprono (mwangi) — paid 18,000 of 25,000 (deposit 10000 + 8000)
    await Payment.create({ booking_id: b5.booking_id, amount: 10000, method: 'mpesa',         reference: 'MPS-BK-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for Rav4 rental' });
    await Payment.create({ booking_id: b5.booking_id, amount: 8000,  method: 'cash',                                   status: 'completed', recorded_by: bookingOfficer.id, notes: 'Partial payment, KES 7,000 still owing' });

    // b6: Joyce Chebet — fully paid 6,000
    await Payment.create({ booking_id: b6.booking_id, amount: 6000,  method: 'cash',                                   status: 'completed', recorded_by: bookingOfficer.id, notes: 'Full cash payment upfront' });

    // b7: Kevin Muthoni — fully paid 8,400
    await Payment.create({ booking_id: b7.booking_id, amount: 5000,  method: 'mpesa',         reference: 'MPS-KM-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit' });
    await Payment.create({ booking_id: b7.booking_id, amount: 3400,  method: 'card',          reference: 'CARD-KM-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Balance via Visa card' });

    // b8: Sarah Njeri (on-rent) — paid deposit 5,000 of 8,400
    await Payment.create({ booking_id: b8.booking_id, amount: 5000,  method: 'mpesa',         reference: 'MPS-SN-003', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for Mazda Axela rental' });

    // b9: Brian Kiprono/mwangi (on-rent) — paid deposit 12,000 of 20,000
    await Payment.create({ booking_id: b9.booking_id, amount: 12000, method: 'mpesa',         reference: 'MPS-BK-002', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for current Rav4 rental' });

    // b10: Amina Hassan (on-rent) — paid deposit 15,000 of 30,000
    await Payment.create({ booking_id: b10.booking_id, amount: 15000, method: 'bank_transfer', reference: 'BANK-AH-002', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for Forester rental' });

    // b11: Lilian Akinyi/shiks100 (on-rent) — paid deposit 4,000 of 8,400
    await Payment.create({ booking_id: b11.booking_id, amount: 4000, method: 'cash',                                    status: 'completed', recorded_by: bookingOfficer.id, notes: 'Cash deposit for Honda Fit' });

    // b12: Tom Odhiambo (on-rent) — paid deposit 7,000 of 14,000
    await Payment.create({ booking_id: b12.booking_id, amount: 7000, method: 'mpesa',         reference: 'MPS-TO-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Deposit for Toyota Fielder' });

    // b13: Patrick Mutua (future) — paid deposit 3,000 of 6,600
    await Payment.create({ booking_id: b13.booking_id, amount: 3000, method: 'mpesa',         reference: 'MPS-PM-001', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Advance deposit for upcoming rental' });

    // b15: Brian Kiprono/mwangi (future) — paid deposit 10,000 of 24,000
    await Payment.create({ booking_id: b15.booking_id, amount: 10000, method: 'mpesa',        reference: 'MPS-BK-003', status: 'completed', recorded_by: bookingOfficer.id, notes: 'Advance deposit for D-Max trip' });

    console.log('✅ 22 Payments created (matching all deposit_paid values)');

    // =====================================================================
    //  6. MAINTENANCE RECORDS  (for fleet supervisor dashboard)
    // =====================================================================
    await Maintenance.create({
      vehicle_id: v5.vehicle_id, service_date: subDays(today, 3), mileage: 95000,
      service_type: 'full_service', description: 'Full 100K service — engine oil, all filters, spark plugs, coolant flush, belt inspection',
      cost: 35000, provider: 'AutoXpress Nairobi', provider_contact: '+254700111222',
      next_service_mileage: 105000, next_service_date: addDays(today, 180),
      is_scheduled: true, completed_by: mechanic.id, notes: 'Transmission mount worn — schedule replacement next visit'
    });
    await Maintenance.create({
      vehicle_id: v23.vehicle_id, service_date: subDays(today, 1), mileage: 65000,
      service_type: 'repair', description: 'Hybrid battery diagnostics and coolant pump replacement',
      cost: 48000, provider: 'EV Service Center', provider_contact: '+254711222333',
      next_service_mileage: 70000, next_service_date: addDays(today, 90),
      is_scheduled: false, completed_by: mechanic.id, notes: 'Battery health at 82% — monitor closely'
    });
    await Maintenance.create({
      vehicle_id: v1.vehicle_id, service_date: subDays(today, 45), mileage: 76000,
      service_type: 'oil_change', description: 'Oil and filter change — 5W-30 synthetic',
      cost: 4500, provider: 'Speedy Lube', provider_contact: '+254733444555',
      next_service_mileage: 81000, next_service_date: addDays(today, 60),
      is_scheduled: true, completed_by: mechanic.id
    });
    await Maintenance.create({
      vehicle_id: v4.vehicle_id, service_date: subDays(today, 30), mileage: 41000,
      service_type: 'tyre', description: 'Replaced all 4 tyres — Michelin Primacy 4 225/65R17',
      cost: 52000, provider: 'Tyre Centre Kenya', provider_contact: '+254722333444',
      next_service_mileage: 81000, is_scheduled: false, completed_by: mechanic.id,
      notes: 'Alignment done; recommend rotation at 60K km'
    });
    await Maintenance.create({
      vehicle_id: v2.vehicle_id, service_date: subDays(today, 60), mileage: 33000,
      service_type: 'brake', description: 'Front brake pads and disc replacement',
      cost: 18000, provider: 'Brake Masters', provider_contact: '+254722333444',
      next_service_mileage: 53000, is_scheduled: false, completed_by: mechanic.id
    });
    await Maintenance.create({
      vehicle_id: v8.vehicle_id, service_date: subDays(today, 15), mileage: 60000,
      service_type: 'inspection', description: 'Annual inspection — passed; minor oil seepage noted on valve cover',
      cost: 3000, provider: 'NTSA Inspection Centre', provider_contact: '+254700555666',
      next_service_date: addDays(today, 350), is_scheduled: true, completed_by: mechanic.id,
      notes: 'Valve cover gasket replacement recommended within 10K km'
    });
    await Maintenance.create({
      vehicle_id: v20.vehicle_id, service_date: subDays(today, 5), mileage: 48000,
      service_type: 'oil_change', description: 'Oil and filter change — 5W-40',
      cost: 4000, provider: 'Speedy Lube', provider_contact: '+254733444555',
      next_service_mileage: 53000, next_service_date: addDays(today, 90),
      is_scheduled: true, completed_by: mechanic.id
    });

    console.log('✅ 7 Maintenance records created');

    // =====================================================================
    //  7. MAINTENANCE SCHEDULES  (upcoming tasks for fleet supervisor)
    // =====================================================================
    await MaintenanceSchedule.create({
      vehicle_id: v4.vehicle_id, service_type: 'oil_change', scheduled_date: addDays(today, 5),
      scheduled_mileage: 45000, priority: 'high', status: 'pending', assigned_to: mechanic.id
    });
    await MaintenanceSchedule.create({
      vehicle_id: v6.vehicle_id, service_type: 'inspection', scheduled_date: addDays(today, 14),
      scheduled_mileage: 26000, priority: 'medium', status: 'pending', assigned_to: mechanic.id
    });
    await MaintenanceSchedule.create({
      vehicle_id: v9.vehicle_id, service_type: 'tyre', scheduled_date: addDays(today, 7),
      scheduled_mileage: 85000, priority: 'high', status: 'pending', assigned_to: mechanic.id
    });
    await MaintenanceSchedule.create({
      vehicle_id: v22.vehicle_id, service_type: 'full_service', scheduled_date: addDays(today, 21),
      scheduled_mileage: 25000, priority: 'low', status: 'pending', assigned_to: mechanic.id
    });
    await MaintenanceSchedule.create({
      vehicle_id: v1.vehicle_id, service_type: 'oil_change', scheduled_date: addDays(today, 60),
      scheduled_mileage: 81000, priority: 'medium', status: 'pending', assigned_to: mechanic.id
    });

    console.log('✅ 5 Maintenance schedules created');

    // =====================================================================
    //  8. MAINTENANCE ALERTS  (for dashboard warnings)
    // =====================================================================
    await MaintenanceAlert.create({
      vehicle_id: v5.vehicle_id, alert_type: 'overdue_service',
      message: 'Transmission mount replacement overdue — flagged during last service',
      due_date: subDays(today, 3), is_read: false
    });
    await MaintenanceAlert.create({
      vehicle_id: v4.vehicle_id, alert_type: 'upcoming_service',
      message: 'Oil change due at 45,000 km (currently 42,000 km)',
      due_date: addDays(today, 5), is_read: false
    });
    await MaintenanceAlert.create({
      vehicle_id: v9.vehicle_id, alert_type: 'upcoming_service',
      message: 'Tyre replacement scheduled — tread depth below 3mm',
      due_date: addDays(today, 7), is_read: false
    });
    await MaintenanceAlert.create({
      vehicle_id: v23.vehicle_id, alert_type: 'overdue_service',
      message: 'Hybrid battery health at 82% — requires diagnostic check',
      due_date: subDays(today, 1), is_read: false
    });

    console.log('✅ 4 Maintenance alerts created');

    // =====================================================================
    //  9. ACTIVITY LOG  (recent actions for admin dashboard)
    // =====================================================================
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'create', entity_type: 'booking', entity_id: b9.booking_id,  description: 'Created booking RVMS-... for Brian Kiprono — Toyota Rav4 (KCC 345C)', created_at: subHours(today, 2) });
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'create', entity_type: 'booking', entity_id: b11.booking_id, description: 'Created booking for Lilian Akinyi — Honda Fit (KCH 890H)', created_at: subHours(today, 3) });
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'checkout', entity_type: 'booking', entity_id: b9.booking_id, description: 'Checked out Toyota Rav4 (KCC 345C) to Brian Kiprono', created_at: subHours(today, 1) });
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'create', entity_type: 'payment', entity_id: null, description: 'Recorded KES 12,000 M-Pesa deposit for booking — Brian Kiprono', created_at: subHours(today, 2) });
    await ActivityLog.create({ user_id: mechanic.id, username: 'mechanic', role: 'mechanic', action: 'complete', entity_type: 'maintenance', entity_id: null, description: 'Completed hybrid battery diagnostics on Mitsubishi Outlander Phev (KCU 101T)', created_at: subHours(today, 6) });
    await ActivityLog.create({ user_id: fleetSup.id, username: 'fleet', role: 'fleet_supervisor', action: 'update', entity_type: 'vehicle', entity_id: v5.vehicle_id, description: 'Moved Mitsubishi Outlander (KCD 456D) to maintenance status', created_at: subHours(today, 8) });
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'create', entity_type: 'customer', entity_id: c10.customer_id, description: 'Registered new customer Joyce Chebet (+254712345000)', created_at: subHours(today, 48) });
    await ActivityLog.create({ user_id: admin.id, username: 'admin', role: 'admin', action: 'update', entity_type: 'user', entity_id: mechanic.id, description: 'Updated mechanic James Otieno account permissions', created_at: subHours(today, 72) });
    await ActivityLog.create({ user_id: bookingOfficer.id, username: 'reception', role: 'receptionist', action: 'return', entity_type: 'booking', entity_id: b7.booking_id, description: 'Returned VW Polo (KCR 770Q) from Kevin Muthoni — condition good', created_at: subHours(today, 50) });
    await ActivityLog.create({ user_id: fleetSup.id, username: 'fleet', role: 'fleet_supervisor', action: 'create', entity_type: 'maintenance', entity_id: null, description: 'Scheduled oil change for Toyota Rav4 (KCC 345C) at 45,000 km', created_at: subHours(today, 24) });

    console.log('✅ 10 Activity log entries created');

    // =====================================================================
    //  10. REVIEWS  (customer reviews for vehicles)
    // =====================================================================
    await Review.create({ vehicle_id: v1.vehicle_id,  user_id: customerUser1.id, rating: 4, comment: 'Smooth ride and great fuel economy. AC worked perfectly.', is_approved: true });
    await Review.create({ vehicle_id: v4.vehicle_id,  user_id: customerUser1.id, rating: 5, comment: 'The Rav4 handled the Naivasha trip like a champ. Very comfortable on long drives.', is_approved: true });
    await Review.create({ vehicle_id: v3.vehicle_id,  user_id: customerUser2.id, rating: 4, comment: 'Compact and easy to park in the CBD. Good for city driving.', is_approved: true });
    await Review.create({ vehicle_id: v6.vehicle_id,  user_id: customerUser2.id, rating: 5, comment: 'Luxury experience! The Mercedes was spotless and drove beautifully.', is_approved: true });
    await Review.create({ vehicle_id: v20.vehicle_id, user_id: customerUser1.id, rating: 3, comment: 'Decent car but the interior could use some freshening up.', is_approved: true });
    await Review.create({ vehicle_id: v12.vehicle_id, user_id: customerUser2.id, rating: 4, comment: 'Perfect for running errands around town. Reliable and affordable.', is_approved: false });

    console.log('✅ 6 Reviews created');

    // =====================================================================
    //  11. INVENTORY & SUPPLIERS
    // =====================================================================
    const supplier1 = await Supplier.create({ name: 'Auto Parts Ltd', contact_person: 'James Maina', email: 'james@autoparts.co.ke', phone: '+254711999888' });
    const supplier2 = await Supplier.create({ name: 'Tyre Centre Kenya', contact_person: 'Mary Wambui', email: 'mary@tyrecentre.co.ke', phone: '+254722333444' });
    const cat1 = await Category.create({ name: 'Filters' });
    const cat2 = await Category.create({ name: 'Brake Parts' });
    const cat3 = await Category.create({ name: 'Tyres' });
    const cat4 = await Category.create({ name: 'Fluids & Oils' });

    await InventoryItem.create({ sku: 'FIL-001', name: 'Oil Filter (universal)', description: 'Standard oil filter fits most vehicles', item_type: 'part', category_id: cat1.category_id, supplier_id: supplier1.supplier_id, universal: true, unit: 'piece', current_stock: 25, minimum_stock: 5, reorder_point: 10, unit_cost: 500, selling_price: 800 });
    await InventoryItem.create({ sku: 'FIL-002', name: 'Air Filter (Toyota)', description: 'Air filter for Toyota models', item_type: 'part', category_id: cat1.category_id, supplier_id: supplier1.supplier_id, universal: false, manufacturer: 'Toyota', part_number: 'AF-TY2020', unit: 'piece', current_stock: 12, minimum_stock: 3, reorder_point: 6, unit_cost: 800, selling_price: 1200 });
    await InventoryItem.create({ sku: 'BRK-101', name: 'Brake Pads (front)', description: 'Front brake pads set — Brembo', item_type: 'part', category_id: cat2.category_id, supplier_id: supplier1.supplier_id, universal: false, manufacturer: 'Brembo', part_number: 'BP2020', unit: 'set', current_stock: 8, minimum_stock: 2, reorder_point: 4, unit_cost: 3500, selling_price: 5000 });
    await InventoryItem.create({ sku: 'BRK-102', name: 'Brake Discs (front)', description: 'Front brake disc pair', item_type: 'part', category_id: cat2.category_id, supplier_id: supplier1.supplier_id, universal: false, manufacturer: 'Brembo', part_number: 'BD2020', unit: 'pair', current_stock: 4, minimum_stock: 1, reorder_point: 2, unit_cost: 6000, selling_price: 8500 });
    await InventoryItem.create({ sku: 'TYR-001', name: 'Tyre 225/65R17 (Michelin)', description: 'Michelin Primacy 4 all-season tyre', item_type: 'part', category_id: cat3.category_id, supplier_id: supplier2.supplier_id, universal: false, manufacturer: 'Michelin', part_number: 'PRM4-22565R17', unit: 'piece', current_stock: 16, minimum_stock: 4, reorder_point: 8, unit_cost: 12000, selling_price: 15000 });
    await InventoryItem.create({ sku: 'OIL-001', name: 'Engine Oil 5W-30 (5L)', description: 'Full synthetic engine oil 5W-30', item_type: 'consumable', category_id: cat4.category_id, supplier_id: supplier1.supplier_id, universal: true, unit: 'bottle', current_stock: 30, minimum_stock: 10, reorder_point: 15, unit_cost: 2500, selling_price: 3500 });

    console.log('✅ Inventory, categories, and suppliers created');

    // =====================================================================
    //  SUMMARY
    // =====================================================================
    console.log('\n===================================');
    console.log('  SEEDING COMPLETE!');
    console.log('===================================');
    console.log('');
    console.log('Login Credentials:');
    console.log('  Admin:            admin / admin123');
    console.log('  Fleet Supervisor: fleet / fleet123');
    console.log('  Receptionist:     reception / reception123');
    console.log('  Mechanic:         mechanic / mechanic123');
    console.log('  Customer (David): mwangi / customer123');
    console.log('  Customer (Grace): shiks100 / customer123');
    console.log('');
    console.log('Data Summary:');
    console.log('  26 vehicles (17 available, 5 on-rent, 2 maintenance, 0 reserved)');
    console.log('  10 customers');
    console.log('  16 bookings (7 completed, 5 checked-out, 3 confirmed, 1 cancelled)');
    console.log('  22 payments (M-Pesa, cash, bank transfer, card)');
    console.log('  7 maintenance records');
    console.log('  5 maintenance schedules');
    console.log('  4 maintenance alerts');
    console.log('  10 activity log entries');
    console.log('  6 vehicle reviews');
    console.log('  6 inventory items, 4 categories, 2 suppliers');
    console.log('');
    console.log('Customer Dashboard Notes:');
    console.log('  mwangi (User.id=5) → Customer c5 (customer_id=5)');
    console.log('    → 1 completed booking (b5: Rav4, KES 25K, balance 7K)');
    console.log('    → 1 active booking (b9: Rav4, KES 20K, balance 8K)');
    console.log('    → 1 future booking (b15: D-Max, KES 24K, balance 14K)');
    console.log('  shiks100 (User.id=6) → Customer c6 (customer_id=6)');
    console.log('    → 1 completed booking (b3: Mercedes, KES 36K, balance 6K)');
    console.log('    → 1 active booking (b11: Honda Fit, KES 8.4K, balance 4.4K)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seed();
