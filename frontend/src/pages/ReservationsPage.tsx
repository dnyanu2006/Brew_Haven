import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../services/api.ts';
import { Reservation, Table } from '../types/index.ts';
import { Calendar, Clock, Users, MapPin, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react';

const TIME_SLOTS = [
  '08:00 AM',
  '09:30 AM',
  '11:00 AM',
  '12:30 PM',
  '02:00 PM',
  '03:30 PM',
  '05:00 PM',
  '06:30 PM',
  '08:00 PM',
];

export const ReservationsPage: React.FC = () => {
  const { user, showToast, setIsAuthModalOpen } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Booking Form State
  const [date, setDate] = useState(todayStr);
  const [timeSlot, setTimeSlot] = useState('11:00 AM');
  const [guestCount, setGuestCount] = useState(2);
  const [seatingArea, setSeatingArea] = useState<'indoor' | 'patio' | 'window' | 'bar'>('window');
  const [selectedTableNumber, setSelectedTableNumber] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');

  // Availability & loading
  const [isChecking, setIsChecking] = useState(false);
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);

  // Active User Reservations
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [activeTab, setActiveTab] = useState<'new' | 'my-bookings'>('new');

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerEmail(user.email);
      if (user.phone) setCustomerPhone(user.phone);

      api
        .getUserReservations()
        .then((res) => setMyReservations(res))
        .catch(() => {});
    }
  }, [user]);

  // Check table availability whenever date, slot or guests change
  useEffect(() => {
    setIsChecking(true);
    api
      .checkAvailability({ date, timeSlot, guestCount })
      .then((res) => {
        setAvailableTables(res.availableTables || []);
        if (res.availableTables?.length > 0) {
          const matchArea = res.availableTables.find((t) => t.location === seatingArea);
          setSelectedTableNumber(matchArea ? matchArea.tableNumber : res.availableTables[0].tableNumber);
        } else {
          setSelectedTableNumber('');
        }
      })
      .catch((err) => {
        console.error('Availability check error:', err);
      })
      .finally(() => setIsChecking(false));
  }, [date, timeSlot, guestCount, seatingArea]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone) {
      showToast('Please provide your name, email, and phone number', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createReservation({
        customerName,
        customerEmail,
        customerPhone,
        date,
        timeSlot,
        guestCount,
        seatingArea,
        tableNumber: selectedTableNumber,
        specialRequests,
      });

      setConfirmedReservation(res.reservation);
      showToast('Table reservation confirmed!', 'success');

      // Refresh list
      if (user) {
        api.getUserReservations().then((r) => setMyReservations(r)).catch(() => {});
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to book table. Slot may be taken.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelBooking = async (code: string) => {
    try {
      await api.cancelReservation(code);
      showToast('Reservation cancelled successfully.', 'info');
      setMyReservations((prev) =>
        prev.map((r) => (r.reservationCode === code ? { ...r, status: 'cancelled' } : r))
      );
      if (confirmedReservation?.reservationCode === code) {
        setConfirmedReservation((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel reservation.', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8DFD5] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#C87D32] block mb-1">
            Table Hospitality
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#291811]">
            Table Reservations
          </h1>
          <p className="text-xs sm:text-sm text-[#6B5547] mt-1 max-w-xl">
            Book your sanctuary for a peaceful morning pour-over, quiet business meeting, or weekend
            brunch gathering.
          </p>
        </div>

        {/* Tab switch between New Booking and My Bookings */}
        <div className="flex bg-[#EFE8DF] p-1 rounded-xl text-xs font-medium self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'new'
                ? 'bg-white text-[#291811] shadow-xs font-semibold'
                : 'text-[#6B5547] hover:text-[#291811]'
            }`}
          >
            New Reservation
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'my-bookings'
                ? 'bg-white text-[#291811] shadow-xs font-semibold'
                : 'text-[#6B5547] hover:text-[#291811]'
            }`}
          >
            My Bookings {myReservations.length > 0 && `(${myReservations.length})`}
          </button>
        </div>
      </div>

      {activeTab === 'new' ? (
        confirmedReservation ? (
          /* Confirmation Success Card */
          <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-[#E8DFD5] p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#EFE8DF] text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#C87D32]">
                Booking Confirmed
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#291811] mt-1">
                We're holding your table!
              </h2>
              <p className="text-xs text-[#6B5547] mt-2">
                A confirmation has been recorded in our reservation log. Please present your booking
                code upon arrival.
              </p>
            </div>

            {/* Ticket Card Details */}
            <div className="p-6 bg-[#FAF7F2] rounded-xl border border-[#E8DFD5] text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between pb-2 border-b border-[#E8DFD5]">
                <span className="text-[#8C6D58]">Reservation Code:</span>
                <span className="font-bold text-[#291811] text-sm">
                  {confirmedReservation.reservationCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C6D58]">Date:</span>
                <span className="text-[#291811]">{confirmedReservation.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C6D58]">Time:</span>
                <span className="text-[#291811]">{confirmedReservation.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C6D58]">Party Size:</span>
                <span className="text-[#291811]">{confirmedReservation.guestCount} Guests</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C6D58]">Assigned Table:</span>
                <span className="text-[#291811] font-bold">
                  {confirmedReservation.tableNumber || 'Auto-Allocated Table'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8C6D58]">Seating Area:</span>
                <span className="text-[#291811] capitalize">
                  {confirmedReservation.seatingArea}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8DFD5]">
                <span className="text-[#8C6D58]">Guest Name:</span>
                <span className="text-[#291811]">{confirmedReservation.customerName}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                onClick={() => setConfirmedReservation(null)}
                className="px-6 py-2.5 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
              >
                Book Another Table
              </button>
              <button
                onClick={() => handleCancelBooking(confirmedReservation.reservationCode)}
                className="px-4 py-2.5 border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors"
              >
                Cancel This Reservation
              </button>
            </div>
          </div>
        ) : (
          /* Main Reservation Form */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Left Side */}
            <form onSubmit={handleBookingSubmit} className="lg:col-span-8 space-y-6">
              {/* Step 1: Date, Time & Guests */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-5">
                <h3 className="font-serif text-base font-semibold text-[#291811] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#291811] text-[#FAF7F2] text-xs flex items-center justify-center font-mono">
                    1
                  </span>
                  <span>Date, Time & Party Size</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date Input */}
                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1.5">
                      Select Date
                    </label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    />
                  </div>

                  {/* Guest Count Selector */}
                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1.5">
                      Party Size
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    >
                      <option value={1}>1 Guest (Solo Study / Brew)</option>
                      <option value={2}>2 Guests (Table for Two)</option>
                      <option value={4}>4 Guests (Standard Booth)</option>
                      <option value={6}>6 Guests (Gathering Table)</option>
                      <option value={8}>8+ Guests (Large Party)</option>
                    </select>
                  </div>

                  {/* Seating Area Preference */}
                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1.5">
                      Preferred Ambiance
                    </label>
                    <select
                      value={seatingArea}
                      onChange={(e) => setSeatingArea(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    >
                      <option value="window">Sunlit Window Nook</option>
                      <option value="indoor">Velvet Booth (Indoor)</option>
                      <option value="patio">Lush Garden Patio</option>
                      <option value="bar">Barista Espresso Counter</option>
                    </select>
                  </div>
                </div>

                {/* Time Slots Chips */}
                <div>
                  <label className="text-xs font-semibold text-[#5C4538] block mb-2">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isSelected = timeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setTimeSlot(slot)}
                          className={`p-2.5 text-xs font-mono rounded-lg border transition-all text-center ${
                            isSelected
                              ? 'border-[#291811] bg-[#291811] text-[#FAF7F2] font-semibold shadow-xs'
                              : 'border-[#E0D5C8] bg-[#FAF7F2] text-[#5C4538] hover:bg-[#F2ECE4]'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 2: Table Availability Status */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base font-semibold text-[#291811] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#291811] text-[#FAF7F2] text-xs flex items-center justify-center font-mono">
                      2
                    </span>
                    <span>Live Table Availability</span>
                  </h3>
                  {isChecking && <Loader2 className="w-4 h-4 animate-spin text-[#C87D32]" />}
                </div>

                {availableTables.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      All tables are fully booked for {date} at {timeSlot}. Please select another time
                      slot above.
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-[#6B5547] mb-3">
                      Select an available table or let our host auto-allocate:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {availableTables.map((tbl) => {
                        const isSelected = selectedTableNumber === tbl.tableNumber;
                        return (
                          <button
                            type="button"
                            key={tbl.tableNumber}
                            onClick={() => setSelectedTableNumber(tbl.tableNumber)}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-[#291811] bg-[#291811] text-[#FAF7F2] shadow-xs'
                                : 'border-[#E0D5C8] bg-[#FAF7F2] hover:bg-[#F2ECE4]'
                            }`}
                          >
                            <span className="font-mono font-bold text-xs block">
                              Table {tbl.tableNumber}
                            </span>
                            <span
                              className={`text-[11px] block mt-0.5 ${
                                isSelected ? 'text-[#E5B26E]' : 'text-[#8C6D58]'
                              }`}
                            >
                              Seats {tbl.capacity} · {tbl.location}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Contact & Special Requests */}
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
                <h3 className="font-serif text-base font-semibold text-[#291811] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#291811] text-[#FAF7F2] text-xs flex items-center justify-center font-mono">
                    3
                  </span>
                  <span>Guest Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="you@domain.com"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5C4538] block mb-1">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="e.g. High chair needed, anniversary celebration, quiet table for laptop work..."
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E0D5C8] bg-[#FAF7F2] focus:outline-none focus:ring-1 focus:ring-[#291811]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || availableTables.length === 0}
                  className="w-full py-3 bg-[#291811] text-[#FAF7F2] font-medium text-xs rounded-xl hover:bg-[#3D251A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#E5B26E]" />
                      <span>Confirming Table Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Reservation</span>
                  )}
                </button>
              </div>
            </form>

            {/* Right Side: Cafe Hospitality Policies */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E8DFD5] space-y-4">
                <h3 className="font-serif text-base font-semibold text-[#291811]">
                  Reservation Policies
                </h3>
                <ul className="space-y-3 text-xs text-[#5C4538] leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C87D32] font-bold">·</span>
                    <span>
                      We hold your table for up to 15 minutes past your reserved slot before
                      re-opening to walk-in guests.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C87D32] font-bold">·</span>
                    <span>
                      Reservations include complimentary filtered sparkling water and access to
                      high-speed fiber Wi-Fi.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C87D32] font-bold">·</span>
                    <span>
                      No cancellation fees. You may cancel anytime from the "My Bookings" tab with
                      one click.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DFD5] space-y-2 text-xs">
                <span className="font-semibold text-[#C87D32] uppercase tracking-wider block">
                  Need Help?
                </span>
                <p className="text-[#5C4538]">
                  For large groups over 8 people or private tasting events, please contact our
                  hospitality concierge directly:
                </p>
                <p className="font-mono font-medium text-[#291811] pt-1">+91 98765 43210</p>
              </div>
            </div>
          </div>
        )
      ) : (
        /* My Bookings Tab */
        <div className="max-w-3xl mx-auto space-y-4">
          {!user ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-3">
              <p className="font-serif text-base font-semibold text-[#291811]">
                Sign in to view your reservation history
              </p>
              <p className="text-xs text-[#8C6D58]">
                Access all your upcoming table bookings and easily cancel or reschedule.
              </p>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg hover:bg-[#3D251A] transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : myReservations.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#E8DFD5] space-y-2">
              <p className="font-serif text-base font-medium text-[#291811]">
                No table bookings found
              </p>
              <p className="text-xs text-[#8C6D58]">
                You have not placed any reservations under {user.email}.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="mt-2 px-4 py-2 bg-[#291811] text-[#FAF7F2] text-xs font-medium rounded-lg"
              >
                Make a Reservation
              </button>
            </div>
          ) : (
            myReservations.map((res) => (
              <div
                key={res._id || res.reservationCode}
                className="p-5 bg-white rounded-2xl border border-[#E8DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#291811]">
                      {res.reservationCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm ${
                        res.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'seated'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C4538]">
                    {res.date} at <b className="font-mono">{res.timeSlot}</b> · {res.guestCount} Guests ·{' '}
                    <span className="capitalize">{res.seatingArea}</span> ({res.tableNumber || 'Assigned on arrival'})
                  </p>
                  {res.specialRequests && (
                    <p className="text-[11px] text-[#8C6D58] italic">Note: "{res.specialRequests}"</p>
                  )}
                </div>

                {res.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancelBooking(res.reservationCode)}
                    className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
