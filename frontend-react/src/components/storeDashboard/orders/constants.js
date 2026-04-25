export const ORDER_TRACKING_STATUS_CHOICES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export const ORDER_PAYMENT_STATUS_CHOICES = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_PAID",
];

export const DELIVERY_SLOT_CHOICES = [
  "Morning (8 AM - 12 PM)",
  "Afternoon (12 PM - 4 PM)",
  "Evening (4 PM - 8 PM)",
];

export const DELIVERY_MEN = [
  // Mock Data
   {
    id: 1,
    name: "Rahim Uddin",
    phone: "01712345678",
    vehicle: "Bike",
    vehicle_no: "DHK-12-3456",
    rating: 4.8,
    jobs: 12,
    active: true,
    distance: "1.2km",
    location: { lat: 23.8103, lng: 90.4125 },
  },
  {
    id: 2,
    name: "Karim Mia",
    phone: "01812345678",
    vehicle: "Scooter",
    vehicle_no: "DHK-11-2233",
    rating: 4.5,
    jobs: 8,
    active: true,
    distance: "0.8km",
    location: { lat: 23.811, lng: 90.413 },
  },
  {
    id: 3,
    name: "Sujon Ahmed",
    phone: "01912345678",
    vehicle: "Bike",
    vehicle_no: "DHK-13-9988",
    rating: 4.9,
    jobs: 15,
    active: false, // Inactive
    distance: "2.5km",
    location: { lat: 23.805, lng: 90.415 },
  },
  {
    id: 4,
    name: "Belal Hossain",
    phone: "01612345678",
    vehicle: "Bike",
    vehicle_no: "DHK-14-7766",
    rating: 4.2,
    jobs: 5,
    active: true,
    distance: "3.0km",
    location: { lat: 23.82, lng: 90.41 },
  },
];
